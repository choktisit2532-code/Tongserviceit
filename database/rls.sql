-- รูปแบบนี้ตั้งใจให้ Frontend เข้าถึงข้อมูลผ่าน Backend เท่านั้น
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ไม่สร้าง policy สำหรับ anon/authenticated โดยตั้งใจ
-- Backend ใช้ Service Role Key ซึ่ง bypass RLS ได้
