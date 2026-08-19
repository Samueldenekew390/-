/* ==========================================================================
   የኢትዮጲያ ሎተሪ እጣ - Global Configuration
   ========================================================================== */

const APP_CONFIG = {
  // Application Branding
  APP_NAME: 'የኢትዮጲያ ሎተሪ እጣ',
  APP_VERSION: '1.0.0',

  // Supabase Configuration
  // Fill these in js/config.js or via Admin Settings to connect real Supabase.
  // If empty, the app seamlessly runs in Local Storage Demo Mode!
  SUPABASE_URL: window.ENV_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: window.ENV_SUPABASE_ANON_KEY || '',

  // ImageBB Configuration for Public Prize Images
  // Securely configured or set in Admin Settings.
  IMAGEBB_API_KEY: window.ENV_IMAGEBB_API_KEY || '',

  // Initial Seed Data (Used for Demo Mode or First-Time Supabase Seed)
  SEED_CATEGORIES: [
    { id: 'cat-car', name_am: 'መኪና', slug: 'car', icon: '🚗', active: true, display_order: 1 },
    { id: 'cat-condo', name_am: 'ኮንደሚኒዬም', slug: 'condo', icon: '🏠', active: true, display_order: 2 },
    { id: 'cat-phone', name_am: 'ዘመናዊ ስልኮች', slug: 'phone', icon: '📱', active: true, display_order: 3 },
    { id: 'cat-money', name_am: 'ገንዘብ', slug: 'money', icon: '💰', active: true, display_order: 4 },
    { id: 'cat-laptop', name_am: 'ላፕቶፕ', slug: 'laptop', icon: '💻', active: true, display_order: 5 },
    { id: 'cat-tv', name_am: 'ቴሌቪዥን', slug: 'tv', icon: '📺', active: true, display_order: 6 },
    { id: 'cat-sheep', name_am: 'በግ', slug: 'sheep', icon: '🐑', active: true, display_order: 7 }
  ],

  SEED_PAYMENT_METHODS: [
    { id: 'pay-cbe', name_am: 'ንግድ ባንክ', account_number: '1000327468956', active: true, display_order: 1 },
    { id: 'pay-abyssinia', name_am: 'አቢሲኒያ ባንክ', account_number: '264416817', active: true, display_order: 3 }
  ],

  DEFAULT_SITE_SETTINGS: {
    site_name_am: 'የኢትዮጲያ ሎተሪ እጣ',
    logo_url: '/assets/official_logo.jpg',
    hero_title_am: 'በአዲስ አመት የቤት ወይንም የመኪና ወይንም ደግሞ የዘመናዊ ስልክ ቀፎና ሌሎችም ሽልማቶች አሸናፊ ይሁኑ!',
    hero_cta_am: 'እድልዎን ይሞክሩ',
    bottom_disclaimer_am: 'በኢትዮጲያ ሎተሪ እጣ ድረ-ገፅ እና አፕልኬሽን ሎተሪ በመቁረጥ እድሎን ይሞክሩ እራስዎን ከአጭበርባሪዎች ይታደጉ!',
    footer_text_am: 'የኢትዮጲያ ሎተሪ እጣ - የዘመን መለወጫ ልዩ አጓጊ ሽልማቶች ዲጂታል መድረክ',
    default_ticket_price: '50 ብር',
    operator_information: 'የኢትዮጲያ ሎተሪ እጣ ዲጂታል ድረገጽ አገልግሎት',
    legal_information: 'መብቱ በህግ የተጠበቀ ነው። © 2026 የኢትዮጲያ ሎተሪ እጣ'
  }
};
