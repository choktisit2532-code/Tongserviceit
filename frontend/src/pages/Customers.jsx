import { useEffect, useState } from 'react';
import { api } from '../services/api';

const emptyForm = {
  name: '',
  customer_type: 'general',
  phone: '',
  email: '',
  address: '',
  tax_id: ''
};

export default function Customers({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try {
      setCustomers(await api.listCustomers());
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.createCustomer(form);
      setForm(emptyForm);
      await load();
      showToast('บันทึกลูกค้าแล้ว', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>ข้อมูลลูกค้า</h1>
          <p>จัดการลูกค้าทั่วไป เอกชน และหน่วยงานรัฐ</p>
        </div>
      </div>

      <div className="split">
        <form className="card form-grid" onSubmit={submit}>
          <h2>เพิ่มลูกค้า</h2>
          <input placeholder="ชื่อลูกค้า" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select value={form.customer_type} onChange={(e) => setForm({ ...form, customer_type: e.target.value })}>
            <option value="general">ทั่วไป</option>
            <option value="private">เอกชน</option>
            <option value="government">หน่วยงานรัฐ</option>
          </select>
          <input placeholder="เบอร์โทร" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="อีเมล" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input placeholder="เลขประจำตัวผู้เสียภาษี" value={form.tax_id} onChange={(e) => setForm({ ...form, tax_id: e.target.value })} />
          <textarea placeholder="ที่อยู่" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <button className="primary">บันทึก</button>
        </form>

        <div className="card">
          <h2>รายการลูกค้า</h2>
          <table>
            <thead><tr><th>ชื่อ</th><th>ประเภท</th><th>โทร</th></tr></thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.customer_type}</td>
                  <td>{c.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
