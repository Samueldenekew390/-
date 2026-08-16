/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Core Frontend Application Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // Register Service Worker for PWA capabilities
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
      console.log('PWA ServiceWorker registered');
    } catch (e) {
      console.warn('SW registration skipped:', e);
    }
  }

  // Initialize Header Branding, Mobile Drawer & Footer Settings
  await AppCore.initHeaderAndFooter();
  AppCore.bindMobileNav();
});

const AppCore = {
  async initHeaderAndFooter() {
    try {
      const settings = await window.dbService.getSiteSettings();
      
      // Update Brand Logo across Header & Footer
      const logoContainers = document.querySelectorAll('.brand-logo-container');
      const logoSrc = (settings && settings.logo_url && settings.logo_url.trim() !== '') 
        ? settings.logo_url 
        : '/assets/official_logo.jpg';

      logoContainers.forEach(container => {
        container.innerHTML = `
          <img src="${Utils.escapeHTML(logoSrc)}" alt="${APP_CONFIG.APP_NAME}" class="brand-logo-img" onerror="this.src='/assets/official_logo.jpg';" />
          <span class="brand-title">${APP_CONFIG.APP_NAME}</span>
        `;
      });

      // Populate Footer Legal & Operator Text
      const operatorEl = document.getElementById('footer-operator-info');
      if (operatorEl) operatorEl.textContent = settings.operator_information || APP_CONFIG.DEFAULT_SITE_SETTINGS.operator_information;

      const legalEl = document.getElementById('footer-legal-info');
      if (legalEl) legalEl.textContent = settings.legal_information || APP_CONFIG.DEFAULT_SITE_SETTINGS.legal_information;

    } catch (e) {
      console.error('Header init error:', e);
    }
  },

  bindMobileNav() {
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const overlay = document.getElementById('mobile-nav-overlay');
    const closeBtn = document.getElementById('mobile-nav-close');

    if (mobileToggle && overlay) {
      mobileToggle.addEventListener('click', () => {
        overlay.classList.add('open');
      });
    }

    if (closeBtn && overlay) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('open');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('open');
      });
    }
  }
};

window.AppCore = AppCore;
