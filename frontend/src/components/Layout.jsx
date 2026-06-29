const menus = [
  ['dashboard', 'Dashboard'],
  ['create', 'ออกเอกสาร'],
  ['archive', 'คลังเอกสาร'],
  ['customers', 'ข้อมูลลูกค้า'],
  ['products', 'คลังสินค้า'],
  ['reports', 'รายงานการเงิน'],
  ['settings', 'ตั้งค่าร้านค้า']
];

export default function Layout({ activePage, setActivePage, children, theme, toggleTheme }) {
  return (
    <div className="app-shell">
      <aside className="sidebar no-print">
        <div className="brand">
          <div className="brand-logo">TS</div>
          <div>
            <h1>ต้อง เซอร์วิส ไอที</h1>
            <p>Billing System</p>
          </div>
        </div>

        <nav>
          {menus.map(([key, label]) => (
            <button
              key={key}
              className={activePage === key ? 'active' : ''}
              onClick={() => setActivePage(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </aside>

      <main className="main">
        {children}
      </main>
    </div>
  );
}
