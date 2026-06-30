import { request, getToken, clearToken, API_BASE_URL } from './api.js';
import { initTheme } from './theme.js';
import {
  DOC_LABELS, STATUS_LABELS, CUSTOMER_TYPE_LABELS, ITEM_TYPE_LABELS,
  ROLE_LABELS, money, dateThai, today, currentMonth, escapeHtml,
  initials, debounce, validatePublicImageUrl, testPublicImageUrl, setImageSource
} from './utils.js';

initTheme();

if (!getToken()) location.replace('./index.html');

const state = {
  user: null,
  settings: null,
  customers: [],
  products: [],
  currentView: 'dashboard',
  dashboardAnalytics: null,
  reportChartData: null,
  editingDocumentId: null,
  documentsTrashMode: false,
  customerStatus: 'active',
  productStatus: 'active'
};
const chartInstances = new Map();
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function getPasswordRequirements(password) {
  const value = String(password || '');
  return {
    length: value.length >= 8,
    uppercase: /[A-Z]/.test(value),
    lowercase: /[a-z]/.test(value),
    number: /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
    allowed: /^[\x21-\x7E]*$/.test(value)
  };
}

function validatePassword(password) {
  const value = String(password || '');
  if (!value) return 'กรุณากรอกรหัสผ่าน';
  if (value.length < 8) return 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร';
  if (value.length > 72) return 'รหัสผ่านต้องไม่เกิน 72 ตัวอักษร';
  if (!/^[\x21-\x7E]+$/.test(value)) return 'รหัสผ่านต้องใช้เฉพาะภาษาอังกฤษ ตัวเลข และอักขระพิเศษ โดยห้ามมีช่องว่าง';
  if (!/[A-Z]/.test(value)) return 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษพิมพ์ใหญ่อย่างน้อย 1 ตัว';
  if (!/[a-z]/.test(value)) return 'รหัสผ่านต้องมีตัวอักษรภาษาอังกฤษพิมพ์เล็กอย่างน้อย 1 ตัว';
  if (!/[0-9]/.test(value)) return 'รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว';
  if (!/[^A-Za-z0-9]/.test(value)) return 'รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว';
  return '';
}

function renderPasswordRequirements(password, markInvalid = false) {
  const rules = getPasswordRequirements(password);
  Object.entries(rules).forEach(([rule, valid]) => {
    const item = document.querySelector(`[data-rule="${rule}"]`);
    if (!item) return;
    item.classList.toggle('is-valid', valid);
    item.classList.toggle('is-invalid', markInvalid && !valid);
  });
  return rules;
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function cssValue(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function chartTheme() {
  return {
    text: cssValue('--text-soft') || '#64748b',
    muted: cssValue('--muted') || '#94a3b8',
    border: cssValue('--border') || '#cbd5e1',
    surface: cssValue('--surface') || '#ffffff'
  };
}

function destroyChart(id) {
  const chart = chartInstances.get(id);
  if (chart) chart.destroy();
  chartInstances.delete(id);
}

function setChartEmpty(id, empty) {
  const canvas = document.getElementById(id);
  const emptyState = document.querySelector(`[data-chart-empty="${id}"]`);
  if (canvas) canvas.classList.toggle('hidden', empty);
  if (emptyState) emptyState.classList.toggle('hidden', !empty);
}

function createChart(id, configuration, hasData = true) {
  destroyChart(id);
  if (!window.Chart) {
    const emptyState = document.querySelector(`[data-chart-empty="${id}"]`);
    if (emptyState) emptyState.textContent = 'โหลดระบบกราฟไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า';
    setChartEmpty(id, true);
    return null;
  }
  setChartEmpty(id, !hasData);
  if (!hasData) return null;
  const canvas = document.getElementById(id);
  if (!canvas) return null;
  const chart = new window.Chart(canvas, configuration);
  chartInstances.set(id, chart);
  return chart;
}

function monthLabel(value) {
  const [year, month] = String(value || '').split('-').map(Number);
  if (!year || !month) return value || '-';
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat('th-TH', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(date);
}

function baseChartOptions({ horizontal = false, showLegend = true, moneyAxis = true } = {}) {
  const theme = chartTheme();
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: showLegend,
        labels: { color: theme.text, usePointStyle: true, boxWidth: 9, padding: 16 }
      },
      tooltip: {
        callbacks: moneyAxis ? {
          label(context) {
            const label = context.dataset.label ? `${context.dataset.label}: ` : '';
            return `${label}${money(context.parsed[horizontal ? 'x' : 'y'] ?? context.raw)}`;
          }
        } : undefined
      }
    },
    scales: {
      x: {
        grid: { color: horizontal ? 'transparent' : theme.border },
        ticks: {
          color: theme.muted,
          callback: horizontal && moneyAxis ? (value) => new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value) : undefined
        }
      },
      y: {
        beginAtZero: true,
        grid: { color: horizontal ? theme.border : theme.border },
        ticks: {
          color: theme.muted,
          callback: !horizontal && moneyAxis ? (value) => new Intl.NumberFormat('th-TH', { notation: 'compact' }).format(value) : undefined
        }
      }
    }
  };
}

function renderDashboardCharts(analytics = state.dashboardAnalytics) {
  if (!analytics) return;
  state.dashboardAnalytics = analytics;
  const trend = analytics.revenue_trend || [];
  const trendHasData = trend.some((row) => Number(row.received_total) > 0 || Number(row.product_total) > 0 || Number(row.service_total) > 0);
  createChart('revenue-trend-chart', {
    type: 'line',
    data: {
      labels: trend.map((row) => monthLabel(row.month)),
      datasets: [
        { label: 'สินค้า/อะไหล่', data: trend.map((row) => Number(row.product_total)), borderColor: '#4f8dd6', backgroundColor: 'rgba(79,141,214,.14)', tension: .28, fill: false },
        { label: 'ค่าแรง/บริการ', data: trend.map((row) => Number(row.service_total)), borderColor: '#8b68c8', backgroundColor: 'rgba(139,104,200,.14)', tension: .28, fill: false },
        { label: 'ยอดรับสุทธิ', data: trend.map((row) => Number(row.received_total)), borderColor: '#36a269', backgroundColor: 'rgba(54,162,105,.12)', tension: .28, borderWidth: 3, fill: true }
      ]
    },
    options: baseChartOptions()
  }, trendHasData);

  const mix = analytics.revenue_mix || {};
  const mixValues = [Number(mix.product_total || 0), Number(mix.service_total || 0), Number(mix.other_total || 0)];
  createChart('revenue-mix-chart', {
    type: 'doughnut',
    data: {
      labels: ['สินค้า/อะไหล่', 'ค่าแรง/บริการ', 'อื่น ๆ'],
      datasets: [{ data: mixValues, backgroundColor: ['#4f8dd6','#8b68c8','#d8842f'], borderWidth: 2, borderColor: chartTheme().surface }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '64%',
      plugins: {
        legend: { position: 'bottom', labels: { color: chartTheme().text, usePointStyle: true, padding: 15 } },
        tooltip: { callbacks: { label: (context) => `${context.label}: ${money(context.raw)}` } }
      }
    }
  }, mixValues.some((value) => value > 0));

  const aging = analytics.receivables_aging || [];
  const agingMap = Object.fromEntries(aging.map((row) => [row.bucket, Number(row.total || 0)]));
  const agingValues = [agingMap.not_due || 0, agingMap.days_1_30 || 0, agingMap.days_31_60 || 0, agingMap.days_61_plus || 0];
  createChart('receivables-aging-chart', {
    type: 'bar',
    data: {
      labels: ['ยังไม่ครบกำหนด', 'เกิน 1–30 วัน', 'เกิน 31–60 วัน', 'เกิน 61 วัน'],
      datasets: [{ label: 'ยอดลูกหนี้', data: agingValues, backgroundColor: ['#4f8dd6','#e0a12f','#d8842f','#d65353'], borderRadius: 8 }]
    },
    options: baseChartOptions({ showLegend: false })
  }, agingValues.some((value) => value > 0));

  const topCustomers = analytics.top_customers || [];
  createChart('top-customers-chart', {
    type: 'bar',
    data: {
      labels: topCustomers.map((row) => row.name),
      datasets: [{ label: 'ยอดรับสุทธิ', data: topCustomers.map((row) => Number(row.total)), backgroundColor: '#36a269', borderRadius: 8 }]
    },
    options: baseChartOptions({ horizontal: true, showLegend: false })
  }, topCustomers.some((row) => Number(row.total) > 0));

  const topServices = analytics.top_services || [];
  createChart('top-services-chart', {
    type: 'bar',
    data: {
      labels: topServices.map((row) => row.description),
      datasets: [{ label: 'รายได้จากบริการ', data: topServices.map((row) => Number(row.total)), backgroundColor: '#8b68c8', borderRadius: 8 }]
    },
    options: baseChartOptions({ horizontal: true, showLegend: false })
  }, topServices.some((row) => Number(row.total) > 0));

  const insights = analytics.insights || {};
  $('#insight-receipt-count').textContent = `${Number(insights.receipt_count || 0).toLocaleString('th-TH')} ฉบับ`;
  $('#insight-average-receipt').textContent = money(insights.average_receipt || 0);
  $('#insight-conversion-rate').textContent = `${Number(insights.quotation_conversion_rate || 0).toLocaleString('th-TH', { maximumFractionDigits: 1 })}%`;
  $('#insight-top-customer').textContent = insights.top_customer || '-';
}

function renderReportCharts(data = state.reportChartData) {
  if (!data) return;
  state.reportChartData = data;
  const summary = data.summary || {};
  const mixValues = [Number(summary.product_total || 0), Number(summary.service_total || 0), Math.max(0, Number(summary.gross_total || 0) - Number(summary.product_total || 0) - Number(summary.service_total || 0))];
  createChart('report-mix-chart', {
    type: 'doughnut',
    data: { labels: ['สินค้า/อะไหล่','ค่าแรง/บริการ','อื่น ๆ'], datasets: [{ data: mixValues, backgroundColor: ['#4f8dd6','#8b68c8','#d8842f'], borderWidth: 2, borderColor: chartTheme().surface }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: { position: 'bottom', labels: { color: chartTheme().text, usePointStyle: true } }, tooltip: { callbacks: { label: (context) => `${context.label}: ${money(context.raw)}` } } } }
  }, mixValues.some((value) => value > 0));

  const counts = Object.fromEntries((data.by_type || []).map((row) => [row.document_type, Number(row.count || 0)]));
  const docValues = ['QT','IN','BN','RC','DO'].map((type) => counts[type] || 0);
  createChart('report-document-chart', {
    type: 'bar',
    data: { labels: ['ใบเสนอราคา','ใบแจ้งหนี้','ใบวางบิล','ใบเสร็จ','ใบส่งสินค้า'], datasets: [{ label: 'จำนวนเอกสาร', data: docValues, backgroundColor: ['#4f8dd6','#d5a13b','#8b68c8','#36a269','#3b9fa3'], borderRadius: 7 }] },
    options: baseChartOptions({ showLegend: false, moneyAxis: false })
  }, docValues.some((value) => value > 0));
}
function dateTimeThai(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return '-';
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
    day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
  }).format(parsed);
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}
function showGlobalError(error) {
  const box = $('#global-alert');
  box.textContent = error.message || String(error);
  box.className = 'alert alert-danger';
  box.classList.remove('hidden');
  setTimeout(() => box.classList.add('hidden'), 7000);
}
function setBusy(button, busy, busyText = 'กำลังบันทึก...') {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.textContent = busyText;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.originalText || button.innerHTML;
    refreshIcons();
  }
}

const viewMeta = {
  dashboard: ['แดชบอร์ดควบคุม', 'ภาพรวมรายได้ เอกสาร และงานค้าง'],
  documents: ['คลังเอกสาร', 'จัดการใบเสนอราคา ใบแจ้งหนี้ ใบวางบิล ใบเสร็จ และใบส่งสินค้า'],
  customers: ['รายชื่อลูกค้า', 'ข้อมูลลูกค้าและกฎการหัก ณ ที่จ่าย'],
  products: ['สินค้าและบริการ', 'คลังรายการมาตรฐาน ค่าแรง อะไหล่ และค่าใช้จ่าย'],
  reports: ['รายงานการเงิน', 'สรุปรายได้สินค้า ค่าแรง ภาษี และยอดรับสุทธิ'],
  settings: ['ตั้งค่าระบบ', 'ข้อมูลร้าน การรับชำระเงิน รูปแบบเอกสาร และผู้ใช้งาน']
};

async function switchView(name) {
  if (name === 'settings' && state.user?.role !== 'admin') return;
  state.currentView = name;
  $$('.view').forEach((el) => el.classList.toggle('active', el.id === `view-${name}`));
  $$('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.view === name));
  $('#page-title').textContent = viewMeta[name][0];
  $('#page-subtitle').textContent = viewMeta[name][1];
  $('#sidebar').classList.remove('open');
  $('#user-menu').classList.add('hidden');

  try {
    if (name === 'dashboard') await loadDashboard();
    if (name === 'documents') await loadDocuments();
    if (name === 'customers') await loadCustomers();
    if (name === 'products') await loadProducts();
    if (name === 'reports') await loadReport();
    if (name === 'settings') await Promise.all([loadSettings(), loadUsers()]);
  } catch (error) { showGlobalError(error); }
}

function applyRole() {
  const isAdmin = state.user.role === 'admin';
  const canWrite = ['admin', 'staff'].includes(state.user.role);
  $$('.admin-only').forEach((el) => el.classList.toggle('hidden', !isAdmin));
  $$('.writer-only').forEach((el) => el.classList.toggle('hidden', !canWrite));
  $('#current-user-name').textContent = state.user.name;
  $('#current-user-role').textContent = ROLE_LABELS[state.user.role];
  $('#user-avatar').textContent = initials(state.user.name);
}

async function loadInitialData() {
  const [me, settings, customers, products] = await Promise.all([
    request('/auth/me'),
    request('/settings'),
    request('/customers?limit=200&page=1'),
    request('/products?limit=200&page=1')
  ]);
  state.user = me.user;
  state.settings = settings.data;
  state.customers = customers.data;
  state.products = products.data;
  applyRole();
  applyBrand();
  renderCustomerOptions();
  ensureProductDatalist();
  await loadDashboard();
}

function applyBrand() {
  $('#sidebar-shop-name').textContent = state.settings?.shop_name_en || state.settings?.shop_name_th || 'Tong Service IT';
  setImageSource($('#sidebar-logo'), state.settings?.logo_url);
}

async function updateImageUrlPreview({ input, preview, status, label }) {
  const value = input.value.trim();
  status.className = 'image-url-status';

  if (!value) {
    setImageSource(preview, '');
    status.textContent = 'ยังไม่ได้กำหนดรูปภาพ ระบบจะใช้รูปเริ่มต้น';
    return true;
  }

  const formatError = validatePublicImageUrl(value, label);
  if (formatError) {
    setImageSource(preview, '');
    status.textContent = formatError;
    status.classList.add('is-error');
    return false;
  }

  status.textContent = 'กำลังตรวจสอบรูปภาพ...';
  status.classList.add('is-loading');
  const loaded = await testPublicImageUrl(value);

  status.className = 'image-url-status';
  if (!loaded) {
    setImageSource(preview, '');
    status.textContent = `${label}: เปิดรูปจาก URL นี้ไม่ได้ กรุณาใช้ลิงก์ไฟล์รูปภาพโดยตรงที่เปิดสาธารณะ`;
    status.classList.add('is-error');
    return false;
  }

  setImageSource(preview, value);
  status.textContent = `${label}: โหลดรูปภาพสำเร็จ`;
  status.classList.add('is-success');
  return true;
}

function imagePreviewOptions(type) {
  const isLogo = type === 'logo';
  return {
    input: $(isLogo ? '#setting-logo-url' : '#setting-signature-url'),
    preview: $(isLogo ? '#setting-logo-preview' : '#setting-signature-preview'),
    status: $(isLogo ? '#setting-logo-status' : '#setting-signature-status'),
    label: isLogo ? 'โลโก้ร้าน' : 'ลายเซ็น'
  };
}


async function loadDashboard() {
  const months = Number($('#dashboard-period')?.value || 6);
  const result = await request(`/dashboard?months=${months}`);
  $('#stat-income').textContent = money(result.stats.monthly_income);
  $('#stat-outstanding').textContent = money(result.stats.outstanding);
  $('#stat-withholding').textContent = money(result.stats.yearly_withholding);
  $('#stat-fee').textContent = money(result.stats.yearly_transfer_fee);

  const overdue = $('#overdue-list');
  if (!result.overdue.length) {
    overdue.className = 'empty-state';
    overdue.innerHTML = '<i data-lucide="badge-check"></i><strong>ไม่มีงานค้าง</strong><span>เอกสารทั้งหมดอยู่ในสถานะปกติ</span>';
  } else {
    overdue.className = '';
    overdue.innerHTML = result.overdue.map((doc) => `
      <div class="overdue-item"><div><strong>${escapeHtml(doc.document_number)}</strong><div>${escapeHtml(doc.customer_name)}</div></div><div><small>ครบกำหนด ${dateThai(doc.due_date)}</small><strong>${money(doc.grand_total)}</strong></div></div>
    `).join('');
  }

  const recent = $('#recent-documents');
  recent.innerHTML = result.recent.length ? result.recent.map((doc) => `
    <tr><td><strong>${escapeHtml(doc.document_number)}</strong></td><td>${escapeHtml(doc.customer_name)}</td><td><span class="type-badge">${DOC_LABELS[doc.document_type]}</span></td><td>${money(doc.grand_total)}</td><td><span class="status-badge status-${doc.status}">${STATUS_LABELS[doc.status]}</span></td></tr>
  `).join('') : '<tr><td colspan="5" class="table-empty">ยังไม่มีเอกสาร</td></tr>';
  renderDashboardCharts(result.analytics);
  refreshIcons();
}

function renderCustomerOptions() {
  const select = $('#doc-customer');
  select.innerHTML = '<option value="">เลือกลูกค้า</option>' + state.customers.filter((c) => c.active).map((c) => `<option value="${c.id}">${escapeHtml(c.name)} · ${CUSTOMER_TYPE_LABELS[c.customer_type]}</option>`).join('');
}

async function loadCustomers(search = '') {
  const status = $('#customer-status-filter')?.value || state.customerStatus || 'active';
  state.customerStatus = status;
  const result = await request(`/customers?limit=200&page=1&status=${status}&search=${encodeURIComponent(search)}`);
  state.customers = result.data;
  $('#customer-count').textContent = `${result.pagination.total} รายการ`;
  $('#customers-table').innerHTML = result.data.length ? result.data.map((c) => {
    const actions = c.active
      ? `${state.user.role !== 'viewer' ? actionIcon({icon:'pencil',title:'แก้ไขลูกค้า',data:{'customer-edit':c.id},className:'action-edit'}) : ''}${state.user.role === 'admin' ? actionIcon({icon:'user-x',title:'ปิดใช้งานลูกค้า',data:{'customer-deactivate':c.id},className:'action-danger'}) : ''}`
      : `${state.user.role === 'admin' ? actionIcon({icon:'rotate-ccw',title:'กู้คืนลูกค้า',data:{'customer-restore':c.id},className:'action-success'}) : ''}`;
    return `<tr class="${c.active ? '' : 'deleted-row'}"><td><strong>${escapeHtml(c.name)}</strong><br><small>${escapeHtml(c.code || '')}</small></td><td>${CUSTOMER_TYPE_LABELS[c.customer_type]}</td><td>${escapeHtml(c.tax_id || '-')}</td><td>${escapeHtml(c.phone || '-')}</td><td>${c.withholding_enabled ? `${Number(c.withholding_rate)}% · ${c.withholding_basis === 'service' ? 'เฉพาะบริการ' : 'ยอดรวม'}` : 'ไม่หัก'}</td><td><span class="status-badge ${c.active ? 'status-PAID' : 'status-CANCELLED'}">${c.active ? 'ใช้งาน' : 'ปิดใช้งาน'}</span></td><td><div class="table-actions">${actions}</div></td></tr>`;
  }).join('') : '<tr><td colspan="7" class="table-empty">ยังไม่มีข้อมูลลูกค้า</td></tr>';
  bindMasterDataButtons(); renderCustomerOptions(); refreshIcons();
}

async function loadProducts(search = '') {
  const status = $('#product-status-filter')?.value || state.productStatus || 'active';
  state.productStatus = status;
  const result = await request(`/products?limit=200&page=1&status=${status}&search=${encodeURIComponent(search)}`);
  state.products = result.data;
  $('#product-count').textContent = `${result.pagination.total} รายการ`;
  $('#products-table').innerHTML = result.data.length ? result.data.map((p) => {
    const actions = p.active
      ? `${state.user.role !== 'viewer' ? actionIcon({icon:'pencil',title:'แก้ไขสินค้า/บริการ',data:{'product-edit':p.id},className:'action-edit'}) : ''}${state.user.role === 'admin' ? actionIcon({icon:'package-x',title:'ปิดใช้งานสินค้า/บริการ',data:{'product-deactivate':p.id},className:'action-danger'}) : ''}`
      : `${state.user.role === 'admin' ? actionIcon({icon:'rotate-ccw',title:'กู้คืนสินค้า/บริการ',data:{'product-restore':p.id},className:'action-success'}) : ''}`;
    return `<tr class="${p.active ? '' : 'deleted-row'}"><td>${escapeHtml(p.sku || '-')}</td><td><strong>${escapeHtml(p.name)}</strong><br><small>${escapeHtml(p.category || '')}</small></td><td>${ITEM_TYPE_LABELS[p.item_type]}</td><td>${escapeHtml(p.unit)}</td><td>${money(p.price)}</td><td><span class="status-badge ${p.active ? 'status-PAID' : 'status-CANCELLED'}">${p.active ? 'ใช้งาน' : 'ปิดใช้งาน'}</span></td><td><div class="table-actions">${actions}</div></td></tr>`;
  }).join('') : '<tr><td colspan="7" class="table-empty">ยังไม่มีสินค้า/บริการ</td></tr>';
  bindMasterDataButtons(); ensureProductDatalist(); refreshIcons();
}

function customerPayload() { return {code:$('#customer-code').value,name:$('#customer-name').value,customer_type:$('#customer-type').value,tax_id:$('#customer-tax-id').value,branch_name:$('#customer-branch').value,address:$('#customer-address').value,phone:$('#customer-phone').value,email:$('#customer-email').value,withholding_enabled:$('#customer-withholding-enabled').checked,withholding_rate:$('#customer-withholding-rate').value,withholding_basis:$('#customer-withholding-basis').value,withholding_threshold:$('#customer-threshold').value,receipt_transfer_fee:$('#customer-transfer-fee').value}; }
function productPayload() { return {sku:$('#product-sku').value,name:$('#product-name').value,item_type:$('#product-type').value,unit:$('#product-unit').value,price:$('#product-price').value,category:$('#product-category').value}; }
function resetCustomerForm(){ $('#customer-form').reset(); $('#customer-edit-id').value=''; $('#customer-form-title').textContent='เพิ่มลูกค้า'; $('#customer-cancel-edit').classList.add('hidden'); $('#customer-type').value='general'; $('#customer-withholding-rate').value='3'; resetCustomerDefaults(); }
function resetProductForm(){ $('#product-form').reset(); $('#product-edit-id').value=''; $('#product-form-title').textContent='เพิ่มสินค้า / บริการ'; $('#product-cancel-edit').classList.add('hidden'); $('#product-unit').value='งาน'; $('#product-price').value='0'; }
function bindMasterDataButtons(){
  $$('[data-customer-edit]').forEach(b=>b.addEventListener('click',async()=>{const {data:c}=await request(`/customers/${b.dataset.customerEdit}`); $('#customer-edit-id').value=c.id; $('#customer-form-title').textContent='แก้ไขลูกค้า'; $('#customer-cancel-edit').classList.remove('hidden'); $('#customer-code').value=c.code||''; $('#customer-name').value=c.name||''; $('#customer-type').value=c.customer_type; $('#customer-tax-id').value=c.tax_id||''; $('#customer-branch').value=c.branch_name||''; $('#customer-address').value=c.address||''; $('#customer-phone').value=c.phone||''; $('#customer-email').value=c.email||''; $('#customer-withholding-enabled').checked=!!c.withholding_enabled; $('#customer-withholding-rate').value=c.withholding_rate; $('#customer-withholding-basis').value=c.withholding_basis; $('#customer-threshold').value=c.withholding_threshold; $('#customer-transfer-fee').value=c.receipt_transfer_fee; $('#customer-name').focus();}));
  $$('[data-product-edit]').forEach(b=>b.addEventListener('click',async()=>{const {data:p}=await request(`/products/${b.dataset.productEdit}`); $('#product-edit-id').value=p.id; $('#product-form-title').textContent='แก้ไขสินค้า / บริการ'; $('#product-cancel-edit').classList.remove('hidden'); $('#product-sku').value=p.sku||''; $('#product-name').value=p.name||''; $('#product-type').value=p.item_type; $('#product-unit').value=p.unit; $('#product-price').value=p.price; $('#product-category').value=p.category||''; $('#product-name').focus();}));
  $$('[data-customer-deactivate]').forEach(b=>b.addEventListener('click',async()=>{const reason=await promptReason('กรุณาระบุเหตุผลที่ปิดใช้งานลูกค้า','ไม่มีการใช้งานแล้ว'); if(!reason||!confirm('ยืนยันปิดใช้งานลูกค้ารายนี้? เอกสารเก่าจะไม่เปลี่ยนแปลง'))return; await request(`/customers/${b.dataset.customerDeactivate}/deactivate`,{method:'POST',body:JSON.stringify({reason})}); showToast('ปิดใช้งานลูกค้าแล้ว'); await loadCustomers($('#customer-search').value);}));
  $$('[data-product-deactivate]').forEach(b=>b.addEventListener('click',async()=>{const reason=await promptReason('กรุณาระบุเหตุผลที่ปิดใช้งานรายการ','ยกเลิกใช้งานรายการนี้'); if(!reason||!confirm('ยืนยันปิดใช้งานรายการนี้? เอกสารเก่าจะไม่เปลี่ยนแปลง'))return; await request(`/products/${b.dataset.productDeactivate}/deactivate`,{method:'POST',body:JSON.stringify({reason})}); showToast('ปิดใช้งานสินค้า/บริการแล้ว'); await loadProducts($('#product-search').value);}));
  $$('[data-customer-restore]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('ยืนยันกู้คืนลูกค้ารายนี้?'))return; await request(`/customers/${b.dataset.customerRestore}/restore`,{method:'POST'}); showToast('กู้คืนลูกค้าแล้ว'); await loadCustomers($('#customer-search').value);}));
  $$('[data-product-restore]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('ยืนยันกู้คืนรายการนี้?'))return; await request(`/products/${b.dataset.productRestore}/restore`,{method:'POST'}); showToast('กู้คืนสินค้า/บริการแล้ว'); await loadProducts($('#product-search').value);}));
}

function ensureProductDatalist() {
  let list = $('#product-master-list');
  if (!list) {
    list = document.createElement('datalist');
    list.id = 'product-master-list';
    document.body.appendChild(list);
  }
  list.innerHTML = state.products.filter((p) => p.active).map((p) => `<option value="${escapeHtml(p.name)}" data-id="${p.id}">${escapeHtml(p.sku || '')} · ${money(p.price)}</option>`).join('');
}

async function loadDocuments() {
  const search = $('#document-search').value.trim();
  const type = $('#document-type-filter').value;
  const status = $('#document-status-filter').value;
  const params = new URLSearchParams({ limit:'100', page:'1', search });
  if (type) params.set('type', type);
  if (status) params.set('status', status);
  if (state.documentsTrashMode) params.set('deleted_only', 'true');

  const result = await request(`/documents?${params}`);
  const modeNote = $('#documents-mode-note');
  modeNote.classList.toggle('hidden', !state.documentsTrashMode);
  modeNote.innerHTML = state.documentsTrashMode
    ? '<i data-lucide="trash-2"></i><span>กำลังแสดงเอกสารในถังขยะ สามารถกู้คืนได้โดยผู้ดูแลระบบ</span>'
    : '';
  $('#trash-toggle').innerHTML = state.documentsTrashMode
    ? '<i data-lucide="files"></i> กลับคลังเอกสาร'
    : '<i data-lucide="trash-2"></i> ถังขยะ';

  $('#documents-table').innerHTML = result.data.length ? result.data.map((d) => {
    const actions = renderDocumentActions(d);
    return `<tr class="${d.deleted_at ? 'deleted-row' : ''}">
      <td><strong>${escapeHtml(d.document_number)}</strong>${d.deleted_at ? `<br><small>ลบเมื่อ ${dateThai(d.deleted_at)}</small>` : ''}</td>
      <td>${dateThai(d.document_date)}</td>
      <td>${escapeHtml(d.customer_name)}</td>
      <td><span class="type-badge">${DOC_LABELS[d.document_type]}</span></td>
      <td>${money(d.grand_total)}</td>
      <td>${money(d.net_total)}</td>
      <td><span class="status-badge status-${d.status}">${STATUS_LABELS[d.status]}</span>${d.deleted_at ? '<br><small class="deleted-label">อยู่ในถังขยะ</small>' : ''}</td>
      <td><div class="table-actions">${actions}</div></td>
    </tr>`;
  }).join('') : `<tr><td colspan="8" class="table-empty">${state.documentsTrashMode ? 'ถังขยะว่าง' : 'ยังไม่มีเอกสาร <button class="link-button writer-only" data-open-document>สร้างเอกสารฉบับแรก</button>'}</td></tr>`;
  bindDynamicDocumentButtons();
  refreshIcons();
}

function documentCapabilities(documentRow) {
  const role = state.user.role;
  const status = documentRow.status;
  const deleted = Boolean(documentRow.deleted_at);
  return {
    canEdit: !deleted && ((role === 'admin' && ['DRAFT','PENDING','APPROVED','OVERDUE'].includes(status)) || (role === 'staff' && ['DRAFT','PENDING'].includes(status))),
    canCancel: !deleted && ((role === 'admin' && ['DRAFT','PENDING','APPROVED','OVERDUE'].includes(status)) || (role === 'staff' && ['DRAFT','PENDING'].includes(status))),
    canDelete: !deleted && ((role === 'admin' && ['DRAFT','PENDING','CANCELLED'].includes(status)) || (role === 'staff' && ['DRAFT','PENDING'].includes(status))),
    canRestore: deleted && role === 'admin',
    canPay: !deleted && ['admin','staff'].includes(role) && ['PENDING','APPROVED','OVERDUE'].includes(status) && ['IN','BN'].includes(documentRow.document_type)
  };
}

function actionIcon({ icon, title, data, className = '' }) {
  const attrs = Object.entries(data).map(([key, value]) => `data-${key}="${escapeHtml(String(value))}"`).join(' ');
  return `<button class="icon-action ${className}" type="button" title="${escapeHtml(title)}" aria-label="${escapeHtml(title)}" ${attrs}><i data-lucide="${icon}"></i></button>`;
}

function renderDocumentActions(d) {
  const caps = documentCapabilities(d);
  const actions = [];
  if (!d.deleted_at) {
    actions.push(actionIcon({ icon:'eye', title:'ดูเอกสาร', data:{ 'view-id':d.id } }));
    actions.push(actionIcon({ icon:'printer', title:'พิมพ์เอกสาร', data:{ 'print-id':d.id }, className:'action-print' }));
  }
  actions.push(actionIcon({ icon:'history', title:'ดูประวัติการเปลี่ยนแปลง', data:{ 'audit-id':d.id } }));
  if (caps.canEdit) actions.push(actionIcon({ icon:'pencil', title:'แก้ไขเอกสาร', data:{ 'edit-id':d.id }, className:'action-edit' }));
  if (caps.canPay) actions.push(actionIcon({ icon:'badge-dollar-sign', title:'ทำเครื่องหมายว่าชำระแล้ว', data:{ 'status-id':d.id, status:'PAID' }, className:'action-success' }));
  if (caps.canCancel) actions.push(actionIcon({ icon:'file-x-2', title:'ยกเลิกเอกสาร', data:{ 'cancel-id':d.id }, className:'action-warning' }));
  if (caps.canDelete) actions.push(actionIcon({ icon:'trash-2', title:'ย้ายไปถังขยะ', data:{ 'delete-id':d.id }, className:'action-danger' }));
  if (caps.canRestore) actions.push(actionIcon({ icon:'rotate-ccw', title:'กู้คืนเอกสาร', data:{ 'restore-id':d.id }, className:'action-success' }));
  return actions.join('');
}

async function promptReason(message, defaultValue) {
  const value = window.prompt(message, defaultValue || '');
  if (value === null) return null;
  const reason = value.trim();
  if (reason.length < 3) {
    showGlobalError(new Error('กรุณาระบุเหตุผลอย่างน้อย 3 ตัวอักษร'));
    return null;
  }
  return reason;
}

async function openAuditModal(documentId) {
  const modal = $('#audit-modal');
  const list = $('#audit-list');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  list.innerHTML = '<div class="table-empty">กำลังโหลด...</div>';
  try {
    const result = await request(`/documents/${documentId}/audit`);
    $('#audit-document-number').textContent = result.document_number;
    const labels = {
      CREATE:'สร้างเอกสาร', UPDATE:'แก้ไขเอกสาร', UPDATE_STATUS:'เปลี่ยนสถานะ',
      CANCEL:'ยกเลิกเอกสาร', SOFT_DELETE:'ย้ายไปถังขยะ', RESTORE:'กู้คืนเอกสาร'
    };
    list.innerHTML = result.data.length ? result.data.map((entry) => `
      <article class="audit-entry">
        <div class="audit-entry-head"><strong>${escapeHtml(labels[entry.action] || entry.action)}</strong><time>${dateTimeThai(entry.created_at)}</time></div>
        <div class="audit-user"><i data-lucide="user-round"></i> ${escapeHtml(entry.user_name || 'ระบบ')}</div>
        <pre>${escapeHtml(JSON.stringify(entry.details || {}, null, 2))}</pre>
      </article>`).join('') : '<div class="table-empty">ยังไม่มีประวัติ</div>';
    refreshIcons();
  } catch (error) {
    list.innerHTML = `<div class="alert alert-danger">${escapeHtml(error.message)}</div>`;
  }
}

function closeAuditModal() {
  $('#audit-modal').classList.add('hidden');
  document.body.style.overflow = $('#document-modal').classList.contains('hidden') ? '' : 'hidden';
}

function bindDynamicDocumentButtons() {
  $$('[data-view-id]').forEach((button) => button.addEventListener('click', () => window.open(`./print.html?id=${button.dataset.viewId}`, '_blank', 'noopener')));
  $$('[data-print-id]').forEach((button) => button.addEventListener('click', () => window.open(`./print.html?id=${button.dataset.printId}`, '_blank', 'noopener')));
  $$('[data-edit-id]').forEach((button) => button.addEventListener('click', () => openDocumentModal(Number(button.dataset.editId)).catch(showGlobalError)));
  $$('[data-audit-id]').forEach((button) => button.addEventListener('click', () => openAuditModal(Number(button.dataset.auditId))));
  $$('[data-status-id]').forEach((button) => button.addEventListener('click', async () => {
    if (!confirm(`ยืนยันเปลี่ยนสถานะเป็น ${STATUS_LABELS[button.dataset.status]}?`)) return;
    try {
      await request(`/documents/${button.dataset.statusId}/status`, { method:'PATCH', body:JSON.stringify({ status:button.dataset.status }) });
      showToast('อัปเดตสถานะแล้ว');
      await Promise.all([loadDocuments(), loadDashboard()]);
    } catch (error) { showGlobalError(error); }
  }));
  $$('[data-cancel-id]').forEach((button) => button.addEventListener('click', async () => {
    const reason = await promptReason('กรุณาระบุเหตุผลในการยกเลิกเอกสาร', 'ยกเลิกเนื่องจากข้อมูลไม่ถูกต้อง');
    if (!reason || !confirm('ยืนยันยกเลิกเอกสารนี้? เอกสารจะยังคงอยู่เพื่อการตรวจสอบย้อนหลัง')) return;
    try {
      await request(`/documents/${button.dataset.cancelId}/cancel`, { method:'POST', body:JSON.stringify({ reason }) });
      showToast('ยกเลิกเอกสารแล้ว');
      await Promise.all([loadDocuments(), loadDashboard()]);
    } catch (error) { showGlobalError(error); }
  }));
  $$('[data-delete-id]').forEach((button) => button.addEventListener('click', async () => {
    const reason = await promptReason('กรุณาระบุเหตุผลในการลบเอกสาร', 'สร้างเอกสารผิดหรือข้อมูลซ้ำ');
    if (!reason || !confirm('ยืนยันย้ายเอกสารไปถังขยะ? ข้อมูลจะไม่ถูกลบถาวร')) return;
    try {
      await request(`/documents/${button.dataset.deleteId}`, { method:'DELETE', body:JSON.stringify({ reason }) });
      showToast('ย้ายเอกสารไปถังขยะแล้ว');
      await Promise.all([loadDocuments(), loadDashboard()]);
    } catch (error) { showGlobalError(error); }
  }));
  $$('[data-restore-id]').forEach((button) => button.addEventListener('click', async () => {
    if (!confirm('ยืนยันกู้คืนเอกสารนี้กลับเข้าสู่คลังเอกสาร?')) return;
    try {
      await request(`/documents/${button.dataset.restoreId}/restore`, { method:'POST' });
      showToast('กู้คืนเอกสารแล้ว');
      await loadDocuments();
    } catch (error) { showGlobalError(error); }
  }));
  $$('[data-open-document]', $('#documents-table')).forEach((button) => button.addEventListener('click', () => openDocumentModal().catch(showGlobalError)));
}

function resetCustomerDefaults() {
  const type = $('#customer-type').value;
  const defaults = {
    general: { enabled:false, threshold:0, fee:0, basis:'none' },
    private: { enabled:true, threshold:1000, fee:20, basis:'full' },
    government: { enabled:true, threshold:10000, fee:0, basis:'full' }
  }[type];
  $('#customer-withholding-enabled').checked = defaults.enabled;
  $('#customer-threshold').value = defaults.threshold;
  $('#customer-transfer-fee').value = defaults.fee;
  $('#customer-withholding-basis').value = defaults.basis;
}

$('#customer-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const button=event.submitter; setBusy(button,true);
  try { const id=$('#customer-edit-id').value; await request(id?`/customers/${id}`:'/customers',{method:id?'PUT':'POST',body:JSON.stringify(customerPayload())}); resetCustomerForm(); await loadCustomers($('#customer-search').value); showToast(id?'แก้ไขลูกค้าสำเร็จ':'เพิ่มลูกค้าสำเร็จ'); } catch(error){showGlobalError(error);} finally{setBusy(button,false);}
});
$('#customer-type').addEventListener('change', resetCustomerDefaults);
$('#customer-cancel-edit').addEventListener('click', resetCustomerForm);
$('#customer-search').addEventListener('input', debounce((e)=>loadCustomers(e.target.value).catch(showGlobalError),350));
$('#customer-status-filter').addEventListener('change',()=>loadCustomers($('#customer-search').value).catch(showGlobalError));

$('#product-form').addEventListener('submit', async (event) => {
  event.preventDefault(); const button=event.submitter; setBusy(button,true);
  try { const id=$('#product-edit-id').value; await request(id?`/products/${id}`:'/products',{method:id?'PUT':'POST',body:JSON.stringify(productPayload())}); resetProductForm(); await loadProducts($('#product-search').value); showToast(id?'แก้ไขสินค้า/บริการสำเร็จ':'เพิ่มสินค้า/บริการสำเร็จ'); } catch(error){showGlobalError(error);} finally{setBusy(button,false);}
});
$('#product-cancel-edit').addEventListener('click', resetProductForm);
$('#product-search').addEventListener('input', debounce((e)=>loadProducts(e.target.value).catch(showGlobalError),350));
$('#product-status-filter').addEventListener('change',()=>loadProducts($('#product-search').value).catch(showGlobalError));

const allowedTypesByCustomer = {
  general: ['QT','RC'],
  private: ['QT','IN','BN','RC','DO'],
  government: ['QT','RC','DO']
};
function selectedCustomer() {
  return state.customers.find((c) => String(c.id) === $('#doc-customer').value);
}
function updateAllowedDocumentTypes() {
  const customer = selectedCustomer();
  if (!customer) return;
  const allowed = allowedTypesByCustomer[customer.customer_type];
  $$('#doc-type option').forEach((option) => { option.disabled = !allowed.includes(option.value); });
  if (!allowed.includes($('#doc-type').value)) $('#doc-type').value = allowed[0];
}

function toDateInputValue(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

async function openDocumentModal(documentId = null) {
  $('#document-form').reset();
  $('#document-items').innerHTML = '';
  $('#document-form-error').classList.add('hidden');
  state.editingDocumentId = documentId ? Number(documentId) : null;
  $('#doc-type').disabled = Boolean(state.editingDocumentId);

  if (state.editingDocumentId) {
    const result = await request(`/documents/${state.editingDocumentId}`);
    const doc = result.data;
    $('#document-modal-title').textContent = `แก้ไข ${doc.document_number}`;
    $('#save-document').innerHTML = '<i data-lucide="save"></i> บันทึกการแก้ไข';
    $('#doc-type').value = doc.document_type;
    $('#doc-customer').value = String(doc.customer_id);
    $('#doc-date').value = toDateInputValue(doc.document_date);
    $('#doc-due-date').value = toDateInputValue(doc.due_date);
    $('#doc-discount').value = doc.discount ?? 0;
    $('#doc-remarks').value = doc.remarks || '';
    $('#doc-payment-terms').value = doc.payment_terms || '';
    $('#doc-delivery-days').value = doc.delivery_days ?? '';
    $('#doc-validity-days').value = doc.quotation_validity_days ?? '';
    doc.items.forEach((item) => addDocumentLine(item.line_type, item));
    $('#source-documents-box').classList.add('hidden');
  } else {
    $('#document-modal-title').textContent = 'สร้างเอกสารใหม่';
    $('#save-document').innerHTML = '<i data-lucide="save"></i> บันทึกเอกสาร';
    $('#doc-date').value = today();
    $('#doc-discount').value = '0';
    $('#doc-type').value = 'QT';
    addDocumentLine('item');
    updateAllowedDocumentTypes();
    await loadSourceDocuments();
  }

  $('#document-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  updateDocumentPreview();
  refreshIcons();
}
function closeDocumentModal() {
  $('#document-modal').classList.add('hidden');
  document.body.style.overflow = '';
  state.editingDocumentId = null;
  $('#doc-type').disabled = false;
}
$$('[data-close-document]').forEach((el) => el.addEventListener('click', closeDocumentModal));
$$('[data-close-audit]').forEach((el) => el.addEventListener('click', closeAuditModal));
$$('[data-open-document]').forEach((el) => el.addEventListener('click', () => openDocumentModal().catch(showGlobalError)));
$('#quick-create').addEventListener('click', () => openDocumentModal().catch(showGlobalError));

function addDocumentLine(lineType = 'item', data = {}) {
  const row = document.createElement('div');
  row.className = `document-line ${lineType}-line`;
  row.dataset.lineType = lineType;
  row.dataset.productId = data.product_id || '';

  if (lineType === 'item') {
    row.innerHTML = `
      <select class="line-type"><option value="item">คิดเงิน</option><option value="section">หัวข้อ</option><option value="note">หมายเหตุ</option></select>
      <select class="line-item-type"><option value="service">ค่าแรง</option><option value="product">สินค้า</option><option value="travel">เดินทาง</option><option value="other">อื่น ๆ</option></select>
      <input class="line-description" list="product-master-list" placeholder="รายละเอียดสินค้า/บริการ" value="${escapeHtml(data.description || '')}">
      <input class="line-quantity" type="number" min="0.01" step="0.01" value="${data.quantity || 1}" aria-label="จำนวน">
      <input class="line-unit" value="${escapeHtml(data.unit || 'งาน')}" aria-label="หน่วย">
      <input class="line-price" type="number" min="0" step="0.01" value="${data.unit_price || 0}" aria-label="ราคา">
      <button class="remove-line" type="button" aria-label="ลบ">×</button>`;
    $('.line-item-type', row).value = data.item_type || 'service';
  } else {
    row.innerHTML = `
      <select class="line-type"><option value="${lineType}">${lineType === 'section' ? 'หัวข้อ' : 'หมายเหตุ'}</option><option value="item">คิดเงิน</option><option value="${lineType === 'section' ? 'note' : 'section'}">${lineType === 'section' ? 'หมายเหตุ' : 'หัวข้อ'}</option></select>
      <input class="line-description" placeholder="${lineType === 'section' ? 'ชื่อหัวข้อ เช่น ออฟฟิศหลัก' : 'ข้อความหมายเหตุ'}" value="${escapeHtml(data.description || '')}">
      <select class="line-style"><option value="${lineType === 'section' ? 'bold' : 'normal'}">${lineType === 'section' ? 'ตัวหนา' : 'ปกติ'}</option><option value="warning">ข้อความเตือน</option><option value="bold">ตัวหนา</option></select>
      <button class="remove-line" type="button" aria-label="ลบ">×</button>`;
  }

  if (lineType === 'item') {
    $('.line-item-type', row).value = data.item_type || 'service';
  } else {
    $('.line-style', row).value = data.text_style || (lineType === 'section' ? 'bold' : 'normal');
  }
  $('.remove-line', row).addEventListener('click', () => { row.remove(); updateDocumentPreview(); });
  $('.line-type', row).addEventListener('change', (event) => {
    const replacementType = event.target.value;
    const description = $('.line-description', row)?.value || '';
    row.remove();
    addDocumentLine(replacementType, { description });
    updateDocumentPreview();
  });
  $$('input,select', row).forEach((input) => input.addEventListener('input', updateDocumentPreview));
  if (lineType === 'item') {
    $('.line-description', row).addEventListener('change', () => {
      const product = state.products.find((p) => p.name === $('.line-description', row).value);
      if (product) {
        row.dataset.productId = product.id;
        $('.line-item-type', row).value = product.item_type;
        $('.line-unit', row).value = product.unit;
        $('.line-price', row).value = product.price;
        updateDocumentPreview();
      }
    });
  }
  $('#document-items').appendChild(row);
  updateDocumentPreview();
}

$('#add-item').addEventListener('click', () => addDocumentLine('item'));
$('#add-section').addEventListener('click', () => addDocumentLine('section'));
$('#add-note').addEventListener('click', () => addDocumentLine('note'));

function collectDocumentItems() {
  return $$('.document-line', $('#document-items')).map((row) => {
    const lineType = row.dataset.lineType;
    if (lineType !== 'item') {
      return { line_type:lineType, description:$('.line-description', row).value, text_style:$('.line-style', row).value };
    }
    return {
      line_type:'item',
      item_type:$('.line-item-type', row).value,
      product_id: row.dataset.productId ? Number(row.dataset.productId) : null,
      description:$('.line-description', row).value,
      quantity:$('.line-quantity', row).value,
      unit:$('.line-unit', row).value,
      unit_price:$('.line-price', row).value,
      text_style:'normal'
    };
  }).filter((item) => item.description.trim());
}

function updateDocumentPreview() {
  let product = 0, service = 0, other = 0;
  $$('.document-line.item-line', $('#document-items')).forEach((row) => {
    const total = (Number($('.line-quantity', row)?.value) || 0) * (Number($('.line-price', row)?.value) || 0);
    const type = $('.line-item-type', row)?.value;
    if (type === 'product') product += total;
    else if (type === 'service') service += total;
    else other += total;
  });
  const subtotal = product + service + other;
  const total = Math.max(subtotal - (Number($('#doc-discount').value) || 0), 0);
  $('#preview-product').textContent = money(product);
  $('#preview-service').textContent = money(service);
  $('#preview-subtotal').textContent = money(subtotal);
  $('#preview-total').textContent = money(total);
}
$('#doc-discount').addEventListener('input', updateDocumentPreview);

async function loadSourceDocuments() {
  if (state.editingDocumentId) { $('#source-documents-box').classList.add('hidden'); return; }
  updateAllowedDocumentTypes();
  const customerId = $('#doc-customer').value;
  const targetType = $('#doc-type').value;
  const box = $('#source-documents-box');
  const list = $('#source-documents-list');
  list.innerHTML = '';
  if (!customerId || targetType === 'QT') { box.classList.add('hidden'); return; }
  const result = await request(`/documents/sources?target_type=${targetType}&customer_id=${customerId}`);
  if (!result.data.length) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  list.innerHTML = result.data.map((d) => `<label class="source-option"><input type="checkbox" value="${d.id}"> <strong>${escapeHtml(d.document_number)}</strong> · ${money(d.grand_total)}</label>`).join('');
}
$('#doc-customer').addEventListener('change', () => { if (!state.editingDocumentId) loadSourceDocuments().catch(showGlobalError); });
$('#doc-type').addEventListener('change', () => { if (!state.editingDocumentId) loadSourceDocuments().catch(showGlobalError); });

$('#document-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = $('#save-document');
  const errorBox = $('#document-form-error');
  errorBox.classList.add('hidden');
  setBusy(button, true);
  try {
    const sourceIds = state.editingDocumentId ? [] : $$('#source-documents-list input:checked').map((input) => Number(input.value));
    const items = collectDocumentItems();
    const payload = {
      document_type: $('#doc-type').value,
      document_date: $('#doc-date').value,
      due_date: $('#doc-due-date').value || null,
      customer_id: Number($('#doc-customer').value),
      discount: $('#doc-discount').value || 0,
      remarks: $('#doc-remarks').value,
      payment_terms: $('#doc-payment-terms').value,
      delivery_days: $('#doc-delivery-days').value ? Number($('#doc-delivery-days').value) : null,
      quotation_validity_days: $('#doc-validity-days').value ? Number($('#doc-validity-days').value) : null,
      items
    };
    if (!state.editingDocumentId) payload.source_document_ids = sourceIds;

    const editingId = state.editingDocumentId;
    const result = await request(editingId ? `/documents/${editingId}` : '/documents', {
      method: editingId ? 'PUT' : 'POST',
      body: JSON.stringify(payload)
    });
    closeDocumentModal();
    showToast(editingId ? `แก้ไข ${result.data.document_number} สำเร็จ` : `สร้าง ${result.data.document_number} สำเร็จ`);
    await Promise.all([loadDashboard(), loadDocuments()]);
    if (!editingId && confirm('สร้างเอกสารสำเร็จ ต้องการเปิดหน้าพิมพ์หรือไม่?')) window.open(`./print.html?id=${result.data.id}`, '_blank', 'noopener');
  } catch (error) {
    errorBox.textContent = error.details?.length ? `${error.message}: ${error.details.map((d) => d.message).join(', ')}` : error.message;
    errorBox.classList.remove('hidden');
  } finally { setBusy(button, false); }
});

async function loadReport() {
  const month = $('#report-month').value || currentMonth();
  $('#report-month').value = month;
  const result = await request(`/reports/monthly?month=${month}`);
  const label = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { month:'long', year:'numeric' }).format(new Date(`${month}-01T00:00:00`));
  $('#report-month-label').textContent = label;
  $('#report-product-total').textContent = money(result.summary.product_total);
  $('#report-service-total').textContent = money(result.summary.service_total);
  $('#report-received-total').textContent = money(result.summary.received_total);
  $('#report-withholding-total').textContent = money(result.summary.withholding_total);
  $('#report-table').innerHTML = result.documents.length ? result.documents.map((d) => `<tr><td>${dateThai(d.document_date)}</td><td>${escapeHtml(d.document_number)}</td><td>${escapeHtml(d.customer_name)}</td><td><span class="report-doc-type report-type-${d.document_type}">${DOC_LABELS[d.document_type]}</span></td><td>${money(d.grand_total)}</td><td>${money(d.withholding_amount)}</td><td>${money(d.transfer_fee)}</td><td>${money(d.net_total)}</td></tr>`).join('') : '<tr><td colspan="8" class="table-empty">ไม่มีข้อมูลในเดือนนี้</td></tr>';
  renderReportCharts(result);
}
$('#load-report').addEventListener('click', () => loadReport().catch(showGlobalError));
$('#print-report').addEventListener('click', () => { document.body.classList.add('print-mode-report'); window.print(); });
window.addEventListener('afterprint', () => document.body.classList.remove('print-mode-report'));

function renderNumberingSettings(config) {
  const types = ['QT','IN','BN','RC','DO'];
  $('#numbering-settings').innerHTML = types.map((type) => {
    const c = config[type] || { prefix:type,digits:3,period:'BYYMM',separator:'-' };
    return `<div class="numbering-row" data-numbering-type="${type}"><strong>${type}</strong><label>Prefix<input class="num-prefix" value="${escapeHtml(c.prefix)}"></label><label>หลัก<input class="num-digits" type="number" min="1" max="8" value="${c.digits}"></label><label>รอบเลข<select class="num-period"><option value="BYYMM">ปี พ.ศ.+เดือน</option><option value="BYY">ปี พ.ศ.</option><option value="MMBYY">เดือน+ปี พ.ศ.</option><option value="NONE">ต่อเนื่อง</option></select></label><label>คั่น<input class="num-separator" value="${escapeHtml(c.separator ?? '-')}"></label></div>`;
  }).join('');
  $$('[data-numbering-type]').forEach((row) => { $('.num-period', row).value = config[row.dataset.numberingType]?.period || 'BYYMM'; });
}

async function loadSettings() {
  const result = await request('/settings');
  state.settings = result.data;
  const s = result.data;
  $('#setting-shop-th').value = s.shop_name_th || '';
  $('#setting-shop-en').value = s.shop_name_en || '';
  $('#setting-owner').value = s.shop_owner || '';
  $('#setting-address').value = s.shop_address || '';
  $('#setting-tax-id').value = s.shop_tax_id || '';
  $('#setting-phone').value = s.shop_phone || '';
  $('#setting-email').value = s.shop_email || '';
  $('#setting-scb').value = s.scb_bank_details || '';
  $('#setting-ktb').value = s.ktb_bank_details || '';
  $('#setting-logo-url').value = s.logo_url || '';
  $('#setting-logo-file').value = '';
  $('#setting-signature-url').value = s.saved_signature_url || '';
  $('#feature-realtime').checked = Boolean(s.feature_flags?.realtime);
  $('#feature-auto-backup').checked = Boolean(s.feature_flags?.automatic_backup);
  $('#feature-email').checked = Boolean(s.feature_flags?.email_notifications);
  renderNumberingSettings(s.numbering_config || {});
  applyBrand();
  setImageSource($('#setting-logo-preview'), s.logo_url || '');
  const logoStatus = $('#setting-logo-status');
  logoStatus.className = 'image-url-status';
  logoStatus.textContent = s.logo_url ? 'มีโลโก้ร้านในระบบแล้ว' : 'ยังไม่ได้อัปโหลดโลโก้ ระบบจะใช้รูปเริ่มต้น';
  if (s.logo_url) logoStatus.classList.add('is-success');
  await updateImageUrlPreview(imagePreviewOptions('signature'));
}

function collectNumberingConfig() {
  const config = {};
  $$('[data-numbering-type]').forEach((row) => {
    config[row.dataset.numberingType] = {
      prefix: $('.num-prefix', row).value,
      digits: Number($('.num-digits', row).value),
      period: $('.num-period', row).value,
      separator: $('.num-separator', row).value
    };
  });
  return config;
}

const refreshSignaturePreview = debounce(() => { void updateImageUrlPreview(imagePreviewOptions('signature')); }, 500);
$('#setting-signature-url').addEventListener('input', refreshSignaturePreview);

$('#setting-logo-file').addEventListener('change', (event) => {
  const file = event.currentTarget.files?.[0];
  const status = $('#setting-logo-status');
  status.className = 'image-url-status';
  if (!file) {
    setImageSource($('#setting-logo-preview'), $('#setting-logo-url').value);
    status.textContent = $('#setting-logo-url').value ? 'มีโลโก้ร้านในระบบแล้ว' : 'ยังไม่ได้เลือกไฟล์';
    return;
  }
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type)) {
    event.currentTarget.value = '';
    status.textContent = 'รองรับเฉพาะไฟล์ PNG, JPG/JPEG และ WebP';
    status.classList.add('is-error');
    return;
  }
  if (file.size > 500 * 1024) {
    event.currentTarget.value = '';
    status.textContent = 'ไฟล์โลโก้ต้องมีขนาดไม่เกิน 500 KB';
    status.classList.add('is-error');
    return;
  }
  const previewUrl = URL.createObjectURL(file);
  const image = $('#setting-logo-preview');
  image.onload = () => URL.revokeObjectURL(previewUrl);
  image.src = previewUrl;
  status.textContent = `พร้อมอัปโหลด: ${file.name} (${Math.ceil(file.size / 1024)} KB)`;
  status.classList.add('is-success');
});

$('#remove-logo-button').addEventListener('click', () => {
  $('#setting-logo-file').value = '';
  $('#setting-logo-url').value = '';
  setImageSource($('#setting-logo-preview'), '');
  const status = $('#setting-logo-status');
  status.className = 'image-url-status';
  status.textContent = 'โลโก้จะถูกลบเมื่อกดบันทึกการตั้งค่า';
});

async function uploadSelectedLogo() {
  const file = $('#setting-logo-file').files?.[0];
  if (!file) return $('#setting-logo-url').value;
  const formData = new FormData();
  formData.append('logo', file);
  const result = await request('/settings/logo', { method: 'POST', body: formData });
  state.settings = result.data;
  $('#setting-logo-url').value = result.data.logo_url || '';
  $('#setting-logo-file').value = '';
  setImageSource($('#setting-logo-preview'), result.data.logo_url || '');
  const status = $('#setting-logo-status');
  status.className = 'image-url-status is-success';
  status.textContent = 'อัปโหลดโลโก้สำเร็จ';
  return result.data.logo_url || '';
}

$('#settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  setBusy(button, true);
  try {
    const signatureOk = await updateImageUrlPreview(imagePreviewOptions('signature'));
    if (!signatureOk) throw new Error('กรุณาแก้ไข URL ลายเซ็นให้โหลดรูปภาพได้ก่อนบันทึก');
    const logoSource = await uploadSelectedLogo();

    const result = await request('/settings', { method:'PUT', body:JSON.stringify({
      shop_name_th: $('#setting-shop-th').value,
      shop_name_en: $('#setting-shop-en').value,
      shop_owner: $('#setting-owner').value,
      shop_address: $('#setting-address').value,
      shop_tax_id: $('#setting-tax-id').value,
      shop_phone: $('#setting-phone').value,
      shop_email: $('#setting-email').value,
      scb_bank_details: $('#setting-scb').value,
      ktb_bank_details: $('#setting-ktb').value,
      logo_url: logoSource,
      saved_signature_url: $('#setting-signature-url').value,
      numbering_config: collectNumberingConfig(),
      feature_flags: {
        realtime: $('#feature-realtime').checked,
        automatic_backup: $('#feature-auto-backup').checked,
        email_notifications: $('#feature-email').checked
      }
    }) });
    state.settings = result.data;
    applyBrand();
    showToast('บันทึกการตั้งค่าแล้ว');
  } catch (error) { showGlobalError(error); }
  finally { setBusy(button, false); }
});

async function loadUsers() {
  if (state.user.role !== 'admin') return;
  const result = await request('/users');
  $('#users-table').innerHTML = result.data.map((u) => `<tr><td>${escapeHtml(u.name)}</td><td>${escapeHtml(u.email)}</td><td>${ROLE_LABELS[u.role]}</td><td>${u.active ? '<span class="status-badge status-PAID">ใช้งาน</span>' : '<span class="status-badge status-CANCELLED">ปิด</span>'}</td></tr>`).join('');
}
$('#new-user-password').addEventListener('input', (event) => {
  renderPasswordRequirements(event.currentTarget.value);
  $('#password-error').classList.add('hidden');
});

$('#user-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.submitter;
  const password = $('#new-user-password').value;
  const passwordMessage = validatePassword(password);
  const passwordError = $('#password-error');
  renderPasswordRequirements(password, Boolean(passwordMessage));
  if (passwordMessage) {
    passwordError.textContent = passwordMessage;
    passwordError.classList.remove('hidden');
    $('#new-user-password').focus();
    return;
  }
  passwordError.classList.add('hidden');
  setBusy(button, true);
  try {
    await request('/users', { method:'POST', body:JSON.stringify({
      name: $('#new-user-name').value,
      email: $('#new-user-email').value,
      password,
      role: $('#new-user-role').value
    }) });
    event.currentTarget.reset();
    renderPasswordRequirements('');
    await loadUsers();
    showToast('เพิ่มผู้ใช้งานแล้ว');
  } catch (error) {
    const passwordDetail = error.details?.find((detail) => detail.path === 'password');
    if (passwordDetail) {
      passwordError.textContent = passwordDetail.message;
      passwordError.classList.remove('hidden');
      renderPasswordRequirements(password, true);
    } else {
      showGlobalError(error);
    }
  } finally { setBusy(button, false); }
});

$('#backup-button').addEventListener('click', async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/backup/export`, { headers:{ Authorization:`Bearer ${getToken()}` } });
    if (!response.ok) throw new Error('สำรองข้อมูลไม่สำเร็จ');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tong-billing-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('ดาวน์โหลดข้อมูลสำรองแล้ว');
  } catch (error) { showGlobalError(error); }
});

$$('[data-view]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.view)));
$('#document-filter-button').addEventListener('click', () => loadDocuments().catch(showGlobalError));

$('#trash-toggle').addEventListener('click', async () => {
  state.documentsTrashMode = !state.documentsTrashMode;
  $('#document-status-filter').value = '';
  try { await loadDocuments(); } catch (error) { showGlobalError(error); }
});
$('#dashboard-period').addEventListener('change', () => loadDashboard().catch(showGlobalError));
window.addEventListener('themechange', () => {
  if (state.dashboardAnalytics) renderDashboardCharts();
  if (state.reportChartData) renderReportCharts();
});
$('#mobile-menu').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
$('#user-menu-button').addEventListener('click', () => $('#user-menu').classList.toggle('hidden'));
$('#logout-button').addEventListener('click', () => { clearToken(); location.replace('./index.html'); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#audit-modal').classList.contains('hidden')) closeAuditModal();
  else if (event.key === 'Escape' && !$('#document-modal').classList.contains('hidden')) closeDocumentModal();
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#document-search').focus(); switchView('documents'); }
});

refreshIcons();
loadInitialData().catch((error) => {
  if (error.status === 401) { clearToken(); location.replace('./index.html'); }
  else showGlobalError(error);
});
