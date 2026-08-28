-- ============================================================
-- Almedina Market — Foundation Schema
-- Tables + RLS policies for the storefront
-- ============================================================

-- ---------- CATEGORIES ----------
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  arabic_name TEXT,
  description TEXT NOT NULL DEFAULT '',
  icon_name   TEXT NOT NULL DEFAULT 'Package',
  image       TEXT NOT NULL DEFAULT '',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_categories" ON categories FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_categories" ON categories FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_categories" ON categories FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_categories" ON categories FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
  id                 TEXT PRIMARY KEY,
  name               TEXT NOT NULL,
  arabic_name        TEXT,
  category_id        TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  price_etb          NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit               TEXT NOT NULL DEFAULT '',
  image              TEXT NOT NULL DEFAULT '',
  stock_count        INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_available       BOOLEAN NOT NULL DEFAULT true,
  description        TEXT NOT NULL DEFAULT '',
  origin             TEXT NOT NULL DEFAULT '',
  rating             NUMERIC(2,1) NOT NULL DEFAULT 0,
  review_count       INTEGER NOT NULL DEFAULT 0,
  is_popular         BOOLEAN NOT NULL DEFAULT false,
  is_imported        BOOLEAN NOT NULL DEFAULT false,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_products" ON products FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_products" ON products FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_products" ON products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_products" ON products FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  order_number      TEXT NOT NULL UNIQUE,
  user_id           TEXT NOT NULL DEFAULT '',
  customer_name     TEXT NOT NULL DEFAULT '',
  customer_phone    TEXT NOT NULL DEFAULT '',
  fulfillment_type  TEXT NOT NULL DEFAULT 'delivery'
                      CHECK (fulfillment_type IN ('delivery','pickup')),
  delivery_address_text TEXT,
  delivery_landmark    TEXT,
  delivery_latitude    DOUBLE PRECISION,
  delivery_longitude   DOUBLE PRECISION,
  delivery_distance_km DOUBLE PRECISION,
  subtotal_etb      NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee_etb  NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_etb         NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method    TEXT NOT NULL DEFAULT 'cash'
                      CHECK (payment_method IN ('chapa','cash')),
  payment_status    TEXT NOT NULL DEFAULT 'pending_cash'
                      CHECK (payment_status IN ('unpaid','payment_pending','pending_cash','paid','failed','cancelled','refunded')),
  order_status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK (order_status IN ('pending','confirmed','out_for_delivery','ready_for_pickup','completed','cancelled')),
  chapa_tx_ref      TEXT,
  notes             TEXT,
  cancellation_reason TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- PAYMENTS ----------
CREATE TABLE IF NOT EXISTS payments (
  id                             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id                       TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method                 TEXT NOT NULL CHECK (payment_method IN ('chapa','cash')),
  payment_status                 TEXT NOT NULL DEFAULT 'pending'
                                   CHECK (payment_status IN ('pending','payment_pending','pending_cash','paid','failed','cancelled','refunded')),
  amount                         NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency                       TEXT NOT NULL DEFAULT 'ETB',
  provider                       TEXT NOT NULL DEFAULT 'chapa' CHECK (provider IN ('chapa','cash')),
  provider_transaction_id        TEXT,
  internal_transaction_reference TEXT,
  created_at                     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_payments" ON payments FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_payments" ON payments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_payments" ON payments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_payments" ON payments FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- ORDER ITEMS ----------
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   TEXT NOT NULL,
  product_name TEXT NOT NULL DEFAULT '',
  price_etb    NUMERIC(10,2) NOT NULL DEFAULT 0,
  quantity     INTEGER NOT NULL DEFAULT 1,
  unit         TEXT NOT NULL DEFAULT '',
  subtotal_etb NUMERIC(10,2) NOT NULL DEFAULT 0
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_order_items" ON order_items FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_order_items" ON order_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_order_items" ON order_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_order_items" ON order_items FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- REVIEWS ----------
CREATE TABLE IF NOT EXISTS reviews (
  id         TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id   TEXT NOT NULL,
  user_id    TEXT NOT NULL DEFAULT '',
  user_name  TEXT NOT NULL DEFAULT '',
  rating     INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'pending_approval'
               CHECK (status IN ('pending_approval','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_reviews" ON reviews FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_reviews" ON reviews FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_reviews" ON reviews FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_reviews" ON reviews FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- RETURN REPORTS ----------
CREATE TABLE IF NOT EXISTS return_reports (
  id                   TEXT PRIMARY KEY,
  order_id             TEXT NOT NULL,
  order_number         TEXT NOT NULL DEFAULT '',
  user_id              TEXT NOT NULL DEFAULT '',
  user_name            TEXT NOT NULL DEFAULT '',
  user_phone           TEXT NOT NULL DEFAULT '',
  reason               TEXT NOT NULL DEFAULT 'damaged_item'
                         CHECK (reason IN ('wrong_item','damaged_item','spoiled_item')),
  photo_url            TEXT NOT NULL DEFAULT '',
  notes                TEXT NOT NULL DEFAULT '',
  status               TEXT NOT NULL DEFAULT 'pending_review'
                         CHECK (status IN ('pending_review','approved','rejected')),
  admin_resolution     TEXT CHECK (admin_resolution IN ('refund','replacement','denied')),
  admin_response_notes TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE return_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_return_reports" ON return_reports FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_return_reports" ON return_reports FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_return_reports" ON return_reports FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_return_reports" ON return_reports FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- CONTACT SUBMISSIONS ----------
CREATE TABLE IF NOT EXISTS contact_submissions (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL DEFAULT '',
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_contact_submissions" ON contact_submissions FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_contact_submissions" ON contact_submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_contact_submissions" ON contact_submissions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_contact_submissions" ON contact_submissions FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- FAQS ----------
CREATE TABLE IF NOT EXISTS faqs (
  id         TEXT PRIMARY KEY,
  question   TEXT NOT NULL DEFAULT '',
  answer     TEXT NOT NULL DEFAULT '',
  category   TEXT NOT NULL DEFAULT 'delivery'
               CHECK (category IN ('delivery','payment','products','orders')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_faqs" ON faqs FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_faqs" ON faqs FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_faqs" ON faqs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_faqs" ON faqs FOR DELETE
  TO anon, authenticated USING (true);

-- ---------- INDEXES ----------
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
