/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Dedicated Image Management Database Service & Handlers
   Provides robust database operations for:
   1. Homepage Images (Banners) -> Supabase `homepage_images` + LocalStorage
   2. Category Images (5 slots x 7 categories) -> Supabase `category_images` & `prizes` + LocalStorage
   3. Prize Images (5 slots x 35 prizes = 175) -> Supabase `prizes` & `prize_images` + LocalStorage
   ========================================================================== */

(function () {
  'use strict';

  console.log('🚀 Initializing Image Management Service...');

  // Normalize Category ID
  function normalizeCategoryId(catId) {
    if (!catId) return 'cat-car';
    if (catId.startsWith('cat-')) return catId;
    return 'cat-' + catId;
  }

  // Normalize Category Slug
  function normalizeCategorySlug(catId) {
    if (!catId) return 'car';
    return catId.replace(/^cat-/, '');
  }

  const ImageManagement = {
    // -----------------------------------------------------------------------
    // 1. PRIZE IMAGES (175 Slots: 7 Categories x 5 Prizes x 5 Slots)
    // -----------------------------------------------------------------------
    async savePrizeImage(prizeId, imageIndex, newUrl) {
      try {
        const slotIdx = parseInt(imageIndex, 10) || 0;
        const cleanUrl = typeof newUrl === 'string' ? newUrl.trim() : '';

        console.log(`💾 Saving Prize Image: Prize=${prizeId}, Slot=${slotIdx}, URL=${cleanUrl}`);

        // 1. Get prizes from LocalStorage
        let prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
        let prize = prizes.find(p => p.id === prizeId);

        // If not in local storage, attempt to seed or load
        if (!prize && window.dbService) {
          try {
            prize = await window.dbService.getPrizeById(prizeId);
          } catch (e) {
            console.warn('Could not fetch prize from dbService:', e);
          }
        }

        if (!prize) {
          // Build fallback prize object if missing
          prize = {
            id: prizeId,
            images: ['', '', '', '', ''],
            title_am: 'የሎተሪ እጣ',
            active: true
          };
          prizes.push(prize);
        }

        if (!prize.images || !Array.isArray(prize.images)) {
          prize.images = ['', '', '', '', ''];
        }

        while (prize.images.length < 5) {
          prize.images.push('');
        }

        // Update exact slot index
        prize.images[slotIdx] = cleanUrl;

        // Persist to LocalStorage
        const prizeIdx = prizes.findIndex(p => p.id === prizeId);
        if (prizeIdx >= 0) {
          prizes[prizeIdx] = prize;
        } else {
          prizes.push(prize);
        }
        localStorage.setItem('eth_lottery_prizes', JSON.stringify(prizes));

        // 2. Persist to Supabase if connected
        const client = window.dbService?.supabase || (window.supabase && APP_CONFIG?.SUPABASE_URL ? window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY) : null);

        if (client) {
          try {
            // Update the prize's images array in `prizes` table
            const { error: pErr } = await client
              .from('prizes')
              .update({ 
                images: prize.images,
                updated_at: new Date().toISOString()
              })
              .eq('id', prizeId);

            if (pErr) {
              console.warn('Supabase prizes update warning:', pErr);
            } else {
              console.log('✅ Supabase prizes table updated with new image array');
            }

            // Also attempt upsert into `prize_images` table
            try {
              await client.from('prize_images').upsert([{
                prize_id: prizeId,
                display_order: slotIdx + 1,
                image_url: cleanUrl,
                active: Boolean(cleanUrl.length > 0),
                updated_at: new Date().toISOString()
              }]);
            } catch (piErr) {
              console.warn('Supabase prize_images table sync notice:', piErr);
            }
          } catch (supErr) {
            console.error('Supabase error saving prize image:', supErr);
          }
        }

        return { success: true, prizeId, slotIndex: slotIdx, url: cleanUrl };
      } catch (err) {
        console.error('Fatal error in savePrizeImage:', err);
        throw err;
      }
    },

    async deletePrizeImage(prizeId, imageIndex) {
      return await this.savePrizeImage(prizeId, imageIndex, '');
    },

    async getPrizeImages(prizeId) {
      const prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
      const prize = prizes.find(p => p.id === prizeId);
      const res = [];
      for (let i = 0; i < 5; i++) {
        const url = (prize && prize.images && prize.images[i]) || '';
        res.push({
          prize_id: prizeId,
          index: i,
          display_order: i + 1,
          url: url,
          active: Boolean(url && url.trim().length > 0)
        });
      }
      return res;
    },

    // -----------------------------------------------------------------------
    // 2. CATEGORY IMAGES (35 Slots: 7 Categories x 5 Slots)
    // -----------------------------------------------------------------------
    async saveCategoryImage(categoryId, imageIndex, newUrl) {
      try {
        const catId = normalizeCategoryId(categoryId);
        const slotIdx = parseInt(imageIndex, 10) || 0;
        const cleanUrl = typeof newUrl === 'string' ? newUrl.trim() : '';

        console.log(`💾 Saving Category Image: Category=${catId}, Slot=${slotIdx}, URL=${cleanUrl}`);

        // 1. Update LocalStorage Category Images Store
        const localStore = JSON.parse(localStorage.getItem('eth_lottery_category_images_store') || '{}');
        let catImages = localStore[catId];
        if (!catImages || !Array.isArray(catImages) || catImages.length === 0) {
          catImages = [];
          for (let i = 0; i < 5; i++) {
            catImages.push({ index: i, display_order: i + 1, url: '', active: true });
          }
        }

        while (catImages.length < 5) {
          catImages.push({ index: catImages.length, display_order: catImages.length + 1, url: '', active: true });
        }

        catImages[slotIdx] = {
          index: slotIdx,
          display_order: slotIdx + 1,
          url: cleanUrl,
          active: Boolean(cleanUrl.length > 0)
        };

        localStore[catId] = catImages;
        localStorage.setItem('eth_lottery_category_images_store', JSON.stringify(localStore));

        // 2. Also sync to the first prize of this category so sliders render immediately
        let prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
        const firstPrize = prizes.find(p => p.category_id === catId || p.category_slug === normalizeCategorySlug(catId));
        if (firstPrize) {
          if (!firstPrize.images || !Array.isArray(firstPrize.images)) {
            firstPrize.images = ['', '', '', '', ''];
          }
          firstPrize.images[slotIdx] = cleanUrl;
          localStorage.setItem('eth_lottery_prizes', JSON.stringify(prizes));
        }

        // 3. Persist to Supabase if connected
        const client = window.dbService?.supabase || (window.supabase && APP_CONFIG?.SUPABASE_URL ? window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY) : null);

        if (client) {
          try {
            // Update first prize images in Supabase
            if (firstPrize) {
              await client.from('prizes').update({ images: firstPrize.images }).eq('id', firstPrize.id);
            }

            // Upsert into `category_images` table
            try {
              await client.from('category_images').upsert([{
                category_id: catId,
                display_order: slotIdx + 1,
                image_url: cleanUrl,
                active: Boolean(cleanUrl.length > 0),
                updated_at: new Date().toISOString()
              }]);
              console.log('✅ Supabase category_images table updated');
            } catch (ciErr) {
              console.warn('Supabase category_images notice:', ciErr);
            }
          } catch (supErr) {
            console.error('Supabase error saving category image:', supErr);
          }
        }

        return { success: true, categoryId: catId, slotIndex: slotIdx, url: cleanUrl };
      } catch (err) {
        console.error('Fatal error in saveCategoryImage:', err);
        throw err;
      }
    },

    async deleteCategoryImage(categoryId, imageIndex) {
      return await this.saveCategoryImage(categoryId, imageIndex, '');
    },

    async getCategoryImages(categoryId) {
      const catId = normalizeCategoryId(categoryId);
      const localStore = JSON.parse(localStorage.getItem('eth_lottery_category_images_store') || '{}');
      if (localStore[catId] && Array.isArray(localStore[catId]) && localStore[catId].length > 0) {
        return localStore[catId];
      }

      const prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
      const firstPrize = prizes.find(p => p.category_id === catId || p.category_slug === normalizeCategorySlug(catId));
      if (firstPrize && Array.isArray(firstPrize.images) && firstPrize.images.length > 0) {
        const result = [];
        for (let i = 0; i < 5; i++) {
          const u = firstPrize.images[i] || '';
          result.push({
            index: i,
            display_order: i + 1,
            url: u,
            active: Boolean(u && u.trim().length > 0)
          });
        }
        return result;
      }

      const res = [];
      for (let i = 0; i < 5; i++) {
        res.push({ index: i, display_order: i + 1, url: '', active: false });
      }
      return res;
    },

    // -----------------------------------------------------------------------
    // 3. HOMEPAGE IMAGES (Banners 1 to 5)
    // -----------------------------------------------------------------------
    async saveHomepageImage(imgObj) {
      try {
        let cleanObj = {};
        if (typeof imgObj === 'string') {
          cleanObj = {
            id: 'hp-banner-1',
            title: 'የመነሻ ገፅ ባነር',
            location: 'መነሻ ገፅ → Banner 1',
            url: imgObj.trim(),
            source_type: 'homepage',
            created_at: new Date().toISOString()
          };
        } else {
          cleanObj = {
            id: imgObj.id || `hp-banner-${Date.now()}`,
            title: imgObj.title || 'የመነሻ ገፅ ባነር',
            location: imgObj.location || 'መነሻ ገፅ → Banner',
            url: (imgObj.url || '').trim(),
            source_type: 'homepage',
            created_at: imgObj.created_at || new Date().toISOString()
          };
        }

        console.log('💾 Saving Homepage Image:', cleanObj);

        // 1. Update LocalStorage
        let list = JSON.parse(localStorage.getItem('eth_lottery_homepage_images') || '[]');
        const idx = list.findIndex(i => i.id === cleanObj.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...cleanObj };
        } else {
          list.unshift(cleanObj);
        }
        localStorage.setItem('eth_lottery_homepage_images', JSON.stringify(list));

        // 2. Persist to Supabase if connected
        const client = window.dbService?.supabase || (window.supabase && APP_CONFIG?.SUPABASE_URL ? window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY) : null);

        if (client) {
          try {
            const { error: hpErr } = await client.from('homepage_images').upsert([cleanObj]);
            if (hpErr) {
              console.warn('Supabase homepage_images upsert warning:', hpErr);
            } else {
              console.log('✅ Supabase homepage_images table updated');
            }
          } catch (supErr) {
            console.error('Supabase error saving homepage image:', supErr);
          }
        }

        return { success: true, image: cleanObj };
      } catch (err) {
        console.error('Fatal error in saveHomepageImage:', err);
        throw err;
      }
    },

    async saveBannerImage(bannerIndex, url, title) {
      const idx = parseInt(bannerIndex, 10) || 0;
      return await this.saveHomepageImage({
        id: `hp-banner-${idx + 1}`,
        title: title || `የመነሻ ገፅ ባነር #${idx + 1}`,
        location: `መነሻ ገፅ → Banner ${idx + 1}`,
        url: url,
        banner_index: idx
      });
    },

    async deleteHomepageImage(imgId) {
      let list = JSON.parse(localStorage.getItem('eth_lottery_homepage_images') || '[]');
      list = list.filter(i => i.id !== imgId);
      localStorage.setItem('eth_lottery_homepage_images', JSON.stringify(list));

      const client = window.dbService?.supabase || (window.supabase && APP_CONFIG?.SUPABASE_URL ? window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY) : null);
      if (client) {
        try {
          await client.from('homepage_images').delete().eq('id', imgId);
        } catch (e) {
          console.warn('Supabase delete homepage image notice:', e);
        }
      }
      return true;
    },

    async getHomepageImages() {
      const local = JSON.parse(localStorage.getItem('eth_lottery_homepage_images') || '[]');
      if (local && local.length > 0) return local;

      const client = window.dbService?.supabase || (window.supabase && APP_CONFIG?.SUPABASE_URL ? window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY) : null);
      if (client) {
        try {
          const { data, error } = await client
            .from('homepage_images')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) return data;
        } catch (e) {
          console.warn('Supabase fetch homepage images failed:', e);
        }
      }
      return local;
    }
  };

  // Expose globally as ImageManagement
  window.ImageManagement = ImageManagement;
  window.ImageManagementService = ImageManagement;

  // Polyfill/bind directly onto window.dbService so that ANY existing calls succeed immediately!
  function bindToDbService() {
    if (!window.dbService) {
      window.dbService = {};
    }

    // Attach all core image functions to window.dbService
    window.dbService.savePrizeImage = ImageManagement.savePrizeImage.bind(ImageManagement);
    window.dbService.deletePrizeImage = ImageManagement.deletePrizeImage.bind(ImageManagement);
    window.dbService.getPrizeImages = ImageManagement.getPrizeImages.bind(ImageManagement);

    window.dbService.saveCategoryImage = ImageManagement.saveCategoryImage.bind(ImageManagement);
    window.dbService.deleteCategoryImage = ImageManagement.deleteCategoryImage.bind(ImageManagement);
    window.dbService.getCategoryImages = ImageManagement.getCategoryImages.bind(ImageManagement);

    window.dbService.saveHomepageImage = ImageManagement.saveHomepageImage.bind(ImageManagement);
    window.dbService.saveBannerImage = ImageManagement.saveBannerImage.bind(ImageManagement);
    window.dbService.deleteHomepageImage = ImageManagement.deleteHomepageImage.bind(ImageManagement);
    window.dbService.getHomepageImages = ImageManagement.getHomepageImages.bind(ImageManagement);

    console.log('✅ Image Management database functions successfully attached to window.dbService');
  }

  // Bind immediately
  bindToDbService();

  // Also bind on DOMContentLoaded to guarantee it runs after any other scripts load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindToDbService);
  } else {
    setTimeout(bindToDbService, 50);
  }
})();
