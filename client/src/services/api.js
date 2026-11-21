import syncService from './syncService';
import * as firestoreService from './firestoreService';
import { isFirebaseConfigured } from '../firebase/config';
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
      return session.email ? session.email.trim().toLowerCase() : '';
    }
  } catch (e) {}
  return '';
}

// Helper: Get active user ID (Firebase UID or numeric ID)
export function getCurrentUserId() {
  try {
    const sessionStr = localStorage.getItem('expense_tracker_auth_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      return session.uid || String(session.id) || 'default_user';
    }
  } catch (e) {}
  return '1';
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

export async function getDashboard(month = new Date().toISOString().slice(0, 7)) {
  // 1. Cloud Firestore Route (Primary Serverless Cloud Engine)
  if (isFirebaseConfigured) {
    try {
      const fsData = await firestoreService.getDashboardData(getCurrentUserId(), month);
      if (fsData) return fsData;
    } catch (e) {
      console.warn('Firestore getDashboard fallback:', e);
    }
  }

  // 2. Local REST API Route (if server running)
  try {
    const url = month ? `${API_BASE}/dashboard?month=${encodeURIComponent(month)}` : `${API_BASE}/dashboard`;
    const res = await fetch(url, {
      headers: { ...getAuthHeaders() }
    });
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch (err) {}

  // 3. Client-Side Fallback Engine (for GitHub Pages / Offline)
  const txs = getLocalTransactions();
  const settings = await getSettings();
  const categories = await getCategories();
  const budget = settings.monthly_budget !== undefined ? (parseFloat(settings.monthly_budget) || 0) : 0;
  return computeDashboardFromTransactions(txs, month, budget, categories);
}

export async function getTransactions(filters = {}) {
  // 1. Cloud Firestore Route (Primary Serverless Cloud Engine)
  if (isFirebaseConfigured) {
    try {
      const fsData = await firestoreService.getTransactions(getCurrentUserId(), filters);
      if (fsData) return fsData;
    } catch (e) {
      console.warn('Firestore getTransactions fallback:', e);
    }
  }

  // 2. Local REST API Route
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

        if (!json.data.grouped) {
          const groupedMap = {};
          json.data.transactions.forEach(tx => {
            const d = tx.date || 'Unknown';
            if (!groupedMap[d]) groupedMap[d] = { date: d, total: 0, transactions: [] };
            groupedMap[d].transactions.push(tx);
            groupedMap[d].total += (parseFloat(tx.amount) || 0);
          });
          json.data.grouped = Object.values(groupedMap);
          json.data.total_count = json.data.pagination ? json.data.pagination.total : json.data.transactions.length;
          json.data.total_amount = json.data.pagination ? json.data.pagination.total_amount : 0;
        }
      }
      return json.data;
    }
  } catch (err) {}

  // 3. Client-Side Query Engine
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
    if (!grouped[d]) grouped[d] = { date: d, total: 0, transactions: [] };
    grouped[d].transactions.push(t);
    grouped[d].total += (parseFloat(t.amount) || 0);
  });

  return {
    transactions: paginated,
    grouped: Object.values(grouped),
    total_count: total,
    total_amount: txs.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
    pagination: { page, limit, total, total_pages: totalPages }
  };
}

export async function createTransaction(data) {
  // 1. Cloud Firestore Route
  if (isFirebaseConfigured) {
    try {
      const fsTx = await firestoreService.addTransaction(getCurrentUserId(), data);
      if (fsTx) return fsTx;
    } catch (e) {
      console.warn('Firestore addTransaction fallback:', e);
    }
  }

  const txId = data.id || ('TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
  const newTx = {
    ...data,
    id: txId,
    month_key: data.month_key || (data.date ? data.date.slice(0, 7) : new Date().toISOString().slice(0, 7)),
    updated_at: new Date().toISOString()
  };

  // Enqueue in Two-Way Sync Queue
  syncService.enqueue('create', newTx, txId);

  // Update local storage cache
  const local = getLocalTransactions();
  local.unshift(newTx);
  saveLocalTransactions(local);

  // Forward to local API server if running
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
  // 1. Cloud Firestore Route
  if (isFirebaseConfigured) {
    try {
      const fsTx = await firestoreService.updateTransaction(getCurrentUserId(), id, data);
      if (fsTx) return fsTx;
    } catch (e) {
      console.warn('Firestore updateTransaction fallback:', e);
    }
  }

  const updatedTx = {
    ...data,
    id: id,
    month_key: data.month_key || (data.date ? data.date.slice(0, 7) : new Date().toISOString().slice(0, 7)),
    updated_at: new Date().toISOString()
  };

  syncService.enqueue('update', updatedTx, id);

  const local = getLocalTransactions();
  const idx = local.findIndex(t => String(t.id) === String(id));
  if (idx !== -1) {
    local[idx] = updatedTx;
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
  // 1. Cloud Firestore Route
  if (isFirebaseConfigured) {
    try {
      await firestoreService.deleteTransaction(getCurrentUserId(), id);
      return { success: true };
    } catch (e) {
      console.warn('Firestore deleteTransaction fallback:', e);
    }
  }

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

  return { success: true };
}

export async function getCategories() {
  if (isFirebaseConfigured) {
    try {
      const cats = await firestoreService.getCategories(getCurrentUserId());
      if (cats && cats.length > 0) return cats;
    } catch (e) {}
  }

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
    { id: 1, name: 'Food', icon: 'Utensils', color: '#6C47FF' },
    { id: 2, name: 'Auto', icon: 'Car', color: '#F59E0B' },
    { id: 3, name: 'Metro', icon: 'Train', color: '#0EA5E9' },
    { id: 4, name: 'Fruits', icon: 'Apple', color: '#EF4444' },
    { id: 5, name: 'Cloths', icon: 'Shirt', color: '#3B82F6' },
    { id: 6, name: 'Shopping', icon: 'ShoppingBag', color: '#A855F7' }
  ];
}

export async function createCategory(data) {
  if (isFirebaseConfigured) {
    try {
      return await firestoreService.addCategory(getCurrentUserId(), data);
    } catch (e) {}
  }

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
  if (isFirebaseConfigured) {
    try {
      return await firestoreService.deleteCategory(getCurrentUserId(), id);
    } catch (e) {}
  }

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

export async function getReports(month = new Date().toISOString().slice(0, 7)) {
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
  const budget = settings.monthly_budget !== undefined ? (parseFloat(settings.monthly_budget) || 0) : 0;
  return computeReportsFromTransactions(txs, month, budget, categories);
}

export async function getSettings() {
  if (isFirebaseConfigured) {
    try {
      const fsSettings = await firestoreService.getSettings(getCurrentUserId());
      if (fsSettings) return fsSettings;
    } catch (e) {}
  }

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
  if (isFirebaseConfigured) {
    try {
      return await firestoreService.updateSettings(getCurrentUserId(), data);
    } catch (e) {}
  }

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
  if (isFirebaseConfigured) {
    try {
      return await firestoreService.updateBudget(getCurrentUserId(), month, budget);
    } catch (e) {}
  }

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
