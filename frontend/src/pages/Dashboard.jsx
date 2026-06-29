import { useEffect, useState } from 'react';
import { api } from '../services/api';

function money(value) {
  return Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Dashboard({ showToast, setActivePage }) {
  const now = new Date();
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.getMonthlyReport({ month: String(now.getMonth() + 1).padStart(2, '0'), year: now.getFullYear() })
      .then(setReport)
      .catch((err) => showToast(err.message, 'error'));
  }, []);

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>Dashboard</h1>
          <p>ภาพรวมรายได้จากใบเสร็จรับเงินประจำเดือน</p>
        </div>
        <button className="primary" onClick={() => setActivePage('create')}>+ ออกเอกสาร</button>
      </div>

      <div className="summary-grid">
        <div className="card metric"><span>ยอดขายสะสม</span><strong>฿{money(report?.summary?.total_sales)}</strong></div>
        <div className="card metric"><span>หัก ณ ที่จ่าย</span><strong>฿{money(report?.summary?.total_withholding_tax)}</strong></div>
        <div className="card metric"><span>ค่าธรรมเนียม</span><strong>฿{money(report?.summary?.total_transfer_fee)}</strong></div>
        <div className="card metric"><span>ยอดโอนสุทธิ</span><strong>฿{money(report?.summary?.total_net_transfer)}</strong></div>
      </div>

      <div className="card">
        <h2>สถานะระบบ</h2>
        <p className="muted">Frontend ใช้ Vercel, Backend ใช้ Render, Database ใช้ Supabase PostgreSQL</p>
      </div>
    </section>
  );
}
