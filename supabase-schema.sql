-- ==========================================================================
-- የኢትዮጲያ ሎተሪ እጣ - Complete Database Schema & RLS Policies
-- Execute this SQL in your Supabase SQL Editor
-- ==========================================================================

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name_am TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT,
    active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORY IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.category_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 1,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRIZES TABLE
CREATE TABLE IF NOT EXISTS public.prizes (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES public.categories(id) ON DELETE CASCADE,
    title_am TEXT NOT NULL,
    description_am TEXT,
    ticket_price TEXT DEFAULT '50 ብር',
    images JSONB DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRIZE IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.prize_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prize_id TEXT REFERENCES public.prizes(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INT DEFAULT 1,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PAYMENT METHODS TABLE
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id TEXT PRIMARY KEY,
    name_am TEXT NOT NULL,
    account_number TEXT NOT NULL,
    icon_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TICKET SUBMISSIONS TABLE (PRIVATE)
CREATE TABLE IF NOT EXISTS public.ticket_submissions (
    id TEXT PRIMARY KEY,
    category_id TEXT REFERENCES public.categories(id),
    prize_id TEXT REFERENCES public.prizes(id),
    phone_number TEXT NOT NULL,
    payment_method_id TEXT,
    payment_screenshot_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, reviewing, approved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.site_settings (
    id INT PRIMARY KEY DEFAULT 1,
    site_name_am TEXT DEFAULT 'የኢትዮጲያ ሎተሪ እጣ',
    logo_url TEXT,
    hero_title_am TEXT,
    bottom_disclaimer_am TEXT,
    operator_information TEXT,
    legal_information TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ADMINS TABLE (For authorized administrators)
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (Anyone can view active content)
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (active = true);
CREATE POLICY "Public Read Category Images" ON public.category_images FOR SELECT USING (active = true);
CREATE POLICY "Public Read Prizes" ON public.prizes FOR SELECT USING (active = true);
CREATE POLICY "Public Read Prize Images" ON public.prize_images FOR SELECT USING (active = true);
CREATE POLICY "Public Read Payment Methods" ON public.payment_methods FOR SELECT USING (active = true);
CREATE POLICY "Public Read Site Settings" ON public.site_settings FOR SELECT USING (true);

-- CUSTOMER SUBMISSION POLICY (Anyone can insert a submission, but nobody can public read submissions)
CREATE POLICY "Public Insert Submissions" ON public.ticket_submissions FOR INSERT WITH CHECK (true);

-- ADMIN FULL ACCESS POLICY
CREATE POLICY "Admin Full Categories" ON public.categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Category Images" ON public.category_images FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Prizes" ON public.prizes FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Prize Images" ON public.prize_images FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Payment Methods" ON public.payment_methods FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Submissions" ON public.ticket_submissions FOR ALL TO authenticated USING (true);
CREATE POLICY "Admin Full Settings" ON public.site_settings FOR ALL TO authenticated USING (true);

-- ==========================================================================
-- PRIVATE STORAGE BUCKET FOR SCREENSHOTS
-- ==========================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment-screenshots', 'payment-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Anyone can upload a screenshot
CREATE POLICY "Allow public upload payment screenshots" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'payment-screenshots');

-- Storage Policy: Only authenticated admins can read payment screenshots
CREATE POLICY "Allow authenticated admin read payment screenshots" ON storage.objects
FOR SELECT TO authenticated USING (bucket_id = 'payment-screenshots');

-- ==========================================================================
-- INITIAL SEED DATA
-- ==========================================================================

INSERT INTO public.categories (id, name_am, slug, icon, active, display_order) VALUES
('cat-car', 'መኪና', 'car', '🚗', true, 1),
('cat-condo', 'ኮንደሚኒዬም', 'condo', '🏠', true, 2),
('cat-phone', 'ዘመናዊ ስልኮች', 'phone', '📱', true, 3),
('cat-money', 'ገንዘብ', 'money', '💰', true, 4),
('cat-laptop', 'ላፕቶፕ', 'laptop', '💻', true, 5),
('cat-tv', 'ቴሌቪዥን', 'tv', '📺', true, 6),
('cat-sheep', 'በግ', 'sheep', '🐑', true, 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payment_methods (id, name_am, account_number, active, display_order) VALUES
('pay-cbe', 'ንግድ ባንክ', '1000327468956', true, 1),
('pay-telebirr', 'ቴሌብር', '0964202064', true, 2),
('pay-abyssinia', 'አቢሲኒያ ባንክ', '1000327468956', true, 3),
('pay-dashen', 'ዳሽን ባንክ', '1000327468956', true, 4),
('pay-amhara', 'አማራ ባንክ', '1000327468956', true, 5),
('pay-oromia', 'ኦሮሚያ ባንክ', '1000327468956', true, 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.site_settings (id, site_name_am, hero_title_am, bottom_disclaimer_am, operator_information, legal_information) VALUES
(1, 'የኢትዮጲያ ሎተሪ እጣ', 'በአዲስ አመት የቤት ወይንም የመኪና ወይንም ደግሞ የዘመናዊ ስልክ ቀፎና ሌሎችም ሽልማቶች አሸናፊ ይሁኑ!', 'በኢትዮጲያ ሎተሪ እጣ ድረ-ገፅ እና አፕልኬሽን ሎተሪ በመቁረጥ እድሎን ይሞክሩ እራስዎን ከአጭበርባሪዎች ይታደጉ!', 'የኢትዮጲያ ሎተሪ እጣ ዲጂታል ድረገጽ አገልግሎት', 'መብቱ በህግ የተጠበቀ ነው። © 2026 የኢትዮጲያ ሎተሪ እጣ')
ON CONFLICT (id) DO NOTHING;
