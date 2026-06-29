export function cleanText(value, { required = false, max = 1000, label = 'ข้อมูล' } = {}) {
  const text = String(value ?? '').trim();
  if (required && !text) throw badRequest(`${label} ต้องมีค่า`);
  if (text.length > max) throw badRequest(`${label}ยาวเกิน ${max} ตัวอักษร`);
  return text;
}

export function nonNegativeNumber(value, label) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) throw badRequest(`${label}ต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป`);
  return number;
}

export function validateCustomer(payload) {
  const allowedTypes = ['general', 'private', 'government'];
  const customerType = cleanText(payload.customer_type, { required: true, max: 20, label: 'ประเภทลูกค้า' });
  if (!allowedTypes.includes(customerType)) throw badRequest('ประเภทลูกค้าไม่ถูกต้อง');
  return {
    name: cleanText(payload.name, { required: true, max: 200, label: 'ชื่อลูกค้า' }),
    customer_type: customerType,
    phone: cleanText(payload.phone, { max: 50 }),
    email: cleanText(payload.email, { max: 200 }),
    address: cleanText(payload.address, { max: 2000 }),
    tax_id: cleanText(payload.tax_id, { max: 30 })
  };
}

export function validateProduct(payload) {
  return {
    name: cleanText(payload.name, { required: true, max: 200, label: 'ชื่อสินค้า/บริการ' }),
    description: cleanText(payload.description, { max: 2000 }),
    unit: cleanText(payload.unit || 'รายการ', { required: true, max: 50, label: 'หน่วย' }),
    price: nonNegativeNumber(payload.price, 'ราคา'),
    stock_qty: nonNegativeNumber(payload.stock_qty, 'จำนวนคงเหลือ')
  };
}

export function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}
