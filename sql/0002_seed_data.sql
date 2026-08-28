-- ============================================================
-- Almedina Market — Seed Data
-- ============================================================

-- ---------- CATEGORIES ----------
INSERT INTO categories (id, name, arabic_name, description, icon_name, image, sort_order) VALUES
('dates_sweets', 'Dates & Sweets', 'تمور وحلويات', 'Premium imported Khudri, Ajwa, Sukkari dates and authentic halwa.', 'Sparkles', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600', 1),
('dairy', 'Dairy Products', 'ألبان وأجبان', 'Almarai powdered milk, spreadable cream cheese, laban, butter, and processed cheeses.', 'Milk', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600', 2),
('juices', 'Juices & Drinks', 'عصائر ومشروبات', 'Almarai natural mango nectar, Rani fruit floats, Capri-Sun pouches, and refreshing juices.', 'Citrus', 'https://images.unsplash.com/photo-1622597467836-f3285f2131b7?auto=format&fit=crop&q=80&w=600', 3),
('rice_grains', 'Basmati Rice & Grains', 'أرز بسمتي وحبوب', 'Abu Bint, Al Walimah, and Shahrazad long-grain aged Basmati rice.', 'Wheat', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600', 4),
('oils_cooking', 'Cooking Oils & Ghee', 'زيوت وسمن', 'Afia corn oil, pure vegetable ghee, and extra virgin olive oils.', 'Flame', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600', 5),
('beverages_coffee', 'Arabic Coffee & Tea', 'قهوة عربية وشاي', 'Arabic coffee with green cardamom, saffron, powdered milk & imported tea.', 'Coffee', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600', 6),
('spices_seasoning', 'Spices & Kabsa Blends', 'بهارات وتوابل', 'Authentic Kabsa spice mixes, cardamom pods, sumac, and saffron.', 'UtensilsCrossed', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600', 7),
('canned_pantry', 'Pantry & Canned Goods', 'معلبات ومؤونة', 'Goody pasta, Luna fava beans, tahini, tomato paste, and olive pickles.', 'Package', 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=600', 8),
('sauces_condiments', 'Sauces & Condiments', 'صلصات وشطة ومتبلات', 'Crystal hot sauce, American More fiery sauce, Ayaan tomato ketchup, and table sauces.', 'Flame', 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=80&w=600', 9),
('snacks', 'Snacks & Confectionery', 'وجبات خفيفة وسناكس', 'Imported chocolates, crispy wafers, potato chips, savory biscuits, and sweet treats.', 'Cookie', 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&q=80&w=600', 10),
('noodles', 'Noodles', 'نودلز ومعكرونة سريعة التحضير', 'Indomie Mi Goreng, spicy chicken ramen, savory broth noodles, and instant meal cups.', 'Soup', 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&q=80&w=600', 11),
('frozen_foods', 'Frozen Halal Meats', 'مأكولات مجمدة', 'Al Kabeer tender chicken breast, kebabs, and frozen sambusa pastry.', 'Snowflake', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=600', 12)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  arabic_name = EXCLUDED.arabic_name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  image = EXCLUDED.image,
  sort_order = EXCLUDED.sort_order;

-- ---------- PRODUCTS ----------
INSERT INTO products (id, name, arabic_name, category_id, price_etb, unit, image, stock_count, low_stock_threshold, is_available, description, origin, rating, review_count, is_popular, is_imported) VALUES
('prod-1', 'Kingdom Dates - Ajwa Madinah Premium', 'تمر عجوة المدينة الفاخر', 'dates_sweets', 1850, '1 kg Box', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600', 24, 5, true, 'Authentic Ajwa dates imported from Al-Madinah Al-Munawwarah. Rich in nutrients, soft texture, natural sweet flavour.', 'Madinah', 4.9, 38, true, true),
('prod-2', 'Almarai Full Cream Powder Milk', 'حليب المراعي المجفف كامل الدسم', 'dairy_juices', 2250, '2.25 kg Can', 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600', 18, 4, true, 'Almarai powdered milk. Enriched with Vitamins A and D. Perfect for tea, coffee, baking, and daily family consumption.', 'Riyadh', 4.8, 29, true, true),
('prod-3', 'Abu Bint Mazza Basmati Rice', 'أرز أبو بنت مزة بسمتي', 'rice_grains', 3400, '5 kg Bag', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600', 30, 6, true, 'Famous long-grain Basmati rice. Extra long grain length, non-sticky cooking result, ideal for authentic Kabsa & Mandi.', 'Imported', 4.9, 45, true, true),
('prod-4', 'Afia Pure Corn Cooking Oil', 'زيت الذرة الصافي عافية', 'oils_cooking', 1650, '1.5 Litre Bottle', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600', 14, 5, true, 'Pure 100% corn oil from Afia. High smoke point, light aroma, heart healthy for frying and cooking.', 'Jeddah', 4.7, 22, false, true),
('prod-5', 'Al Saffah Green Cardamom Coffee', 'قهوة خضراء بالهيل الصفاح', 'beverages_coffee', 980, '500 g Pack', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=600', 3, 5, true, 'Traditional light roast Arabic coffee blended with premium green cardamom pods. Aromatic, gold-hued, authentic hospitality drink.', 'Al Qassim', 4.9, 19, true, true),
('prod-6', 'Al Kabeer Tender Chicken Breast Fillets', 'صدور دجاج مجمدة الكبير', 'frozen_foods', 1450, '1 kg Pack', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&q=80&w=600', 12, 3, true, '100% Halal certified tender boneless skinless chicken breast. Frozen at peak freshness, high protein content.', 'Imported', 4.6, 15, false, true),
('prod-7', 'Halwani Bros Finest Tahini (100% Sesame)', 'طحينة حلواني إخوان النقية', 'canned_pantry', 720, '500 g Jar', 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=600', 22, 5, true, 'Creamy 100% pure hulled sesame seed paste by Halwani Bros. Essential for hummus, dressings, and dips.', 'Jeddah', 4.8, 12, false, true),
('prod-8', 'Royal Kabsa Special Seasoning Blend', 'بهارات الكبسة الملكية', 'spices_seasoning', 450, '250 g Container', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600', 0, 5, false, 'Master blended spices containing dried lime (loomi), bay leaf, nutmeg, black pepper, cinnamon, and cumin.', 'Dammam', 4.9, 31, true, true),
('prod-9', 'Almarai Natural Mango Nectar Juice', 'عصير مانجو المراعي الطبيعي', 'dairy_juices', 280, '1 Litre Pack', 'https://images.unsplash.com/photo-1622597467836-f3285f2131b7?auto=format&fit=crop&q=80&w=600', 35, 10, true, 'Rich, pulp-filled natural mango nectar. No artificial preservatives. Serve chilled for a refreshing flavour.', 'Imported', 4.7, 17, false, true),
('prod-10', 'Sukkari Al Qassim Soft Golden Dates', 'تمر سكري القصيم اللين', 'dates_sweets', 1550, '1 kg Box', 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=600', 15, 4, true, 'Naturally sweet, melt-in-the-mouth golden Sukkari dates from Al Qassim palm groves. Perfect pairing with Arabic coffee.', 'Al Qassim', 4.9, 28, true, true)
ON CONFLICT (id) DO NOTHING;

-- ---------- ORDERS ----------
INSERT INTO orders (id, order_number, user_id, customer_name, customer_phone, fulfillment_type, delivery_address_text, delivery_landmark, delivery_latitude, delivery_longitude, delivery_distance_km, subtotal_etb, delivery_fee_etb, total_etb, payment_method, payment_status, order_status, chapa_tx_ref, notes, cancellation_reason, created_at, updated_at) VALUES
('ord-101', 'ALM-2026-0801', 'user-001', 'Sami Bekele', '+251911223344', 'delivery', 'Bethel Block 4, Near Commercial Bank of Ethiopia branch', 'Behind Total station', 8.9850, 38.7110, 2.1, 3700, 82, 3782, 'telebirr', 'paid', 'pending', 'CHP-TX-99881122', 'Please call before driving to Bethel Block 4.', NULL, now() - interval '2 hours', now() - interval '2 hours'),
('ord-102', 'ALM-2026-0802', 'user-002', 'Meron Tadesse', '+251922334455', 'pickup', NULL, NULL, NULL, NULL, NULL, 2250, 0, 2250, 'cbe_birr', 'paid', 'ready_for_pickup', 'CHP-TX-77441199', NULL, NULL, now() - interval '5 hours', now() - interval '4 hours'),
('ord-103', 'ALM-2026-0803', 'user-001', 'Sami Bekele', '+251911223344', 'delivery', 'Keraniyo Hillside, Bethel West', NULL, 8.9790, 38.6920, 3.8, 5050, 107, 5157, 'cod', 'paid', 'completed', NULL, NULL, NULL, now(), now())
ON CONFLICT (id) DO NOTHING;

-- ---------- ORDER ITEMS ----------
INSERT INTO order_items (order_id, product_id, product_name, price_etb, quantity, unit, subtotal_etb) VALUES
('ord-101', 'prod-1', 'Kingdom Dates - Ajwa Madinah Premium', 1850, 2, '1 kg Box', 3700),
('ord-102', 'prod-2', 'Almarai Full Cream Powder Milk', 2250, 1, '2.25 kg Can', 2250),
('ord-103', 'prod-3', 'Abu Bint Mazza Basmati Rice', 3400, 1, '5 kg Bag', 3400),
('ord-103', 'prod-4', 'Afia Pure Corn Cooking Oil', 1650, 1, '1.5 Litre Bottle', 1650)
ON CONFLICT DO NOTHING;

-- ---------- REVIEWS ----------
INSERT INTO reviews (id, product_id, order_id, user_id, user_name, rating, comment, status, created_at) VALUES
('rev-1', 'prod-1', 'ord-101', 'user-001', 'Sami Bekele', 5, 'Authentic Ajwa dates! Soft, fresh and natural sweetness. Delivery to Bethel was fast.', 'approved', now() - interval '2 days'),
('rev-2', 'prod-3', 'ord-103', 'user-001', 'Sami Bekele', 5, 'Best Basmati rice for Kabsa in Addis. Non-sticky and long grains. Will order again.', 'pending_approval', now())
ON CONFLICT (id) DO NOTHING;

-- ---------- RETURN REPORTS ----------
INSERT INTO return_reports (id, order_id, order_number, user_id, user_name, user_phone, reason, photo_url, notes, status, admin_resolution, admin_response_notes, created_at) VALUES
('ret-1', 'ord-103', 'ALM-2026-0803', 'user-001', 'Sami Bekele', '+251911223344', 'damaged_item', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400', 'Outer bag paper seal was slightly torn during handoff.', 'pending_review', NULL, NULL, now())
ON CONFLICT (id) DO NOTHING;

-- ---------- CONTACT SUBMISSIONS ----------
INSERT INTO contact_submissions (id, name, phone, message, is_read, created_at) VALUES
('cnt-1', 'Abebe Kebede', '+251912009988', 'Do you offer bulk wholesale boxes for Almarai milk cans for Bethel restaurants?', false, now() - interval '12 hours')
ON CONFLICT (id) DO NOTHING;

-- ---------- FAQS ----------
INSERT INTO faqs (id, question, answer, category, sort_order) VALUES
('faq-1', 'Where is Almedina Market located and what is your delivery range?', 'Almedina Market is located at Bethel Main Road, Addis Ababa. We deliver directly within a strict 6.0 km radius. Pickup is available for all customers with no distance limit.', 'delivery', 1),
('faq-2', 'What is the delivery fee and minimum order amount?', 'Delivery fee is calculated as 50 ETB base fee + 15 ETB per kilometre straight-line distance. Delivery orders require a minimum product subtotal of 1,000 ETB. Pickup has no minimum order requirement.', 'delivery', 2),
('faq-3', 'How do payment methods work (Chapa, Telebirr, CBE Birr, Cash)?', 'We accept online payments via Chapa (supporting Telebirr & CBE Birr) and Cash on Delivery / Pickup. Online payments undergo server-side verification before being marked Paid.', 'payment', 1),
('faq-4', 'When will I receive a confirmation phone call?', 'Our store owner makes order confirmation phone calls between 3:00 AM and 9:00 PM local time. Orders placed outside these hours are queued and called promptly during active call hours.', 'orders', 1),
('faq-5', 'What is the return and refund policy for damaged or wrong goods?', 'Customer satisfaction is guaranteed! You can submit a Same-Day Return or Refund report with mandatory photo evidence on the day of delivery through your order history page.', 'products', 1)
ON CONFLICT (id) DO NOTHING;
