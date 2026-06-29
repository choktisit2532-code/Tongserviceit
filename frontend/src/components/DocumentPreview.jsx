import { formatThaiDate } from '../utils/date';
import { printDocument } from '../utils/print';

const labels = {
  QT: 'ใบเสนอราคา',
  IN: 'ใบแจ้งหนี้',
  BN: 'ใบวางบิล',
  RC: 'ใบเสร็จรับเงิน',
  DO: 'ใบส่งของ'
};

function money(value) {
  return Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DocumentPreview({ document, settings }) {
  if (!document) {
    return (
      <div className="card">
        <h2>Preview เอกสาร</h2>
        <p className="muted">เลือกหรือสร้างเอกสารเพื่อดูตัวอย่าง</p>
      </div>
    );
  }

  const customer = document.customer_snapshot || document.customers || {};
  const documentSettings = document.shop_snapshot || settings || {};
  const items = document.document_items || [];
  const showPaymentBox = ['IN', 'BN'].includes(document.doc_type) && ['private', 'government'].includes(document.customer_type);
  const bankName = document.customer_type === 'government' ? 'ธนาคารกรุงไทย (KTB)' : 'ธนาคารไทยพาณิชย์ (SCB)';
  const bankAccount = document.customer_type === 'government' ? documentSettings?.ktb_account : documentSettings?.scb_account;
  const showCustomerSignature = ['BN', 'DO'].includes(document.doc_type);

  return (
    <section>
      <div className="toolbar no-print">
        <button className="primary" onClick={printDocument}>พิมพ์ A4</button>
      </div>

      <div className="print-document card document-paper">
        <header className="doc-header">
          <div>
            <h1>{documentSettings?.shop_name || 'ต้อง เซอร์วิส ไอที'}</h1>
            <p>{documentSettings?.address || '-'}</p>
            <p>โทร: {documentSettings?.phone || '-'} | อีเมล: {documentSettings?.email || '-'}</p>
            <p>เลขประจำตัวผู้เสียภาษี: {documentSettings?.tax_id || '-'}</p>
          </div>
          <div className="doc-title">
            <h2>{labels[document.doc_type] || document.doc_type}</h2>
            <p>เลขที่: <strong>{document.doc_no}</strong></p>
            <p>วันที่: {formatThaiDate(document.doc_date)}</p>
            {document.due_date && <p>กำหนด: {formatThaiDate(document.due_date)}</p>}
          </div>
        </header>

        <section className="doc-customer">
          <h3>ข้อมูลลูกค้า</h3>
          <p><strong>{customer.name || '-'}</strong></p>
          <p>{customer.address || '-'}</p>
          <p>โทร: {customer.phone || '-'} | เลขภาษี: {customer.tax_id || '-'}</p>
        </section>

        <table className="doc-table">
          <thead>
            <tr>
              <th>รายการ</th>
              <th>จำนวน</th>
              <th>ราคา/หน่วย</th>
              <th>รวม</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id || item.description}>
                <td>{item.description}</td>
                <td className="right">{money(item.qty)}</td>
                <td className="right">{money(item.unit_price)}</td>
                <td className="right">{money(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="doc-summary">
          <div>
            <p><strong>หมายเหตุ:</strong> {document.note || '-'}</p>
            {showPaymentBox && (
              <div className="payment-box">
                <h3>ช่องทางชำระเงิน</h3>
                <p>{bankName}</p>
                <p>เลขบัญชี: {bankAccount || '-'}</p>
              </div>
            )}
          </div>

          <div className="totals">
            <p><span>ยอดรวม</span><strong>{money(document.subtotal)}</strong></p>
            <p><span>หัก ณ ที่จ่าย</span><strong>{money(document.withholding_tax)}</strong></p>
            <p><span>ค่าธรรมเนียมโอน</span><strong>{money(document.transfer_fee)}</strong></p>
            <p className="grand"><span>ยอดสุทธิ</span><strong>{money(document.net_total)}</strong></p>
          </div>
        </div>

        <footer className={`signature-grid ${showCustomerSignature ? 'two' : 'one'}`}>
          {showCustomerSignature && (
            <div>
              <div className="sig-line"></div>
              <p>ผู้รับบิล/ผู้รับของ</p>
            </div>
          )}
          <div>
            <div className="sig-line"></div>
            <p>ผู้มีอำนาจลงนาม/ร้านค้า</p>
          </div>
        </footer>
      </div>
    </section>
  );
}
