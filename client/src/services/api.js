import syncService from './syncService';
import { 
  computeDashboardFromTransactions, 
  computeReportsFromTransactions
} from './sheetsBackend';

const API_BASE = '/api';
const LOCAL_STORAGE_TXS_KEY = 'expense_tracker_cached_transactions';
const LOCAL_CATEGORIES_KEY = 'expense_tracker_cached_categories';
const LOCAL_SETTINGS_KEY = 'expense_tracker_cached_settings';

// Helper: Get authenticated user headers for multi-user requests
function getAuthHeaders() {
  const headers = {};
  try {
    const sessionStr = localStorage.getItem('expense_tracker_auth_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session.email) headers['x-user-email'] = session.email;
      if (session.name) headers['x-user-name'] = session.name;
      if (session.sub) headers['x-google-sub'] = session.sub;
      if (session.id_token) headers['authorization'] = `Bearer ${session.id_token}`;
    }
  } catch (e) {}
  return headers;
}

// Helper: Get active user email
export function getCurrentUserEmail() {
  try {
    const sessionStr = localStorage.getItem('expense_tracker_auth_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      return session.email ? session.email.trim().toLowerCase() : 'raaajshinde@gmail.com';
    }
  } catch (e) {}
  return 'raaajshinde@gmail.com';
}

// Get cached transactions from local storage (scoped strictly per user)
export function getLocalTransactions() {
  try {
    const email = getCurrentUserEmail();
    const key = `${LOCAL_STORAGE_TXS_KEY}_${email}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

// Save cached transactions (scoped strictly per user)
export function saveLocalTransactions(txs) {
  try {
    const email = getCurrentUserEmail();
    const key = `${LOCAL_STORAGE_TXS_KEY}_${email}`;
    localStorage.setItem(key, JSON.stringify(txs));
  } catch (e) {}
}

export async function getDashboard(month = '2026-11') {
  try {
    const url = month ? `${API_BASE}/dashboard?month=${encodeURIComponent(month)}` : `${API_BASE}/dashboard`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {
    // Fall back to client-side engine (for GitHub Pages / Offline)
  }

  // Client-Side Fallback Engine
  const txs = getLocalTransactions();
  const settings = await getSettings();
  const categories = await getCategories();
  const budget = parseFloat(settings.monthly_budget) || 12000;
  return computeDashboardFromTransactions(txs, month, budget, categories);
}

export async function getTransactions(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.month) params.append('month', filters.month);
    if (filters.category) params.append('category', filters.category);
    if (filters.payment_mode) params.append('payment_mode', filters.payment_mode);
    if (filters.date) params.append('date', filters.date);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const res = await fetch(`${API_BASE}/transactions?${params.toString()}`, {
      headers: { ...getAuthHeaders() }
    });
    if (res.ok) {
      const json = await res.json();
      // Cache transactions for offline resilience
      if (json.data && json.data.transactions) {
        const current = getLocalTransactions();
        const merged = [...current];
        json.data.transactions.forEach(t => {
          const idx = merged.findIndex(m => String(m.id) === String(t.id));
          if (idx !== -1) merged[idx] = t;
          else merged.push(t);
        });
        saveLocalTransactions(merged);
      }
      return json.data;
    }
  } catch (err) {
    // Fallback to local storage query
  }

  // Client-Side Query Engine
  let txs = getLocalTransactions();
  if (filters.month && filters.month !== 'all') {
    txs = txs.filter(t => (t.month_key || t.date?.slice(0, 7)) === filters.month);
  }
  if (filters.category && filters.category !== 'all') {
    txs = txs.filter(t => (t.category || '').toLowerCase() === filters.category.toLowerCase());
  }
  if (filters.payment_mode && filters.payment_mode !== 'all') {
    txs = txs.filter(t => (t.payment_mode || '').toLowerCase() === filters.payment_mode.toLowerCase());
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    txs = txs.filter(t => 
      (t.description || '').toLowerCase().includes(q) || 
      (t.category || '').toLowerCase().includes(q)
    );
  }

  // Sort by date descending
  txs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const page = parseInt(filters.page) || 1;
  const limit = parseInt(filters.limit) || 40;
  const total = txs.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const paginated = txs.slice((page - 1) * limit, page * limit);

  // Group by date
  const grouped = {};
  paginated.forEach(t => {
    const d = t.date || 'Unknown';
    if (!grouped[d]) grouped[d] = { date: d, day_total: 0, items: [] };
    grouped[d].items.push(t);
    grouped[d].day_total += (parseFloat(t.amount) || 0);
  });

  return {
    transactions: paginated,
    grouped: Object.values(grouped),
    pagination: { page, limit, total, total_pages: totalPages }
  };
}

export async function createTransaction(data) {
  const txId = data.id || ('TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
  const newTx = {
    ...data,
    id: txId,
    month_key: data.month_key || (data.date ? data.date.slice(0, 7) : '2026-11'),
    updated_at: new Date().toISOString()
  };

  // 1. Enqueue in Two-Way Sync Queue
  syncService.enqueue('create', newTx, txId);

  // 2. Update local storage cache
  const local = getLocalTransactions();
  local.unshift(newTx);
  saveLocalTransactions(local);

  // 3. If local API server is running, forward to it
  try {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(newTx)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}

  return newTx;
}

export async function updateTransaction(id, data) {
  const updatedTx = {
    ...data,
    id: id,
    month_key: data.month_key || (data.date ? data.date.slice(0, 7) : '2026-11'),
    updated_at: new Date().toISOString()
  };

  syncService.enqueue('update', updatedTx, id);

  const local = getLocalTransactions();
  const idx = local.findIndex(t => String(t.id) === String(id));
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updatedTx };
    saveLocalTransactions(local);
  }

  try {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(updatedTx)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}

  return updatedTx;
}

export async function deleteTransaction(id) {
  syncService.enqueue('delete', {}, id);

  const local = getLocalTransactions();
  const filtered = local.filter(t => String(t.id) !== String(id));
  saveLocalTransactions(filtered);

  try {
    const res = await fetch(`${API_BASE}/transactions/${id}`, { 
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  return { success: true, id };
}

export async function getCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      headers: { ...getAuthHeaders() }
    });
    if (res.ok) {
      const json = await res.json();
      localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(json.data));
      return json.data;
    }
  } catch (err) {}

  try {
    const saved = localStorage.getItem(LOCAL_CATEGORIES_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  return [
    { id: 1, name: 'Food', icon: 'Utensils', color: '#6C47FF', is_quick: 1 },
    { id: 2, name: 'Auto', icon: 'Car', color: '#F59E0B', is_quick: 1 },
    { id: 3, name: 'Metro', icon: 'Train', color: '#0EA5E9', is_quick: 1 },
    { id: 4, name: 'Fruits', icon: 'Apple', color: '#EF4444', is_quick: 1 },
    { id: 5, name: 'Cloths', icon: 'Shirt', color: '#3B82F6', is_quick: 1 },
    { id: 6, name: 'Shopping', icon: 'ShoppingBag', color: '#A855F7', is_quick: 1 },
    { id: 7, name: 'Bills', icon: 'FileText', color: '#EAB308', is_quick: 1 },
    { id: 8, name: 'Medical', icon: 'HeartPulse', color: '#EC4899', is_quick: 0 }
  ];
}

export async function createCategory(data) {
  try {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (res.ok) return (await res.json()).data;
  } catch (err) {}

  const cats = await getCategories();
  const newCat = { ...data, id: Date.now() };
  cats.push(newCat);
  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(cats));
  return newCat;
}

export async function deleteCategory(id) {
  try {
    const res = await fetch(`${API_BASE}/categories/${id}`, { 
      method: 'DELETE',
      headers: { ...getAuthHeaders() }
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  const cats = await getCategories();
  const filtered = cats.filter(c => c.id !== id);
  localStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(filtered));
  return { success: true };
}

export async function getReports(month = '2026-11') {
  try {
    const url = month ? `${API_BASE}/reports?month=${encodeURIComponent(month)}` : `${API_BASE}/reports`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (res.ok) return (await res.json()).data;
  } catch (err) {}

  const txs = getLocalTransactions();
  const settings = await getSettings();
  const categories = await getCategories();
  const budget = parseFloat(settings.monthly_budget) || 12000;
  return computeReportsFromTransactions(txs, month, budget, categories);
}

export async function getSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: { ...getAuthHeaders() }
    });
    if (res.ok) {
      const json = await res.json();
      const email = getCurrentUserEmail();
      localStorage.setItem(`${LOCAL_SETTINGS_KEY}_${email}`, JSON.stringify(json.data));
      return json.data;
    }
  } catch (err) {}

  try {
    const email = getCurrentUserEmail();
    const saved = localStorage.getItem(`${LOCAL_SETTINGS_KEY}_${email}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {}

  const email = getCurrentUserEmail();
  return {
    monthly_budget: '12000',
    currency: '₹',
    user_name: email.split('@')[0],
    user_email: email
  };
}

export async function updateSettings(data) {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (res.ok) return (await res.json()).data;
  } catch (err) {}

  const current = await getSettings();
  const updated = { ...current, ...data };
  const email = getCurrentUserEmail();
  localStorage.setItem(`${LOCAL_SETTINGS_KEY}_${email}`, JSON.stringify(updated));
  return updated;
}

export async function updateBudget(month, budget) {
  try {
    const res = await fetch(`${API_BASE}/budget`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ month, budget })
    });
    if (res.ok) return await res.json();
  } catch (err) {}

  await updateSettings({ monthly_budget: String(budget) });
  return { success: true };
}

// User Profile & Spreadsheet Mapping APIs
export async function getUserProfile() {
  try {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { ...getAuthHeaders() }
    });
    if (res.ok) return (await res.json());
  } catch (err) {}
  return null;
}

export async function associateSpreadsheet(spreadsheetId, spreadsheetUrl = '') {
  try {
    const res = await fetch(`${API_BASE}/user/spreadsheet`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: spreadsheetUrl,
        status: 'active'
      })
    });
    if (res.ok) return (await res.json()).spreadsheet;
  } catch (err) {}
  return null;
}

export async function authenticateGoogle(payload) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

export async function importExcelOrCsv(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to import file');
  return json;
}

export async function restoreBackup(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/backup/restore`, {
    method: 'POST',
    headers: { ...getAuthHeaders() },
    body: formData
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to restore backup');
  return json;
}
