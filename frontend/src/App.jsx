import { useEffect, useState } from 'react';
import Layout from './components/Layout.jsx';
import Toast from './components/Toast.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DocumentForm from './pages/DocumentForm.jsx';
import DocumentArchive from './pages/DocumentArchive.jsx';
import Customers from './pages/Customers.jsx';
import Products from './pages/Products.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import { api } from './services/api.js';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    api.getSettings()
      .then(setSettings)
      .catch(() => setToast({ message: 'เชื่อมต่อ backend ไม่สำเร็จ กรุณาตรวจสอบ VITE_API_BASE_URL', type: 'error' }));
  }, []);

  function showToast(message, type = 'info') {
    setToast({ message, type });
  }

  const commonProps = { settings, setSettings, showToast, setActivePage };

  return (
    <>
      <Layout
        activePage={activePage}
        setActivePage={setActivePage}
        theme={theme}
        toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        {activePage === 'dashboard' && <Dashboard {...commonProps} />}
        {activePage === 'create' && <DocumentForm {...commonProps} />}
        {activePage === 'archive' && <DocumentArchive {...commonProps} />}
        {activePage === 'customers' && <Customers {...commonProps} />}
        {activePage === 'products' && <Products {...commonProps} />}
        {activePage === 'reports' && <Reports {...commonProps} />}
        {activePage === 'settings' && <Settings {...commonProps} />}
      </Layout>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />
    </>
  );
}
