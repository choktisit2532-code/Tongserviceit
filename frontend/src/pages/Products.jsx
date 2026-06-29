import { useEffect, useState } from 'react';
import { api } from '../services/api';

const emptyForm = {
  name: '',
  description: '',
  unit: 'รายการ',
  price: 0,
  stock_qty: 0
};

export default function Products({ showToast }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    try {
      setProducts(await api.listProducts());
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.createProduct(form);
      setForm(emptyForm);
      await load();
      showToast('บันทึกสินค้า/บริการแล้ว', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>คลังสินค้า</h1>
          <p>เก็บรายการสินค้าและบริการสำหรับออกเอกสาร</p>
        </div>
      </div>

      <div className="split">
        <form className="card form-grid" onSubmit={submit}>
          <h2>เพิ่มสินค้า/บริการ</h2>
          <input placeholder="ชื่อสินค้า/บริการ" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <textarea placeholder="รายละเอียด" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <input placeholder="หน่วย" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <input type="number" min="0" step="0.01" placeholder="ราคา" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input type="number" min="0" step="0.01" placeholder="จำนวนคงเหลือ" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
          <button className="primary">บันทึก</button>
        </form>

        <div className="card">
          <h2>รายการสินค้า/บริการ</h2>
          <table>
            <thead><tr><th>ชื่อ</th><th>หน่วย</th><th>ราคา</th><th>คงเหลือ</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.unit}</td>
                  <td>{Number(p.price).toLocaleString('th-TH')}</td>
                  <td>{Number(p.stock_qty).toLocaleString('th-TH')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
