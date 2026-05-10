-- SQL Schema for Revieward Supabase Database

-- 1. Businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT,
    category TEXT,
    city TEXT,
    api_key TEXT UNIQUE,
    notification_template JSONB DEFAULT '{"subject": "Оставьте отзыв о вашей покупке", "body": "Здравствуйте! Спасибо за покупку #{order_id} в {business_name}."}',
    widget_config JSONB DEFAULT '{"title": "Оставьте отзыв", "description": "Поделитесь впечатлениями", "button_color": "green"}',
    points_weak INTEGER DEFAULT 10,
    points_medium INTEGER DEFAULT 25,
    points_detailed INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. API Keys table (for history/validation)
CREATE TABLE IF NOT EXISTS api_keys (
    key TEXT PRIMARY KEY,
    business_id UUID REFERENCES businesses(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Notifications log
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    user_email TEXT NOT NULL,
    order_id TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id),
    user_email TEXT NOT NULL,
    order_id TEXT NOT NULL,
    text TEXT NOT NULL,
    category TEXT NOT NULL, -- 'слабый', 'средний', 'подробный'
    points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User balances (gamification)
CREATE TABLE IF NOT EXISTS user_balances (
    user_email TEXT PRIMARY KEY,
    balance INTEGER DEFAULT 0
);

-- 6. Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    business_id UUID REFERENCES businesses(id),
    user_email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) - Basic setup
-- For hackathon, you might want to disable RLS or add policies
-- ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Businesses can see their own data" ON businesses FOR ALL USING (auth.uid() = id);
