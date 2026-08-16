/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Payment Screen JavaScript Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  await PaymentScreen.init();
});

const PaymentScreen = {
  selectedPrize: null,
  selectedCategory: null,
  uploadedScreenshotBase64: null,

  async init() {
    const prizeId = sessionStorage.getItem('selected_prize_id');
    const catId = sessionStorage.getItem('selected_category_id');

    if (!prizeId) {
      // Fallback: Pick default first prize
      const categories = await window.dbService.getCategories();
      if (categories.length > 0) {
        const prizes = await window.dbService.getPrizesForCategory(categories[0].id);
        if (prizes.length > 0) {
          this.selectedPrize = prizes[0];
          this.selectedCategory = categories[0];
        }
      }
    } else {
      this.selectedPrize = await window.dbService.getPrizeById(prizeId);
      if (catId) {
        const categories = await window.dbService.getCategories();
        this.selectedCategory = categories.find(c => c.id === catId);
      }
    }

    this.renderSelectedPrizeSummary();
    await this.renderBankAccounts();
    this.bindFileUpload();
    this.bindFormSubmit();
  },

  renderSelectedPrizeSummary() {
    const container = document.getElementById('selected-prize-summary');
    if (!container) return;

    if (!this.selectedPrize) {
      container.innerHTML = '<p style="color:var(--text-muted);">የተመረጠ እጣ አልተገኘም። እባክዎ አስቀድመው እጣ ይምረጡ።</p>';
      return;
    }

    container.innerHTML = `
      <div style="display:flex; align-items:center; gap:1rem; background: var(--surface); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-gold);">
        <img src="${(this.selectedPrize.images && this.selectedPrize.images[0]) || 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'}" alt="Prize" style="width: 80px; height: 80px; object-fit: cover; border-radius: var(--radius-sm);" />
        <div>
          <span style="font-size:0.8rem; color:var(--primary); font-weight:700;">የተመረጠው ሽልማት</span>
          <h4 style="font-size: 1.15rem; font-weight:800; color:var(--text); margin: 0.2rem 0;">${Utils.escapeHTML(this.selectedPrize.title_am)}</h4>
          <span style="font-size:0.9rem; color:var(--text-muted);">የእጣ ዋጋ: <strong style="color:var(--primary);">${Utils.escapeHTML(this.selectedPrize.ticket_price || '50 ብር')}</strong></span>
        </div>
      </div>
    `;
  },

  async renderBankAccounts() {
    const container = document.getElementById('bank-accounts-container');
    if (!container) return;

    try {
      const methods = await window.dbService.getPaymentMethods();
      container.innerHTML = '';

      methods.forEach((method, idx) => {
        const row = document.createElement('div');
        row.className = 'bank-item';
        row.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
          margin-bottom: 0.85rem;
          transition: border-color 0.2s;
        `;

        row.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <input type="radio" name="payment_method" value="${method.id}" id="pay-method-${method.id}" ${idx === 0 ? 'checked' : ''} style="accent-color: var(--primary); transform: scale(1.2);" />
            <label for="pay-method-${method.id}" style="font-size: 1.05rem; font-weight: 700; color: var(--text); cursor: pointer;">
              ${Utils.escapeHTML(method.name_am)}
            </label>
          </div>

          <div class="bank-number-group" style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-family: var(--font-numeric); font-size: 1.1rem; font-weight: 700; color: var(--primary); letter-spacing: 0.05em;">
              ${Utils.escapeHTML(method.account_number)}
            </span>

            <!-- Copy Button on RIGHT Side -->
            <button type="button" class="btn-copy-account" data-account="${Utils.escapeHTML(method.account_number)}" title="ቁጥሩን ቅዳ" style="
              background: rgba(212, 175, 55, 0.15);
              border: 1px solid var(--border-gold);
              color: var(--primary);
              padding: 0.4rem 0.75rem;
              border-radius: var(--radius-sm);
              font-size: 0.9rem;
              font-weight: 600;
              display: flex;
              align-items: center;
              gap: 0.35rem;
            ">
              📋 ቅዳ
            </button>
          </div>
        `;

        container.appendChild(row);
      });

      // Bind copy listeners
      document.querySelectorAll('.btn-copy-account').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const num = btn.getAttribute('data-account');
          Utils.copyToClipboard(num, 'ቁጥሩ ተቀድቷል!');
        });
      });

    } catch (e) {
      console.error('Error rendering bank accounts:', e);
    }
  },

  bindFileUpload() {
    const fileInput = document.getElementById('screenshot-file-input');
    const previewContainer = document.getElementById('screenshot-preview-container');
    const dropzone = document.getElementById('screenshot-dropzone');

    if (!fileInput) return;

    const handleFile = async (file) => {
      const validation = Utils.validateImageFile(file);
      if (!validation.valid) {
        Utils.showToast(validation.error, 'error');
        return;
      }

      try {
        const base64 = await Utils.readFileAsDataURL(file);
        this.uploadedScreenshotBase64 = base64;

        if (previewContainer) {
          previewContainer.innerHTML = `
            <div style="position: relative; width: 100%; max-width: 320px; margin: 1rem auto 0 auto; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-gold);">
              <img src="${base64}" alt="የክፍያ ማረጋገጫ" style="width: 100%; max-height: 250px; object-fit: contain; background: #000;" />
              <div style="display: flex; gap: 0.5rem; justify-content: center; padding: 0.75rem; background: var(--surface);">
                <button type="button" id="btn-replace-screenshot" class="btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.85rem;">ቀይር</button>
                <button type="button" id="btn-remove-screenshot" class="btn-secondary" style="padding: 0.4rem 0.85rem; font-size: 0.85rem; color: var(--accent-red); border-color: var(--accent-red);">አስወግድ</button>
              </div>
            </div>
          `;

          document.getElementById('btn-remove-screenshot')?.addEventListener('click', () => {
            this.uploadedScreenshotBase64 = null;
            previewContainer.innerHTML = '';
            fileInput.value = '';
          });

          document.getElementById('btn-replace-screenshot')?.addEventListener('click', () => {
            fileInput.click();
          });
        }
      } catch (err) {
        Utils.showToast('የፎቶ ጭነት ላይ ችግር ተፈጥሯል', 'error');
      }
    };

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });

    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--border-gold)';
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-gold)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFile(e.dataTransfer.files[0]);
        }
      });
    }
  },

  bindFormSubmit() {
    const form = document.getElementById('payment-form');
    const submitBtn = document.getElementById('submit-payment-btn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const phoneInput = document.getElementById('customer-phone-input');
      const phoneValue = phoneInput ? phoneInput.value.trim() : '';

      const selectedMethodEl = document.querySelector('input[name="payment_method"]:checked');
      const paymentMethodId = selectedMethodEl ? selectedMethodEl.value : 'pay-cbe';

      // 1. Validate Form Completion
      if (!phoneValue || !this.uploadedScreenshotBase64) {
        Utils.showToast('እባክዎ ሁሉንም አስፈላጊ መረጃ ያሟሉ።', 'error');
        return;
      }

      // 2. Validate Ethiopian Phone Format
      if (!Utils.validateEthiopianPhone(phoneValue)) {
        Utils.showToast('እባክዎ ትክክለኛ የስልክ ቁጥር ያስገቡ።', 'error');
        return;
      }

      // Prevent duplicate submission
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'እየላከ ነው...';
      }

      try {
        const submissionPayload = {
          category_id: this.selectedCategory ? this.selectedCategory.id : 'cat-car',
          prize_id: this.selectedPrize ? this.selectedPrize.id : 'prize-1',
          phone_number: Utils.formatPhone(phoneValue),
          payment_method_id: paymentMethodId,
          payment_screenshot_path: this.uploadedScreenshotBase64
        };

        const result = await window.dbService.createTicketSubmission(submissionPayload);

        if (result && result.success) {
          // Clear session selection
          sessionStorage.removeItem('selected_prize_id');
          sessionStorage.removeItem('selected_category_id');

          // Redirect to success page
          window.location.href = 'success.html';
        } else {
          throw new Error('Submission failed');
        }

      } catch (err) {
        console.error('Submission error:', err);
        Utils.showToast('የመረጃ ጭነት ላይ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'አስገባ';
        }
      }
    });
  }
};
