-- 1. Create Products Table
CREATE TABLE products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    price NUMERIC,
    image TEXT, -- Base64 string or URL
    category TEXT,
    "parentCategory" TEXT, -- Quoted because of mixed case in JS
    "subCategory" TEXT,
    sizes TEXT[], -- Array of strings
    colors TEXT[], -- Array of strings
    badge TEXT,
    status TEXT DEFAULT 'active',
    "colorVariants" JSONB, -- Store complex object as JSONB
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Orders Table
CREATE TABLE orders (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    "customerName" TEXT,
    phone TEXT,
    gov TEXT,
    address TEXT,
    items JSONB, -- Store cart items as JSONB
    "itemsTotal" NUMERIC,
    "shippingCost" NUMERIC,
    total NUMERIC,
    status TEXT DEFAULT 'جديد',
    "paymentMethod" TEXT,
    "paymentStatus" TEXT DEFAULT 'لم يتم الدفع',
    "userId" UUID REFERENCES auth.users(id), -- Link to Supabase Auth User (optional)
    "userEmail" TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Settings Table (for Shipping Costs)
CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    costs JSONB,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create User Carts Table
CREATE TABLE user_carts (
    "userId" UUID PRIMARY KEY REFERENCES auth.users(id),
    items JSONB,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) - Optional but recommended
-- For simplicity in this migration, we will allow public access mostly, 
-- but ideally you should restrict write access to admins.
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust as needed)
-- Allow everyone to read products and settings
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON settings FOR SELECT USING (true);

-- Allow everyone to create orders
CREATE POLICY "Public Create Orders" ON orders FOR INSERT WITH CHECK (true);
-- Allow users to read their own orders (if logged in) or Admins (we'll handle admin logic in app for now or use service role)
-- Note: Logic for "Admin" in Supabase usually involves checking a role in auth.users or a separate table.
-- For now, we will allow public read for simplicity to match current "Client-side Admin" approach,
-- BUT BE WARNED: This means anyone with technical skills can read orders if they know the API.
-- To secure it, you should implement proper Auth policies. 
-- FOR NOW: Open access to keep it working like the previous Firebase setup.
CREATE POLICY "Public Read Orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public Update Orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Public Delete Orders" ON orders FOR DELETE USING (true);

-- Same for products (Admin manages them)
CREATE POLICY "Public Write Products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Products" ON products FOR UPDATE USING (true);
CREATE POLICY "Public Delete Products" ON products FOR DELETE USING (true);

-- Initial Shipping Settings
INSERT INTO settings (id, costs) VALUES ('shipping', '{}');
