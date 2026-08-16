/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Image Upload Service (ImageBB for Public Images)
   ========================================================================== */

const ImageUploadService = {
  // Validate File (Type and Size)
  validateImageFile(file, maxSizeMB = 10) {
    if (!file) {
      return { valid: false, message: 'እባክዎ የምስል ፋይል ይምረጡ።' };
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileType = file.type ? file.type.toLowerCase() : '';
    const fileName = file.name ? file.name.toLowerCase() : '';
    const hasValidExt = /\.(jpe?g|png|webp)$/i.test(fileName);

    if (!allowedTypes.includes(fileType) && !hasValidExt) {
      return {
        valid: false,
        message: 'የተሳሳተ የፋይል አይነት! እባክዎ JPG, JPEG, PNG ወይም WEBP ምስል ብቻ ይጠቀሙ።'
      };
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        message: `የምስሉ መጠን ከ ${maxSizeMB}MB መብለጥ የለበትም። የተመረጠው: ${(file.size / (1024 * 1024)).toFixed(1)}MB`
      };
    }

    return { valid: true };
  },

  // Upload Public Prize/Category Image to ImageBB
  async uploadToImageBB(file, apiKey = '') {
    // 1. Validate File
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    const base64 = await Utils.readFileAsDataURL(file);

    // 2. Try Secure Server Endpoint first
    try {
      const serverRes = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64,
          apiKey: apiKey || APP_CONFIG.IMAGEBB_API_KEY || ''
        })
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data && data.success && data.url) {
          return {
            success: true,
            url: data.url,
            display_url: data.display_url || data.url,
            thumb_url: data.thumb_url || data.url
          };
        }
      }
    } catch (err) {
      console.warn('Server upload endpoint not reachable, trying direct fallback:', err);
    }

    // 3. Try Direct ImageBB API if key is available
    const key = apiKey || APP_CONFIG.IMAGEBB_API_KEY;
    if (key) {
      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data && data.success && data.data) {
          return {
            success: true,
            url: data.data.url,
            display_url: data.data.display_url,
            thumb_url: data.data.thumb?.url || data.data.url
          };
        }
      } catch (err) {
        console.error('Direct ImageBB Upload Error:', err);
      }
    }

    // 4. Safe Base64 Data URL Fallback (Guarantees preview & persistence without breaking)
    return {
      success: true,
      url: base64,
      isLocalBase64: true,
      display_url: base64
    };
  }
};

window.ImageUploadService = ImageUploadService;

