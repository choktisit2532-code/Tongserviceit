# API Summary

Base URL: `/api`

- `GET /health`
- `POST /auth/login`
- `GET /auth/me`
- `GET|POST /customers`
- `PUT /customers/:id`
- `GET|POST /products`
- `PUT /products/:id`
- `GET|POST /documents`
- `GET /documents/sources`
- `GET /documents/:id`
- `PATCH /documents/:id/status`
- `GET /dashboard?months=6|12`
- `GET /reports/monthly?month=YYYY-MM`
- `GET|PUT /settings`
- `GET|POST /users`
- `GET /backup/export`

ทุก Endpoint ยกเว้น `/health` และ `/auth/login` ต้องส่ง:

```http
Authorization: Bearer YOUR_JWT
```

## v3.2.0 additions

### POST `/api/settings/logo`

Admin only. Upload logo with `multipart/form-data` field name `logo`.

- PNG, JPG/JPEG, WebP
- maximum 500 KB
- returns updated settings including `logo_url`

### Password policy for POST `/api/users`

- minimum 8 characters, maximum 72
- at least one uppercase English letter
- at least one lowercase English letter
- at least one number
- at least one special character
- ASCII printable characters only; no Thai characters or spaces


## v3.3.0 dashboard analytics

`GET /api/dashboard?months=6` รองรับ `months=6` หรือ `months=12` และส่งข้อมูลเพิ่มใน `analytics`:

- `revenue_trend`: รายรับจากใบเสร็จแยกรายเดือน
- `revenue_mix`: สัดส่วนสินค้า ค่าแรง/บริการ และรายการอื่น
- `receivables_aging`: อายุลูกหนี้จากใบแจ้งหนี้ที่ยังไม่ชำระ
- `top_customers`: ลูกค้าที่สร้างยอดรับสุทธิสูงสุด
- `top_services`: งานบริการที่สร้างรายได้สูงสุด
- `insights`: จำนวนใบเสร็จ ยอดเฉลี่ย อัตราแปลงใบเสนอราคา และลูกค้าหลัก


## v3.4.0 document lifecycle

- `PUT /api/documents/:id` แก้ไขเอกสารและรายการ
- `POST /api/documents/:id/cancel` ยกเลิกเอกสาร Body: `{ "reason": "..." }`
- `DELETE /api/documents/:id` ลบแบบ Soft Delete Body: `{ "reason": "..." }`
- `POST /api/documents/:id/restore` กู้คืนเอกสาร เฉพาะ Admin
- `GET /api/documents/:id/audit` อ่านประวัติการเปลี่ยนแปลง
- `GET /api/documents?deleted_only=true` เปิดถังขยะ เฉพาะ Admin
