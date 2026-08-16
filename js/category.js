/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Category View JavaScript Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  await CategoryScreen.init();
});

const CategoryScreen = {
  async init() {
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('category') || 'car';

    await this.loadCategoryDetails(categorySlug);
  },

  async loadCategoryDetails(slug) {
    const titleEl = document.getElementById('category-page-title');
    const container = document.getElementById('prizes-container');

    try {
      const category = await window.dbService.getCategoryBySlug(slug);
      if (!category) {
        if (container) container.innerHTML = '<p style="text-align:center; padding: 3rem;">ምድቡ አልተገኘም።</p>';
        return;
      }

      if (titleEl) {
        titleEl.innerHTML = `${category.icon || '🎁'} ${Utils.escapeHTML(category.name_am)} - የሎተሪ እጣዎች`;
      }

      const prizes = await window.dbService.getPrizesForCategory(category.id);

      if (!container) return;
      container.innerHTML = '';

      if (!prizes || prizes.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 3rem; color: var(--text-muted);">ለጊዜው በዚህ ምድብ የተዘጋጁ እጣዎች የሉም።</p>';
        return;
      }

      prizes.forEach((prize, pIdx) => {
        const prizeCard = document.createElement('div');
        prizeCard.className = 'category-card';
        prizeCard.style.marginBottom = '2.5rem';

        // Ensure prize has 5 images
        const images = (prize.images && prize.images.length > 0) ? prize.images : [
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=800&q=80'
        ];

        prizeCard.innerHTML = `
          <div class="category-header">
            <h3 class="category-title">${Utils.escapeHTML(prize.title_am)}</h3>
            <span class="gold-badge">${Utils.escapeHTML(prize.ticket_price || '50 ብር')}</span>
          </div>

          <!-- 5 IMAGE SLIDER -->
          <div id="prize-slider-${prize.id}" style="width: 100%;"></div>

          <div style="padding: 1.5rem; background: var(--surface-card);">
            <p style="color: var(--text-muted); font-size: 1rem; line-height: 1.6; margin-bottom: 1.5rem;">
              ${Utils.escapeHTML(prize.description_am)}
            </p>

            <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 1.25rem;">
              <div>
                <span style="font-size: 0.85rem; color: var(--text-dim); display: block;">የእጣ ዋጋ</span>
                <strong style="font-size: 1.2rem; color: var(--primary);">${Utils.escapeHTML(prize.ticket_price || '50 ብር')}</strong>
              </div>

              <!-- EXACT REQUIRED BUTTON: ቁረጥ -->
              <button class="btn-primary select-prize-btn" data-prize-id="${prize.id}" data-category-id="${category.id}">
                ቁረጥ
              </button>
            </div>
          </div>
        `;

        container.appendChild(prizeCard);

        // Initialize Carousel for prize
        const sliderEl = prizeCard.querySelector(`#prize-slider-${prize.id}`);
        Utils.initCarousel(sliderEl, images, { autoSlide: true, interval: 4500 });
      });

      // Bind "ቁረጥ" click handlers
      document.querySelectorAll('.select-prize-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const prizeId = btn.getAttribute('data-prize-id');
          const catId = btn.getAttribute('data-category-id');

          sessionStorage.setItem('selected_prize_id', prizeId);
          sessionStorage.setItem('selected_category_id', catId);

          window.location.href = 'payment.html';
        });
      });

    } catch (err) {
      console.error('Category load error:', err);
      if (container) {
        container.innerHTML = '<p style="text-align:center; padding: 3rem; color: var(--accent-red);">የመረጃ ጭነት ላይ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።</p>';
      }
    }
  }
};
