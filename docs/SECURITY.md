# Security Notes

- Frontend ไม่เก็บ Supabase Database Password หรือ Service Role Key
- Backend ใช้ JWT และตรวจผู้ใช้จากฐานข้อมูลทุก Request
- Password hash ด้วย bcrypt cost 12
- Write actions จำกัด `admin` และ `staff`; Settings/User/Backup จำกัด `admin`
- Helmet, CORS, JSON size limit และ rate limit ถูกเปิดใช้งาน
- เลขเอกสารและ workflow สร้างใน Database transaction
- ยอดรวมคำนวณที่ Backend ด้วย Decimal.js ไม่เชื่อค่ารวมจาก Browser
- Tables เปิด RLS เป็น defense-in-depth แม้ Backend จะเชื่อมด้วย database role
- Backup export ไม่รวม `password_hash`

## ก่อน Production

- ใช้ HTTPS เท่านั้น (Vercel/Render จัดให้)
- ตั้ง `CORS_ORIGINS` เป็น Domain จริง ไม่ใช้ `*`
- ไม่ Commit `.env`
- ลบ Admin password ชั่วคราวจาก Render หลังสร้างบัญชี
- ใช้ Supabase Storage แบบ Private หากเพิ่ม Upload Logo/Signature ในภายหลัง
- ตรวจสอบ Retention และ Backup ตามความเสี่ยงของธุรกิจ

## Logo upload security (v3.2.0)

Logo uploads are restricted to PNG, JPEG, and WebP, checked by MIME type and file signature, limited to 500 KB, and available only to Admin users. The file is stored as a Data URL in the existing settings row, so the system does not rely on Render's ephemeral filesystem.

## Password policy (v3.2.0)

New users and the create-admin script require at least 8 characters with uppercase, lowercase, number, and special character. Validation is performed on both Frontend and Backend. Passwords continue to be hashed with bcrypt.
