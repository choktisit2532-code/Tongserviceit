import './style.css';
import { api } from './api.js';

const labels = { QT: 'ใบเสนอราคา', IN: 'ใบแจ้งหนี้', BN: 'ใบวางบิล', RC: 'ใบเสร็จรับเงิน', DO: 'ใบส่งของ' };
const state = { type: 'QT', settings: {}, customers: [], items: [{ name: '', quantity: 1, price: 0 }] };

const app = document.querySelector('#app');
app.innerHTML = `
<div class="layout no-print">
  <aside class="sidebar">
    <div><span class="eyebrow">TONG SERVICE IT</span><h1>Billing</h1></div>
    <nav>${Object.entries(labels).map(([key, label]) => `<button class="nav-button" data-type="${key}">${label}<small>${key}</small></button>`).join('')}</nav>
    <button id="theme" class="secondary">สลับโหมดสี</button>
  </aside>
  <main class="workspace">
    <header><div><span class="eyebrow">DOCUMENT CREATOR</span><h2 id="page-title">ใบเสนอราคา</h2></div><button id="print" class="secondary fit">พิมพ์เอกสาร</button></header>
    <section class="panel form-grid">
      <label>วันที่เอกสาร<input id="date" type="date"></label>
      <label>ลูกค้า<select id="customer"></select></label>
      <label>เลขที่เอกสาร<input id="number" readonly></label>
      <label>หมายเหตุ<input id="remarks" placeholder="รายละเอียดเพิ่มเติม"></label>
    </section>
    <section class="panel"><div class="section-head"><h3>รายการสินค้า/บริการ</h3><button id="add-item" class="secondary fit">+ เพิ่มรายการ</button></div><div id="items"></div></section>
    <section class="actions"><div id="message"></div><button id="save">บันทึกเอกสาร</button></section>
  </main>
</div>
<article class="paper" id="paper">
  <header class="paper-header"><div><h1 id="shop-name">ต้อง เซอร์วิส ไอที</h1><p id="shop-address"></p></div><div class="doc-meta"><h2 id="print-type">ใบเสนอราคา</h2><p>เลขที่ <strong id="print-number">-</strong></p><p>วันที่ <span id="print-date">-</span></p></div></header>
  <section class="customer-box"><strong>ลูกค้า</strong><div id="print-customer">-</div></section>
  <table><thead><tr><th>#</th><th>รายการ</th><th>จำนวน</th><th>ราคา/หน่วย</th><th>รวม</th></tr></thead><tbody id="print-items"></tbody></table>
  <div class="total"><span>ยอดรวมสุทธิ</span><strong id="grand-total">0.00 บาท</strong></div>
  <div id="payment-box" class="note hidden"><strong>รายละเอียดการโอนเงิน</strong><p id="bank-details"></p></div>
  <div id="signature-box" class="signature hidden">ลงชื่อผู้รับสินค้า<br><br><br>(................................................)</div>
</article>`;

const el = id => document.getElementById(id);
const money = value => Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function renderItems() {
  el('items').innerHTML = state.items.map((item, index) => `
    <div class="item-row">
      <input data-index="${index}" data-field="name" value="${item.name}" placeholder="ชื่อรายการ">
      <input data-index="${index}" data-field="quantity" type="number" min="0.01" step="0.01" value="${item.quantity}">
      <input data-index="${index}" data-field="price" type="number" min="0" step="0.01" value="${item.price}">
      <button data-remove="${index}" class="danger fit">ลบ</button>
    </div>`).join('');

  el('print-items').innerHTML = state.items.map((item, i) => `<tr><td>${i + 1}</td><td>${item.name || '-'}</td><td>${money(item.quantity)}</td><td>${money(item.price)}</td><td>${money(item.quantity * item.price)}</td></tr>`).join('');
  const total = state.items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0);
  el('grand-total').textContent = `${money(total)} บาท`;
}

function applyRules() {
  const customer = state.customers.find(c => c.id === el('customer').value);
  el('print-customer').textContent = customer ? `${customer.name} — ${customer.address}` : '-';
  const showPayment = ['IN', 'BN'].includes(state.type) && ['private', 'government'].includes(customer?.type);
  el('payment-box').classList.toggle('hidden', !showPayment);
  el('signature-box').classList.toggle('hidden', !['BN', 'DO'].includes(state.type));
  el('bank-details').textContent = customer?.type === 'government' ? state.settings.ktb_bank_details : state.settings.scb_bank_details;
}

async function refreshNumber() {
  const result = await api(`/documents/next-number?type=${state.type}&date=${el('date').value}`);
  el('number').value = result.number;
  el('print-number').textContent = result.number;
}

async function setType(type) {
  state.type = type;
  document.querySelectorAll('[data-type]').forEach(button => button.classList.toggle('active', button.dataset.type === type));
  el('page-title').textContent = labels[type];
  el('print-type').textContent = labels[type];
  await refreshNumber();
  applyRules();
}

async function init() {
  el('date').value = new Date().toISOString().slice(0, 10);
  try {
    [state.settings, state.customers] = await Promise.all([api('/settings'), api('/customers')]);
    el('shop-name').textContent = state.settings.shop_name_th || 'Tong Service IT';
    el('shop-address').textContent = `${state.settings.shop_address || ''} ${state.settings.shop_phone || ''}`;
    el('customer').innerHTML = state.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    renderItems();
    await setType('QT');
    applyRules();
  } catch (error) { el('message').textContent = error.message; }
}

document.addEventListener('click', async event => {
  const type = event.target.closest('[data-type]')?.dataset.type;
  if (type) await setType(type);
  if (event.target.id === 'add-item') { state.items.push({ name: '', quantity: 1, price: 0 }); renderItems(); }
  const remove = event.target.dataset.remove;
  if (remove !== undefined) { state.items.splice(Number(remove), 1); if (!state.items.length) state.items.push({ name: '', quantity: 1, price: 0 }); renderItems(); }
  if (event.target.id === 'theme') document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  if (event.target.id === 'print') window.print();
  if (event.target.id === 'save') {
    try {
      el('message').textContent = 'กำลังบันทึก...';
      const result = await api('/documents', { method: 'POST', body: JSON.stringify({ type: state.type, date: el('date').value, customer_id: el('customer').value, remarks: el('remarks').value, items: state.items }) });
      el('message').textContent = `บันทึกสำเร็จ: ${result.number}`;
      await refreshNumber();
    } catch (error) { el('message').textContent = error.message; }
  }
});

document.addEventListener('input', event => {
  if (event.target.dataset.index !== undefined) {
    const item = state.items[Number(event.target.dataset.index)];
    item[event.target.dataset.field] = ['quantity', 'price'].includes(event.target.dataset.field) ? Number(event.target.value) : event.target.value;
    renderItems();
  }
  if (event.target.id === 'date') { el('print-date').textContent = event.target.value; refreshNumber().catch(console.error); }
});
el('customer').addEventListener('change', applyRules);
init();
