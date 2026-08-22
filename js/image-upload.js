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

  // Resize/compress large images (e.g. mobile camera photos) client-side before upload.
  // Mobile photos are often 4-10MB+, which blows past the server upload endpoint's
  // request size limit and can also overflow localStorage's fallback quota. Downscaling
  // here keeps the payload small and reliable on every device without any visible
  // quality loss for a web banner/thumbnail image.
  //
  // Returns { file, dataUrl }. dataUrl is populated when compression ran (read
  // straight off the canvas, avoiding a Blob->File->FileReader round trip that can
  // intermittently fail on some mobile browsers). When no compression was needed,
  // dataUrl is null and the caller falls back to the normal FileReader path.
  compressImageFile(file, maxDimension = 1600, quality = 0.82) {
    return new Promise((resolve) => {
      // Skip resizing for already-small files or non-raster types we shouldn't touch
      if (!file || file.size <= 700 * 1024) {
        resolve({ file, dataUrl: null });
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      const cleanupAndResolveOriginal = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({ file, dataUrl: null });
      };

      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width >= height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(outputType, quality);
          URL.revokeObjectURL(objectUrl);

          // Rough size check on the data URL (base64 is ~4/3 of raw bytes)
          const approxCompressedBytes = Math.round((dataUrl.length * 3) / 4);
          if (approxCompressedBytes >= file.size) {
            // Compression didn't help - keep the original file/path
            resolve({ file, dataUrl: null });
            return;
          }

          // Also derive a Blob/File for the direct-upload (FormData) fallback path
          canvas.toBlob((blob) => {
            if (!blob) {
              resolve({ file, dataUrl });
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name || 'upload.jpg',
              { type: outputType }
            );
            resolve({ file: compressedFile, dataUrl });
          }, outputType, quality);
        } catch (e) {
          cleanupAndResolveOriginal();
        }
      };

      img.onerror = cleanupAndResolveOriginal;
      img.src = objectUrl;
    });
  },

  // Upload Public Prize/Category Image to ImageBB
  async uploadToImageBB(file, apiKey = '') {
    // 1. Validate File
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // 1b. Downscale large photos (mainly mobile camera uploads) before encoding
    const { file: processedFile, dataUrl: compressedDataUrl } = await this.compressImageFile(file);
    file = processedFile;

    const base64 = compressedDataUrl || await Utils.readFileAsDataURL(file);

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
