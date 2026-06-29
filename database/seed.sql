INSERT INTO settings (
  id, shop_name_th, shop_name_en, shop_owner, shop_address,
  shop_taxid, shop_phone, scb_bank_details, ktb_bank_details
)
VALUES (
  1,
  'ต้อง เซอร์วิส ไอที',
  'Tong Service IT',
  'กิตติโชค ส่งศรีเจริญ',
  '123/45 ต.ปากน้ำ อ.เมือง จ.กระบี่ 81000',
  '1234567890123',
  '081-234-5678',
  'ไทยพาณิชย์ (SCB) 123-4-56789-0 กิตติโชค',
  'กรุงไทย (KTB) 987-6-54321-0 กิตติโชค'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, name, type, taxid, phone, address)
VALUES
  ('CUS-001', 'ลูกค้าทั่วไป', 'general', NULL, '080-000-0000', 'กระบี่'),
  ('CUS-002', 'บริษัทตัวอย่าง จำกัด', 'private', '0100000000000', '081-111-1111', 'กรุงเทพมหานคร'),
  ('CUS-003', 'หน่วยงานราชการตัวอย่าง', 'government', '0990000000000', '075-222-222', 'กระบี่')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, price, unit, category)
VALUES
  ('PRD-001', 'ค่าบริการตรวจเช็กคอมพิวเตอร์', 500, 'ครั้ง', 'Service'),
  ('PRD-002', 'ค่าติดตั้งระบบปฏิบัติการ', 800, 'เครื่อง', 'Service')
ON CONFLICT (id) DO NOTHING;
