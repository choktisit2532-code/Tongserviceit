# Tong Service IT Billing System

ระบบบิลสำหรับร้าน “ต้อง เซอร์วิส ไอที” แยกเป็น 3 ส่วน:

```text
/frontend   React + Vite SPA สำหรับ deploy บน Vercel
/backend    Node.js + Express API สำหรับ deploy บน Render
/database   Supabase PostgreSQL schema และ seed
```

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: Supabase PostgreSQL
- Main storage: Supabase
- LocalStorage: ใช้เฉพาะ theme และ draft เล็ก ๆ

## วิธีติดตั้งแบบเร็ว

### 1. สร้าง Supabase Project

เปิด Supabase SQL Editor แล้วรัน:

```text
/database/schema.sql
/database/seed.sql
```

### 2. ตั้งค่า Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

แก้ `.env`:

```env
PORT=10000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=http://localhost:5173
```

### 3. ตั้งค่า Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

แก้ `.env`:

```env
VITE_API_BASE_URL=http://localhost:10000
```

## Deploy

### Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_BASE_URL=https://your-render-api.onrender.com`

### Render

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment variables:
  - `PORT`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `FRONTEND_URL`

## Logic ที่ใส่แล้ว

- เลขเอกสาร `RC001-2606`
- ใช้ปี ค.ศ. 2 หลักในเลขเอกสาร
- แสดงวันที่แบบไทย พ.ศ. บน frontend
- แยกสถานะ QT, IN, BN, RC, DO
- สร้าง RC แล้วอัปเดตสถานะ IN/BN เป็น PAID
- สร้างเอกสารจาก QT แล้วอัปเดต QT เป็น APPROVED
- QT expiry date อย่างน้อย 15 วัน
- BN due date อย่างน้อย 15 วัน
- คำนวณ WHT 3% ตามประเภทลูกค้า
- RC ของลูกค้าเอกชนมี transfer fee 20 บาท
- Import/Export JSON จาก Supabase
- Print A4 และ print financial report

## หมายเหตุสำคัญ

Starter นี้พร้อมนำไปต่อยอด แต่ก่อนใช้จริงควรเพิ่ม:

- Login/Auth middleware เต็มรูปแบบ
- Row Level Security ตาม user/store
- Audit log
- Backup schedule
- Unit test สำหรับ business rules

## การอัปเกรด v2 (Production Hardening)

สำหรับฐานข้อมูลเดิม ให้รัน `database/migration_v2.sql` หนึ่งครั้งก่อน deploy backend เวอร์ชันนี้

สิ่งที่เพิ่ม:

- เก็บ Customer/Shop Snapshot ในเอกสารใหม่ เพื่อให้เอกสารเก่าไม่เปลี่ยนตาม Master Data
- Customer และ Product ใช้การปิดใช้งาน (soft delete) แทนการลบถาวร
- Validation ฝั่ง Backend สำหรับข้อความ ราคา จำนวน และประเภทลูกค้า
- จำกัดการลบเอกสารให้ลบได้เฉพาะสถานะ `DRAFT`
- เก็บวันเวลาและเหตุผลการยกเลิกเอกสาร
- เพิ่ม database constraints และ automated tests ของ business rules

ทดสอบ Backend:

```bash
cd backend
npm test
```
