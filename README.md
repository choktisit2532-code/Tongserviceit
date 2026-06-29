# Tong Service IT Billing

โครงสร้างระบบถูกแยกเป็น 3 ส่วน:

- `frontend/` — Vite + Vanilla JavaScript สำหรับหน้าจอและพิมพ์เอกสาร
- `backend/` — Node.js + Express API ติดต่อ Supabase ด้วย Service Role Key
- `database/` — PostgreSQL/Supabase schema, seed และ RLS

## เริ่มใช้งาน

### 1) Database
1. สร้าง Supabase project
2. เปิด SQL Editor
3. รัน `database/schema.sql`
4. รัน `database/seed.sql`
5. สำหรับระบบที่เรียกข้อมูลผ่าน Backend เท่านั้น ให้รัน `database/rls.sql`

### 2) Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
แก้ค่า `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` และ `FRONTEND_ORIGIN` ใน `.env`

Backend: http://localhost:3000
Health check: http://localhost:3000/api/health

### 3) Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
แก้ `VITE_API_URL` เมื่อ Backend ไม่ได้รันที่ `http://localhost:3000/api`

Frontend: http://localhost:5173

## หมายเหตุด้านความปลอดภัย
- ห้ามนำ `SUPABASE_SERVICE_ROLE_KEY` ไปใส่ใน Frontend
- Frontend ติดต่อ Backend เท่านั้น
- ก่อนใช้งานจริงควรเพิ่มระบบ Login, Authorization, Audit log, validation เพิ่มเติม และทดสอบ workflow ของเอกสาร
