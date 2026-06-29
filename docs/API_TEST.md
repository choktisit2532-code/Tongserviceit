# API Test Examples

## Health

```bash
curl http://localhost:10000/health
```

## Create Customer

```bash
curl -X POST http://localhost:10000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name":"บริษัท ทดสอบ จำกัด",
    "customer_type":"private",
    "phone":"0800000000"
  }'
```

## Create Product

```bash
curl -X POST http://localhost:10000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name":"บริการซ่อม Notebook",
    "description":"ตรวจเช็กและซ่อม Notebook",
    "unit":"ครั้ง",
    "price":1200
  }'
```

## Create Document

Replace `customer_id` and `product_id`.

```bash
curl -X POST http://localhost:10000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "doc_type":"QT",
    "doc_date":"2026-06-30",
    "due_date":"2026-07-15",
    "customer_id":"CUSTOMER_UUID",
    "items":[
      {
        "product_id":"PRODUCT_UUID",
        "description":"บริการซ่อม Notebook",
        "qty":1,
        "unit_price":1200
      }
    ],
    "note":"ทดสอบออกใบเสนอราคา"
  }'
```
