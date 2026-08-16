# የኢትዮጲያ ሎተሪ እጣ (Ethiopian Lottery Web Application)

A modern, luxurious, production-ready Amharic lottery web application built using HTML5, CSS3, Vanilla JavaScript (ES6+), Supabase, and Progressive Web App (PWA) standards.

---

## 🌟 Key Features

1. **Brand Identity & Exact Naming**: Standardized strictly as **የኢትዮጲያ ሎተሪ እጣ** across all customer & admin pages.
2. **Framework-Free Static Application**: Built with standard static HTML, CSS, and JS without React or Node build steps for max portability.
3. **7 Core Lottery Categories**:
   - 🚗 መኪና (Car)
   - 🏠 ኮንደሚኒዬም (Condominium)
   - 📱 ዘመናዊ ስልኮች (Smartphones)
   - 💰 ገንዘብ (Cash Prize)
   - 💻 ላፕቶፕ (Laptop)
   - 📺 ቴሌቪዥን (Television)
   - 🐑 በግ (Livestock / Sheep)
4. **5 Preview Image Carousels**: Each category and prize features a 5-image touch-swipe carousel with dots, navigation buttons, and auto-slide.
5. **Interactive Ticket Purchase ("ቁረጥ")**: Validates selected prize and passes information to payment module.
6. **Manual Payment Methods & Account Copy**:
   - Commercial Bank of Ethiopia (CBE)
   - Telebirr
   - Bank of Abyssinia
   - Dashen Bank
   - Amhara Bank
   - Oromia Bank
   - **One-click account number copier** (`📋 ቅዳ`) copying *only* the account number with toast notification `ቁጥሩ ተቀድቷል!`.
7. **Sensitive Customer Data Protection**:
   - Ethiopian phone number validator
   - Private payment screenshot uploader with file preview, remove, and replace
   - **Private Supabase Bucket** storage for screenshots ensuring customer payment receipts are never public.
8. **Success Confirmation**: Displays required texts:
   - `መረጃዎ በትክክል ተልኳል።`
   - `መስከረም 1 በአዲስ አመት አሸናፊ ከሆኑ መልዕክት ይደርሶታል!`
9. **Admin Dashboard**:
   - Ticket submissions stats counters (Total, Pending, Reviewing, Approved, Rejected, Today's)
   - Search by phone number & status filtering
   - Private receipt screenshot modal viewer
   - Category & prize management
   - Bank account numbers manager
   - Site logo, hero title, legal, & operator text editor
10. **Offline Local Demo Mode**: Automatically functions with local browser storage if Supabase credentials are not provided initially!

---

## 🚀 Quick Start & Local Development

### 1. Open Locally
No frontend build command or `npm install` required! Simply open `index.html` in any web browser.

Alternatively, to serve via a local web server:
```bash
# Using Node / Express included in server.ts
npm run dev
```

---

## 🗄️ Supabase Setup & Configuration

1. Log into [Supabase Dashboard](https://supabase.com) and create a new project.
2. Navigate to **SQL Editor** in Supabase.
3. Open `supabase-schema.sql` from this repository, paste the entire SQL code, and click **Run**.
   - This creates all required tables (`categories`, `prizes`, `payment_methods`, `ticket_submissions`, `site_settings`).
   - Configures Row Level Security (RLS) policies.
   - Creates the private `payment-screenshots` bucket.
   - Populates initial seed data.
4. Copy your **Project URL** and **Anon Public Key** from `Settings -> API`.
5. Open `js/config.js` and set:
   ```javascript
   SUPABASE_URL: 'https://your-project.supabase.co',
   SUPABASE_ANON_KEY: 'your-anon-key-here'
   ```

---

## 📦 Deploying to Vercel via GitHub

1. **Create GitHub Repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of የኢትዮጲያ ሎተሪ እጣ"
   git branch -M main
   git remote add origin https://github.com/your-username/eth-lottery.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Log into [Vercel](https://vercel.com).
   - Click **Add New... -> Project** and import your GitHub repository.
   - Leave Build Settings as default (No build command required).
   - Click **Deploy**.

---

## 🔐 Security & Privacy Practices

- **Private Payment Receipts**: Payment screenshots contain sensitive financial information and are saved into a private Supabase Storage bucket (`payment-screenshots`). They are accessible strictly to authorized administrators.
- **Service Worker Cache Exclusions**: `sw.js` explicitly excludes customer phone numbers, admin endpoints, and payment screenshots from browser caching.
- **XSS Sanitization**: All customer inputs are safely escaped using `Utils.escapeHTML()`.

---

## 📄 Legal & Operator License Information

Operator information and legal disclaimers can be dynamically updated anytime from the Admin Dashboard under the **ብራንዲንግና ሴቲንግ** section.
