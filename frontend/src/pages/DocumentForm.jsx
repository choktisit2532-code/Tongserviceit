import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { addDaysISO, toISODate } from '../utils/date';
import DocumentPreview from '../components/DocumentPreview.jsx';

const docLabels = {
  QT: 'ใบเสนอราคา',
  IN: 'ใบแจ้งหนี้',
  BN: 'ใบวางบิล',
  RC: 'ใบเสร็จรับเงิน',
  DO: 'ใบส่งของ'
};

const allowedByType = {
  general: ['QT', 'RC'],
  private: ['QT', 'IN', 'BN', 'RC', 'DO'],
  government: ['QT', 'RC', 'DO']
};

function blankItem() {
  return { product_id: '', description: '', qty: 1, unit_price: 0 };
}

export default function DocumentForm({ settings, showToast }) {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [created, setCreated] = useState(null);

  const [form, setForm] = useState({
    doc_type: 'QT',
    doc_date: toISODate(),
    due_date: addDaysISO(new Date(), 15),
    customer_id: '',
    source_doc_ids: [],
    note: '',
    items: [blankItem()]
  });

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === form.customer_id),
    [customers, form.customer_id]
  );

  const allowedDocs = selectedCustomer ? allowedByType[selectedCustomer.customer_type] : ['QT'];

  useEffect(() => {
    Promise.all([api.listCustomers(), api.listProducts(), api.listDocuments()])
      .then(([cs, ps, ds]) => {
        setCustomers(cs);
        setProducts(ps);
        setDocuments(ds);
      })
      .catch((err) => showToast(err.message, 'error'));
  }, []);

  useEffect(() => {
    if (!allowedDocs.includes(form.doc_type)) {
      setForm((prev) => ({ ...prev, doc_type: allowedDocs[0] || 'QT' }));
    }
  }, [selectedCustomer?.id]);

  const sourceOptions = documents.filter((doc) => {
    if (!selectedCustomer || doc.customer_id !== selectedCustomer.id) return false;
    if (form.doc_type === 'RC') {
      if (selectedCustomer.customer_type === 'general') return doc.doc_type === 'QT';
      if (selectedCustomer.customer_type === 'government') return doc.doc_type === 'QT';
      return ['QT', 'IN', 'BN'].includes(doc.doc_type);
    }
    if (['IN', 'BN', 'DO'].includes(form.doc_type)) return doc.doc_type === 'QT' || doc.doc_type === 'IN';
    return false;
  });

  function updateItem(index, key, value) {
    setForm((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [key]: value };

      if (key === 'product_id') {
        const product = products.find((p) => p.id === value);
        if (product) {
          items[index].description = product.description || product.name;
          items[index].unit_price = product.price;
        }
      }

      return { ...prev, items };
    });
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, blankItem()] }));
  }

  async function submit(e) {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        source_doc_ids: Array.from(form.source_doc_ids || []),
        items: form.items.map((item) => ({
          ...item,
          qty: Number(item.qty),
          unit_price: Number(item.unit_price)
        }))
      };
      const saved = await api.createDocument(payload);
      setCreated(saved);
      setDocuments(await api.listDocuments());
      showToast(`สร้างเอกสาร ${saved.doc_no} แล้ว`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <section>
      <div className="page-title">
        <div>
          <h1>ออกเอกสาร</h1>
          <p>สร้าง QT, IN, BN, RC และ DO ตามกฎประเภทลูกค้า</p>
        </div>
      </div>

      <div className="split wide">
        <form className="card form-grid" onSubmit={submit}>
          <h2>รายละเอียดเอกสาร</h2>

          <label>ลูกค้า</label>
          <select value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })} required>
            <option value="">-- เลือกลูกค้า --</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.customer_type})</option>)}
          </select>

          <label>ประเภทเอกสาร</label>
          <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}>
            {allowedDocs.map((d) => <option key={d} value={d}>{d} - {docLabels[d]}</option>)}
          </select>

          <label>วันที่เอกสาร</label>
          <input type="date" value={form.doc_date} onChange={(e) => setForm({ ...form, doc_date: e.target.value })} />

          {['QT', 'BN', 'IN'].includes(form.doc_type) && (
            <>
              <label>{form.doc_type === 'QT' ? 'วันหมดอายุใบเสนอราคา' : 'วันครบกำหนดชำระเงิน'}</label>
              <input type="date" value={form.due_date || ''} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </>
          )}

          {sourceOptions.length > 0 && (
            <>
              <label>เอกสารต้นทาง</label>
              <select
                multiple
                value={form.source_doc_ids}
                onChange={(e) => setForm({ ...form, source_doc_ids: Array.from(e.target.selectedOptions, (o) => o.value) })}
              >
                {sourceOptions.map((d) => <option key={d.id} value={d.id}>{d.doc_no} - {d.doc_type} - {d.status}</option>)}
              </select>
              <small>กด Ctrl/Cmd เพื่อเลือกหลายรายการ</small>
            </>
          )}

          <label>รายการ</label>
          <div className="items-box">
            {form.items.map((item, index) => (
              <div className="item-row" key={index}>
                <select value={item.product_id} onChange={(e) => updateItem(index, 'product_id', e.target.value)}>
                  <option value="">เลือกสินค้า/บริการ</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input placeholder="รายละเอียด" value={item.description} onChange={(e) => updateItem(index, 'description', e.target.value)} required />
                <input type="number" min="0.01" step="0.01" value={item.qty} onChange={(e) => updateItem(index, 'qty', e.target.value)} />
                <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', e.target.value)} />
              </div>
            ))}
            <button type="button" onClick={addItem}>+ เพิ่มรายการ</button>
          </div>

          <textarea placeholder="หมายเหตุ" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />

          <button className="primary">สร้างเอกสาร</button>
        </form>

        <DocumentPreview document={created} settings={settings} />
      </div>
    </section>
  );
}
