/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Homepage JavaScript Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  await HomeScreen.init();
});

const HomeScreen = {
  async init() {
    await this.loadHeroSettings();
    await this.renderHeroBanner();
    await this.renderHomepageGallery();
    await this.renderCategoryGrid();
    this.bindCtaScroll();
  },

  async renderHeroBanner() {
    const heroContainer = document.getElementById('hero-banner-container');
    if (!heroContainer) return;

    try {
      const images = await window.dbService.getHomepageImages();
      if (!images || images.length === 0) {
        heroContainer.style.display = 'none';
        return;
      }
      heroContainer.style.display = 'block';

      const imageUrls = images.map(img => img.url).filter(Boolean);
      if (imageUrls.length > 0) {
        Utils.initCarousel(heroContainer, imageUrls, { autoSlide: true, interval: 4000 });
      } else {
        heroContainer.style.display = 'none';
      }
    } catch (e) {
      console.error('Error rendering hero banner:', e);
    }
  },

  async renderHomepageGallery() {
    const galleryContainer = document.getElementById('homepage-images-gallery-container');
    if (!galleryContainer) return;

    try {
      const images = await window.dbService.getHomepageImages();
      galleryContainer.innerHTML = '';

      const section = document.getElementById('homepage-featured-images-section');
      if (!images || images.length === 0) {
        if (section) section.style.display = 'none';
        return;
      } else {
        if (section) section.style.display = 'block';
      }

      images.forEach(img => {
        const item = document.createElement('div');
        item.style.cssText = 'padding:1rem; border-radius:var(--radius-md); background:var(--surface); border:1px solid var(--border); overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; box-shadow:var(--shadow-sm);';
        item.innerHTML = `
          <div style="width:100%; height:200px; border-radius:var(--radius-sm); overflow:hidden; background:#000; margin-bottom:0.75rem; border:1px solid var(--border);">
            <img src="${Utils.escapeHTML(img.url)}" alt="${Utils.escapeHTML(img.title)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'200\\'><rect fill=\\'%2313131a\\' width=\\'400\\' height=\\'200\\'/><text fill=\\'%238a8a9e\\' font-size=\\'14\\' font-family=\\'sans-serif\\' font-weight=\\'bold\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>ምስል የለም</text></svg>';" />
          </div>
          <div>
            <h4 style="font-size:1.05rem; font-weight:800; color:var(--text); margin-bottom:0.4rem;">${Utils.escapeHTML(img.title)}</h4>
            <a href="#categories-section" class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem; width:100%; justify-content:center; margin-top:0.5rem;">
              እድልዎን ይሞክሩ 🎯
            </a>
          </div>
        `;
        galleryContainer.appendChild(item);
      });
    } catch (e) {
      console.error('Error rendering homepage gallery:', e);
    }
  },

  async loadHeroSettings() {
    try {
      const settings = await window.dbService.getSiteSettings();
      const heroTitleEl = document.getElementById('hero-title');
      if (heroTitleEl && settings.hero_title_am) {
        heroTitleEl.textContent = settings.hero_title_am;
      }

      const disclaimerEl = document.getElementById('bottom-disclaimer-text');
      if (disclaimerEl) {
        disclaimerEl.textContent = settings.bottom_disclaimer_am || APP_CONFIG.DEFAULT_SITE_SETTINGS.bottom_disclaimer_am;
      }
    } catch (e) {
      console.error('Error loading hero settings:', e);
    }
  },

  async renderCategoryGrid() {
    const gridContainer = document.getElementById('category-grid-container');
    if (!gridContainer) return;

    try {
      const categories = await window.dbService.getCategories();
      gridContainer.innerHTML = '';

      for (const cat of categories) {
        // Fetch prizes to extract preview images for this category
        const prizes = await window.dbService.getPrizesForCategory(cat.id);
        
        // Collect all custom images from all prizes in this category
        let previewImages = [];
        prizes.forEach(p => {
          if (p.images && Array.isArray(p.images)) {
            p.images.forEach(img => {
              if (img && typeof img === 'string' && img.trim().length > 0 && !previewImages.includes(img.trim())) {
                previewImages.push(img.trim());
              }
            });
          }
        });

        if (previewImages.length === 0) {
          // Fallback sample images
          previewImages = [
            'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
            'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
          ];
        }

        // Category ticket price
        const priceDisplay = cat.ticket_price || (prizes[0] && prizes[0].ticket_price) || '50 ብር';

        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
          <div class="category-header">
            <h3 class="category-title">
              <span>${cat.icon || '🎁'}</span>
              <span>${Utils.escapeHTML(cat.name_am)}</span>
            </h3>
            <span class="gold-badge" style="font-size: 0.8rem; font-weight: 700; padding: 0.25rem 0.65rem;">
              🏷️ ${Utils.escapeHTML(priceDisplay)}
            </span>
          </div>
          <div class="category-carousel-wrapper" id="carousel-${cat.id}"></div>
          <div class="category-footer" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <span style="font-size: 0.8rem; color: var(--text-dim); display: block;">የእጣ ዋጋ</span>
              <strong style="font-size: 1.05rem; color: var(--primary); font-family: var(--font-numeric);">${Utils.escapeHTML(priceDisplay)}</strong>
            </div>
            <a href="category.html?category=${encodeURIComponent(cat.slug)}" class="btn-primary" style="padding: 0.6rem 1.25rem; font-size: 0.9rem;">
              እጣዎችን ይመልከቱ ❯
            </a>
          </div>
        `;

        gridContainer.appendChild(card);

        // Initialize Carousel
        const carouselEl = card.querySelector(`#carousel-${cat.id}`);
        Utils.initCarousel(carouselEl, previewImages, { autoSlide: true, interval: 4000 });
      }
    } catch (err) {
      console.error('Error rendering category grid:', err);
      gridContainer.innerHTML = '<p style="text-align:center; color: var(--accent-red); padding: 2rem;">የመረጃ ጭነት ላይ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።</p>';
    }
  },

  bindCtaScroll() {
    const ctaBtn = document.getElementById('hero-cta-btn');
    const targetSection = document.getElementById('categories-section');
    if (ctaBtn && targetSection) {
      ctaBtn.addEventListener('click', (e) => {
        e.preventDefault();
        targetSection.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
};
