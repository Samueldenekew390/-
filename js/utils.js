/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Utility Helper Functions
   ========================================================================== */

const Utils = {
  // Toast Notification System
  showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : '✕';
    toast.innerHTML = `<span style="font-weight:bold">${icon}</span> <span>${this.escapeHTML(message)}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  // Copy Only Account Number to Clipboard
  async copyToClipboard(text, successMsg = 'ቁጥሩ ተቀድቷል!') {
    const cleanedText = String(text).trim();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanedText);
      } else {
        // Fallback for non-HTTPS or older mobile browsers
        const textarea = document.createElement('textarea');
        textarea.value = cleanedText;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      this.showToast(successMsg, 'success');
      return true;
    } catch (err) {
      console.error('Copy failed:', err);
      this.showToast('ቁጥሩን መቅዳት አልተቻለም', 'error');
      return false;
    }
  },

  // Ethiopian Phone Number Validation
  validateEthiopianPhone(phone) {
    if (!phone) return false;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    // Matches 09xxxxxxxx, 07xxxxxxxx, +2519xxxxxxxx, +2517xxxxxxxx, 2519xxxxxxxx, 2517xxxxxxxx
    const ethioRegex = /^(?:\+251|251|0)?(9|7)\d{8}$/;
    return ethioRegex.test(cleanPhone);
  },

  // Format Ethiopian Phone nicely
  formatPhone(phone) {
    if (!phone) return '';
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('251')) clean = '0' + clean.slice(3);
    if (clean.length === 9) clean = '0' + clean;
    return clean;
  },

  // Escape HTML to prevent XSS
  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // File Validation
  validateImageFile(file) {
    if (!file) return { valid: false, error: 'እባክዎ ምስል ይምረጡ' };
    
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return { valid: false, error: 'እባክዎ ትክክለኛ የፎቶ አይነት ያስገቡ (JPG, PNG, WEBP)' };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: 'የፎቶው መጠን ከ 10MB መብለጥ የለበትም' };
    }

    return { valid: true };
  },

  // Read File as Data URL (Base64)
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('ምስሉን ማንበብ አልተቻለም'));
      reader.readAsDataURL(file);
    });
  },

  // Create Carousel Component
  initCarousel(containerEl, images, options = {}) {
    if (!containerEl || !images || images.length === 0) return;

    let currentIndex = 0;
    const autoSlideInterval = options.autoSlide !== false ? (options.interval || 4000) : null;
    let timer = null;

    containerEl.innerHTML = `
      <div class="carousel-container">
        <div class="carousel-track">
          ${images.map((imgUrl, idx) => `
            <div class="carousel-slide">
              <img src="${this.escapeHTML(imgUrl)}" alt="ምስል ${idx + 1}" loading="${idx === 0 ? 'eager' : 'lazy'}" onerror="this.src='https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=800&q=80'" />
            </div>
          `).join('')}
        </div>
        <button class="carousel-btn prev" aria-label="ያለፈው">❮</button>
        <button class="carousel-btn next" aria-label="ቀጣይ">❯</button>
        <div class="carousel-dots">
          ${images.map((_, idx) => `<div class="carousel-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"></div>`).join('')}
        </div>
      </div>
    `;

    const track = containerEl.querySelector('.carousel-track');
    const dots = containerEl.querySelectorAll('.carousel-dot');
    const prevBtn = containerEl.querySelector('.carousel-btn.prev');
    const nextBtn = containerEl.querySelector('.carousel-btn.next');

    function goToIndex(index) {
      if (index < 0) index = images.length - 1;
      if (index >= images.length) index = 0;
      currentIndex = index;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToIndex(currentIndex - 1);
      resetAutoSlide();
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goToIndex(currentIndex + 1);
      resetAutoSlide();
    });

    dots.forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goToIndex(parseInt(dot.getAttribute('data-index')));
        resetAutoSlide();
      });
    });

    // Touch Swipe Support on Mobile
    let startX = 0;
    let isDragging = false;

    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      pauseAutoSlide();
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      if (Math.abs(diffX) > 40) {
        if (diffX > 0) goToIndex(currentIndex + 1);
        else goToIndex(currentIndex - 1);
      }
      isDragging = false;
      resetAutoSlide();
    }, { passive: true });

    function startAutoSlide() {
      if (autoSlideInterval && images.length > 1) {
        timer = setInterval(() => goToIndex(currentIndex + 1), autoSlideInterval);
      }
    }

    function pauseAutoSlide() {
      if (timer) clearInterval(timer);
    }

    function resetAutoSlide() {
      pauseAutoSlide();
      startAutoSlide();
    }

    containerEl.addEventListener('mouseenter', pauseAutoSlide);
    containerEl.addEventListener('mouseleave', startAutoSlide);

    startAutoSlide();
  },

  // Safe offline SVG placeholder image data URI
  getPlaceholderSvg(text = 'ምስል የለም', width = 400, height = 200) {
    const safeText = String(text).replace(/[<>&"]/g, '');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect fill="%2313131a" width="${width}" height="${height}"/><rect x="2" y="2" width="${width - 4}" height="${height - 4}" fill="none" stroke="%232e2e42" stroke-width="1.5" stroke-dasharray="6,6"/><text fill="%238a8a9e" font-family="sans-serif" font-size="14" font-weight="bold" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(safeText)}</text></svg>`;
    return `data:image/svg+xml;utf8,${svg}`;
  }
};
