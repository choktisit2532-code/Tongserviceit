insert into shop_settings (
  shop_name,
  address,
  phone,
  email,
  tax_id,
  scb_account,
  ktb_account
)
values (
  'ต้อง เซอร์วิส ไอที',
  '123 ถนนตัวอย่าง อำเภอเมือง จังหวัดตัวอย่าง',
  '080-000-0000',
  'contact@tongserviceit.com',
  '0100000000000',
  '123-456789-0',
  '987-654321-0'
)
on conflict do nothing;

insert into customers (name, customer_type, phone, email, address, tax_id)
values
  ('ลูกค้าทั่วไป ตัวอย่าง', 'general', '081-111-1111', null, 'ที่อยู่ลูกค้าทั่วไป', null),
  ('บริษัท เอกชน จำกัด', 'private', '082-222-2222', 'private@example.com', 'ที่อยู่บริษัทเอกชน', '0200000000000'),
  ('หน่วยงานรัฐ ตัวอย่าง', 'government', '083-333-3333', 'gov@example.go.th', 'ที่อยู่หน่วยงานรัฐ', '0300000000000');

insert into products (name, description, unit, price, stock_qty)
values
  ('บริการซ่อมคอมพิวเตอร์', 'ตรวจเช็กและซ่อมคอมพิวเตอร์', 'ครั้ง', 1500, 0),
  ('ติดตั้ง Windows และโปรแกรมพื้นฐาน', 'ติดตั้งระบบปฏิบัติการและโปรแกรมจำเป็น', 'เครื่อง', 800, 0),
  ('SSD 512GB', 'อุปกรณ์จัดเก็บข้อมูล SSD 512GB', 'ชิ้น', 1800, 10);
