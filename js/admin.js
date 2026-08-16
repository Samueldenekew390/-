/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Admin Dashboard Controller
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = await AdminAuth.checkAuthAndRedirect();
  if (isAuth && AdminAuth.isLoggedIn()) {
    await AdminDashboard.init();
  }
});

const AdminDashboard = {
  activeTab: 'submissions',

  async init() {
    this.bindNavTabs();
    this.bindLogout();
    this.bindMobileSidebar();
    await this.refreshAllData();
    this.handleInitialHash();
  },

  switchTab(tabName) {
    if (!tabName) return;
    let tab = tabName.replace(/^#/, '').toLowerCase().trim();
    if (tab === 'homepage-images' || tab === 'image-management' || tab === 'admin-images' || tab === 'image') {
      tab = 'images';
    }

    const navItems = document.querySelectorAll('.admin-nav-item');
    navItems.forEach(i => {
      const itemTab = (i.getAttribute('data-tab') || i.getAttribute('href') || '').replace(/^#/, '').toLowerCase().trim();
      if (itemTab === tab || (tab === 'images' && (itemTab === 'homepage-images' || itemTab === 'images'))) {
        i.classList.add('active');
      } else {
        i.classList.remove('active');
      }
    });

    document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
    
    let targetContent = document.getElementById(`tab-content-${tab}`);
    if (!targetContent && tab === 'images') {
      targetContent = document.getElementById('tab-content-homepage-images');
    } else if (!targetContent && tab === 'homepage-images') {
      targetContent = document.getElementById('tab-content-images');
    }

    if (targetContent) {
      targetContent.style.display = 'block';
    }

    this.activeTab = tab;
    
    // Close mobile sidebar if open
    document.getElementById('admin-sidebar')?.classList.remove('open');
    document.getElementById('admin-sidebar-backdrop')?.classList.remove('open');

    // Trigger tab-specific refresh if needed
    if (tab === 'images' || tab === 'homepage-images') {
      this.renderHomepageImagesManager();
    }
  },

  bindNavTabs() {
    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab') || (item.getAttribute('href') || '').replace('#', '');
        if (!tab) return;

        if (history.pushState) {
          history.pushState(null, '', `#${tab}`);
        } else {
          window.location.hash = tab;
        }

        this.switchTab(tab);
      });
    });
  },

  bindMobileSidebar() {
    const toggleBtn = document.getElementById('admin-mobile-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('admin-sidebar-backdrop');

    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sidebar.classList.toggle('open');
        backdrop?.classList.toggle('open');
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('open');
      });
    }
  },

  handleInitialHash() {
    const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
    if (hash) {
      this.switchTab(hash);
    } else {
      this.switchTab('submissions');
    }

    window.addEventListener('hashchange', () => {
      const newHash = window.location.hash ? window.location.hash.replace('#', '') : '';
      if (newHash) {
        this.switchTab(newHash);
      }
    });
  },

  bindLogout() {
    document.getElementById('admin-logout-btn')?.addEventListener('click', () => {
      AdminAuth.logout();
    });
  },

  async refreshAllData() {
    await this.renderStats();
    await this.renderSubmissionsTable();
    await this.renderCategoriesTable();
    await this.renderPrizesTable();
    await this.renderPaymentMethodsTable();
    await this.renderHomepageImagesManager();
    await this.renderCategoryPricesManager();
    await this.loadBrandingSettings();
  },

  // --- 1. STATS OVERVIEW ---
  async renderStats() {
    const submissions = await window.dbService.getAdminSubmissions();
    const totalCount = submissions.length;
    const pendingCount = submissions.filter(s => s.status === 'pending').length;
    const reviewingCount = submissions.filter(s => s.status === 'reviewing').length;
    const approvedCount = submissions.filter(s => s.status === 'approved').length;
    const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = submissions.filter(s => s.created_at && s.created_at.startsWith(todayStr)).length;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('stat-total-submissions', totalCount);
    setVal('stat-pending-submissions', pendingCount);
    setVal('stat-reviewing-submissions', reviewingCount);
    setVal('stat-approved-submissions', approvedCount);
    setVal('stat-rejected-submissions', rejectedCount);
    setVal('stat-today-submissions', todayCount);
  },

  // --- 2. CUSTOMER SUBMISSIONS TABLE ---
  async renderSubmissionsTable() {
    const tbody = document.getElementById('submissions-table-body');
    if (!tbody) return;

    const searchVal = document.getElementById('search-phone-input')?.value || '';
    const statusVal = document.getElementById('filter-status-select')?.value || 'all';

    const submissions = await window.dbService.getAdminSubmissions({
      search: searchVal,
      status: statusVal
    });

    tbody.innerHTML = '';

    if (submissions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">ምንም የቲኬት ጥያቄ አልተገኘም።</td></tr>';
      return;
    }

    submissions.forEach((sub, idx) => {
      const row = document.createElement('tr');
      const dateFormatted = new Date(sub.created_at).toLocaleString('am-ET', { dateStyle: 'short', timeStyle: 'short' });

      let statusBadgeClass = 'pending';
      let statusText = 'በመጠባበቅ ላይ';
      if (sub.status === 'reviewing') { statusBadgeClass = 'reviewing'; statusText = 'እየተመረመረ ነው'; }
      if (sub.status === 'approved') { statusBadgeClass = 'approved'; statusText = 'ተፈቅዷል'; }
      if (sub.status === 'rejected') { statusBadgeClass = 'rejected'; statusText = 'ውድቅ ተደርጓል'; }

      row.innerHTML = `
        <td style="font-family:var(--font-numeric); font-weight:700;">#${sub.id.slice(-6)}</td>
        <td style="font-family:var(--font-numeric); font-weight:700; color:var(--primary);">${Utils.escapeHTML(sub.phone_number)}</td>
        <td>${dateFormatted}</td>
        <td>
          <button type="button" class="btn-secondary view-screenshot-btn" data-sub-id="${sub.id}" style="padding:0.3rem 0.65rem; font-size:0.8rem;">
            📷 ፎቶ ይመልከቱ
          </button>
        </td>
        <td>
          <span class="badge-status ${statusBadgeClass}">${statusText}</span>
        </td>
        <td>
          <select class="form-control status-select-dropdown" data-sub-id="${sub.id}" style="padding:0.3rem; font-size:0.85rem; width: auto;">
            <option value="pending" ${sub.status === 'pending' ? 'selected' : ''}>በመጠባበቅ ላይ</option>
            <option value="reviewing" ${sub.status === 'reviewing' ? 'selected' : ''}>እየተመረመረ ነው</option>
            <option value="approved" ${sub.status === 'approved' ? 'selected' : ''}>ተፈቅዷል</option>
            <option value="rejected" ${sub.status === 'rejected' ? 'selected' : ''}>ውድቅ ተደርጓል</option>
          </select>
        </td>
      `;

      tbody.appendChild(row);
    });

    // Bind Status dropdown changes
    document.querySelectorAll('.status-select-dropdown').forEach(select => {
      select.addEventListener('change', async (e) => {
        const subId = select.getAttribute('data-sub-id');
        const newStatus = select.value;
        await window.dbService.updateSubmissionStatus(subId, newStatus);
        Utils.showToast('የቲኬት ሁኔታ ተቀይሯል', 'success');
        await this.renderStats();
      });
    });

    // Bind Screenshot Modal buttons
    document.querySelectorAll('.view-screenshot-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const subId = btn.getAttribute('data-sub-id');
        const submissions = await window.dbService.getAdminSubmissions();
        const sub = submissions.find(s => s.id === subId);

        if (sub && sub.payment_screenshot_path) {
          const modal = document.getElementById('screenshot-modal');
          const imgEl = document.getElementById('modal-screenshot-img');
          const phoneEl = document.getElementById('modal-screenshot-phone');

          if (imgEl) imgEl.src = sub.payment_screenshot_path;
          if (phoneEl) phoneEl.textContent = `ስልክ: ${sub.phone_number}`;

          if (modal) modal.classList.add('open');
        } else {
          Utils.showToast('የክፍያ ማረጋገጫ ምስል አልተገኘም', 'error');
        }
      });
    });
  },

  // --- 3. CATEGORIES MANAGEMENT ---
  async renderCategoriesTable() {
    const tbody = document.getElementById('categories-table-body');
    if (!tbody) return;

    const categories = await window.dbService.getCategories();
    tbody.innerHTML = '';

    categories.forEach(cat => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-size:1.2rem;">${cat.icon || '🎁'}</td>
        <td style="font-weight:700;">${Utils.escapeHTML(cat.name_am)}</td>
        <td style="color:var(--text-muted);">${Utils.escapeHTML(cat.slug)}</td>
        <td>${cat.display_order}</td>
        <td>
          <span class="badge-status ${cat.active ? 'approved' : 'rejected'}">${cat.active ? 'ንቁ' : 'ቦዝኗል'}</span>
        </td>
        <td>
          <button type="button" class="btn-secondary edit-cat-btn" data-cat-id="${cat.id}" style="padding:0.3rem 0.65rem; font-size:0.8rem;">ማስተካከያ</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  },

  // --- 4. PRIZES MANAGEMENT ---
  async renderPrizesTable() {
    const tbody = document.getElementById('prizes-table-body');
    if (!tbody) return;

    const categories = await window.dbService.getCategories();
    
    // Populate Category Dropdown in Prize Modal
    const categorySelect = document.getElementById('edit-prize-category');
    if (categorySelect) {
      categorySelect.innerHTML = categories.map(c => 
        `<option value="${c.id}">${c.icon || '🎁'} ${Utils.escapeHTML(c.name_am)}</option>`
      ).join('');
    }

    tbody.innerHTML = '';
    const allPrizesList = [];

    for (const cat of categories) {
      const prizes = await window.dbService.getPrizesForCategory(cat.id);
      prizes.forEach(prize => {
        allPrizesList.push(prize);
        const imgCount = (prize.images && Array.isArray(prize.images)) ? prize.images.length : 0;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight:700;">${Utils.escapeHTML(prize.title_am)}</td>
          <td>${cat.icon || '🎁'} ${Utils.escapeHTML(cat.name_am)}</td>
          <td>
            <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
              <span class="gold-badge" style="font-size:0.85rem; font-weight:700;">
                ${Utils.escapeHTML(prize.ticket_price || '50 ብር')}
              </span>
              <button type="button" class="btn-secondary inline-price-btn" data-prize-id="${prize.id}" style="padding:0.2rem 0.5rem; font-size:0.75rem;">
                ✏️ ዋጋ ቀይር
              </button>
            </div>
          </td>
          <td>
            <span style="background:rgba(212, 175, 55, 0.15); color:var(--primary); padding:0.2rem 0.6rem; border-radius:12px; font-size:0.8rem; font-weight:700;">
              🖼️ ${imgCount} ምስሎች
            </span>
          </td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button type="button" class="btn-secondary edit-prize-btn" data-prize-id="${prize.id}" style="padding:0.3rem 0.65rem; font-size:0.8rem;">
                ✏️ ማስተካከያ
              </button>
              <button type="button" class="btn-secondary delete-prize-btn" data-prize-id="${prize.id}" style="padding:0.3rem 0.5rem; font-size:0.8rem; color:#e74c3c;">
                🗑️
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    // Bind Quick Inline Price Change buttons
    document.querySelectorAll('.inline-price-btn').forEach(btn => {
      btn.onclick = async () => {
        const prizeId = btn.getAttribute('data-prize-id');
        const prize = allPrizesList.find(p => p.id === prizeId);
        if (!prize) return;

        const newP = prompt(`"${prize.title_am}" - አዲስ የእጣ ዋጋ ያስገቡ (ምሳሌ፡ 100 ብር):`, prize.ticket_price || '50 ብር');
        if (newP && newP.trim()) {
          prize.ticket_price = newP.trim();
          await window.dbService.savePrize(prize);
          Utils.showToast(`${prize.title_am} የእጣ ዋጋ ወደ ${newP.trim()} ተቀይሯል! 💰`, 'success');
          await this.renderPrizesTable();
        }
      };
    });

    // Helper function to render Live Image Previews in modal
    const renderImagePreviews = () => {
      const urlTextarea = document.getElementById('edit-prize-image-urls');
      const galleryEl = document.getElementById('prize-image-preview-gallery');
      if (!urlTextarea || !galleryEl) return;

      const rawText = urlTextarea.value || '';
      const urls = rawText.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0);

      galleryEl.innerHTML = '';
      if (urls.length === 0) {
        galleryEl.innerHTML = '<span style="font-size:0.75rem; color:var(--text-dim);">ምንም የተጫነ ምስል የለም</span>';
        return;
      }

      urls.forEach((url, idx) => {
        const thumbBox = document.createElement('div');
        thumbBox.style.cssText = 'position:relative; width:60px; height:60px; border-radius:6px; overflow:hidden; border:1px solid var(--border); background:#000;';
        thumbBox.innerHTML = `
          <img src="${Utils.escapeHTML(url)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'60\\'><rect fill=\\'%2313131a\\' width=\\'60\\' height=\\'60\\'/><text fill=\\'%238a8a9e\\' font-size=\\'10\\' font-family=\\'sans-serif\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>Error</text></svg>';" />
          <button type="button" data-idx="${idx}" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.7); color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
        `;

        // Remove image URL on click
        thumbBox.querySelector('button').onclick = () => {
          urls.splice(idx, 1);
          urlTextarea.value = urls.join('\n');
          renderImagePreviews();
        };

        galleryEl.appendChild(thumbBox);
      });
    };

    // Listen to changes in image URL textarea
    const imgUrlsInput = document.getElementById('edit-prize-image-urls');
    if (imgUrlsInput) {
      imgUrlsInput.oninput = renderImagePreviews;
    }

    // Bind Price Quick Presets
    document.querySelectorAll('.price-preset-btn').forEach(btn => {
      btn.onclick = () => {
        const price = btn.getAttribute('data-price');
        const priceInput = document.getElementById('edit-prize-ticket-price');
        if (priceInput && price) {
          priceInput.value = price;
        }
      };
    });

    // Bind ImgBB File Upload Button
    const uploadBtn = document.getElementById('imgbb-upload-btn');
    const fileInput = document.getElementById('imgbb-file-input');
    const statusEl = document.getElementById('imgbb-upload-status');

    if (uploadBtn && fileInput) {
      uploadBtn.onclick = () => fileInput.click();

      fileInput.onchange = async () => {
        const files = Array.from(fileInput.files || []);
        if (files.length === 0) return;

        if (statusEl) statusEl.textContent = `⏳ ${files.length} ምስሎች ወደ ImgBB በመጫን ላይ...`;
        uploadBtn.disabled = true;

        const newUrls = [];
        for (const file of files) {
          try {
            const res = await window.ImageUploadService.uploadToImageBB(file);
            if (res && res.url) {
              newUrls.push(res.url);
            }
          } catch (e) {
            console.error('Upload error:', e);
          }
        }

        if (newUrls.length > 0 && imgUrlsInput) {
          const currentVal = imgUrlsInput.value.trim();
          const combined = currentVal ? (currentVal + '\n' + newUrls.join('\n')) : newUrls.join('\n');
          imgUrlsInput.value = combined;
          renderImagePreviews();
          if (statusEl) statusEl.textContent = `✅ ${newUrls.length} ምስል ወደ ImgBB በትክክል ተጫነ!`;
        } else {
          if (statusEl) statusEl.textContent = '❌ ምስል መጫን አልተሳካም። እባክዎ ሊንክ ኮፒ አድርገው ያስገቡ።';
        }

        uploadBtn.disabled = false;
        fileInput.value = '';
        setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 4000);
      };
    }

    // Bind Edit Prize button clicks
    document.querySelectorAll('.edit-prize-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prizeId = btn.getAttribute('data-prize-id');
        const prize = allPrizesList.find(p => p.id === prizeId);
        if (!prize) return;

        document.getElementById('prize-modal-title').textContent = 'የእጣ መረጃ፣ ዋጋና ImgBB ምስል ማስተካከያ';
        document.getElementById('edit-prize-id').value = prize.id;
        
        if (categorySelect && prize.category_id) categorySelect.value = prize.category_id;
        document.getElementById('edit-prize-title').value = prize.title_am || '';
        document.getElementById('edit-prize-ticket-price').value = prize.ticket_price || '50 ብር';
        
        const imgUrls = (prize.images && Array.isArray(prize.images)) ? prize.images.join('\n') : '';
        if (imgUrlsInput) imgUrlsInput.value = imgUrls;

        document.getElementById('edit-prize-description').value = prize.description_am || '';

        renderImagePreviews();

        const modal = document.getElementById('prize-modal');
        if (modal) modal.classList.add('open');
      });
    });

    // Bind Delete Prize button clicks
    document.querySelectorAll('.delete-prize-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const prizeId = btn.getAttribute('data-prize-id');
        const prize = allPrizesList.find(p => p.id === prizeId);
        if (!prize) return;

        if (confirm(`እርግጠኛ ነዎት "${prize.title_am}" የተባለውን እጣ መሰረዝ ይፈልጋሉ?`)) {
          await window.dbService.deletePrize(prizeId);
          Utils.showToast('እጣው በትክክል ተሰርዟል', 'success');
          await this.renderPrizesTable();
        }
      });
    });

    // Bind "➕ አዲስ እጣ ጨምር" (Add New Prize) Button
    const addPrizeBtn = document.getElementById('add-prize-btn');
    if (addPrizeBtn) {
      addPrizeBtn.onclick = () => {
        document.getElementById('prize-modal-title').textContent = '➕ አዲስ የሎተሪ እጣ መጨመሪያ';
        document.getElementById('edit-prize-id').value = 'prize-custom-' + Date.now();
        if (categorySelect && categories.length > 0) categorySelect.value = categories[0].id;
        document.getElementById('edit-prize-title').value = '';
        document.getElementById('edit-prize-ticket-price').value = '50 ብር';
        if (imgUrlsInput) imgUrlsInput.value = '';
        document.getElementById('edit-prize-description').value = '';

        renderImagePreviews();

        const modal = document.getElementById('prize-modal');
        if (modal) modal.classList.add('open');
      };
    }

    // Bind Batch Price Change Button
    const batchBtn = document.getElementById('batch-price-btn');
    if (batchBtn) {
      batchBtn.onclick = async () => {
        const newPrice = prompt('የሁሉም እጣዎች አዲስ የእጣ ዋጋ ያስገቡ (ምሳሌ፡ 100 ብር):', '50 ብር');
        if (newPrice && newPrice.trim()) {
          await window.dbService.updateAllTicketPrices(newPrice.trim());
          Utils.showToast(`የሁሉም እጣዎች ዋጋ ወደ ${newPrice.trim()} ተቀይሯል!`, 'success');
          await this.renderPrizesTable();
        }
      };
    }

    // Bind Prize Modal Edit Form Submission
    const prizeForm = document.getElementById('prize-edit-form');
    if (prizeForm) {
      prizeForm.onsubmit = async (e) => {
        e.preventDefault();
        const pId = document.getElementById('edit-prize-id').value;
        const pCatId = categorySelect ? categorySelect.value : (categories[0] ? categories[0].id : 'car');
        const pTitle = document.getElementById('edit-prize-title').value.trim();
        const pPrice = document.getElementById('edit-prize-ticket-price').value.trim();
        const rawUrls = imgUrlsInput ? imgUrlsInput.value : '';
        const pDesc = document.getElementById('edit-prize-description').value.trim();

        // Parse ImgBB image URLs
        const pImages = rawUrls.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0);

        const selectedCatObj = categories.find(c => c.id === pCatId) || categories[0];

        const prizeObj = {
          id: pId,
          category_id: pCatId,
          category_slug: selectedCatObj ? selectedCatObj.slug : 'car',
          title_am: pTitle,
          ticket_price: pPrice || '50 ብር',
          description_am: pDesc || `የ 2019 አዲስ አመት ልዩ አጓጊ የ ${pTitle} ዕጣ ሽልማት።`,
          images: pImages.length > 0 ? pImages : [
            'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
          ],
          active: true,
          display_order: allPrizesList.length + 1,
          created_at: new Date().toISOString()
        };

        await window.dbService.savePrize(prizeObj);
        Utils.showToast('የእጣ መረጃ፣ ዋጋና ImgBB ምስል በትክክል ተመዝግቧል! 🎯', 'success');

        const modal = document.getElementById('prize-modal');
        if (modal) modal.classList.remove('open');

        await this.renderPrizesTable();
      };
    }
  },

  // --- 5. PAYMENT METHODS MANAGEMENT ---
  async renderPaymentMethodsTable() {
    const tbody = document.getElementById('payment-methods-table-body');
    if (!tbody) return;

    const methods = await window.dbService.getPaymentMethods();
    tbody.innerHTML = '';

    if (!methods || methods.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:1.5rem;">ምንም የተቀመጠ የባንክ አካውንት የለም። እባክዎ "አዲስ የባንክ አካውንት ጨምር" የሚለውን ይጫኑ።</td></tr>';
    } else {
      methods.forEach(m => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight:700;">${Utils.escapeHTML(m.name_am)}</td>
          <td style="font-family:var(--font-numeric); font-weight:700; color:var(--primary); font-size:1.05rem;">
            ${Utils.escapeHTML(m.account_number)}
          </td>
          <td>
            <span style="background:rgba(46,204,113,0.15); color:#2ecc71; padding:0.25rem 0.6rem; border-radius:12px; font-size:0.75rem; font-weight:700;">
              ይሰራል (Active)
            </span>
          </td>
          <td>
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <button type="button" class="btn-secondary edit-payment-btn" data-pay-id="${m.id}" style="padding:0.3rem 0.75rem; font-size:0.8rem;">
                ✏️ ማስተካከያ (Edit)
              </button>
              <button type="button" class="btn-secondary delete-payment-btn" data-pay-id="${m.id}" data-pay-name="${Utils.escapeHTML(m.name_am)}" style="padding:0.3rem 0.75rem; font-size:0.8rem; color:var(--accent-red); border-color:var(--accent-red);">
                🗑️ ሰርዝ (Delete)
              </button>
            </div>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    // Bind Edit Payment Method buttons to Modal
    document.querySelectorAll('.edit-payment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const payId = btn.getAttribute('data-pay-id');
        const method = methods.find(m => m.id === payId);
        if (!method) return;

        document.getElementById('edit-pay-id').value = method.id;
        document.getElementById('edit-pay-name').value = method.name_am || '';
        document.getElementById('edit-pay-account').value = method.account_number || '';
        document.getElementById('payment-modal-title').textContent = `${method.name_am} ማስተካከያ`;

        const modal = document.getElementById('payment-method-modal');
        if (modal) modal.classList.add('open');
      });
    });

    // Bind Delete Payment Method buttons with strict Confirmation
    document.querySelectorAll('.delete-payment-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const payId = btn.getAttribute('data-pay-id');
        const payName = btn.getAttribute('data-pay-name') || 'ይህንን የባንክ አካውንት';

        const confirmed = confirm(`እርግጠኛ ነዎት ${payName} ከድረ-ገፁ ላይ መሰረዝ ይፈልጋሉ?\n(Are you sure you want to delete ${payName}?)`);
        if (confirmed) {
          await window.dbService.deletePaymentMethod(payId);
          Utils.showToast(`${payName} ከድረ-ገፁ እና ከአድሚን ገፅ ላይ በትክክል ተሰርዟል!`, 'success');
          await this.renderPaymentMethodsTable();
        }
      });
    });

    // Bind Add Payment Method Button
    const addPayBtn = document.getElementById('add-payment-method-btn');
    if (addPayBtn) {
      addPayBtn.onclick = () => {
        document.getElementById('edit-pay-id').value = 'pay-' + Date.now();
        document.getElementById('edit-pay-name').value = '';
        document.getElementById('edit-pay-account').value = '';
        document.getElementById('payment-modal-title').textContent = 'አዲስ የባንክ አካውንት ጨምር';

        const modal = document.getElementById('payment-method-modal');
        if (modal) modal.classList.add('open');
      };
    }

    // Bind Payment Method Form Submission
    const payForm = document.getElementById('payment-method-form');
    if (payForm) {
      payForm.onsubmit = async (e) => {
        e.preventDefault();
        const payId = document.getElementById('edit-pay-id').value;
        const name = document.getElementById('edit-pay-name').value.trim();
        const account = document.getElementById('edit-pay-account').value.trim();

        if (!name || !account) {
          Utils.showToast('እባክዎን የባንክ ስም እና አካውንት ቁጥር ያስገቡ', 'error');
          return;
        }

        const methodObj = {
          id: payId,
          name_am: name,
          account_number: account,
          active: true,
          display_order: methods.length + 1
        };

        await window.dbService.savePaymentMethod(methodObj);
        Utils.showToast(`${name} አካውንት ቁጥር በትክክል ተቀይሯል! 💳`, 'success');

        const modal = document.getElementById('payment-method-modal');
        if (modal) modal.classList.remove('open');

        await this.renderPaymentMethodsTable();
      };
    }
  },

  // --- 6. BRANDING & SITE SETTINGS ---
  async loadBrandingSettings() {
    const settings = await window.dbService.getSiteSettings();

    const logoInput = document.getElementById('setting-logo-url');
    const logoPreview = document.getElementById('admin-logo-preview');
    const currentLogoUrl = settings.logo_url || '/assets/official_logo.jpg';

    if (logoInput) logoInput.value = settings.logo_url || '/assets/official_logo.jpg';
    if (logoPreview) logoPreview.src = currentLogoUrl;

    // Live URL preview
    if (logoInput && logoPreview) {
      logoInput.oninput = () => {
        const val = logoInput.value.trim();
        logoPreview.src = val || '/assets/official_logo.jpg';
      };
    }

    // Logo File Upload via ImgBB
    const fileInp = document.getElementById('logo-file-upload-input');
    const statusEl = document.getElementById('logo-upload-status');
    if (fileInp) {
      fileInp.onchange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (statusEl) statusEl.textContent = '⏳ ምስሉ ወደ ImgBB እየተጫነ ነው...';

        try {
          const res = await window.ImageUploadService.uploadToImageBB(files[0]);
          if (res && res.url) {
            if (logoInput) logoInput.value = res.url;
            if (logoPreview) logoPreview.src = res.url;
            if (statusEl) statusEl.textContent = '✅ አዲስ የሎጎ ምስል ተጭኗል!';
          } else {
            if (statusEl) statusEl.textContent = '❌ መጫን አልተሳካም። ሊንክ ኮፒ አድርገው ያስገቡ።';
          }
        } catch (err) {
          if (statusEl) statusEl.textContent = '❌ ምስል መጫን አልተሳካም።';
        }
      };
    }

    // Save Logo button
    const saveLogoBtn = document.getElementById('save-logo-btn');
    if (saveLogoBtn) {
      saveLogoBtn.onclick = async () => {
        const newUrl = logoInput ? logoInput.value.trim() : '/assets/official_logo.jpg';
        await window.dbService.updateSiteSettings({ logo_url: newUrl });
        Utils.showToast('የሳይቱ ሎጎ በትክክል ተቀይሯል! 🏷️', 'success');
        await AppCore.initHeaderAndFooter();
      };
    }

    // Reset Logo button
    const resetLogoBtn = document.getElementById('reset-logo-btn');
    if (resetLogoBtn) {
      resetLogoBtn.onclick = async () => {
        const confirmed = confirm('ወደ ኦፊሴላዊው ዋና ሎጎ መመለስ ይፈልጋሉ?');
        if (confirmed) {
          if (logoInput) logoInput.value = '/assets/official_logo.jpg';
          if (logoPreview) logoPreview.src = '/assets/official_logo.jpg';
          await window.dbService.updateSiteSettings({ logo_url: '/assets/official_logo.jpg' });
          Utils.showToast('ሎጎው ወደ ኦፊሴላዊው ዋና ሎጎ ተመልሷል! 🔄', 'success');
          await AppCore.initHeaderAndFooter();
        }
      };
    }

    const ticketPriceInput = document.getElementById('setting-ticket-price');
    if (ticketPriceInput) ticketPriceInput.value = settings.default_ticket_price || '50 ብር';

    const heroInput = document.getElementById('setting-hero-title');
    if (heroInput) heroInput.value = settings.hero_title_am || APP_CONFIG.DEFAULT_SITE_SETTINGS.hero_title_am;

    const disclaimerInput = document.getElementById('setting-disclaimer-text');
    if (disclaimerInput) disclaimerInput.value = settings.bottom_disclaimer_am || APP_CONFIG.DEFAULT_SITE_SETTINGS.bottom_disclaimer_am;

    const operatorInput = document.getElementById('setting-operator-info');
    if (operatorInput) operatorInput.value = settings.operator_information || APP_CONFIG.DEFAULT_SITE_SETTINGS.operator_information;

    const legalInput = document.getElementById('setting-legal-info');
    if (legalInput) legalInput.value = settings.legal_information || APP_CONFIG.DEFAULT_SITE_SETTINGS.legal_information;

    // Bind settings form submit
    const settingsForm = document.getElementById('site-settings-form');
    if (settingsForm) {
      settingsForm.onsubmit = async (e) => {
        e.preventDefault();
        const updated = {
          site_name_am: APP_CONFIG.APP_NAME,
          logo_url: logoInput ? logoInput.value.trim() : '/assets/official_logo.jpg',
          default_ticket_price: ticketPriceInput ? ticketPriceInput.value.trim() : '50 ብር',
          hero_title_am: heroInput ? heroInput.value.trim() : '',
          bottom_disclaimer_am: disclaimerInput ? disclaimerInput.value.trim() : '',
          operator_information: operatorInput ? operatorInput.value.trim() : '',
          legal_information: legalInput ? legalInput.value.trim() : '',
          updated_at: new Date().toISOString()
        };

        await window.dbService.updateSiteSettings(updated);

        Utils.showToast('የሳይት መረጃዎች በትክክል ተቀምጠዋል!', 'success');
        await AppCore.initHeaderAndFooter();
        await this.renderPrizesTable();
      };
    }
  },

  // --- 7. WEBSITE IMAGE MANAGEMENT (HOMEPAGE, CATEGORY 35 SLOTS, PRIZE 175 SLOTS) ---
  currentImageSubtab: 'homepage',
  currentCategoryMgmtFilter: 'all',
  currentPrizeMgmtCategory: 'cat-car',
  currentPrizeMgmtPrizeId: '',
  currentImageSearchQuery: '',
  activeUploadContext: null,
  activeDeleteContext: null,

  async renderHomepageImagesManager() {
    this.initImageSubtabs();
    this.initMasterImageUploadModals();

    if (this.currentImageSubtab === 'homepage') {
      await this.renderImagesSubsectionHomepage();
    } else if (this.currentImageSubtab === 'category') {
      await this.renderImagesSubsectionCategory();
    } else if (this.currentImageSubtab === 'prize') {
      await this.renderImagesSubsectionPrize();
    } else if (this.currentImageSubtab === 'all') {
      await this.renderImagesSubsectionAll();
    }
  },

  initImageSubtabs() {
    const subtabContainer = document.getElementById('images-subtabs');
    if (!subtabContainer || subtabContainer.dataset.bound) return;
    subtabContainer.dataset.bound = 'true';

    subtabContainer.querySelectorAll('.img-subtab-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const subtab = btn.getAttribute('data-subtab');
        if (!subtab) return;

        subtabContainer.querySelectorAll('.img-subtab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.img-subtab-content').forEach(c => c.style.display = 'none');
        const targetContent = document.getElementById(`subtab-content-${subtab}`);
        if (targetContent) targetContent.style.display = 'block';

        this.currentImageSubtab = subtab;
        if (subtab === 'homepage') await this.renderImagesSubsectionHomepage();
        else if (subtab === 'category') await this.renderImagesSubsectionCategory();
        else if (subtab === 'prize') await this.renderImagesSubsectionPrize();
        else if (subtab === 'all') await this.renderImagesSubsectionAll();
      });
    });

    // Global Search input binding
    const searchInput = document.getElementById('managed-images-search-input');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = 'true';
      searchInput.addEventListener('input', () => {
        this.currentImageSearchQuery = searchInput.value;
        if (this.currentImageSubtab === 'all') {
          this.renderImagesSubsectionAll();
        } else {
          // Switch to all grid to show search results
          const allBtn = subtabContainer.querySelector('.img-subtab-btn[data-subtab="all"]');
          if (allBtn) allBtn.click();
        }
      });
    }
  },

  initMasterImageUploadModals() {
    // 1. Unified Replace Image Modal
    const replaceModal = document.getElementById('replace-image-modal');
    const closeBtn = document.getElementById('replace-modal-close-btn');
    const cancelBtn = document.getElementById('replace-modal-cancel-btn');
    const clearBtn = document.getElementById('replace-modal-clear-btn');
    const saveBtn = document.getElementById('replace-modal-save-btn');
    const fileInput = document.getElementById('replace-modal-file-input');
    const uploadBtn = document.getElementById('replace-modal-upload-btn');
    const newPreviewImg = document.getElementById('replace-modal-new-preview-img');
    const noNewPreview = document.getElementById('replace-modal-no-new-preview');
    const fileMetaEl = document.getElementById('replace-modal-file-meta');
    const uploadStatusEl = document.getElementById('replace-modal-upload-status');
    const urlInput = document.getElementById('replace-modal-url-input');

    const closeModal = () => {
      if (replaceModal) replaceModal.style.display = 'none';
      if (fileInput) fileInput.value = '';
      this.activeReplaceContext = null;
      this.selectedUploadFile = null;
    };

    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = 'true';
      closeBtn.onclick = closeModal;
    }
    if (cancelBtn && !cancelBtn.dataset.bound) {
      cancelBtn.dataset.bound = 'true';
      cancelBtn.onclick = closeModal;
    }

    // File input change: Instant preview
    if (fileInput && !fileInput.dataset.bound) {
      fileInput.dataset.bound = 'true';
      fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (file.size > 15 * 1024 * 1024) {
          Utils.showToast('የምስሉ መጠን ከ 15MB መብለጥ የለበትም!', 'error');
          fileInput.value = '';
          return;
        }

        this.selectedUploadFile = file;

        // Show metadata
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        if (fileMetaEl) fileMetaEl.textContent = `📁 የተመረጠ ፋይል፡ ${file.name} (${sizeMB} MB)`;

        if (uploadStatusEl) {
          uploadStatusEl.textContent = 'ፋይሉ ተመርጧል። "ImageBB ላይ ጫን" ይጫኑ ወይም "አስቀምጥ" ሲሉ በራሱ ይጫናል።';
          uploadStatusEl.style.color = 'var(--primary)';
        }

        // Real-time FileReader preview
        const reader = new FileReader();
        reader.onload = (e) => {
          if (newPreviewImg) {
            newPreviewImg.src = e.target.result;
            newPreviewImg.style.display = 'block';
          }
          if (noNewPreview) noNewPreview.style.display = 'none';
        };
        reader.readAsDataURL(file);
      });
    }

    // Direct ImgBB Upload Button Action
    if (uploadBtn && !uploadBtn.dataset.bound) {
      uploadBtn.dataset.bound = 'true';
      uploadBtn.addEventListener('click', async () => {
        if (!this.selectedUploadFile) {
          Utils.showToast('እባክዎ መጀመሪያ ከስልክዎ ወይም ከኮምፒውተርዎ ምስል ይምረጡ!', 'warning');
          return;
        }

        uploadBtn.disabled = true;
        uploadBtn.textContent = '⏳ በመጫን ላይ...';
        if (uploadStatusEl) {
          uploadStatusEl.textContent = '⏳ ምስሉ ወደ ImageBB በመጫን ላይ ነው...';
          uploadStatusEl.style.color = 'var(--primary)';
        }

        try {
          const res = await window.ImageUploadService.uploadToImageBB(this.selectedUploadFile);
          if (res && res.url) {
            if (urlInput) urlInput.value = res.url;
            if (uploadStatusEl) {
              uploadStatusEl.textContent = '✅ ምስሉ ወደ ImageBB ተጭኗል!';
              uploadStatusEl.style.color = 'var(--accent-green)';
            }
            Utils.showToast('ምስሉ ወደ ImageBB ተጭኗል! 💾', 'success');
          } else {
            throw new Error('Upload failed');
          }
        } catch (err) {
          console.error(err);
          if (uploadStatusEl) {
            uploadStatusEl.textContent = '❌ ምስሉን መጫን አልተቻለም። እንደገና ይሞክሩ።';
            uploadStatusEl.style.color = 'var(--accent-red)';
          }
          Utils.showToast('ምስሉን ወደ ImageBB መጫን አልተቻለም', 'error');
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.textContent = '⬆️ ImageBB ላይ ጫን';
        }
      });
    }

    // Direct URL input listener: update preview when typed/pasted
    if (urlInput && !urlInput.dataset.bound) {
      urlInput.dataset.bound = 'true';
      urlInput.addEventListener('input', () => {
        const val = urlInput.value.trim();
        if (val) {
          if (newPreviewImg) {
            newPreviewImg.src = val;
            newPreviewImg.style.display = 'block';
          }
          if (noNewPreview) noNewPreview.style.display = 'none';
        }
      });
    }

    // Save & Replace Button Action
    if (saveBtn && !saveBtn.dataset.bound) {
      saveBtn.dataset.bound = 'true';
      saveBtn.addEventListener('click', async () => {
        if (!this.activeReplaceContext) return;

        const titleInput = document.getElementById('replace-modal-title-input');
        const customTitle = titleInput ? titleInput.value.trim() : '';
        let targetUrl = urlInput ? urlInput.value.trim() : '';

        // If file chosen but not yet uploaded, upload now
        if (!targetUrl && this.selectedUploadFile) {
          saveBtn.disabled = true;
          saveBtn.textContent = '⏳ በመጫንና በማስቀመጥ ላይ...';
          if (uploadStatusEl) {
            uploadStatusEl.textContent = '⏳ ምስሉ ወደ ImageBB በመጫን ላይ ነው...';
            uploadStatusEl.style.color = 'var(--primary)';
          }
          try {
            const res = await window.ImageUploadService.uploadToImageBB(this.selectedUploadFile);
            if (res && res.url) {
              targetUrl = res.url;
            } else {
              throw new Error('Upload failed');
            }
          } catch (e) {
            console.error(e);
            Utils.showToast('ምስሉን ወደ ImageBB መጫን አልተቻለም', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 ምስሉን ቀይርና አስቀምጥ (Save / Replace Image)';
            return;
          }
        }

        if (!targetUrl) {
          Utils.showToast('እባክዎ አዲስ ምስል ይምረጡ ወይም የ ImgBB URL ያስገቡ!', 'warning');
          return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = '⏳ በማስቀመጥ ላይ...';

        const ctx = this.activeReplaceContext;
        try {
          if (ctx.type === 'homepage') {
            const hpImg = {
              id: ctx.id || `hp-banner-${(ctx.bannerIndex || 0) + 1}`,
              title: customTitle || ctx.slotTitle || `የመነሻ ገፅ ባነር #${(ctx.bannerIndex || 0) + 1}`,
              location: ctx.location || `መነሻ ገፅ → Banner ${(ctx.bannerIndex || 0) + 1}`,
              url: targetUrl,
              source_type: 'homepage',
              created_at: new Date().toISOString()
            };
            await window.dbService.saveHomepageImage(hpImg);
          } else if (ctx.type === 'category') {
            await window.dbService.saveCategoryImage(ctx.categoryId, ctx.index, targetUrl);
          } else if (ctx.type === 'prize') {
            await window.dbService.savePrizeImage(ctx.prizeId, ctx.index, targetUrl);
          }

          Utils.showToast('ምስሉ በትክክል ተቀይሯል።', 'success');
          closeModal();
          await this.renderHomepageImagesManager();
        } catch (err) {
          console.error(err);
          Utils.showToast('የምስሉን መረጃ ማስቀመጥ አልተቻለም', 'error');
        } finally {
          saveBtn.disabled = false;
          saveBtn.textContent = '💾 ምስሉን ቀይርና አስቀምጥ (Save / Replace Image)';
        }
      });
    }

    // Clear / Empty Button Action
    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = 'true';
      clearBtn.addEventListener('click', async () => {
        if (!this.activeReplaceContext) return;
        if (!confirm('ይህን ምስል ባዶ ማድረግ ይፈልጋሉ?')) return;

        const ctx = this.activeReplaceContext;
        try {
          if (ctx.type === 'category') {
            await window.dbService.deleteCategoryImage(ctx.categoryId, ctx.index);
          } else if (ctx.type === 'prize') {
            await window.dbService.deletePrizeImage(ctx.prizeId, ctx.index);
          } else if (ctx.type === 'homepage') {
            await window.dbService.deleteHomepageImage(ctx.id);
          }

          Utils.showToast('ምስሉ ተወግዷል', 'info');
          closeModal();
          await this.renderHomepageImagesManager();
        } catch (e) {
          console.error(e);
          Utils.showToast('ምስሉን ማስወገድ አልተቻለም', 'error');
        }
      });
    }

    // 2. Delete Confirmation Modal
    const deleteModal = document.getElementById('image-delete-confirm-modal');
    const deleteSlotInfoEl = document.getElementById('img-delete-slot-info');
    const deleteConfirmBtn = document.getElementById('img-delete-confirm-btn');
    const deleteCancelBtn = document.getElementById('img-delete-cancel-btn');

    if (deleteConfirmBtn && !deleteConfirmBtn.dataset.bound) {
      deleteConfirmBtn.dataset.bound = 'true';
      deleteConfirmBtn.addEventListener('click', async () => {
        if (!this.activeDeleteContext) return;

        deleteConfirmBtn.disabled = true;
        const ctx = this.activeDeleteContext;

        try {
          if (ctx.type === 'category') {
            await window.dbService.deleteCategoryImage(ctx.categoryId, ctx.index);
          } else if (ctx.type === 'prize') {
            await window.dbService.deletePrizeImage(ctx.prizeId, ctx.index);
          } else if (ctx.type === 'homepage') {
            await window.dbService.deleteHomepageImage(ctx.id);
          }

          Utils.showToast('ምስሉ ተወግዷል', 'info');
        } catch (e) {
          console.error(e);
          Utils.showToast('ምስሉን ማስወገድ አልተቻለም', 'error');
        }

        if (deleteModal) deleteModal.style.display = 'none';
        deleteConfirmBtn.disabled = false;
        this.activeDeleteContext = null;
        await this.renderHomepageImagesManager();
      });
    }

    if (deleteCancelBtn && !deleteCancelBtn.dataset.bound) {
      deleteCancelBtn.dataset.bound = 'true';
      deleteCancelBtn.onclick = () => {
        if (deleteModal) deleteModal.style.display = 'none';
        this.activeDeleteContext = null;
      };
    }
  },

  // Open Replace Image Modal with rich context
  triggerImageReplace(context) {
    this.activeReplaceContext = context;
    this.selectedUploadFile = null;

    const replaceModal = document.getElementById('replace-image-modal');
    const locBadge = document.getElementById('replace-modal-location-text');
    const currentImg = document.getElementById('replace-modal-current-img');
    const currentUrlText = document.getElementById('replace-modal-current-url-text');
    const titleInput = document.getElementById('replace-modal-title-input');
    const urlInput = document.getElementById('replace-modal-url-input');
    const fileInput = document.getElementById('replace-modal-file-input');
    const newPreviewImg = document.getElementById('replace-modal-new-preview-img');
    const noNewPreview = document.getElementById('replace-modal-no-new-preview');
    const fileMetaEl = document.getElementById('replace-modal-file-meta');
    const uploadStatusEl = document.getElementById('replace-modal-upload-status');

    if (locBadge) locBadge.innerHTML = Utils.escapeHTML(context.displayLocation || `📍 ${context.slotTitle || 'የድረ-ገፅ ምስል'}`);
    if (currentImg) currentImg.src = context.currentUrl || '';
    if (currentUrlText) currentUrlText.textContent = context.currentUrl || 'ምንም ምስል አልተመደበም';
    if (titleInput) titleInput.value = context.title || '';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
    if (newPreviewImg) {
      newPreviewImg.src = '';
      newPreviewImg.style.display = 'none';
    }
    if (noNewPreview) noNewPreview.style.display = 'block';
    if (fileMetaEl) fileMetaEl.textContent = '';
    if (uploadStatusEl) uploadStatusEl.textContent = '';

    if (replaceModal) replaceModal.style.display = 'flex';
  },

  // Trigger delete dialog with target context
  triggerImageDelete(context) {
    this.activeDeleteContext = context;
    const deleteModal = document.getElementById('image-delete-confirm-modal');
    const deleteSlotInfoEl = document.getElementById('img-delete-slot-info');
    if (deleteSlotInfoEl) {
      deleteSlotInfoEl.innerHTML = `የሚወገደው ምስል፡ <strong>${Utils.escapeHTML(context.displayLocation || context.slotTitle || 'የድረ-ገፅ ምስል')}</strong>`;
    }
    if (deleteModal) deleteModal.style.display = 'flex';
  },

  // =========================================================================
  // SUBSECTION A: HOMEPAGE IMAGES CONTROLLER (5 BANNERS)
  // =========================================================================
  currentHomepageMgmtSlotIndex: 0,
  selectedHomepageSlotFile: null,

  async renderImagesSubsectionHomepage() {
    const slotSelect = document.getElementById('homepage-mgmt-slot-select');
    const grid = document.getElementById('homepage-only-images-grid');
    if (!grid) return;

    // 1. Bind Slot Selector
    if (slotSelect && !slotSelect.dataset.bound) {
      slotSelect.dataset.bound = 'true';
      slotSelect.addEventListener('change', async () => {
        this.currentHomepageMgmtSlotIndex = parseInt(slotSelect.value, 10) || 0;
        this.selectedHomepageSlotFile = null;
        await this.updateHomepageSlotUploadSection();
        this.highlightActiveHomepageSlotCard();
      });
    }

    if (slotSelect) {
      slotSelect.value = String(this.currentHomepageMgmtSlotIndex);
    }

    // 2. Initialize Dedicated Upload Section
    this.initHomepageSlotUploadSection();

    // 3. Update Preview & Grid
    await this.updateHomepageSlotUploadSection();
    await this.renderHomepage5SlotsGrid();
  },

  initHomepageSlotUploadSection() {
    const fileInput = document.getElementById('homepage-slot-file-input');
    const uploadBtn = document.getElementById('homepage-slot-upload-btn');
    const uploadStatusEl = document.getElementById('homepage-slot-upload-status');
    const manualUrlInput = document.getElementById('homepage-slot-manual-url-input');
    const saveUrlBtn = document.getElementById('homepage-slot-save-url-btn');
    const clearBtn = document.getElementById('homepage-slot-clear-btn');
    const newPreviewImg = document.getElementById('homepage-upload-new-img');
    const newPreviewEmpty = document.getElementById('homepage-upload-new-empty');
    const fileMetaEl = document.getElementById('homepage-upload-file-meta');

    // A. File Input Live Preview
    if (fileInput && !fileInput.dataset.bound) {
      fileInput.dataset.bound = 'true';
      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) {
          this.selectedHomepageSlotFile = null;
          if (newPreviewImg) {
            newPreviewImg.src = '';
            newPreviewImg.style.display = 'none';
          }
          if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
          if (fileMetaEl) fileMetaEl.textContent = '';
          if (uploadStatusEl) uploadStatusEl.textContent = '';
          return;
        }

        const validation = window.ImageUploadService.validateImageFile(file, 15);
        if (!validation.valid) {
          Utils.showToast(validation.message, 'warning');
          fileInput.value = '';
          this.selectedHomepageSlotFile = null;
          if (newPreviewImg) {
            newPreviewImg.src = '';
            newPreviewImg.style.display = 'none';
          }
          if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
          if (fileMetaEl) fileMetaEl.textContent = '';
          return;
        }

        this.selectedHomepageSlotFile = file;
        const sizeKB = (file.size / 1024).toFixed(0);
        const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKB} KB`;
        if (fileMetaEl) {
          fileMetaEl.textContent = `📁 ${file.name} (${sizeStr}) - ዝግጁ ነው`;
        }
        if (uploadStatusEl) {
          uploadStatusEl.style.color = 'var(--primary)';
          uploadStatusEl.textContent = '✨ ምስሉ ተመርጧል፤ "Upload to ImageBB" የሚለውን ይጫኑ';
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (newPreviewImg) {
            newPreviewImg.src = e.target.result;
            newPreviewImg.style.display = 'block';
          }
          if (newPreviewEmpty) {
            newPreviewEmpty.style.display = 'none';
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // B. Upload to ImageBB Button
    if (uploadBtn && !uploadBtn.dataset.bound) {
      uploadBtn.dataset.bound = 'true';
      uploadBtn.addEventListener('click', async () => {
        if (!this.selectedHomepageSlotFile) {
          Utils.showToast('እባክዎ መጀመሪያ የሚጫን ባነር ፋይል ይምረጡ!', 'warning');
          if (fileInput) fileInput.click();
          return;
        }

        const originalText = uploadBtn.innerHTML;
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '⏳ በመጫን ላይ...';
        if (uploadStatusEl) {
          uploadStatusEl.style.color = 'var(--primary)';
          uploadStatusEl.textContent = '⏳ ባነሩ ወደ ImageBB በመጫን ላይ ነው... እባክዎ ይጠብቁ';
        }

        try {
          const uploadRes = await window.ImageUploadService.uploadToImageBB(this.selectedHomepageSlotFile);
          if (uploadRes && (uploadRes.url || uploadRes.display_url)) {
            const finalUrl = uploadRes.url || uploadRes.display_url;
            const slotIdx = this.currentHomepageMgmtSlotIndex;
            const bannerId = `hp-banner-${slotIdx + 1}`;

            await window.dbService.saveHomepageImage({
              id: bannerId,
              title: `የመነሻ ገፅ ባነር #${slotIdx + 1}`,
              location: `መነሻ ገፅ → Banner ${slotIdx + 1}`,
              url: finalUrl,
              source_type: 'homepage',
              created_at: new Date().toISOString()
            });

            Utils.showToast('ባነሩ በትክክል ተቀይሯል! 💾', 'success');
            if (uploadStatusEl) {
              uploadStatusEl.style.color = 'var(--accent-green)';
              uploadStatusEl.textContent = '✅ ባነሩ ወደ ImageBB ተጭኗል እና በ Supabase ተቀምጧል!';
            }

            this.selectedHomepageSlotFile = null;
            if (fileInput) fileInput.value = '';
            if (newPreviewImg) {
              newPreviewImg.src = '';
              newPreviewImg.style.display = 'none';
            }
            if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
            if (fileMetaEl) fileMetaEl.textContent = '';
            if (manualUrlInput) manualUrlInput.value = '';

            await this.updateHomepageSlotUploadSection();
            await this.renderHomepage5SlotsGrid();
          } else {
            throw new Error('ImageBB ምስሉን አልመለሰም');
          }
        } catch (err) {
          console.error('Homepage ImageBB upload error:', err);
          Utils.showToast('ባነሩን መጫን አልተቻለም፡ ' + (err.message || 'ስህተት ተፈጥሯል'), 'error');
          if (uploadStatusEl) {
            uploadStatusEl.style.color = 'var(--accent-red)';
            uploadStatusEl.textContent = '❌ ባነሩን መጫን አልተቻለም፡ ' + (err.message || 'ስህተት');
          }
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = originalText;
        }
      });
    }

    // C. Direct URL Save Button
    if (saveUrlBtn && !saveUrlBtn.dataset.bound) {
      saveUrlBtn.dataset.bound = 'true';
      saveUrlBtn.addEventListener('click', async () => {
        const rawUrl = manualUrlInput ? manualUrlInput.value.trim() : '';
        if (!rawUrl) {
          Utils.showToast('እባክዎ የባነር ሊንክ (URL) ያስገቡ!', 'warning');
          if (manualUrlInput) manualUrlInput.focus();
          return;
        }

        saveUrlBtn.disabled = true;
        saveUrlBtn.innerHTML = '⏳ በማስቀመጥ ላይ...';

        try {
          const slotIdx = this.currentHomepageMgmtSlotIndex;
          const bannerId = `hp-banner-${slotIdx + 1}`;

          await window.dbService.saveHomepageImage({
            id: bannerId,
            title: `የመነሻ ገፅ ባነር #${slotIdx + 1}`,
            location: `መነሻ ገፅ → Banner ${slotIdx + 1}`,
            url: rawUrl,
            source_type: 'homepage',
            created_at: new Date().toISOString()
          });

          Utils.showToast('የባነር ሊንክ በ Supabase ተቀምጧል! 💾', 'success');
          if (manualUrlInput) manualUrlInput.value = '';
          if (uploadStatusEl) {
            uploadStatusEl.style.color = 'var(--accent-green)';
            uploadStatusEl.textContent = '✅ ባነሩ በ Supabase ተቀምጧል!';
          }

          await this.updateHomepageSlotUploadSection();
          await this.renderHomepage5SlotsGrid();
        } catch (err) {
          console.error('Manual URL save error:', err);
          Utils.showToast('ማስቀመጥ አልተቻለም፡ ' + (err.message || 'ስህተት'), 'error');
        } finally {
          saveUrlBtn.disabled = false;
          saveUrlBtn.innerHTML = '💾 ሊንኩን አስቀምጥ (Save URL)';
        }
      });
    }

    // D. Clear Slot Button
    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = 'true';
      clearBtn.addEventListener('click', async () => {
        const slotIdx = this.currentHomepageMgmtSlotIndex;
        const bannerNum = slotIdx + 1;
        const confirmed = confirm(`Banner #${bannerNum} ባዶ (Clear) ማድረግ ይፈልጋሉ?`);
        if (!confirmed) return;

        try {
          const bannerId = `hp-banner-${bannerNum}`;
          await window.dbService.saveHomepageImage({
            id: bannerId,
            title: `የመነሻ ገፅ ባነር #${bannerNum}`,
            location: `መነሻ ገፅ → Banner ${bannerNum}`,
            url: '',
            source_type: 'homepage',
            created_at: new Date().toISOString()
          });

          Utils.showToast(`Banner #${bannerNum} ባዶ ተደርጓል! 🗑️`, 'info');

          this.selectedHomepageSlotFile = null;
          if (fileInput) fileInput.value = '';
          if (manualUrlInput) manualUrlInput.value = '';
          if (newPreviewImg) {
            newPreviewImg.src = '';
            newPreviewImg.style.display = 'none';
          }
          if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
          if (fileMetaEl) fileMetaEl.textContent = '';
          if (uploadStatusEl) {
            uploadStatusEl.style.color = 'var(--text-muted)';
            uploadStatusEl.textContent = 'የባነር ቦታው ባዶ ሆኗል።';
          }

          await this.updateHomepageSlotUploadSection();
          await this.renderHomepage5SlotsGrid();
        } catch (err) {
          console.error('Clear homepage banner error:', err);
          Utils.showToast('ባዶ ማድረግ አልተቻለም፡ ' + (err.message || 'ስህተት'), 'error');
        }
      });
    }
  },

  async updateHomepageSlotUploadSection() {
    const breadcrumbEl = document.getElementById('homepage-upload-slot-breadcrumb');
    const statusBadge = document.getElementById('homepage-upload-slot-status-badge');
    const currentImg = document.getElementById('homepage-upload-current-img');
    const currentEmpty = document.getElementById('homepage-upload-current-empty');
    const currentUrlEl = document.getElementById('homepage-upload-current-url');
    const slotSelect = document.getElementById('homepage-mgmt-slot-select');
    const fileInput = document.getElementById('homepage-slot-file-input');
    const newPreviewImg = document.getElementById('homepage-upload-new-img');
    const newPreviewEmpty = document.getElementById('homepage-upload-new-empty');
    const fileMetaEl = document.getElementById('homepage-upload-file-meta');
    const uploadStatusEl = document.getElementById('homepage-slot-upload-status');

    if (slotSelect) {
      slotSelect.value = String(this.currentHomepageMgmtSlotIndex);
    }

    const slotIdx = this.currentHomepageMgmtSlotIndex;
    const bannerNum = slotIdx + 1;
    const bannerLabel = bannerNum === 1 ? 'Banner 1 (ዋና የጀግና ባነር / Hero)' : `Banner ${bannerNum} (የማስተዋወቂያ ባነር)`;

    if (breadcrumbEl) {
      breadcrumbEl.innerHTML = `📍 መነሻ ገፅ → ${bannerLabel}`;
    }

    const allManaged = await window.dbService.getAllManagedImages();
    const hpList = allManaged.filter(img => img.source_type === 'homepage');
    const targetImg = hpList[slotIdx];
    const currentUrl = targetImg && typeof targetImg.url === 'string' ? targetImg.url.trim() : '';

    if (currentUrl && currentUrl.length > 0) {
      if (currentImg) {
        currentImg.src = currentUrl;
        currentImg.style.display = 'block';
        currentImg.onerror = () => {
          currentImg.style.display = 'none';
          if (currentEmpty) currentEmpty.style.display = 'flex';
        };
      }
      if (currentEmpty) currentEmpty.style.display = 'none';
      if (currentUrlEl) {
        currentUrlEl.textContent = currentUrl;
        currentUrlEl.title = currentUrl;
      }
      if (statusBadge) {
        statusBadge.innerHTML = '🟢 ንቁ ባነር (Active)';
        statusBadge.style.color = 'var(--accent-green)';
        statusBadge.style.background = 'rgba(16,185,129,0.15)';
        statusBadge.style.borderColor = 'var(--accent-green)';
      }
    } else {
      if (currentImg) {
        currentImg.src = '';
        currentImg.style.display = 'none';
      }
      if (currentEmpty) currentEmpty.style.display = 'flex';
      if (currentUrlEl) {
        currentUrlEl.textContent = 'ምንም ባነር አልተጫነም (ባዶ / No banner uploaded yet)';
        currentUrlEl.title = '';
      }
      if (statusBadge) {
        statusBadge.innerHTML = '⚪ ባዶ ቦታ (Empty)';
        statusBadge.style.color = 'var(--text-muted)';
        statusBadge.style.background = 'rgba(255,255,255,0.05)';
        statusBadge.style.borderColor = 'var(--border)';
      }
    }

    if (!this.selectedHomepageSlotFile) {
      if (fileInput) fileInput.value = '';
      if (newPreviewImg) {
        newPreviewImg.src = '';
        newPreviewImg.style.display = 'none';
      }
      if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
      if (fileMetaEl) fileMetaEl.textContent = '';
      if (uploadStatusEl) uploadStatusEl.textContent = '';
    }

    this.highlightActiveHomepageSlotCard();
  },

  highlightActiveHomepageSlotCard() {
    const grid = document.getElementById('homepage-only-images-grid');
    if (!grid) return;

    const cards = grid.querySelectorAll('.homepage-slot-card-item');
    cards.forEach((c, idx) => {
      if (idx === this.currentHomepageMgmtSlotIndex) {
        c.style.borderColor = 'var(--primary)';
        c.style.boxShadow = '0 0 12px rgba(217,119,6,0.35)';
        const badge = c.querySelector('.slot-selected-indicator');
        if (badge) badge.style.display = 'inline-block';
      } else {
        c.style.borderColor = 'var(--border)';
        c.style.boxShadow = 'none';
        const badge = c.querySelector('.slot-selected-indicator');
        if (badge) badge.style.display = 'none';
      }
    });
  },

  async renderHomepage5SlotsGrid() {
    const grid = document.getElementById('homepage-only-images-grid');
    if (!grid) return;

    const allManaged = await window.dbService.getAllManagedImages();
    const hpList = allManaged.filter(img => img.source_type === 'homepage');
    grid.innerHTML = '';

    for (let idx = 0; idx < 5; idx++) {
      const img = hpList[idx] || { id: `hp-banner-${idx + 1}`, title: `የመነሻ ገፅ ባነር #${idx + 1}`, url: '' };
      const card = document.createElement('div');
      card.className = 'homepage-slot-card-item admin-image-slot-card';
      const isSelected = (idx === this.currentHomepageMgmtSlotIndex);
      const isActive = Boolean(img.url && img.url.trim().length > 0);
      const safeDisplayLocation = img.display_location || `📍 መነሻ ገፅ → Banner ${idx + 1}`;
      const safeTitle = Utils.escapeHTML(img.title || `የመነሻ ገፅ ባነር #${idx + 1}`);
      const safeUrl = Utils.escapeHTML(img.url || '');

      card.style.cssText = `
        background: var(--surface);
        border: ${isSelected ? '2px solid var(--primary)' : '1px solid var(--border)'};
        box-shadow: ${isSelected ? '0 0 12px rgba(217,119,6,0.35)' : 'none'};
        border-radius: var(--radius-md);
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
      `;

      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
            <span style="font-size:0.8rem; font-weight:800; color:var(--primary); background:rgba(217,119,6,0.12); padding:0.25rem 0.65rem; border-radius:6px; border:1px solid var(--border-gold);">
              ${safeDisplayLocation}
            </span>
            <span style="font-size:0.75rem; font-weight:700; color:${isActive ? 'var(--accent-green)' : 'var(--text-muted)'};">
              ${isActive ? '🟢 ንቁ' : '⚪ ባዶ'}
            </span>
          </div>

          <div style="margin-bottom:0.4rem;">
            <span class="slot-selected-indicator" style="display:${isSelected ? 'inline-block' : 'none'}; font-size:0.7rem; font-weight:800; background:var(--primary); color:#000; padding:0.15rem 0.45rem; border-radius:4px;">
              ✨ አሁን የተመረጠው (Active)
            </span>
          </div>

          <h4 style="font-size:0.92rem; font-weight:800; color:var(--text); margin-bottom:0.65rem; line-height:1.3;">
            ${safeTitle}
          </h4>

          <div style="width:100%; height:160px; background:#000; border-radius:var(--radius-sm); border:2px solid var(--border-gold); overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:0.65rem;">
            <img src="${safeUrl}" alt="${safeTitle}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'200\\'><rect fill=\\'%2313131a\\' width=\\'400\\' height=\\'200\\'/><text fill=\\'%238a8a9e\\' font-size=\\'14\\' font-family=\\'sans-serif\\' font-weight=\\'bold\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>Banner ${idx + 1}</text></svg>';" />
          </div>

          <div style="font-size:0.72rem; color:var(--text-dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:0.4rem; font-family:monospace;">
            ${safeUrl || 'ምንም ሊንክ የለም'}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; border-top:1px dashed var(--border); padding-top:0.75rem;">
          <button type="button" class="btn-primary hp-select-btn" style="padding:0.5rem; font-size:0.8rem; justify-content:center; font-weight:700;">
            📷 ይምረጡና ቀይሩ
          </button>
          <button type="button" class="btn-secondary hp-delete-btn" style="color:var(--accent-red); border-color:var(--accent-red); padding:0.5rem; font-size:0.8rem; justify-content:center; font-weight:700;">
            🗑️ ባዶ አድርግ
          </button>
        </div>
      `;

      grid.appendChild(card);

      card.onclick = async (e) => {
        if (e.target.closest('.hp-delete-btn')) return;
        this.currentHomepageMgmtSlotIndex = idx;
        this.selectedHomepageSlotFile = null;
        await this.updateHomepageSlotUploadSection();
        const uploadSec = document.getElementById('homepage-slot-upload-section');
        if (uploadSec) {
          uploadSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };

      card.querySelector('.hp-delete-btn').onclick = async (e) => {
        e.stopPropagation();
        const confirmed = confirm(`Banner #${idx + 1} ምስልን ባዶ ማድረግ ይፈልጋሉ?`);
        if (!confirmed) return;

        const bannerId = `hp-banner-${idx + 1}`;
        await window.dbService.saveHomepageImage({
          id: bannerId,
          title: `የመነሻ ገፅ ባነር #${idx + 1}`,
          location: `መነሻ ገፅ → Banner ${idx + 1}`,
          url: '',
          source_type: 'homepage',
          created_at: new Date().toISOString()
        });

        Utils.showToast(`Banner #${idx + 1} ባዶ ተደርጓል 🗑️`, 'info');
        await this.updateHomepageSlotUploadSection();
        await this.renderHomepage5SlotsGrid();
      };
    }
  },

  // =========================================================================
  // SUBSECTION B: CATEGORY IMAGES CONTROLLER (7 CATEGORIES × 5 SLOTS = 35)
  // =========================================================================
  currentCategoryMgmtCategory: 'cat-car',
  currentCategoryMgmtSlotIndex: 0,
  selectedCategorySlotFile: null,

  async renderImagesSubsectionCategory() {
    const catSelect = document.getElementById('category-mgmt-category-select');
    const slotSelect = document.getElementById('category-mgmt-slot-select');
    const container = document.getElementById('category-slots-container');
    if (!container) return;

    // 1. Bind Category Select
    if (catSelect && !catSelect.dataset.bound) {
      catSelect.dataset.bound = 'true';
      catSelect.addEventListener('change', async () => {
        this.currentCategoryMgmtCategory = catSelect.value;
        this.currentCategoryMgmtSlotIndex = 0;
        this.selectedCategorySlotFile = null;
        await this.updateCategorySlotUploadSection();
        await this.renderCategorySlotsContainer();
      });
    }

    // 2. Bind Slot Select
    if (slotSelect && !slotSelect.dataset.bound) {
      slotSelect.dataset.bound = 'true';
      slotSelect.addEventListener('change', async () => {
        this.currentCategoryMgmtSlotIndex = parseInt(slotSelect.value, 10) || 0;
        this.selectedCategorySlotFile = null;
        await this.updateCategorySlotUploadSection();
        this.highlightActiveCategorySlotCard();
      });
    }

    // 3. Bind Filter Chips
    const filterContainer = document.getElementById('category-mgmt-filter-chips');
    if (filterContainer && !filterContainer.dataset.bound) {
      filterContainer.dataset.bound = 'true';
      filterContainer.querySelectorAll('.cat-mgmt-filter-btn').forEach(btn => {
        btn.onclick = async () => {
          filterContainer.querySelectorAll('.cat-mgmt-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const chosenCat = btn.getAttribute('data-cat');
          this.currentCategoryMgmtFilter = chosenCat;
          if (chosenCat !== 'all') {
            this.currentCategoryMgmtCategory = chosenCat;
            if (catSelect) catSelect.value = chosenCat;
          }
          await this.updateCategorySlotUploadSection();
          await this.renderCategorySlotsContainer();
        };
      });
    }

    if (catSelect) catSelect.value = this.currentCategoryMgmtCategory;
    if (slotSelect) slotSelect.value = String(this.currentCategoryMgmtSlotIndex);

    // 4. Initialize Dedicated Upload Section
    this.initCategorySlotUploadSection();

    // 5. Update UI
    await this.updateCategorySlotUploadSection();
    await this.renderCategorySlotsContainer();
  },

  initCategorySlotUploadSection() {
    const fileInput = document.getElementById('category-slot-file-input');
    const uploadBtn = document.getElementById('category-slot-upload-btn');
    const uploadStatusEl = document.getElementById('category-slot-upload-status');
    const manualUrlInput = document.getElementById('category-slot-manual-url-input');
    const saveUrlBtn = document.getElementById('category-slot-save-url-btn');
    const clearBtn = document.getElementById('category-slot-clear-btn');
    const newPreviewImg = document.getElementById('category-upload-new-img');
    const newPreviewEmpty = document.getElementById('category-upload-new-empty');
    const fileMetaEl = document.getElementById('category-upload-file-meta');

    // A. File Input Live Preview
    if (fileInput && !fileInput.dataset.bound) {
      fileInput.dataset.bound = 'true';
      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) {
          this.selectedCategorySlotFile = null;
          if (newPreviewImg) {
            newPreviewImg.src = '';
            newPreviewImg.style.display = 'none';
          }
          if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
          if (fileMetaEl) fileMetaEl.textContent = '';
          if (uploadStatusEl) uploadStatusEl.textContent = '';
          return;
        }

        const validation = window.ImageUploadService.validateImageFile(file, 15);
        if (!validation.valid) {
          Utils.showToast(validation.message, 'warning');
          fileInput.value = '';
          this.selectedCategorySlotFile = null;
          if (newPreviewImg) {
            newPreviewImg.src = '';
            newPreviewImg.style.display = 'none';
          }
          if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
          if (fileMetaEl) fileMetaEl.textContent = '';
          return;
        }

        this.selectedCategorySlotFile = file;
        const sizeKB = (file.size / 1024).toFixed(0);
        const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKB} KB`;
        if (fileMetaEl) {
          fileMetaEl.textContent = `📁 ${file.name} (${sizeStr}) - ዝግጁ ነው`;
        }
        if (uploadStatusEl) {
          uploadStatusEl.style.color = 'var(--primary)';
          uploadStatusEl.textContent = '✨ ምስሉ ተመርጧል፤ "Upload to ImageBB" የሚለውን ይጫኑ';
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          if (newPreviewImg) {
            newPreviewImg.src = e.target.result;
            newPreviewImg.style.display = 'block';
          }
          if (newPreviewEmpty) {
            newPreviewEmpty.style.display = 'none';
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // B. Upload to ImageBB Button
    if (uploadBtn && !uploadBtn.dataset.bound) {
      uploadBtn.dataset.bound = 'true';
      uploadBtn.addEventListener('click', async () => {
        if (!this.selectedCategorySlotFile) {
          Utils.showToast('እባክዎ መጀመሪያ የምድብ ምስል ፋይል ይምረጡ!', 'warning');
          if (fileInput) fileInput.click();
          return;
        }

        const originalText = uploadBtn.innerHTML;
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '⏳ በመጫን ላይ...';
        if (uploadStatusEl) {
          uploadStatusEl.style.color = 'var(--primary)';
          uploadStatusEl.textContent = '⏳ ምስሉ ወደ ImageBB በመጫን ላይ ነው... እባክዎ ይጠብቁ';
        }

        try {
          const uploadRes = await window.ImageUploadService.uploadToImageBB(this.selectedCategorySlotFile);
          if (uploadRes && (uploadRes.url || uploadRes.display_url)) {
            const finalUrl = uploadRes.url || uploadRes.display_url;

            await window.dbService.saveCategoryImage(
              this.currentCategoryMgmtCategory,
              this.currentCategoryMgmtSlotIndex,
              finalUrl
            );

            Utils.showToast('የምድብ ምስሉ በትክክል ተቀይሯል! 💾', 'success');
            if (uploadStatusEl) {
              uploadStatusEl.style.color = 'var(--accent-green)';
              uploadStatusEl.textContent = '✅ ምስሉ ወደ ImageBB ተጭኗል እና በ Supabase ተቀምጧል!';
            }

            this.selectedCategorySlotFile = null;
            if (fileInput) fileInput.value = '';
            if (newPreviewImg) {
              newPreviewImg.src = '';
              newPreviewImg.style.display = 'none';
            }
            if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
            if (fileMetaEl) fileMetaEl.textContent = '';
            if (manualUrlInput) manualUrlInput.value = '';

            await this.updateCategorySlotUploadSection();
            await this.renderCategorySlotsContainer();
          } else {
            throw new Error('ImageBB ምስሉን አልመለሰም');
          }
        } catch (err) {
          console.error('Category ImageBB upload error:', err);
          Utils.showToast('ምስሉን መጫን አልተቻለም፡ ' + (err.message || 'ስህተት ተፈጥሯል'), 'error');
          if (uploadStatusEl) {
            uploadStatusEl.style.color = 'var(--accent-red)';
            uploadStatusEl.textContent = '❌ ምስሉን መጫን አልተቻለም፡ ' + (err.message || 'ስህተት');
          }
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = originalText;
        }
      });
    }

    // C. Direct URL Save Button
    if (saveUrlBtn && !saveUrlBtn.dataset.bound) {
      saveUrlBtn.dataset.bound = 'true';
      saveUrlBtn.addEventListener('click', async () => {
        const rawUrl = manualUrlInput ? manualUrlInput.value.trim() : '';
        if (!rawUrl) {
          Utils.showToast('እባክዎ የምስል ሊንክ (URL) ያስገቡ!', 'warning');
          if (manualUrlInput) manualUrlInput.focus();
          return;
        }

        saveUrlBtn.disabled = true;
        saveUrlBtn.innerHTML = '⏳ በማስቀመጥ ላይ...';

        try {
          await window.dbService.saveCategoryImage(
            this.currentCategoryMgmtCategory,
            this.currentCategoryMgmtSlotIndex,
            rawUrl
          );

          Utils.showToast('የምድብ ምስል ሊንክ በ Supabase ተቀምጧል! 💾', 'success');
          if (manualUrlInput) manualUrlInput.value = '';
          if (uploadStatusEl) {
            uploadStatusEl.style.color = 'var(--accent-green)';
            uploadStatusEl.textContent = '✅ ምስሉ በ Supabase ተቀምጧል!';
          }

          await this.updateCategorySlotUploadSection();
          await this.renderCategorySlotsContainer();
        } catch (err) {
          console.error('Manual Category URL save error:', err);
          Utils.showToast('ማስቀመጥ አልተቻለም፡ ' + (err.message || 'ስህተት'), 'error');
        } finally {
          saveUrlBtn.disabled = false;
          saveUrlBtn.innerHTML = '💾 ሊንኩን አስቀምጥ (Save URL)';
        }
      });
    }

    // D. Clear Slot Button
    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = 'true';
      clearBtn.addEventListener('click', async () => {
        const slotNum = this.currentCategoryMgmtSlotIndex + 1;
        const confirmed = confirm(`የምድብ ምስል #${slotNum} ባዶ (Clear) ማድረግ ይፈልጋሉ?`);
        if (!confirmed) return;

        try {
          await window.dbService.saveCategoryImage(
            this.currentCategoryMgmtCategory,
            this.currentCategoryMgmtSlotIndex,
            ''
          );

          Utils.showToast(`ምስል #${slotNum} ባዶ ተደርጓል! 🗑️`, 'info');

          this.selectedCategorySlotFile = null;
          if (fileInput) fileInput.value = '';
          if (manualUrlInput) manualUrlInput.value = '';
          if (newPreviewImg) {
            newPreviewImg.src = '';
            newPreviewImg.style.display = 'none';
          }
          if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
          if (fileMetaEl) fileMetaEl.textContent = '';
          if (uploadStatusEl) {
            uploadStatusEl.style.color = 'var(--text-muted)';
            uploadStatusEl.textContent = 'የምድብ ምስል ቦታው ባዶ ሆኗል።';
          }

          await this.updateCategorySlotUploadSection();
          await this.renderCategorySlotsContainer();
        } catch (err) {
          console.error('Clear category image error:', err);
          Utils.showToast('ባዶ ማድረግ አልተቻለም፡ ' + (err.message || 'ስህተት'), 'error');
        }
      });
    }
  },

  async updateCategorySlotUploadSection() {
    const breadcrumbEl = document.getElementById('category-upload-slot-breadcrumb');
    const statusBadge = document.getElementById('category-upload-slot-status-badge');
    const currentImg = document.getElementById('category-upload-current-img');
    const currentEmpty = document.getElementById('category-upload-current-empty');
    const currentUrlEl = document.getElementById('category-upload-current-url');
    const catSelect = document.getElementById('category-mgmt-category-select');
    const slotSelect = document.getElementById('category-mgmt-slot-select');
    const fileInput = document.getElementById('category-slot-file-input');
    const newPreviewImg = document.getElementById('category-upload-new-img');
    const newPreviewEmpty = document.getElementById('category-upload-new-empty');
    const fileMetaEl = document.getElementById('category-upload-file-meta');
    const uploadStatusEl = document.getElementById('category-slot-upload-status');

    if (catSelect) catSelect.value = this.currentCategoryMgmtCategory;
    if (slotSelect) slotSelect.value = String(this.currentCategoryMgmtSlotIndex);

    const categories = await window.dbService.getCategories();
    const currentCat = categories.find(c => c.id === this.currentCategoryMgmtCategory) || { name_am: 'ምድብ' };
    const slotNumber = this.currentCategoryMgmtSlotIndex + 1;
    const slotLabel = slotNumber === 1 ? 'ምስል 1 (ዋና የማሳያ ምስል / Main)' : `ምስል ${slotNumber}`;

    if (breadcrumbEl) {
      breadcrumbEl.innerHTML = `📍 ${Utils.escapeHTML(currentCat.name_am)} → ${slotLabel}`;
    }

    const catImages = await window.dbService.getCategoryImages(this.currentCategoryMgmtCategory);
    const currentSlotObj = catImages[this.currentCategoryMgmtSlotIndex];
    const currentUrl = currentSlotObj && typeof currentSlotObj.url === 'string' ? currentSlotObj.url.trim() : '';

    if (currentUrl && currentUrl.length > 0) {
      if (currentImg) {
        currentImg.src = currentUrl;
        currentImg.style.display = 'block';
        currentImg.onerror = () => {
          currentImg.style.display = 'none';
          if (currentEmpty) currentEmpty.style.display = 'flex';
        };
      }
      if (currentEmpty) currentEmpty.style.display = 'none';
      if (currentUrlEl) {
        currentUrlEl.textContent = currentUrl;
        currentUrlEl.title = currentUrl;
      }
      if (statusBadge) {
        statusBadge.innerHTML = '🟢 ንቁ ምስል (Active)';
        statusBadge.style.color = 'var(--accent-green)';
        statusBadge.style.background = 'rgba(16,185,129,0.15)';
        statusBadge.style.borderColor = 'var(--accent-green)';
      }
    } else {
      if (currentImg) {
        currentImg.src = '';
        currentImg.style.display = 'none';
      }
      if (currentEmpty) currentEmpty.style.display = 'flex';
      if (currentUrlEl) {
        currentUrlEl.textContent = 'ምንም ምስል አልተጫነም (ባዶ / No image uploaded yet)';
        currentUrlEl.title = '';
      }
      if (statusBadge) {
        statusBadge.innerHTML = '⚪ ባዶ ቦታ (Empty)';
        statusBadge.style.color = 'var(--text-muted)';
        statusBadge.style.background = 'rgba(255,255,255,0.05)';
        statusBadge.style.borderColor = 'var(--border)';
      }
    }

    if (!this.selectedCategorySlotFile) {
      if (fileInput) fileInput.value = '';
      if (newPreviewImg) {
        newPreviewImg.src = '';
        newPreviewImg.style.display = 'none';
      }
      if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
      if (fileMetaEl) fileMetaEl.textContent = '';
      if (uploadStatusEl) uploadStatusEl.textContent = '';
    }

    this.highlightActiveCategorySlotCard();
  },

  highlightActiveCategorySlotCard() {
    const container = document.getElementById('category-slots-container');
    if (!container) return;

    const cards = container.querySelectorAll('.category-slot-card-item');
    cards.forEach((c) => {
      const cardCat = c.getAttribute('data-cat-id');
      const cardSlot = parseInt(c.getAttribute('data-slot-idx'), 10);
      const isSelected = (cardCat === this.currentCategoryMgmtCategory && cardSlot === this.currentCategoryMgmtSlotIndex);

      if (isSelected) {
        c.style.borderColor = 'var(--primary)';
        c.style.boxShadow = '0 0 12px rgba(217,119,6,0.35)';
        const badge = c.querySelector('.slot-selected-indicator');
        if (badge) badge.style.display = 'inline-block';
      } else {
        c.style.borderColor = 'var(--border)';
        c.style.boxShadow = 'none';
        const badge = c.querySelector('.slot-selected-indicator');
        if (badge) badge.style.display = 'none';
      }
    });
  },

  async renderCategorySlotsContainer() {
    const container = document.getElementById('category-slots-container');
    if (!container) return;

    const categoriesDef = [
      { id: 'cat-car', name_am: 'መኪና', icon: '🚗' },
      { id: 'cat-condo', name_am: 'ኮንደሚኒዬም', icon: '🏠' },
      { id: 'cat-phone', name_am: 'ዘመናዊ ስልኮች', icon: '📱' },
      { id: 'cat-money', name_am: 'ገንዘብ', icon: '💰' },
      { id: 'cat-laptop', name_am: 'ላፕቶፕ', icon: '💻' },
      { id: 'cat-tv', name_am: 'ቴሌቪዥን', icon: '📺' },
      { id: 'cat-sheep', name_am: 'በግ', icon: '🐑' }
    ];

    container.innerHTML = '';

    const targetCategories = (this.currentCategoryMgmtFilter === 'all')
      ? categoriesDef
      : categoriesDef.filter(c => c.id === this.currentCategoryMgmtFilter);

    for (const cat of targetCategories) {
      const catBlock = document.createElement('div');
      catBlock.style.cssText = 'background:var(--surface-card); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem;';

      catBlock.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border); padding-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="font-size:1.5rem;">${cat.icon}</span>
            <h4 style="font-size:1.15rem; font-weight:800; color:var(--text); margin:0;">
              ${cat.icon} ${Utils.escapeHTML(cat.name_am)} (5 የምድብ ማሳያ ምስሎች)
            </h4>
          </div>
          <span style="font-size:0.8rem; font-weight:700; background:var(--primary); color:#000; padding:0.2rem 0.6rem; border-radius:12px;">
            5 ምስሎች (Slots)
          </span>
        </div>

        <div class="cat-5-slots-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:1rem;">
          <!-- 5 Slots Rendered Below -->
        </div>
      `;

      const slotsGrid = catBlock.querySelector('.cat-5-slots-grid');
      const catImages = await window.dbService.getCategoryImages(cat.id);

      for (let i = 0; i < 5; i++) {
        const imgObj = catImages[i] || { index: i, display_order: i + 1, url: '', active: false };
        const slotCard = document.createElement('div');
        slotCard.className = 'category-slot-card-item';
        slotCard.setAttribute('data-cat-id', cat.id);
        slotCard.setAttribute('data-slot-idx', String(i));

        const isSelected = (cat.id === this.currentCategoryMgmtCategory && i === this.currentCategoryMgmtSlotIndex);
        const isActive = Boolean(imgObj.url && imgObj.url.trim().length > 0);
        const displayLocation = `📍 ${cat.name_am} → ምስል ${i + 1}`;
        const slotTitle = `${cat.name_am} — ምስል #${i + 1}${i === 0 ? ' (ዋና)' : ''}`;

        slotCard.style.cssText = `
          background: var(--surface);
          border: ${isSelected ? '2px solid var(--primary)' : '1px solid var(--border)'};
          box-shadow: ${isSelected ? '0 0 12px rgba(217,119,6,0.35)' : 'none'};
          border-radius: var(--radius-sm);
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
        `;

        slotCard.innerHTML = `
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
              <span style="font-size:0.78rem; font-weight:800; color:var(--primary); background:rgba(217,119,6,0.12); padding:0.15rem 0.45rem; border-radius:4px;">
                ${displayLocation}
              </span>
              <span style="font-size:0.7rem; font-weight:700; color:${isActive ? 'var(--accent-green)' : 'var(--text-muted)'};">
                ${isActive ? '🟢 ንቁ' : '⚪ ባዶ'}
              </span>
            </div>

            <div style="margin-bottom:0.35rem;">
              <span class="slot-selected-indicator" style="display:${isSelected ? 'inline-block' : 'none'}; font-size:0.7rem; font-weight:800; background:var(--primary); color:#000; padding:0.15rem 0.45rem; border-radius:4px;">
                ✨ አሁን የተመረጠው (Active)
              </span>
            </div>

            <div style="width:100%; height:135px; background:#000; border-radius:4px; border:1px solid var(--border-gold); overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:0.45rem;">
              <img src="${Utils.escapeHTML(imgObj.url || '')}" alt="${slotTitle}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'130\\'><rect fill=\\'%2313131a\\' width=\\'200\\' height=\\'130\\'/><text fill=\\'%238a8a9e\\' font-size=\\'12\\' font-family=\\'sans-serif\\' font-weight=\\'bold\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>${encodeURIComponent(cat.name_am)} ${i + 1}</text></svg>';" />
            </div>

            <div style="font-size:0.68rem; color:var(--text-dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:monospace; margin-bottom:0.35rem;">
              ${Utils.escapeHTML(imgObj.url || 'ባዶ')}
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem; border-top:1px dashed var(--border); padding-top:0.5rem;">
            <button type="button" class="btn-primary cat-slot-select-btn" style="padding:0.4rem; font-size:0.75rem; justify-content:center; font-weight:700;">
              📷 ይምረጡና ቀይሩ
            </button>
            <button type="button" class="btn-secondary cat-delete-btn" style="color:var(--accent-red); border-color:var(--accent-red); padding:0.4rem; font-size:0.75rem; justify-content:center; font-weight:700;">
              🗑️ ባዶ አድርግ
            </button>
          </div>
        `;

        slotsGrid.appendChild(slotCard);

        slotCard.onclick = async (e) => {
          if (e.target.closest('.cat-delete-btn')) return;
          this.currentCategoryMgmtCategory = cat.id;
          this.currentCategoryMgmtSlotIndex = i;
          this.selectedCategorySlotFile = null;
          const catSelect = document.getElementById('category-mgmt-category-select');
          if (catSelect) catSelect.value = cat.id;
          await this.updateCategorySlotUploadSection();
          const uploadSec = document.getElementById('category-slot-upload-section');
          if (uploadSec) {
            uploadSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        };

        slotCard.querySelector('.cat-delete-btn').onclick = async (e) => {
          e.stopPropagation();
          const confirmed = confirm(`${slotTitle} ምስልን ባዶ ማድረግ ይፈልጋሉ?`);
          if (!confirmed) return;

          await window.dbService.saveCategoryImage(cat.id, i, '');
          Utils.showToast(`${slotTitle} ምስል ባዶ ተደርጓል 🗑️`, 'info');
          await this.updateCategorySlotUploadSection();
          await this.renderCategorySlotsContainer();
        };
      }

      container.appendChild(catBlock);
    }
  },

  // =========================================================================
  // SUBSECTION C: PRIZE IMAGES CONTROLLER (7 CATS × 5 PRIZES × 5 SLOTS = 175)
  // =========================================================================
  currentPrizeMgmtCategory: 'cat-car',
  currentPrizeMgmtPrizeId: '',
  currentPrizeMgmtSlotIndex: 0,
  selectedPrizeSlotFile: null,

  async renderImagesSubsectionPrize() {
    const catSelect = document.getElementById('prize-mgmt-category-select');
    const prizeSelect = document.getElementById('prize-mgmt-prize-select');
    const slotSelect = document.getElementById('prize-mgmt-slot-select');
    const slotsContainer = document.getElementById('prize-5-slots-container');
    if (!catSelect || !prizeSelect || !slotsContainer) return;

    // 1. Bind Category Select
    if (!catSelect.dataset.bound) {
      catSelect.dataset.bound = 'true';
      catSelect.addEventListener('change', async () => {
        this.currentPrizeMgmtCategory = catSelect.value;
        this.currentPrizeMgmtSlotIndex = 0;
        this.selectedPrizeSlotFile = null;
        await this.populatePrizeSelectOptions();
        await this.updatePrizeSlotUploadSection();
        await this.renderPrize5Slots();
      });
    }

    // 2. Bind Prize Select
    if (!prizeSelect.dataset.bound) {
      prizeSelect.dataset.bound = 'true';
      prizeSelect.addEventListener('change', async () => {
        this.currentPrizeMgmtPrizeId = prizeSelect.value;
        this.currentPrizeMgmtSlotIndex = 0;
        this.selectedPrizeSlotFile = null;
        await this.updatePrizeSlotUploadSection();
        await this.renderPrize5Slots();
      });
    }

    // 3. Bind Slot Select
    if (slotSelect && !slotSelect.dataset.bound) {
      slotSelect.dataset.bound = 'true';
      slotSelect.addEventListener('change', async () => {
        this.currentPrizeMgmtSlotIndex = parseInt(slotSelect.value, 10) || 0;
        this.selectedPrizeSlotFile = null;
        await this.updatePrizeSlotUploadSection();
        this.highlightActiveSlotCard();
      });
    }

    // 4. Initialize the Dedicated Upload Section Actions
    this.initPrizeSlotUploadSection();

    catSelect.value = this.currentPrizeMgmtCategory;
    if (slotSelect) slotSelect.value = String(this.currentPrizeMgmtSlotIndex);

    await this.populatePrizeSelectOptions();
    await this.updatePrizeSlotUploadSection();
    await this.renderPrize5Slots();
  },

  initPrizeSlotUploadSection() {
    const fileInput = document.getElementById('prize-slot-file-input');
    const uploadBtn = document.getElementById('prize-slot-upload-btn');
    const uploadStatusEl = document.getElementById('prize-slot-upload-status');
    const manualUrlInput = document.getElementById('prize-slot-manual-url-input');
    const saveUrlBtn = document.getElementById('prize-slot-save-url-btn');
    const clearBtn = document.getElementById('prize-slot-clear-btn');
    const newPreviewImg = document.getElementById('prize-upload-new-img');
    const newPreviewEmpty = document.getElementById('prize-upload-new-empty');
    const fileMetaEl = document.getElementById('prize-upload-file-meta');

    // A. File Input Live Preview
    if (fileInput && !fileInput.dataset.bound) {
      fileInput.dataset.bound = 'true';
      fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) {
          this.selectedPrizeSlotFile = null;
          if (newPreviewImg) {
            newPreviewImg.src = '';
            newPreviewImg.style.display = 'none';
          }
          if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
          if (fileMetaEl) fileMetaEl.textContent = '';
          if (uploadStatusEl) uploadStatusEl.textContent = '';
          return;
        }

        const validation = window.ImageUploadService.validateImageFile(file, 15);
        if (!validation.valid) {
          Utils.showToast(validation.message, 'warning');
          fileInput.value = '';
          this.selectedPrizeSlotFile = null;
          if (newPreviewImg) {
            newPreviewImg.src = '';
            newPreviewImg.style.display = 'none';
          }
          if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
          if (fileMetaEl) fileMetaEl.textContent = '';
          return;
        }

        this.selectedPrizeSlotFile = file;
        const sizeKB = (file.size / 1024).toFixed(0);
        const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeKB} KB`;
        if (fileMetaEl) {
          fileMetaEl.textContent = `📁 ${file.name} (${sizeStr}) - ዝግጁ ነው`;
        }
        if (uploadStatusEl) {
          uploadStatusEl.style.color = 'var(--primary)';
          uploadStatusEl.textContent = '✨ ምስሉ ተመርጧል፤ "Upload to ImageBB" የሚለውን ይጫኑ';
        }

        // Live Local Preview before upload
        const reader = new FileReader();
        reader.onload = (e) => {
          if (newPreviewImg) {
            newPreviewImg.src = e.target.result;
            newPreviewImg.style.display = 'block';
          }
          if (newPreviewEmpty) {
            newPreviewEmpty.style.display = 'none';
          }
        };
        reader.readAsDataURL(file);
      });
    }

    // B. Upload to ImageBB Button
    if (uploadBtn && !uploadBtn.dataset.bound) {
      uploadBtn.dataset.bound = 'true';
      uploadBtn.addEventListener('click', async () => {
        if (!this.selectedPrizeSlotFile) {
          Utils.showToast('እባክዎ መጀመሪያ የሚጫን የምስል ፋይል ይምረጡ!', 'warning');
          if (fileInput) fileInput.click();
          return;
        }

        if (!this.currentPrizeMgmtPrizeId) {
          Utils.showToast('እባክዎ መጀመሪያ እጣ ይምረጡ!', 'warning');
          return;
        }

        const originalText = uploadBtn.innerHTML;
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '⏳ በመጫን ላይ...';
        if (uploadStatusEl) {
          uploadStatusEl.style.color = 'var(--primary)';
          uploadStatusEl.textContent = '⏳ ምስሉ ወደ ImageBB በመጫን ላይ ነው... እባክዎ ይጠብቁ';
        }

        try {
          const uploadRes = await window.ImageUploadService.uploadToImageBB(this.selectedPrizeSlotFile);
          if (uploadRes && (uploadRes.url || uploadRes.display_url)) {
            const finalUrl = uploadRes.url || uploadRes.display_url;

            // Automatically save into Supabase record matching prize and slot index
            await window.dbService.savePrizeImage(
              this.currentPrizeMgmtPrizeId,
              this.currentPrizeMgmtSlotIndex,
              finalUrl
            );

            Utils.showToast('ምስሉ በትክክል ተቀይሯል! 💾', 'success');
            if (uploadStatusEl) {
              uploadStatusEl.style.color = 'var(--accent-green)';
              uploadStatusEl.textContent = '✅ ምስሉ ወደ ImageBB ተጭኗል እና በ Supabase ተቀምጧል!';
            }

            // Reset file picker & preview
            this.selectedPrizeSlotFile = null;
            if (fileInput) fileInput.value = '';
            if (newPreviewImg) {
              newPreviewImg.src = '';
              newPreviewImg.style.display = 'none';
            }
            if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
            if (fileMetaEl) fileMetaEl.textContent = '';
            if (manualUrlInput) manualUrlInput.value = '';

            // Refresh UI
            await this.updatePrizeSlotUploadSection();
            await this.renderPrize5Slots();
          } else {
            throw new Error('ImageBB ምስሉን አልመለሰም');
          }
        } catch (err) {
          console.error('ImageBB upload error:', err);
          Utils.showToast('ምስሉን መጫን አልተቻለም፡ ' + (err.message || 'ስህተት ተፈጥሯል'), 'error');
          if (uploadStatusEl) {
            uploadStatusEl.style.color = 'var(--accent-red)';
            uploadStatusEl.textContent = '❌ ምስሉን መጫን አልተቻለም፡ ' + (err.message || 'ስህተት');
          }
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.innerHTML = originalText;
        }
      });
    }

    // C. Manual Direct URL Save Button
    if (saveUrlBtn && !saveUrlBtn.dataset.bound) {
      saveUrlBtn.dataset.bound = 'true';
      saveUrlBtn.addEventListener('click', async () => {
        const rawUrl = manualUrlInput ? manualUrlInput.value.trim() : '';
        if (!rawUrl) {
          Utils.showToast('እባክዎ የምስል ሊንክ (URL) ያስገቡ!', 'warning');
          if (manualUrlInput) manualUrlInput.focus();
          return;
        }

        if (!this.currentPrizeMgmtPrizeId) {
          Utils.showToast('እባክዎ መጀመሪያ እጣ ይምረጡ!', 'warning');
          return;
        }

        saveUrlBtn.disabled = true;
        saveUrlBtn.innerHTML = '⏳ በማስቀመጥ ላይ...';

        try {
          await window.dbService.savePrizeImage(
            this.currentPrizeMgmtPrizeId,
            this.currentPrizeMgmtSlotIndex,
            rawUrl
          );

          Utils.showToast('የምስል ሊንክ በ Supabase ተቀምጧል! 💾', 'success');
          if (manualUrlInput) manualUrlInput.value = '';
          if (uploadStatusEl) {
            uploadStatusEl.style.color = 'var(--accent-green)';
            uploadStatusEl.textContent = '✅ ምስሉ በ Supabase ተቀምጧል!';
          }

          await this.updatePrizeSlotUploadSection();
          await this.renderPrize5Slots();
        } catch (err) {
          console.error('Manual URL save error:', err);
          Utils.showToast('ማስቀመጥ አልተቻለም፡ ' + (err.message || 'ስህተት'), 'error');
        } finally {
          saveUrlBtn.disabled = false;
          saveUrlBtn.innerHTML = '💾 ሊንኩን አስቀምጥ (Save URL)';
        }
      });
    }

    // D. Clear Slot Button (Removes/nulls image URL in Supabase)
    if (clearBtn && !clearBtn.dataset.bound) {
      clearBtn.dataset.bound = 'true';
      clearBtn.addEventListener('click', async () => {
        if (!this.currentPrizeMgmtPrizeId) return;

        const slotNum = this.currentPrizeMgmtSlotIndex + 1;
        const confirmed = confirm(`የተመረጠውን ምስል #${slotNum} ባዶ (Clear) ማድረግ ይፈልጋሉ?`);
        if (!confirmed) return;

        try {
          await window.dbService.savePrizeImage(
            this.currentPrizeMgmtPrizeId,
            this.currentPrizeMgmtSlotIndex,
            ''
          );

          Utils.showToast(`ምስል #${slotNum} ባዶ ተደርጓል! (Image Cleared) 🗑️`, 'info');

          // Reset inputs and previews
          this.selectedPrizeSlotFile = null;
          if (fileInput) fileInput.value = '';
          if (manualUrlInput) manualUrlInput.value = '';
          if (newPreviewImg) {
            newPreviewImg.src = '';
            newPreviewImg.style.display = 'none';
          }
          if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
          if (fileMetaEl) fileMetaEl.textContent = '';
          if (uploadStatusEl) {
            uploadStatusEl.style.color = 'var(--text-muted)';
            uploadStatusEl.textContent = 'የምስል ቦታው ባዶ ሆኗል።';
          }

          await this.updatePrizeSlotUploadSection();
          await this.renderPrize5Slots();
        } catch (err) {
          console.error('Clear image error:', err);
          Utils.showToast('ባዶ ማድረግ አልተቻለም፡ ' + (err.message || 'ስህተት'), 'error');
        }
      });
    }
  },

  async updatePrizeSlotUploadSection() {
    const breadcrumbEl = document.getElementById('prize-upload-slot-breadcrumb');
    const statusBadge = document.getElementById('prize-upload-slot-status-badge');
    const currentImg = document.getElementById('prize-upload-current-img');
    const currentEmpty = document.getElementById('prize-upload-current-empty');
    const currentUrlEl = document.getElementById('prize-upload-current-url');
    const slotSelect = document.getElementById('prize-mgmt-slot-select');
    const fileInput = document.getElementById('prize-slot-file-input');
    const newPreviewImg = document.getElementById('prize-upload-new-img');
    const newPreviewEmpty = document.getElementById('prize-upload-new-empty');
    const fileMetaEl = document.getElementById('prize-upload-file-meta');
    const uploadStatusEl = document.getElementById('prize-slot-upload-status');

    if (slotSelect) {
      slotSelect.value = String(this.currentPrizeMgmtSlotIndex);
    }

    if (!this.currentPrizeMgmtPrizeId) {
      if (breadcrumbEl) breadcrumbEl.textContent = '📍 እጣ አልተመረጠም';
      if (statusBadge) {
        statusBadge.innerHTML = '⚪ እጣ ይምረጡ';
        statusBadge.style.color = 'var(--text-muted)';
        statusBadge.style.borderColor = 'var(--border)';
      }
      if (currentImg) {
        currentImg.src = '';
        currentImg.style.display = 'none';
      }
      if (currentEmpty) currentEmpty.style.display = 'flex';
      if (currentUrlEl) currentUrlEl.textContent = 'ምንም ሊንክ የለም';
      return;
    }

    const categories = await window.dbService.getCategories();
    const currentCat = categories.find(c => c.id === this.currentPrizeMgmtCategory) || { name_am: 'ምድብ' };
    const prizes = await window.dbService.getPrizesForCategory(this.currentPrizeMgmtCategory);
    const prizeIndex = prizes.findIndex(p => p.id === this.currentPrizeMgmtPrizeId);
    const prize = prizes[prizeIndex] || { title_am: 'የተመረጠው እጣ' };
    const prizeOrder = prizeIndex >= 0 ? prizeIndex + 1 : 1;
    const slotNumber = this.currentPrizeMgmtSlotIndex + 1;
    const slotLabel = slotNumber === 1 ? 'ምስል 1 (ዋና ምስል / Main)' : `ምስል ${slotNumber}`;

    if (breadcrumbEl) {
      breadcrumbEl.innerHTML = `📍 ${Utils.escapeHTML(currentCat.name_am)} → ሽልማት ${prizeOrder} (${Utils.escapeHTML(prize.title_am)}) → ${slotLabel}`;
    }

    const prizeImages = await window.dbService.getPrizeImages(this.currentPrizeMgmtPrizeId);
    const currentSlotObj = prizeImages[this.currentPrizeMgmtSlotIndex];
    const currentUrl = currentSlotObj && typeof currentSlotObj.url === 'string' ? currentSlotObj.url.trim() : '';

    if (currentUrl && currentUrl.length > 0) {
      if (currentImg) {
        currentImg.src = currentUrl;
        currentImg.style.display = 'block';
        currentImg.onerror = () => {
          currentImg.style.display = 'none';
          if (currentEmpty) currentEmpty.style.display = 'flex';
        };
      }
      if (currentEmpty) currentEmpty.style.display = 'none';
      if (currentUrlEl) {
        currentUrlEl.textContent = currentUrl;
        currentUrlEl.title = currentUrl;
      }

      if (statusBadge) {
        statusBadge.innerHTML = '🟢 ንቁ ምስል (Active)';
        statusBadge.style.color = 'var(--accent-green)';
        statusBadge.style.background = 'rgba(16,185,129,0.15)';
        statusBadge.style.borderColor = 'var(--accent-green)';
      }
    } else {
      if (currentImg) {
        currentImg.src = '';
        currentImg.style.display = 'none';
      }
      if (currentEmpty) currentEmpty.style.display = 'flex';
      if (currentUrlEl) {
        currentUrlEl.textContent = 'ምንም ምስል አልተጫነም (ባዶ / No image uploaded yet)';
        currentUrlEl.title = '';
      }

      if (statusBadge) {
        statusBadge.innerHTML = '⚪ ምንም ምስል የለም (Empty)';
        statusBadge.style.color = 'var(--text-muted)';
        statusBadge.style.background = 'rgba(255,255,255,0.05)';
        statusBadge.style.borderColor = 'var(--border)';
      }
    }

    // If no file currently selected in picker, keep preview reset
    if (!this.selectedPrizeSlotFile) {
      if (fileInput) fileInput.value = '';
      if (newPreviewImg) {
        newPreviewImg.src = '';
        newPreviewImg.style.display = 'none';
      }
      if (newPreviewEmpty) newPreviewEmpty.style.display = 'flex';
      if (fileMetaEl) fileMetaEl.textContent = '';
      if (uploadStatusEl) uploadStatusEl.textContent = '';
    }

    this.highlightActiveSlotCard();
  },

  highlightActiveSlotCard() {
    const slotsContainer = document.getElementById('prize-5-slots-container');
    if (!slotsContainer) return;

    const cards = slotsContainer.querySelectorAll('.prize-slot-card-item');
    cards.forEach((c, idx) => {
      if (idx === this.currentPrizeMgmtSlotIndex) {
        c.style.borderColor = 'var(--primary)';
        c.style.boxShadow = '0 0 12px rgba(217,119,6,0.35)';
        const badge = c.querySelector('.slot-selected-indicator');
        if (badge) badge.style.display = 'inline-block';
      } else {
        c.style.borderColor = 'var(--border)';
        c.style.boxShadow = 'none';
        const badge = c.querySelector('.slot-selected-indicator');
        if (badge) badge.style.display = 'none';
      }
    });
  },

  async populatePrizeSelectOptions() {
    const prizeSelect = document.getElementById('prize-mgmt-prize-select');
    if (!prizeSelect) return;

    const prizes = await window.dbService.getPrizesForCategory(this.currentPrizeMgmtCategory);
    prizeSelect.innerHTML = '';

    if (!prizes || prizes.length === 0) {
      prizeSelect.innerHTML = '<option value="">ምንም እጣ አልተገኘም</option>';
      this.currentPrizeMgmtPrizeId = '';
      return;
    }

    prizes.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `🎁 ሽልማት #${idx + 1}፡ ${p.title_am}`;
      prizeSelect.appendChild(opt);
    });

    if (!this.currentPrizeMgmtPrizeId || !prizes.some(p => p.id === this.currentPrizeMgmtPrizeId)) {
      this.currentPrizeMgmtPrizeId = prizes[0].id;
    }
    prizeSelect.value = this.currentPrizeMgmtPrizeId;
  },

  async renderPrize5Slots() {
    const slotsContainer = document.getElementById('prize-5-slots-container');
    if (!slotsContainer) return;

    slotsContainer.innerHTML = '';
    if (!this.currentPrizeMgmtPrizeId) {
      slotsContainer.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">እባክዎ እጣ ይምረጡ።</div>`;
      return;
    }

    const categories = await window.dbService.getCategories();
    const currentCat = categories.find(c => c.id === this.currentPrizeMgmtCategory) || { name_am: 'ምድብ' };
    const prizes = await window.dbService.getPrizesForCategory(this.currentPrizeMgmtCategory);
    const prizeIndex = prizes.findIndex(p => p.id === this.currentPrizeMgmtPrizeId);
    const prize = prizes[prizeIndex] || { title_am: 'የተመረጠው እጣ', ticket_price: '50 ብር' };
    const prizeOrder = prizeIndex >= 0 ? prizeIndex + 1 : 1;

    const prizeImages = await window.dbService.getPrizeImages(this.currentPrizeMgmtPrizeId);

    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; background:var(--surface-card); padding:0.85rem 1rem; border-radius:6px; border:1px solid var(--border);';
    titleEl.innerHTML = `
      <div>
        <h4 style="font-size:1.1rem; font-weight:800; color:var(--primary); margin:0;">
          🎁 ${Utils.escapeHTML(currentCat.name_am)} ❯ ሽልማት #${prizeOrder} (${Utils.escapeHTML(prize.title_am)}) — 5 ምስሎች
        </h4>
        <span style="font-size:0.8rem; color:var(--text-muted);">የእጣ ዋጋ፡ <strong>${Utils.escapeHTML(prize.ticket_price || '50 ብር')}</strong></span>
      </div>
      <span style="font-size:0.8rem; font-weight:700; background:var(--border-gold); color:#000; padding:0.2rem 0.65rem; border-radius:12px;">
        5 የካርድ ምስሎች
      </span>
    `;
    slotsContainer.appendChild(titleEl);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:1.25rem;';

    for (let i = 0; i < 5; i++) {
      const imgObj = prizeImages[i] || { index: i, display_order: i + 1, url: '', active: false };
      const isActive = Boolean(imgObj.url && imgObj.url.trim().length > 0);
      const isSelected = (i === this.currentPrizeMgmtSlotIndex);
      const displayLocation = `📍 ${currentCat.name_am} → ሽልማት ${prizeOrder} → ምስል ${i + 1}`;
      const slotTitle = `${currentCat.name_am} ❯ ሽልማት #${prizeOrder} ❯ ምስል #${i + 1}${i === 0 ? ' (ዋና)' : ''}`;

      const card = document.createElement('div');
      card.className = 'prize-slot-card-item';
      card.style.cssText = `
        background: var(--surface);
        border: ${isSelected ? '2px solid var(--primary)' : '1px solid var(--border)'};
        box-shadow: ${isSelected ? '0 0 12px rgba(217,119,6,0.35)' : 'none'};
        border-radius: var(--radius-md);
        padding: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 0.6rem;
        cursor: pointer;
        transition: all 0.2s ease;
      `;

      card.innerHTML = `
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem; gap:0.3rem;">
            <span style="font-size:0.75rem; font-weight:800; color:var(--primary); background:rgba(217,119,6,0.12); padding:0.2rem 0.5rem; border-radius:4px;">
              ${displayLocation}
            </span>
            <span style="font-size:0.72rem; font-weight:700; color:${isActive ? 'var(--accent-green)' : 'var(--text-muted)'};">
              ${isActive ? '🟢 ንቁ' : '⚪ ባዶ'}
            </span>
          </div>

          <div style="margin-bottom:0.4rem;">
            <span class="slot-selected-indicator" style="display:${isSelected ? 'inline-block' : 'none'}; font-size:0.7rem; font-weight:800; background:var(--primary); color:#000; padding:0.15rem 0.45rem; border-radius:4px; margin-bottom:0.3rem;">
              ✨ አሁን የተመረጠው (Active)
            </span>
          </div>

          <div style="width:100%; height:150px; background:#000; border-radius:6px; border:2px solid var(--border-gold); overflow:hidden; display:flex; align-items:center; justify-content:center; margin-bottom:0.5rem;">
            ${isActive ? `
              <img src="${Utils.escapeHTML(imgObj.url)}" alt="${slotTitle}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.parentElement.innerHTML='<span style=\\'font-size:0.8rem; color:var(--text-muted); padding:1rem; text-align:center;\\'>ምስሉ አልተገኘም</span>';" />
            ` : `
              <div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:0.5rem;">
                <span style="font-size:1.5rem; display:block; margin-bottom:0.2rem;">📷</span>
                ምንም ምስል የለም
              </div>
            `}
          </div>

          <div style="font-size:0.68rem; color:var(--text-dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:monospace; margin-bottom:0.4rem;">
            ${Utils.escapeHTML(imgObj.url || 'ባዶ')}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; border-top:1px dashed var(--border); padding-top:0.6rem;">
          <button type="button" class="btn-primary prize-slot-select-btn" style="padding:0.45rem; font-size:0.78rem; justify-content:center; font-weight:700;">
            📷 ይምረጡና ቀይሩ
          </button>
          <button type="button" class="btn-secondary prize-slot-delete-btn" style="color:var(--accent-red); border-color:var(--accent-red); padding:0.45rem; font-size:0.78rem; justify-content:center; font-weight:700;">
            🗑️ ባዶ አድርግ
          </button>
        </div>
      `;

      grid.appendChild(card);

      // Card click selects this slot and updates upload section above
      card.onclick = async (e) => {
        if (e.target.closest('.prize-slot-delete-btn')) return;
        this.currentPrizeMgmtSlotIndex = i;
        this.selectedPrizeSlotFile = null;
        await this.updatePrizeSlotUploadSection();
        const uploadSec = document.getElementById('prize-slot-upload-section');
        if (uploadSec) {
          uploadSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };

      card.querySelector('.prize-slot-delete-btn').onclick = async (e) => {
        e.stopPropagation();
        const confirmed = confirm(`${slotTitle} ምስልን ባዶ ማድረግ ይፈልጋሉ?`);
        if (!confirmed) return;

        await window.dbService.savePrizeImage(this.currentPrizeMgmtPrizeId, i, '');
        Utils.showToast('ምስሉ ባዶ ተደርጓል 🗑️', 'info');
        await this.updatePrizeSlotUploadSection();
        await this.renderPrize5Slots();
      };
    }

    slotsContainer.appendChild(grid);
  },

  // =========================================================================
  // SUBSECTION ALL: GLOBAL GRID FOR ALL 210+ IMAGES WITH INSTANT SEARCH & FILTERS
  // =========================================================================
  async renderImagesSubsectionAll() {
    const listGrid = document.getElementById('homepage-images-list-grid');
    const badge = document.getElementById('all-images-count-badge');
    const catFilter = document.getElementById('all-grid-filter-category');
    const prizeFilter = document.getElementById('all-grid-filter-prize');
    const slotFilter = document.getElementById('all-grid-filter-slot');
    if (!listGrid) return;

    // Bind Filter Dropdowns
    if (catFilter && !catFilter.dataset.bound) {
      catFilter.dataset.bound = 'true';
      catFilter.addEventListener('change', () => this.renderImagesSubsectionAll());
    }
    if (prizeFilter && !prizeFilter.dataset.bound) {
      prizeFilter.dataset.bound = 'true';
      prizeFilter.addEventListener('change', () => this.renderImagesSubsectionAll());
    }
    if (slotFilter && !slotFilter.dataset.bound) {
      slotFilter.dataset.bound = 'true';
      slotFilter.addEventListener('change', () => this.renderImagesSubsectionAll());
    }

    let allImages = await window.dbService.getAllManagedImages();

    // 1. Text Search Filter
    if (this.currentImageSearchQuery && this.currentImageSearchQuery.trim()) {
      const q = this.currentImageSearchQuery.trim().toLowerCase();
      allImages = allImages.filter(img => {
        return (img.title && img.title.toLowerCase().includes(q)) ||
               (img.location && img.location.toLowerCase().includes(q)) ||
               (img.display_location && img.display_location.toLowerCase().includes(q)) ||
               (img.id && img.id.toLowerCase().includes(q)) ||
               (img.url && img.url.toLowerCase().includes(q));
      });
    }

    // 2. Category Dropdown Filter
    if (catFilter && catFilter.value !== 'all') {
      const selectedCat = catFilter.value;
      if (selectedCat === 'homepage') {
        allImages = allImages.filter(img => img.source_type === 'homepage');
      } else {
        allImages = allImages.filter(img => img.category_id === selectedCat || img.category_slug === selectedCat);
      }
    }

    // 3. Prize Dropdown Filter
    if (prizeFilter && prizeFilter.value !== 'all') {
      const pNum = parseInt(prizeFilter.value, 10);
      allImages = allImages.filter(img => img.source_type === 'prize' && img.prize_order === pNum);
    }

    // 4. Slot Dropdown Filter
    if (slotFilter && slotFilter.value !== 'all') {
      const sNum = parseInt(slotFilter.value, 10);
      allImages = allImages.filter(img => img.display_order === sNum);
    }

    if (badge) badge.textContent = `${allImages.length} ምስሎች`;
    listGrid.innerHTML = '';

    if (allImages.length === 0) {
      listGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; color:var(--text-dim); padding:3rem 1.5rem; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md);">
          <p style="font-size:1.1rem; font-weight:700; color:var(--text); margin-bottom:0.5rem;">ምንም የተጣጣመ ምስል አልተገኘም (No matching images found)</p>
          <p style="font-size:0.85rem; color:var(--text-muted);">የፍለጋ ቃል ወይም ማጣሪያዎችን በመቀየር እንደገና ይሞክሩ።</p>
        </div>
      `;
      return;
    }

    allImages.forEach((img) => {
      const card = document.createElement('div');
      card.className = 'admin-image-management-card';
      card.style.cssText = `
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: 1.25rem;
        box-shadow: var(--shadow-sm);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 0.75rem;
        transition: transform 0.2s ease, border-color 0.2s ease;
      `;

      const safeDisplayLocation = img.display_location || `📍 ${img.location || 'የድረ-ገፅ ምስል'}`;
      const safeTitle = Utils.escapeHTML(img.title || 'Untitled Image');
      const safeUrl = Utils.escapeHTML(img.url || '');
      const isActive = Boolean(img.url && img.url.trim().length > 0);

      const isPrize = img.source_type === 'prize' && img.prize_id && typeof img.image_index === 'number';
      const isCategory = img.source_type === 'category' && img.category_id && typeof img.image_index === 'number';
      const isHomepage = img.source_type === 'homepage';

      card.innerHTML = `
        <div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.5rem; gap:0.4rem;">
            <span style="font-size:0.75rem; font-weight:800; color:var(--primary); background:rgba(217,119,6,0.12); padding:0.2rem 0.5rem; border-radius:4px; border:1px solid var(--border-gold);">
              ${safeDisplayLocation}
            </span>
            <span style="font-size:0.72rem; font-weight:700; color:${isActive ? 'var(--accent-green)' : 'var(--text-muted)'};">
              ${isActive ? '🟢 ንቁ' : '⚪ ባዶ'}
            </span>
          </div>

          <h4 style="font-size:0.9rem; font-weight:800; color:var(--text); margin-bottom:0.65rem; line-height:1.35;">
            ${safeTitle}
          </h4>

          <div style="width:100%; height:160px; border-radius:var(--radius-sm); overflow:hidden; background:#000; margin-bottom:0.65rem; border:2px solid var(--border-gold); display:flex; align-items:center; justify-content:center;">
            <img src="${safeUrl}" alt="${safeTitle}" style="max-width:100%; max-height:100%; object-fit:contain;" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'200\\'><rect fill=\\'%2313131a\\' width=\\'400\\' height=\\'200\\'/><text fill=\\'%238a8a9e\\' font-size=\\'14\\' font-family=\\'sans-serif\\' font-weight=\\'bold\\' x=\\'50%\\' y=\\'50%\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>ምስል የለም</text></svg>';" />
          </div>

          <div style="font-size:0.7rem; color:var(--text-dim); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:monospace; margin-bottom:0.35rem;">
            ${safeUrl || 'ምንም ሊንክ የለም'}
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.4rem; border-top:1px dashed var(--border); padding-top:0.75rem;">
          <button type="button" class="btn-primary global-goto-slot-btn" style="padding:0.45rem; font-size:0.8rem; justify-content:center; font-weight:700; width:100%;">
            🎯 ወደ ማስተዳደሪያው ሂድ (Go to Slot Manager)
          </button>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.4rem;">
            <button type="button" class="btn-secondary global-replace-btn" style="padding:0.4rem; font-size:0.75rem; justify-content:center; font-weight:700;">
              ✏️ ፈጣን ቀይር
            </button>
            <button type="button" class="btn-secondary global-delete-btn" style="color:var(--accent-red); border-color:var(--accent-red); padding:0.4rem; font-size:0.75rem; justify-content:center; font-weight:700;">
              🗑️ ባዶ አድርግ
            </button>
          </div>
        </div>
      `;

      listGrid.appendChild(card);

      // 1. Go to Dedicated Slot Manager Action
      card.querySelector('.global-goto-slot-btn').onclick = async () => {
        const subtabContainer = document.getElementById('images-subtabs');
        if (isHomepage) {
          const btn = subtabContainer && subtabContainer.querySelector('.img-subtab-btn[data-subtab="homepage"]');
          if (btn) btn.click();
          this.currentHomepageMgmtSlotIndex = (typeof img.banner_index === 'number') ? img.banner_index : (img.display_order ? img.display_order - 1 : 0);
          await this.updateHomepageSlotUploadSection();
          const uploadSec = document.getElementById('homepage-slot-upload-section');
          if (uploadSec) uploadSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (isCategory) {
          const btn = subtabContainer && subtabContainer.querySelector('.img-subtab-btn[data-subtab="category"]');
          if (btn) btn.click();
          this.currentCategoryMgmtCategory = img.category_id;
          this.currentCategoryMgmtSlotIndex = img.image_index;
          const catSelect = document.getElementById('category-mgmt-category-select');
          if (catSelect) catSelect.value = img.category_id;
          await this.updateCategorySlotUploadSection();
          const uploadSec = document.getElementById('category-slot-upload-section');
          if (uploadSec) uploadSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (isPrize) {
          const btn = subtabContainer && subtabContainer.querySelector('.img-subtab-btn[data-subtab="prize"]');
          if (btn) btn.click();
          const prizeCategory = img.category_id || (img.prize_id ? img.prize_id.split('-')[0] : 'cat-car');
          this.currentPrizeMgmtCategory = prizeCategory.startsWith('cat-') ? prizeCategory : `cat-${prizeCategory}`;
          this.currentPrizeMgmtPrizeId = img.prize_id;
          this.currentPrizeMgmtSlotIndex = img.image_index;
          const catSelect = document.getElementById('prize-mgmt-category-select');
          if (catSelect) catSelect.value = this.currentPrizeMgmtCategory;
          await this.populatePrizeSelectOptions();
          const prizeSelect = document.getElementById('prize-mgmt-prize-select');
          if (prizeSelect) prizeSelect.value = img.prize_id;
          await this.updatePrizeSlotUploadSection();
          await this.renderPrize5Slots();
          const uploadSec = document.getElementById('prize-slot-upload-section');
          if (uploadSec) uploadSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };

      // 2. Quick Replace Modal Action
      card.querySelector('.global-replace-btn').onclick = () => {
        if (isPrize) {
          this.triggerImageReplace({
            type: 'prize',
            prizeId: img.prize_id,
            index: img.image_index,
            displayLocation: safeDisplayLocation,
            slotTitle: safeTitle,
            title: img.title,
            currentUrl: img.url
          });
        } else if (isCategory) {
          this.triggerImageReplace({
            type: 'category',
            categoryId: img.category_id,
            index: img.image_index,
            displayLocation: safeDisplayLocation,
            slotTitle: safeTitle,
            title: img.title,
            currentUrl: img.url
          });
        } else {
          this.triggerImageReplace({
            type: 'homepage',
            id: img.id,
            bannerIndex: img.banner_index || 0,
            displayLocation: safeDisplayLocation,
            slotTitle: safeTitle,
            title: img.title,
            currentUrl: img.url
          });
        }
      };

      // 3. Direct Delete Action
      card.querySelector('.global-delete-btn').onclick = () => {
        if (isPrize) {
          this.triggerImageDelete({
            type: 'prize',
            prizeId: img.prize_id,
            index: img.image_index,
            displayLocation: safeDisplayLocation,
            slotTitle: safeTitle
          });
        } else if (isCategory) {
          this.triggerImageDelete({
            type: 'category',
            categoryId: img.category_id,
            index: img.image_index,
            displayLocation: safeDisplayLocation,
            slotTitle: safeTitle
          });
        } else {
          this.triggerImageDelete({
            type: 'homepage',
            id: img.id,
            displayLocation: safeDisplayLocation,
            slotTitle: safeTitle
          });
        }
      };
    });
  },

  // --- 8. SEPARATE CATEGORY / TICKET PRICE MANAGEMENT ---
  async renderCategoryPricesManager() {
    const pricesGrid = document.getElementById('category-prices-grid');
    if (!pricesGrid) return;

    const categories = await window.dbService.getCategories();
    pricesGrid.innerHTML = '';

    for (const cat of categories) {
      const prizes = await window.dbService.getPrizesForCategory(cat.id);
      const currentPrice = cat.ticket_price || (prizes[0] && prizes[0].ticket_price) || '50 ብር';

      const card = document.createElement('div');
      card.style.cssText = 'background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-md); padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between; gap:1rem;';
      card.innerHTML = `
        <div>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.5rem;">${cat.icon || '🎁'}</span>
              <h4 style="font-size:1.15rem; font-weight:800; color:var(--text);">${Utils.escapeHTML(cat.name_am)}</h4>
            </div>
            <span class="gold-badge" id="badge-cat-price-${cat.id}" style="font-size:0.85rem; font-weight:700;">
              ${Utils.escapeHTML(currentPrice)}
            </span>
          </div>

          <p style="font-size:0.8rem; color:var(--text-dim); margin-bottom:0.75rem;">
            በዚህ ምድብ ውስጥ <strong>${prizes.length}</strong> የሎተሪ እጣዎች አሉ። የየእጣዎቹ ዋጋ እዚህ ይስተካከላል።
          </p>

          <div class="form-group" style="margin-bottom:0.5rem;">
            <label class="form-label" style="font-size:0.8rem; color:var(--primary); font-weight:700;">
              የ ${Utils.escapeHTML(cat.name_am)} የእጣ ዋጋ ማስገቢያ፡
            </label>
            <input type="text" id="input-cat-price-${cat.id}" class="form-control" value="${Utils.escapeHTML(currentPrice)}" style="font-size:1.1rem; font-weight:800; color:var(--primary); font-family:var(--font-numeric);" />
          </div>

          <!-- Quick Presets -->
          <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.75rem;">
            <button type="button" class="btn-secondary preset-cat-btn" data-cat-id="${cat.id}" data-val="50 ብር" style="padding:0.2rem 0.5rem; font-size:0.75rem;">50 ብር</button>
            <button type="button" class="btn-secondary preset-cat-btn" data-cat-id="${cat.id}" data-val="100 ብር" style="padding:0.2rem 0.5rem; font-size:0.75rem;">100 ብር</button>
            <button type="button" class="btn-secondary preset-cat-btn" data-cat-id="${cat.id}" data-val="200 ብር" style="padding:0.2rem 0.5rem; font-size:0.75rem;">200 ብር</button>
            <button type="button" class="btn-secondary preset-cat-btn" data-cat-id="${cat.id}" data-val="500 ብር" style="padding:0.2rem 0.5rem; font-size:0.75rem;">500 ብር</button>
          </div>
        </div>

        <button type="button" class="btn-primary save-single-cat-price-btn" data-cat-id="${cat.id}" data-cat-name="${Utils.escapeHTML(cat.name_am)}" style="width:100%; justify-content:center; padding:0.6rem;">
          💾 የ ${Utils.escapeHTML(cat.name_am)} ዋጋ ብቻ መዝግብ (Save)
        </button>
      `;
      pricesGrid.appendChild(card);
    }

    // Bind Presets
    document.querySelectorAll('.preset-cat-btn').forEach(btn => {
      btn.onclick = () => {
        const catId = btn.getAttribute('data-cat-id');
        const val = btn.getAttribute('data-val');
        const input = document.getElementById(`input-cat-price-${catId}`);
        if (input) input.value = val;
      };
    });

    // Bind Single Category Save Button
    document.querySelectorAll('.save-single-cat-price-btn').forEach(btn => {
      btn.onclick = async () => {
        const catId = btn.getAttribute('data-cat-id');
        const catName = btn.getAttribute('data-cat-name');
        const input = document.getElementById(`input-cat-price-${catId}`);
        if (!input) return;

        const newPrice = input.value.trim();
        if (!newPrice) {
          Utils.showToast('እባክዎ የእጣ ዋጋ ያስገቡ!', 'error');
          return;
        }

        await window.dbService.updateCategoryPrice(catId, newPrice);
        Utils.showToast(`የ "${catName}" የእጣ ዋጋ ወደ ${newPrice} ብቻ በትክክል ተቀይሯል! 💰`, 'success');
        await this.renderCategoryPricesManager();
        await this.renderPrizesTable();
      };
    });
  }
};

window.AdminDashboard = AdminDashboard;
