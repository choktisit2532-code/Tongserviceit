const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    let message = `API error ${res.status}`;
    if (contentType.includes('application/json')) {
      const data = await res.json();
      message = data.error || data.message || message;
    } else {
      message = await res.text();
    }
    throw new Error(message);
  }

  if (contentType.includes('application/json')) return res.json();
  return res.blob();
}

export const api = {
  health: () => request('/health'),

  listCustomers: () => request('/api/customers'),
  createCustomer: (payload) => request('/api/customers', { method: 'POST', body: JSON.stringify(payload) }),
  updateCustomer: (id, payload) => request(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCustomer: (id) => request(`/api/customers/${id}`, { method: 'DELETE' }),

  listProducts: () => request('/api/products'),
  createProduct: (payload) => request('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),

  listDocuments: () => request('/api/documents'),
  getDocument: (id) => request(`/api/documents/${id}`),
  createDocument: (payload) => request('/api/documents', { method: 'POST', body: JSON.stringify(payload) }),
  cancelDocument: (id, reason = '') => request(`/api/documents/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'CANCELLED', reason })
  }),

  getMonthlyReport: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/reports/monthly?${qs}`);
  },

  getSettings: () => request('/api/settings'),
  updateSettings: (payload) => request('/api/settings', { method: 'PUT', body: JSON.stringify(payload) }),

  exportBackup: () => request('/api/backup/export'),
  importBackup: (payload) => request('/api/backup/import', { method: 'POST', body: JSON.stringify(payload) })
};
