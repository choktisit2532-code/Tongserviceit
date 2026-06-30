# Implemented and Pending

## ใช้งานได้ในเวอร์ชันนี้

- Login/Role
- Dashboard
- เพิ่มและดูรายชื่อลูกค้า
- เพิ่มและดูสินค้า/บริการ
- สร้างเอกสาร 5 ประเภท
- หัวข้อ/รายการ/หมายเหตุในเอกสาร
- เลือกเอกสารต้นทางและ workflow สถานะ
- พิมพ์ A4
- ตั้งค่าร้านและเลขเอกสาร
- เพิ่มผู้ใช้งาน
- รายงานรายเดือน
- Export Backup JSON
- แก้ไข ยกเลิก และ Soft Delete เอกสาร
- ถังขยะและกู้คืนเอกสาร
- Audit Log viewer
- Dashboard charts และ business analytics

## เตรียมโค้ดไว้ แต่ปิดเป็นค่าเริ่มต้น

- Realtime
- Automatic Backup
- Email Notification

## งานที่ควรเพิ่มในเฟสถัดไป

- UI แก้ไขลูกค้าและ Product Master (API PUT มีแล้ว)
- ระบบ Revision แบบเก็บ snapshot ทุกเวอร์ชัน
- Supabase Storage upload สำหรับ Logo/Signature
- Import/Restore Backup พร้อม dry-run และ confirmation
- แนบหนังสือรับรองภาษีหัก ณ ที่จ่าย
- Pagination/Advanced search สำหรับข้อมูลจำนวนมาก
- Automated integration tests ที่เชื่อมฐานข้อมูลทดสอบ

เวอร์ชันนี้เป็น Production-oriented MVP ต้องผ่าน User Acceptance Test และตรวจแบบเอกสาร/กฎบัญชีก่อนใช้งานจริง
