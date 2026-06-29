import { useEffect, useState } from 'react';
import { api } from '../services/api';

const emptySettings = {
  shop_name: 'ต้อง เซอร์วิส ไอที',
  address: '',
  phone: '',
  email: '',
  tax_id: '',
  scb_account: '',
  ktb_account: ''
};

export default function Settings({ settings, setSettings, showToast }) {
  const [form, setForm] = useState(emptySettings);

  useEffect(() => {
    if (settings) setForm({ ...emptySettings, ...settings });
  }, [settings]);

  async function submit(e) {
    e.preventDefault();
    try {
      const saved = await api.updateSettings(form);
      setSettings(saved);
      showToast('บันทึกข้อมูลร้านค้าแล้ว', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function exportJson() {
    try {
      const blob = await api.exportBackup();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tong-service-it-backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function importJson(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Import อาจเขียนทับข้อมูลเดิม ต้องการดำเนินการต่อหรือไม่?')) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await api.importBackup(payload);
      showToast('Import ข้อมูลสำเร็จ', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>ตั้งค่าร้านค้า</h1>
          <p>ข้อมูลนี้จะถูกแสดงบนเอกสารพิมพ์ A4</p>
        </div>
      </div>

      <div className="split">
        <form className="card form-grid" onSubmit={submit}>
          <h2>ข้อมูลร้านค้า</h2>
          <input placeholder="ชื่อร้าน" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} />
          <textarea placeholder="ที่อยู่" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <input placeholder="โทร" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="อีเมล" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="เลขประจำตัวผู้เสียภาษี" value={form.tax_id || ''} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
          <input placeholder="SCB Account" value={form.scb_account || ''} onChange={(e) => setForm({ ...form, scb_account: e.target.value })} />
          <input placeholder="KTB Account" value={form.ktb_account || ''} onChange={(e) => setForm({ ...form, ktb_account: e.target.value })} />
          <button className="primary">บันทึก</button>
        </form>

        <div className="card">
          <h2>สำรองข้อมูล JSON</h2>
          <p className="muted">Export/Import จากฐานข้อมูล Supabase ไม่ใช่ LocalStorage</p>
          <button className="primary" onClick={exportJson}>Export JSON</button>
          <label className="import-label">
            Import JSON
            <input type="file" accept=".json,application/json" onChange={importJson} />
          </label>
        </div>
      </div>
    </section>
  );
}
