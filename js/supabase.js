/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Supabase Client & Database Service Layer
   ========================================================================== */

class DatabaseService {
  constructor() {
    this.supabase = null;
    this.isSupabaseConnected = false;
    this.init();
  }

  init() {
    // Check if Supabase browser SDK is available and credentials are set
    if (window.supabase && APP_CONFIG.SUPABASE_URL && APP_CONFIG.SUPABASE_ANON_KEY) {
      try {
        this.supabase = window.supabase.createClient(APP_CONFIG.SUPABASE_URL, APP_CONFIG.SUPABASE_ANON_KEY);
        this.isSupabaseConnected = true;
        console.log('✅ Supabase Client initialized successfully');
      } catch (err) {
        console.warn('⚠️ Supabase init failed, falling back to LocalStorage:', err);
      }
    } else {
      console.log('ℹ️ Running in Local Storage Demo Mode (Supabase URL/Key not configured)');
    }

    // Always seed LocalStorage with defaults if empty
    this.seedLocalStorage();
  }

  seedLocalStorage() {
    if (!localStorage.getItem('eth_lottery_categories')) {
      localStorage.setItem('eth_lottery_categories', JSON.stringify(APP_CONFIG.SEED_CATEGORIES));
    }
    if (!localStorage.getItem('eth_lottery_prizes')) {
      // Default 5 prizes per category with 5 high quality images each
      const seedPrizes = [];
      const categories = APP_CONFIG.SEED_CATEGORIES;

      const sampleImages = {
        'car': [
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
        ],
        'condo': [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
        ],
        'phone': [
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80'
        ],
        'money': [
          'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1607863680198-23d4b2565df0?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=800&q=80'
        ],
        'laptop': [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80'
        ],
        'tv': [
          'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1571415060716-baff5f7179e6?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=800&q=80'
        ],
        'sheep': [
          '1st and banner.jpg',
          '2nd.jpg',
          '3rd.jpg',
          'https://images.unsplash.com/photo-1533318087102-b3ad366ed041?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=800&q=80'
        ]
      };

      categories.forEach(cat => {
        const imgs = sampleImages[cat.slug] || sampleImages['car'];
        for (let i = 1; i <= 5; i++) {
          seedPrizes.push({
            id: `prize-${cat.slug}-${i}`,
            category_id: cat.id,
            category_slug: cat.slug,
            title_am: `${cat.name_am} - አጓጊ የዘመን መለወጫ ሽልማት #${i}`,
            description_am: `የ 2019 አዲስ አመት ልዩ አጓጊ የ ${cat.name_am} ዕጣ ሽልማት። ዕድልዎን አሁኑኑ ይሞክሩ!`,
            ticket_price: '50 ብር',
            images: imgs, // 5 images per prize by default
            active: true,
            display_order: i,
            created_at: new Date().toISOString()
          });
        }
      });

      localStorage.setItem('eth_lottery_prizes', JSON.stringify(seedPrizes));
    }

    if (!localStorage.getItem('eth_lottery_homepage_images')) {
      const defaultHomepageImages = [
        {
          id: 'hp-img-1',
          title: 'የ 2019 አዲስ አመት አጓጊ የሎተሪ ሽልማቶች',
          url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
          created_at: new Date().toISOString()
        },
        {
          id: 'hp-img-2',
          title: 'የኮንደሚኒዬም ቤት እና ዘመናዊ መኪና እጣ',
          url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
          created_at: new Date().toISOString()
        },
        {
          id: 'hp-img-3',
          title: 'ዘመናዊ የቶዮታ መኪናዎች እና ስልኮች',
          url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
          created_at: new Date().toISOString()
        }
      ];
      localStorage.setItem('eth_lottery_homepage_images', JSON.stringify(defaultHomepageImages));
    }

    if (!localStorage.getItem('eth_lottery_payment_methods')) {
      localStorage.setItem('eth_lottery_payment_methods', JSON.stringify(APP_CONFIG.SEED_PAYMENT_METHODS));
    }

    if (!localStorage.getItem('eth_lottery_site_settings')) {
      localStorage.setItem('eth_lottery_site_settings', JSON.stringify(APP_CONFIG.DEFAULT_SITE_SETTINGS));
    }

    if (!localStorage.getItem('eth_lottery_submissions')) {
      localStorage.setItem('eth_lottery_submissions', JSON.stringify([]));
    }
  }

  // --- CATEGORIES API ---
  async getCategories() {
    if (this.isSupabaseConnected) {
      try {
        const { data, error } = await this.supabase
          .from('categories')
          .select('*')
          .eq('active', true)
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase fetch failed, falling to localStorage:', e);
      }
    }
    const local = JSON.parse(localStorage.getItem('eth_lottery_categories') || '[]');
    return local.filter(c => c.active !== false).sort((a, b) => a.display_order - b.display_order);
  }

  async getCategoryBySlug(slug) {
    const categories = await this.getCategories();
    return categories.find(c => c.slug === slug) || categories[0];
  }

  // --- PRIZES API ---
  async getPrizesForCategory(categoryId) {
    if (this.isSupabaseConnected) {
      try {
        const { data, error } = await this.supabase
          .from('prizes')
          .select('*')
          .eq('category_id', categoryId)
          .eq('active', true)
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase prizes fetch failed:', e);
      }
    }
    const local = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    return local.filter(p => p.category_id === categoryId && p.active !== false)
                .sort((a, b) => a.display_order - b.display_order);
  }

  async getPrizeById(prizeId) {
    if (this.isSupabaseConnected) {
      try {
        const { data, error } = await this.supabase
          .from('prizes')
          .select('*')
          .eq('id', prizeId)
          .single();
        if (!error && data) return data;
      } catch (e) {
        console.warn('Supabase prize fetch error:', e);
      }
    }
    const local = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    return local.find(p => p.id === prizeId) || null;
  }

  // --- PAYMENT METHODS API ---
  async getPaymentMethods() {
    if (this.isSupabaseConnected) {
      try {
        const { data, error } = await this.supabase
          .from('payment_methods')
          .select('*')
          .eq('active', true)
          .order('display_order', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase payment methods fetch error:', e);
      }
    }
    const local = JSON.parse(localStorage.getItem('eth_lottery_payment_methods') || '[]');
    return local.filter(m => m.active !== false).sort((a, b) => a.display_order - b.display_order);
  }

  // --- TICKET SUBMISSION API ---
  async createTicketSubmission(submission) {
    const submissionRecord = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      category_id: submission.category_id,
      prize_id: submission.prize_id,
      phone_number: submission.phone_number,
      payment_method_id: submission.payment_method_id,
      payment_method_name: submission.payment_method_name,
      payment_screenshot_path: submission.payment_screenshot_path,
      status: 'pending', // "በመጠባበቅ ላይ"
      created_at: new Date().toISOString()
    };

    if (this.isSupabaseConnected) {
      try {
        const { data, error } = await this.supabase
          .from('ticket_submissions')
          .insert([submissionRecord]);
        if (error) throw error;
        return { success: true, data: submissionRecord };
      } catch (e) {
        console.warn('Supabase submission insert error:', e);
      }
    }

    // Local Storage Save
    const submissions = JSON.parse(localStorage.getItem('eth_lottery_submissions') || '[]');
    submissions.unshift(submissionRecord);
    localStorage.setItem('eth_lottery_submissions', JSON.stringify(submissions));
    return { success: true, data: submissionRecord };
  }

  // --- SITE SETTINGS API ---
  async getSiteSettings() {
    let localSettings = null;
    try {
      localSettings = JSON.parse(localStorage.getItem('eth_lottery_site_settings') || 'null');
    } catch (e) {}

    if (this.isSupabaseConnected) {
      try {
        const { data, error } = await this.supabase
          .from('site_settings')
          .select('*')
          .single();
        if (!error && data) {
          return { ...APP_CONFIG.DEFAULT_SITE_SETTINGS, ...data, ...(localSettings || {}) };
        }
      } catch (e) {
        console.warn('Supabase settings fetch error:', e);
      }
    }
    return localSettings || APP_CONFIG.DEFAULT_SITE_SETTINGS;
  }

  async updateSiteSettings(settings) {
    const current = await this.getSiteSettings();
    const merged = { ...current, ...settings, updated_at: new Date().toISOString() };

    localStorage.setItem('eth_lottery_site_settings', JSON.stringify(merged));

    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('site_settings').upsert([merged]);
      } catch (e) {
        console.warn('Supabase update settings failed:', e);
      }
    }
    return true;
  }

  // --- ADMIN MANAGEMENT API ---
  async getAdminSubmissions(filters = {}) {
    let submissions = [];
    if (this.isSupabaseConnected) {
      try {
        const { data, error } = await this.supabase
          .from('ticket_submissions')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) submissions = data;
      } catch (e) {
        console.warn('Supabase admin fetch error:', e);
      }
    }

    if (submissions.length === 0) {
      submissions = JSON.parse(localStorage.getItem('eth_lottery_submissions') || '[]');
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      submissions = submissions.filter(s => s.phone_number.includes(q) || s.id.includes(q));
    }

    if (filters.status && filters.status !== 'all') {
      submissions = submissions.filter(s => s.status === filters.status);
    }

    return submissions;
  }

  async updateSubmissionStatus(id, newStatus) {
    if (this.isSupabaseConnected) {
      try {
        await this.supabase
          .from('ticket_submissions')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (e) {
        console.warn('Supabase status update error:', e);
      }
    }

    const submissions = JSON.parse(localStorage.getItem('eth_lottery_submissions') || '[]');
    const sub = submissions.find(s => s.id === id);
    if (sub) {
      sub.status = newStatus;
      sub.updated_at = new Date().toISOString();
      localStorage.setItem('eth_lottery_submissions', JSON.stringify(submissions));
    }
    return true;
  }

  // Admin CRUD for Categories, Prizes, Payment Methods
  async saveCategory(cat) {
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('categories').upsert([cat]);
      } catch (e) {
        console.warn('Supabase save category error:', e);
      }
    }
    const list = JSON.parse(localStorage.getItem('eth_lottery_categories') || '[]');
    const index = list.findIndex(c => c.id === cat.id);
    if (index >= 0) list[index] = cat;
    else list.push(cat);
    localStorage.setItem('eth_lottery_categories', JSON.stringify(list));
    return true;
  }

  async savePrize(prize) {
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('prizes').upsert([prize]);
      } catch (e) {
        console.warn('Supabase save prize error:', e);
      }
    }
    const list = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    const index = list.findIndex(p => p.id === prize.id);
    if (index >= 0) list[index] = prize;
    else list.push(prize);
    localStorage.setItem('eth_lottery_prizes', JSON.stringify(list));
    return true;
  }

  async deletePrize(prizeId) {
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('prizes').delete().eq('id', prizeId);
      } catch (e) {
        console.warn('Supabase delete prize error:', e);
      }
    }
    let list = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    list = list.filter(p => p.id !== prizeId);
    localStorage.setItem('eth_lottery_prizes', JSON.stringify(list));
    return true;
  }

  async updateAllTicketPrices(newPrice) {
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('prizes').update({ ticket_price: newPrice }).neq('id', 'none');
      } catch (e) {
        console.warn('Supabase update all prices error:', e);
      }
    }
    const list = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    list.forEach(p => { p.ticket_price = newPrice; });
    localStorage.setItem('eth_lottery_prizes', JSON.stringify(list));
    return true;
  }

  async updateCategoryPrice(categoryId, newPrice) {
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('categories').update({ ticket_price: newPrice }).eq('id', categoryId);
        await this.supabase.from('prizes').update({ ticket_price: newPrice }).eq('category_id', categoryId);
      } catch (e) {
        console.warn('Supabase update category price error:', e);
      }
    }

    // Update category in localStorage
    const categories = JSON.parse(localStorage.getItem('eth_lottery_categories') || '[]');
    const catObj = categories.find(c => c.id === categoryId);
    if (catObj) {
      catObj.ticket_price = newPrice;
      localStorage.setItem('eth_lottery_categories', JSON.stringify(categories));
    }

    // Update all prizes under this category in localStorage
    const prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    prizes.forEach(p => {
      if (p.category_id === categoryId) {
        p.ticket_price = newPrice;
      }
    });
    localStorage.setItem('eth_lottery_prizes', JSON.stringify(prizes));
    return true;
  }

  // --- CATEGORY IMAGES (5 SLOTS PER CATEGORY, 35 TOTAL) ---
  async getCategoryImages(categoryId) {
    const defaultSampleImages = {
      'cat-car': [
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
      ],
      'cat-condo': [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
      ],
      'cat-phone': [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80'
      ],
      'cat-money': [
        'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1607863680198-23d4b2565df0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=800&q=80'
      ],
      'cat-laptop': [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80'
      ],
      'cat-tv': [
        'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1571415060716-baff5f7179e6?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=800&q=80'
      ],
      'cat-sheep': [
        'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1533318087102-b3ad366ed041?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=800&q=80'
      ]
    };

    let defaults = defaultSampleImages[categoryId] || defaultSampleImages['cat-car'];
    
    // Check local storage category images store
    const localStore = JSON.parse(localStorage.getItem('eth_lottery_category_images_store') || '{}');
    if (localStore[categoryId] && Array.isArray(localStore[categoryId]) && localStore[categoryId].length > 0) {
      return localStore[categoryId];
    }

    // Check first prize of category
    const prizes = await this.getPrizesForCategory(categoryId);
    if (prizes.length > 0 && prizes[0].images && prizes[0].images.length > 0) {
      const result = [];
      for (let i = 0; i < 5; i++) {
        result.push({
          index: i,
          display_order: i + 1,
          url: prizes[0].images[i] || defaults[i] || '',
          active: true
        });
      }
      return result;
    }

    // Build 5 default slots
    const result = [];
    for (let i = 0; i < 5; i++) {
      result.push({
        index: i,
        display_order: i + 1,
        url: defaults[i] || '',
        active: true
      });
    }
    return result;
  }

  async saveCategoryImage(categoryId, imageIndex, newUrl) {
    const slotIdx = parseInt(imageIndex, 10) || 0;
    const cleanUrl = typeof newUrl === 'string' ? newUrl.trim() : '';

    let images = await this.getCategoryImages(categoryId);
    if (!images || images.length === 0) {
      images = [];
      for (let i = 0; i < 5; i++) {
        images.push({ index: i, display_order: i + 1, url: '', active: true });
      }
    }

    while (images.length < 5) {
      images.push({ index: images.length, display_order: images.length + 1, url: '', active: true });
    }

    if (slotIdx >= 0 && slotIdx < 5) {
      images[slotIdx] = {
        index: slotIdx,
        display_order: slotIdx + 1,
        url: cleanUrl,
        active: Boolean(cleanUrl.length > 0)
      };
    }

    // Save to local storage cache
    const localStore = JSON.parse(localStorage.getItem('eth_lottery_category_images_store') || '{}');
    localStore[categoryId] = images;
    localStorage.setItem('eth_lottery_category_images_store', JSON.stringify(localStore));

    // Also sync to first prize so sliders update
    const prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    const firstPrize = prizes.find(p => p.category_id === categoryId || p.category_slug === categoryId.replace(/^cat-/, ''));
    if (firstPrize) {
      if (!firstPrize.images || !Array.isArray(firstPrize.images)) {
        firstPrize.images = ['', '', '', '', ''];
      }
      firstPrize.images[slotIdx] = cleanUrl;
      localStorage.setItem('eth_lottery_prizes', JSON.stringify(prizes));
      if (this.isSupabaseConnected) {
        try {
          await this.supabase.from('prizes').update({ images: firstPrize.images }).eq('id', firstPrize.id);
        } catch (e) {
          console.warn('Supabase sync prize image error:', e);
        }
      }
    }

    // Also sync to category_images table in Supabase
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('category_images').upsert([{
          category_id: categoryId,
          display_order: slotIdx + 1,
          image_url: cleanUrl,
          active: Boolean(cleanUrl.length > 0),
          updated_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn('Supabase save category image error:', e);
      }
    }

    return true;
  }

  async deleteCategoryImage(categoryId, imageIndex) {
    return await this.saveCategoryImage(categoryId, imageIndex, '');
  }

  async reorderCategoryImages(categoryId, fromIndex, toIndex) {
    const images = await this.getCategoryImages(categoryId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= images.length || toIndex >= images.length) {
      return false;
    }

    const temp = images[fromIndex].url;
    images[fromIndex].url = images[toIndex].url;
    images[toIndex].url = temp;

    const localStore = JSON.parse(localStorage.getItem('eth_lottery_category_images_store') || '{}');
    localStore[categoryId] = images;
    localStorage.setItem('eth_lottery_category_images_store', JSON.stringify(localStore));

    // Sync to first prize
    const prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    const firstPrize = prizes.find(p => p.category_id === categoryId);
    if (firstPrize && firstPrize.images) {
      firstPrize.images = images.map(img => img.url);
      localStorage.setItem('eth_lottery_prizes', JSON.stringify(prizes));
      if (this.isSupabaseConnected) {
        try {
          await this.supabase.from('prizes').update({ images: firstPrize.images }).eq('id', firstPrize.id);
        } catch (e) {}
      }
    }
    return true;
  }

  // --- PRIZE IMAGES (5 SLOTS PER PRIZE, 175 TOTAL) ---
  async getPrizeImages(prizeId) {
    const prize = await this.getPrizeById(prizeId);
    const defaults = [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
    ];

    const result = [];
    for (let i = 0; i < 5; i++) {
      let url = '';
      if (prize && Array.isArray(prize.images) && typeof prize.images[i] === 'string') {
        url = prize.images[i];
      } else {
        url = defaults[i] || '';
      }
      result.push({
        prize_id: prizeId,
        index: i,
        display_order: i + 1,
        url: url,
        active: Boolean(url && url.trim().length > 0)
      });
    }
    return result;
  }

  async savePrizeImage(prizeId, imageIndex, newUrl) {
    const slotIdx = parseInt(imageIndex, 10) || 0;
    const cleanUrl = typeof newUrl === 'string' ? newUrl.trim() : '';

    let prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    let prize = prizes.find(p => p.id === prizeId);

    if (!prize) {
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

    prize.images[slotIdx] = cleanUrl;
    
    const pIdx = prizes.findIndex(p => p.id === prizeId);
    if (pIdx >= 0) {
      prizes[pIdx] = prize;
    } else {
      prizes.push(prize);
    }
    localStorage.setItem('eth_lottery_prizes', JSON.stringify(prizes));

    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('prizes').update({ images: prize.images }).eq('id', prizeId);
        await this.supabase.from('prize_images').upsert([{
          prize_id: prizeId,
          display_order: slotIdx + 1,
          image_url: cleanUrl,
          active: Boolean(cleanUrl.length > 0),
          updated_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn('Supabase save prize image error:', e);
      }
    }
    return true;
  }

  async deletePrizeImage(prizeId, imageIndex) {
    return await this.savePrizeImage(prizeId, imageIndex, '');
  }

  async reorderPrizeImages(prizeId, fromIndex, toIndex) {
    const prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    const prize = prizes.find(p => p.id === prizeId);
    if (!prize || !prize.images || fromIndex < 0 || toIndex < 0 || fromIndex >= prize.images.length || toIndex >= prize.images.length) {
      return false;
    }

    const temp = prize.images[fromIndex];
    prize.images.splice(fromIndex, 1);
    prize.images.splice(toIndex, 0, temp);

    localStorage.setItem('eth_lottery_prizes', JSON.stringify(prizes));
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('prizes').update({ images: prize.images }).eq('id', prizeId);
      } catch (e) {}
    }
    return true;
  }

  // --- ALL WEBSITE IMAGES UNIFIED API (215 MANAGED SLOTS) ---
  async getAllManagedImages() {
    const imagesList = [];

    // 1. 5 Homepage Banners (Banner 1 to Banner 5)
    const hpImages = await this.getHomepageImages();
    const defaultHpUrls = [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
    ];

    for (let i = 0; i < 5; i++) {
      const existing = hpImages && hpImages[i];
      const bannerUrl = (existing && existing.url) ? existing.url : defaultHpUrls[i];
      const bannerTitle = (existing && existing.title) ? existing.title : `የመነሻ ገፅ ባነር #${i + 1}`;
      imagesList.push({
        id: (existing && existing.id) ? existing.id : `hp-banner-${i + 1}`,
        title: bannerTitle,
        location: `መነሻ ገፅ → Banner ${i + 1}`,
        display_location: `📍 መነሻ ገፅ → Banner ${i + 1}`,
        url: bannerUrl,
        default_url: defaultHpUrls[i],
        source_type: 'homepage',
        banner_index: i,
        display_order: i + 1,
        created_at: (existing && existing.created_at) || new Date().toISOString()
      });
    }

    // 2. 35 Category Preview Slots (7 Categories × 5 Slots)
    const categories = await this.getCategories();
    for (const cat of categories) {
      const catImages = await this.getCategoryImages(cat.id);
      for (let i = 0; i < 5; i++) {
        const cImg = catImages[i] || { index: i, url: '' };
        imagesList.push({
          id: `img-cat-${cat.id}-slot-${i}`,
          title: `${cat.name_am} — የምድብ ማሳያ ምስል #${i + 1}`,
          location: `${cat.name_am} → ምስል ${i + 1}`,
          display_location: `📍 ${cat.name_am} → ምስል ${i + 1}`,
          url: cImg.url || '',
          default_url: cImg.url || '',
          source_type: 'category',
          category_id: cat.id,
          category_slug: cat.slug,
          category_name: cat.name_am,
          image_index: i,
          display_order: i + 1,
          created_at: cat.created_at || new Date().toISOString()
        });
      }

      // 3. 175 Prize Section Images (7 Categories × 5 Prizes × 5 Images = 175)
      const prizes = await this.getPrizesForCategory(cat.id);
      for (let pIdx = 0; pIdx < 5; pIdx++) {
        const prize = prizes[pIdx] || {
          id: `prize-${cat.slug}-${pIdx + 1}`,
          title_am: `${cat.name_am} - አጓጊ የዘመን መለወጫ ሽልማት #${pIdx + 1}`,
          ticket_price: '50 ብር',
          images: []
        };
        const prizeImages = await this.getPrizeImages(prize.id);
        for (let imgIdx = 0; imgIdx < 5; imgIdx++) {
          const pImg = prizeImages[imgIdx] || { index: imgIdx, url: '' };
          imagesList.push({
            id: `img-prize-${prize.id}-${imgIdx}`,
            title: `${cat.name_am} ❯ ሽልማት #${pIdx + 1} (${prize.title_am}) — ምስል #${imgIdx + 1}`,
            location: `${cat.name_am} → ሽልማት ${pIdx + 1} → ምስል ${imgIdx + 1}`,
            display_location: `📍 ${cat.name_am} → ሽልማት ${pIdx + 1} → ምስል ${imgIdx + 1}`,
            url: pImg.url || '',
            default_url: pImg.url || '',
            source_type: 'prize',
            category_id: cat.id,
            category_slug: cat.slug,
            category_name: cat.name_am,
            prize_id: prize.id,
            prize_title: prize.title_am,
            prize_order: pIdx + 1,
            image_index: imgIdx,
            display_order: imgIdx + 1,
            created_at: prize.created_at || new Date().toISOString()
          });
        }
      }
    }

    return imagesList;
  }

  async saveManagedImage(imgObj) {
    if (imgObj.location && imgObj.location.toLowerCase().includes('logo')) {
      const settings = await this.getSiteSettings();
      settings.logo_url = imgObj.url;
      await this.updateSiteSettings(settings);
      return true;
    }

    if (imgObj.source_type === 'logo') {
      const settings = await this.getSiteSettings();
      settings.logo_url = imgObj.url;
      await this.updateSiteSettings(settings);
      return true;
    }

    if (imgObj.source_type === 'payment' && imgObj.payment_id) {
      const methods = await this.getPaymentMethods();
      const pm = methods.find(m => m.id === imgObj.payment_id);
      if (pm) {
        pm.logo_url = imgObj.url;
        await this.savePaymentMethod(pm);
      }
      return true;
    }

    if (imgObj.source_type === 'prize' && imgObj.prize_id !== undefined) {
      const prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
      const prize = prizes.find(p => p.id === imgObj.prize_id);
      if (prize && prize.images) {
        if (imgObj.image_index !== undefined && prize.images[imgObj.image_index] !== undefined) {
          prize.images[imgObj.image_index] = imgObj.url;
        } else {
          prize.images.push(imgObj.url);
        }
        await this.savePrize(prize);
      }
      return true;
    }

    // Default: Save to homepage_images collection
    const hpImg = {
      id: imgObj.id || 'hp-img-' + Date.now(),
      title: imgObj.title || 'አዲስ የመነሻ ገፅ ምስል',
      location: imgObj.location || 'Homepage Hero / Carousel',
      url: imgObj.url,
      created_at: new Date().toISOString()
    };
    return await this.saveHomepageImage(hpImg);
  }

  async updateManagedImage(imgId, updatedData) {
    // Check if it's logo
    if (imgId === 'img-logo-main' || updatedData.source_type === 'logo' || (updatedData.location && updatedData.location.toLowerCase().includes('logo'))) {
      await this.updateSiteSettings({ logo_url: updatedData.url });
      return true;
    }

    // Check if it's prize image or category preview image
    if ((updatedData.source_type === 'prize' || updatedData.source_type === 'category') && updatedData.prize_id) {
      const prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
      const prize = prizes.find(p => p.id === updatedData.prize_id);
      if (prize && prize.images) {
        if (updatedData.image_index !== undefined && prize.images[updatedData.image_index] !== undefined) {
          prize.images[updatedData.image_index] = updatedData.url;
        } else {
          prize.images.push(updatedData.url);
        }
        await this.savePrize(prize);
      }
      return true;
    }

    // Check if it's payment image
    if (updatedData.source_type === 'payment' && updatedData.payment_id) {
      const methods = await this.getPaymentMethods();
      const pm = methods.find(m => m.id === updatedData.payment_id);
      if (pm) {
        pm.logo_url = updatedData.url;
        await this.savePaymentMethod(pm);
      }
      return true;
    }

    // Otherwise homepage image
    const list = JSON.parse(localStorage.getItem('eth_lottery_homepage_images') || '[]');
    let idx = list.findIndex(i => i.id === imgId);
    if (idx >= 0) {
      list[idx].title = updatedData.title || list[idx].title;
      list[idx].location = updatedData.location || list[idx].location;
      list[idx].url = updatedData.url || list[idx].url;
    } else {
      list.unshift({
        id: imgId || 'hp-img-' + Date.now(),
        title: updatedData.title || 'አዲስ የመነሻ ገፅ ምስል',
        location: updatedData.location || 'Homepage Hero / Carousel',
        url: updatedData.url,
        created_at: new Date().toISOString()
      });
    }

    localStorage.setItem('eth_lottery_homepage_images', JSON.stringify(list));
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('homepage_images').upsert(list);
      } catch (e) {
        console.warn('Supabase update homepage image failed:', e);
      }
    }
    return true;
  }

  async deleteManagedImage(imgId, sourceType, extraData = {}) {
    if (imgId === 'img-logo-main' || sourceType === 'logo') {
      const settings = await this.getSiteSettings();
      settings.logo_url = '/assets/official_logo.jpg';
      await this.updateSiteSettings(settings);
      return true;
    }

    if ((sourceType === 'prize' || sourceType === 'category') && extraData.prize_id !== undefined) {
      const prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
      const prize = prizes.find(p => p.id === extraData.prize_id);
      if (prize && prize.images && extraData.image_index !== undefined) {
        // Reset to clean placeholder to ensure slider integrity
        prize.images[extraData.image_index] = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80';
        await this.savePrize(prize);
      }
      return true;
    }

    if (sourceType === 'payment' && extraData.payment_id) {
      const methods = await this.getPaymentMethods();
      const pm = methods.find(m => m.id === extraData.payment_id);
      if (pm) {
        pm.logo_url = '';
        await this.savePaymentMethod(pm);
      }
      return true;
    }

    // Default homepage images delete
    return await this.deleteHomepageImage(imgId);
  }

  async reorderPrizeImage(prizeId, fromIndex, toIndex) {
    const prizes = JSON.parse(localStorage.getItem('eth_lottery_prizes') || '[]');
    const prize = prizes.find(p => p.id === prizeId);
    if (!prize || !prize.images || fromIndex < 0 || toIndex < 0 || fromIndex >= prize.images.length || toIndex >= prize.images.length) {
      return false;
    }

    const temp = prize.images[fromIndex];
    prize.images.splice(fromIndex, 1);
    prize.images.splice(toIndex, 0, temp);

    await this.savePrize(prize);
    return true;
  }


  // --- HOMEPAGE IMAGES API ---
  async getHomepageImages() {
    if (this.isSupabaseConnected) {
      try {
        const { data, error } = await this.supabase
          .from('homepage_images')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch (e) {
        console.warn('Supabase fetch homepage images failed:', e);
      }
    }
    const local = JSON.parse(localStorage.getItem('eth_lottery_homepage_images') || '[]');
    return local;
  }
   async saveHomepageImage(imgObj) {
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('homepage_images').upsert([imgObj]);
      } catch (e) {
        console.warn('Supabase save homepage image failed:', e);
      }
    }
    // Best-effort local backup only - Supabase (when connected) is the real source of
    // truth for this data. Wrapped in try/catch and capped to a few recent entries so
    // it can never throw a "quota exceeded" error and break an otherwise-successful save.
    try {
      const list = JSON.parse(localStorage.getItem('eth_lottery_homepage_images') || '[]');
      const idx = list.findIndex(i => i.id === imgObj.id);
      if (idx >= 0) list[idx] = imgObj;
      else list.unshift(imgObj);
      localStorage.setItem('eth_lottery_homepage_images', JSON.stringify(list.slice(0, 8)));
    } catch (e) {
      console.warn('Local homepage image cache write skipped (non-fatal):', e);
      try { localStorage.removeItem('eth_lottery_homepage_images'); } catch (_) {}
    }
    return true;
  }
  async deleteHomepageImage(imgId) {
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('homepage_images').delete().eq('id', imgId);
      } catch (e) {
        console.warn('Supabase delete homepage image failed:', e);
      }
    }
    try {
      let list = JSON.parse(localStorage.getItem('eth_lottery_homepage_images') || '[]');
      list = list.filter(i => i.id !== imgId);
      localStorage.setItem('eth_lottery_homepage_images', JSON.stringify(list));
    } catch (e) {
      console.warn('Local homepage image cache cleanup skipped (non-fatal):', e);
    }
    return true;
  }
  async savePaymentMethod(method) {
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('payment_methods').upsert([method]);
      } catch (e) {
        console.warn('Supabase save payment method error:', e);
      }
    }
    const list = JSON.parse(localStorage.getItem('eth_lottery_payment_methods') || '[]');
    const index = list.findIndex(m => m.id === method.id);
    if (index >= 0) list[index] = method;
    else list.push(method);
    localStorage.setItem('eth_lottery_payment_methods', JSON.stringify(list));
    return true;
  }

  async deletePaymentMethod(methodId) {
    if (this.isSupabaseConnected) {
      try {
        await this.supabase.from('payment_methods').delete().eq('id', methodId);
      } catch (e) {
        console.warn('Supabase delete payment method error:', e);
      }
    }
    let list = JSON.parse(localStorage.getItem('eth_lottery_payment_methods') || '[]');
    list = list.filter(m => m.id !== methodId);
    localStorage.setItem('eth_lottery_payment_methods', JSON.stringify(list));
    return true;
  }
}

// Global Singleton Instance
window.dbService = new DatabaseService();
