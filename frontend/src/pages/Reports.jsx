import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { printReport } from '../utils/print';
import { formatThaiDate } from '../utils/date';

function money(value) {
  return Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Reports({ showToast }) {
  const now = new Date();
  const [filter, setFilter] = useState({
    month: String(now.getMonth() + 1).padStart(2, '0'),
    year: String(now.getFullYear()),
    customer_type: '',
    doc_type: '',
    status: ''
  });
  const [report, setReport] = useState(null);

  async function load() {
    try {
      setReport(await api.getMonthlyReport(filter));
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="report-page">
      <div className="page-title">
        <div>
          <h1>รายงานการเงิน</h1>
          <p>คำนวณจากใบเสร็จรับเงิน RC ที่ไม่ถูกยกเลิก</p>
        </div>
        <button className="primary no-print" onClick={printReport}>สั่งพิมพ์รายงาน</button>
      </div>

      <div className="card filters no-print">
        <div className="filter-row">
          <input placeholder="เดือน" value={filter.month} onChange={(e) => setFilter({ ...filter, month: e.target.value })} />
          <input placeholder="ปี ค.ศ." value={filter.year} onChange={(e) => setFilter({ ...filter, year: e.target.value })} />
          <select value={filter.customer_type} onChange={(e) => setFilter({ ...filter, customer_type: e.target.value })}>
            <option value="">ทุกประเภทลูกค้า</option>
            <option value="general">ทั่วไป</option>
            <option value="private">เอกชน</option>
            <option value="government">หน่วยงานรัฐ</option>
          </select>
          <button onClick={load}>ค้นหา</button>
        </div>
      </div>

      <div className="report-print-area">
        <h2>รายงานสรุปการเงิน เดือน {filter.month}/{Number(filter.year) + 543}</h2>

        <div className="summary-grid report-summary">
          <div className="card report-card metric"><span>ยอดขายสะสม</span><strong>฿{money(report?.summary?.total_sales)}</strong></div>
          <div className="card report-card metric"><span>หัก ณ ที่จ่าย</span><strong>฿{money(report?.summary?.total_withholding_tax)}</strong></div>
          <div className="card report-card metric"><span>ค่าธรรมเนียม</span><strong>฿{money(report?.summary?.total_transfer_fee)}</strong></div>
          <div className="card report-card metric"><span>ยอดโอนสุทธิ</span><strong>฿{money(report?.summary?.total_net_transfer)}</strong></div>
        </div>

        <div className="card report-table-card">
          <table>
            <thead>
              <tr>
                <th>วันที่</th><th>เลขเอกสาร</th><th>ลูกค้า</th><th>ยอดขาย</th><th>WHT</th><th>Fee</th><th>สุทธิ</th>
              </tr>
            </thead>
            <tbody>
              {(report?.rows || []).map((d) => (
                <tr key={d.id}>
                  <td>{formatThaiDate(d.doc_date)}</td>
                  <td>{d.doc_no}</td>
                  <td>{d.customers?.name || '-'}</td>
                  <td>{money(d.subtotal)}</td>
                  <td>{money(d.withholding_tax)}</td>
                  <td>{money(d.transfer_fee)}</td>
                  <td>{money(d.net_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
