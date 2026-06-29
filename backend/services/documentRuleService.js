const allowedDocs = {
  general: ['QT', 'RC'],
  private: ['QT', 'IN', 'BN', 'RC', 'DO'],
  government: ['QT', 'RC', 'DO']
};

const statusByDocType = {
  QT: 'DRAFT',
  IN: 'UNPAID',
  BN: 'UNPAID',
  RC: 'ISSUED',
  DO: 'ISSUED'
};

export function assertAllowedDocType(customerType, docType) {
  if (!allowedDocs[customerType]?.includes(docType)) {
    const err = new Error(`ลูกค้าประเภท ${customerType} ไม่สามารถออกเอกสาร ${docType} ได้`);
    err.status = 400;
    throw err;
  }
}

export function getInitialStatus(docType) {
  return statusByDocType[docType];
}

export function assertDueDateRule(docType, docDate, dueDate) {
  if (docType === 'QT' || docType === 'BN') {
    if (!dueDate) {
      const label = docType === 'QT' ? 'วันหมดอายุใบเสนอราคา' : 'วันครบกำหนดชำระเงิน';
      const err = new Error(`${label} ต้องมีค่า`);
      err.status = 400;
      throw err;
    }

    const diff = daysBetween(docDate, dueDate);
    if (diff < 15) {
      const label = docType === 'QT' ? 'วันหมดอายุใบเสนอราคา' : 'วันครบกำหนดชำระเงิน';
      const err = new Error(`${label} ต้องไม่น้อยกว่า 15 วันนับจากวันที่ออกเอกสาร`);
      err.status = 400;
      throw err;
    }
  }
}

export function assertItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const err = new Error('เอกสารต้องมีรายการอย่างน้อย 1 รายการ');
    err.status = 400;
    throw err;
  }

  for (const item of items) {
    if (!item.description) {
      const err = new Error('ทุกรายการต้องมีรายละเอียด');
      err.status = 400;
      throw err;
    }
    if (Number(item.qty) <= 0) {
      const err = new Error('จำนวนต้องมากกว่า 0');
      err.status = 400;
      throw err;
    }
    if (Number(item.unit_price) < 0) {
      const err = new Error('ราคาต่อหน่วยต้องไม่ติดลบ');
      err.status = 400;
      throw err;
    }
  }
}

function daysBetween(start, end) {
  const a = new Date(start);
  const b = new Date(end);
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}
