import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Secure Server-Side ImageBB Upload Endpoint
app.post('/api/upload-image', async (req, res) => {
  try {
    const { image, apiKey } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: 'No image provided' });
    }

    const key = process.env.IMAGEBB_API_KEY || apiKey || 'f568779951b14a274b7bf0e3c5097444'; // fallback key if available

    // Remove data:image/...;base64, prefix if present
    let base64Data = image;
    if (base64Data.includes(',')) {
      base64Data = base64Data.split(',')[1];
    }

    const formData = new URLSearchParams();
    formData.append('image', base64Data);

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    });

    const data = await imgbbRes.json();
    if (data && data.success && data.data) {
      return res.json({
        success: true,
        url: data.data.url,
        display_url: data.data.display_url,
        thumb_url: data.data.thumb?.url || data.data.url,
        delete_url: data.data.delete_url
      });
    } else {
      console.warn('ImageBB remote error:', data);
      return res.status(500).json({
        success: false,
        error: data.error?.message || 'ImageBB upload failed',
        data
      });
    }
  } catch (error: any) {
    console.error('Server upload error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server upload error'
    });
  }
});

// Serve static assets from root directory
app.use(express.static(__dirname, {
  extensions: ['html', 'htm']
}));

// Fallback to index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Explicit routes for html pages
app.get('/category', (req, res) => {
  res.sendFile(path.join(__dirname, 'category.html'));
});

app.get('/payment', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, 'success.html'));
});

app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin-login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin-images', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin/images', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

