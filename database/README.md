# Supabase Database

1. สร้าง Supabase project
2. เปิด SQL Editor
3. รัน `migrations/001_initial_schema.sql`
4. ถ้าต้องการข้อมูลตัวอย่าง ให้รัน `seeds/001_demo_data.sql`
5. คัดลอก **Session Pooler connection string** ไปใส่ `backend/.env` เป็น `DATABASE_URL`

Frontend จะไม่เชื่อมฐานข้อมูลโดยตรง ทุกคำสั่งต้องผ่าน Render API เพื่อไม่เปิดเผยรหัสฐานข้อมูลและเพื่อให้การสร้างเลขเอกสาร/คำนวณยอดทำใน transaction เดียวกัน


## Migration v3.4.0

`002_document_lifecycle.sql` เพิ่มข้อมูลยกเลิก ลบแบบ Soft Delete ผู้ดำเนินการ และดัชนีถังขยะ รันผ่าน `npm run db:migrate` เท่านั้น ไม่ต้องแก้ `001_initial_schema.sql`
