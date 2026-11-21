import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase/config';
import rajHistoricalData from '../data/rajHistoricalData.json';
import { 
  computeDashboardFromTransactions, 
  computeReportsFromTransactions 
} from './sheetsBackend';
import { 
  createPersonalGoogleSheet, 
  appendExpenseToGoogleSheet, 
  batchPopulateGoogleSheet 
} from './googleDriveService';

// Minimal Starter Categories for New Users (Clean, essential, non-overwhelming)
export const MINIMAL_DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: 'Utensils', color: '#6C47FF', is_quick: true },
  { name: 'Groceries', icon: 'ShoppingBag', color: '#10B981', is_quick: true },
  { name: 'Transportation', icon: 'Car', color: '#F59E0B', is_quick: true },
  { name: 'Shopping', icon: 'Shirt', color: '#EC4899', is_quick: true },
  { name: 'Bills & Utilities', icon: 'Zap', color: '#3B82F6', is_quick: false },
  { name: 'Entertainment', icon: 'Film', color: '#8B5CF6', is_quick: false },
  { name: 'Health', icon: 'HeartPulse', color: '#EF4444', is_quick: false },
  { name: 'Other', icon: 'Tag', color: '#64748B', is_quick: false }
];

export function getLocalMonthKey() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Standard 67 Category Meta Definitions (for Raj's historical data migration)
const CATEGORY_META = {
  'Food': { icon: 'Utensils', color: '#6C47FF' },
  'Auto': { icon: 'Car', color: '#F59E0B' },
  'Metro': { icon: 'Train', color: '#0EA5E9' },
  'Fruits': { icon: 'Apple', color: '#EF4444' },
  'Cloths': { icon: 'Shirt', color: '#3B82F6' },
  'Shopping': { icon: 'ShoppingBag', color: '#A855F7' },
  'Biryani': { icon: 'Utensils', color: '#F97316' },
  'Non Veg': { icon: 'Drumstick', color: '#EF4444' },
  'Chicken': { icon: 'Drumstick', color: '#EA580C' },
  'Mutton': { icon: 'Drumstick', color: '#DC2626' },
  'Fish': { icon: 'Fish', color: '#0284C7' },
  'Eggs': { icon: 'Egg', color: '#F59E0B' },
  'Fast Food': { icon: 'Pizza', color: '#F97316' },
  'Office Lunch': { icon: 'UtensilsCrossed', color: '#6366F1' },
  'Office Nashta': { icon: 'Coffee', color: '#D97706' },
  'Office Tifin': { icon: 'Package', color: '#059669' },
  'Office Bottle': { icon: 'Droplet', color: '#06B6D4' },
  'Tea': { icon: 'Coffee', color: '#B45309' },
  'Coffee Powder': { icon: 'Coffee', color: '#78350F' },
  'Cold Drink': { icon: 'CupSoda', color: '#06B6D4' },
  'Juice': { icon: 'Wine', color: '#EC4899' },
  'Vegitables': { icon: 'Carrot', color: '#10B981' },
  'Salad': { icon: 'Salad', color: '#22C55E' },
  'Milk': { icon: 'Milk', color: '#3B82F6' },
  'General': { icon: 'ShoppingBag', color: '#64748B' },
  'Grocery': { icon: 'ShoppingCart', color: '#059669' },
  'Medical': { icon: 'HeartPulse', color: '#E11D48' },
  'Mobile Recharge': { icon: 'Smartphone', color: '#7C3AED' },
  'Rent': { icon: 'Home', color: '#2563EB' },
  'Electricity': { icon: 'Zap', color: '#CA8A04' }
};

/**
 * Ensures user profile, manages Google Drive spreadsheet initialization, and handles historical migration
 */
export async function ensureUserProfile(userId, email, displayName = '', googleAccessToken = '') {
  if (!isFirebaseConfigured || !db) return;

  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    let spreadsheetId = null;
    let spreadsheetUrl = null;

    if (!snap.exists()) {
      const isRaj = email.toLowerCase() === 'raaajshinde@gmail.com';
      const name = displayName || (isRaj ? 'Raj Shinde' : email.split('@')[0]);

      // If Google OAuth Access Token is present, automatically create user's personal Google Sheet in their Google Drive
      if (googleAccessToken) {
        try {
          const sheet = await createPersonalGoogleSheet(googleAccessToken, name);
          spreadsheetId = sheet.spreadsheetId;
          spreadsheetUrl = sheet.spreadsheetUrl;
          console.log(`Created personal Google Sheet for ${name}: ${spreadsheetId}`);
        } catch (sheetErr) {
          console.warn('Google Sheet creation deferred or skipped:', sheetErr.message);
        }
      }

      await setDoc(userRef, {
        email: email.toLowerCase(),
        displayName: name,
        monthly_budget: isRaj ? 12000 : 0,
        currency: '₹',
        migrated: false,
        onboarding_completed: isRaj,
        spreadsheet_id: spreadsheetId,
        spreadsheet_url: spreadsheetUrl,
        created_at: serverTimestamp()
      });

      // If Raj Shinde, run historical data migration
      if (isRaj) {
        await migrateRajHistoricalData(userId);
        if (spreadsheetId && googleAccessToken) {
          batchPopulateGoogleSheet(googleAccessToken, spreadsheetId, rajHistoricalData.transactions);
        }
      } else {
        await seedDefaultCategories(userId);
      }
    } else {
      const data = snap.data();
      const isRaj = email.toLowerCase() === 'raaajshinde@gmail.com';
      if (isRaj && !data.migrated) {
        await migrateRajHistoricalData(userId);
      }

      // If user signed in with Google and doesn't have a spreadsheet yet, auto-create it now
      if (!data.spreadsheet_id && googleAccessToken) {
        try {
          const sheet = await createPersonalGoogleSheet(googleAccessToken, data.displayName || 'Personal');
          await updateDoc(userRef, {
            spreadsheet_id: sheet.spreadsheetId,
            spreadsheet_url: sheet.spreadsheetUrl
          });
          if (isRaj) {
            batchPopulateGoogleSheet(googleAccessToken, sheet.spreadsheetId, rajHistoricalData.transactions);
          }
        } catch (e) {
          console.warn('Auto Google Sheet creation notice:', e.message);
        }
      }
    }
  } catch (err) {
    console.error('Error in ensureUserProfile:', err);
  }
}

/**
 * Batch migrations for Raj Shinde's 1,216 historical transactions and 73 categories
 */
export async function migrateRajHistoricalData(userId) {
  if (!isFirebaseConfigured || !db) return;

  try {
    console.log(`Starting historical migration of ${rajHistoricalData.transactions.length} records for user ${userId}...`);

    // 1. Seed categories
    const catCol = collection(db, 'users', userId, 'categories');
    const catBatch = writeBatch(db);
    for (const cat of rajHistoricalData.categories) {
      const docRef = doc(catCol, String(cat.id || cat.name));
      catBatch.set(docRef, {
        name: cat.name,
        icon: cat.icon || CATEGORY_META[cat.name]?.icon || 'Tag',
        color: cat.color || CATEGORY_META[cat.name]?.color || '#6C47FF',
        is_system: true
      });
    }
    await catBatch.commit();

    // 2. Seed transactions in batches of 400 (staying safely below 500-op limit)
    const txCol = collection(db, 'users', userId, 'transactions');
    const transactions = rajHistoricalData.transactions;
    const CHUNK_SIZE = 400;

    for (let i = 0; i < transactions.length; i += CHUNK_SIZE) {
      const chunk = transactions.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const tx of chunk) {
        const docRef = doc(txCol, String(tx.id));
        batch.set(docRef, {
          id: tx.id,
          date: tx.date,
          month_key: tx.month_key || (tx.date ? tx.date.slice(0, 7) : '2026-11'),
          description: tx.description || '',
          category: tx.category || 'Other',
          payment_mode: tx.payment_mode || 'UPI',
          amount: parseFloat(tx.amount) || 0,
          is_refund: Boolean(tx.is_refund || tx.amount < 0)
        });
      }
      await batch.commit();
      console.log(`Migrated transactions ${i + 1} to ${Math.min(i + CHUNK_SIZE, transactions.length)}...`);
    }

    // 3. Mark migration complete in profile
    await updateDoc(doc(db, 'users', userId), {
      migrated: true,
      migrated_records: transactions.length,
      migration_date: serverTimestamp()
    });

    console.log('Historical migration completed successfully!');
  } catch (err) {
    console.error('Error during historical data migration:', err);
  }
}

/**
 * Seed default categories for new accounts (Clean & Minimal starter set)
 */
export async function seedDefaultCategories(userId) {
  if (!isFirebaseConfigured || !db) return;

  try {
    const catCol = collection(db, 'users', userId, 'categories');
    const batch = writeBatch(db);

    MINIMAL_DEFAULT_CATEGORIES.forEach((cat, idx) => {
      const docRef = doc(catCol, `cat_${idx + 1}`);
      batch.set(docRef, {
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_quick: Boolean(cat.is_quick),
        is_system: true
      });
    });

    await batch.commit();
  } catch (err) {
    console.error('Error seeding categories:', err);
  }
}

/**
 * Get monthly dashboard data from Firestore with Monthly Roll-up Cache
 */
export async function getDashboardData(userId, monthKey = getLocalMonthKey()) {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const isRaj = userDoc.exists() && userDoc.data().email === 'raaajshinde@gmail.com';
    const profile = userDoc.exists() ? userDoc.data() : { monthly_budget: 0, currency: '₹' };
    const budget = profile.monthly_budget !== undefined ? (parseFloat(profile.monthly_budget) || 0) : (isRaj ? 12000 : 0);

    // Check if pre-aggregated monthly summary document exists for instant 1-read load
    const monthDocRef = doc(db, 'users', userId, 'months', monthKey);
    try {
      const monthSnap = await getDoc(monthDocRef);
      if (monthSnap.exists()) {
        const summary = monthSnap.data();
        summary.budget = budget;
        summary.currency = profile.currency || '₹';
        summary.remaining = Math.max(0, budget - (summary.total_spent || 0));
        summary.spent_percentage = budget > 0 ? Math.min(100, Math.round(((summary.total_spent || 0) / budget) * 100)) : 0;
        return summary;
      }
    } catch (cacheErr) {}

    // Otherwise, query transactions for the selected month
    const txCol = collection(db, 'users', userId, 'transactions');
    const q = query(txCol, where('month_key', '==', monthKey));
    const snap = await getDocs(q);

    const transactions = [];
    snap.forEach(docSnap => transactions.push(docSnap.data()));

    // Get categories
    const categories = await getCategories(userId);

    // Compute dashboard metrics
    const computed = computeDashboardFromTransactions(transactions, monthKey, budget, categories);

    // Cache summary document for instant future dashboard visits
    try {
      await setDoc(monthDocRef, {
        ...computed,
        cached_at: serverTimestamp()
      }, { merge: true });
    } catch (saveErr) {}

    return computed;
  } catch (err) {
    console.error('Error in getDashboardData:', err);
    return null;
  }
}

/**
 * Query transactions with filters
 */
export async function getTransactions(userId, filters = {}) {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const txCol = collection(db, 'users', userId, 'transactions');
    let q = query(txCol);

    if (filters.month && filters.month !== 'all') {
      q = query(q, where('month_key', '==', filters.month));
    }
    if (filters.category && filters.category !== 'all') {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters.payment_mode && filters.payment_mode !== 'all') {
      q = query(q, where('payment_mode', '==', filters.payment_mode));
    }

    const snap = await getDocs(q);
    let rows = [];
    snap.forEach(d => rows.push(d.data()));

    // Client-side search filtering if query provided
    if (filters.search) {
      const s = filters.search.toLowerCase();
      rows = rows.filter(t => 
        (t.description || '').toLowerCase().includes(s) ||
        (t.category || '').toLowerCase().includes(s) ||
        (t.date || '').includes(s)
      );
    }

    // Sort by date descending
    rows.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    // Calculate totals
    const totalCount = rows.length;
    const totalAmount = rows.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    // Group transactions by date for UI presentation
    const groupedMap = {};
    rows.forEach(tx => {
      const d = tx.date || 'Unknown';
      if (!groupedMap[d]) {
        groupedMap[d] = { date: d, total: 0, transactions: [] };
      }
      groupedMap[d].transactions.push(tx);
      groupedMap[d].total += (parseFloat(tx.amount) || 0);
    });

    return {
      transactions: rows,
      total_count: totalCount,
      total_amount: totalAmount,
      grouped: Object.values(groupedMap),
      pagination: {
        total: totalCount,
        total_amount: totalAmount,
        page: filters.page || 1,
        limit: filters.limit || 40,
        total_pages: Math.ceil(totalCount / (filters.limit || 40))
      }
    };
  } catch (err) {
    console.error('Error in getTransactions:', err);
    return null;
  }
}

/**
 * Add transaction to Firestore
 */
export async function addTransaction(userId, data) {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const txCol = collection(db, 'users', userId, 'transactions');
    const docRef = doc(txCol);
    const txId = docRef.id;

    const parsedDate = data.date || new Date().toISOString().slice(0, 10);
    const monthKey = parsedDate.slice(0, 7);
    let amount = parseFloat(data.amount) || 0;
    if (data.is_refund && amount > 0) amount = -amount;

    const newTx = {
      id: txId,
      date: parsedDate,
      month_key: monthKey,
      category: data.category || 'Food',
      payment_mode: data.payment_mode || 'UPI',
      amount,
      description: data.description || '',
      is_refund: Boolean(data.is_refund || amount < 0),
      created_at: serverTimestamp()
    };

    await setDoc(docRef, newTx);

    // 1. Invalidate monthly roll-up cache so next dashboard visit re-calculates fresh totals
    try {
      await deleteDoc(doc(db, 'users', userId, 'months', monthKey));
    } catch (cacheDelErr) {}

    // 2. Background non-blocking mirror to user's Google Sheet in their Google Drive
    try {
      const sessionStr = typeof window !== 'undefined' ? localStorage.getItem('expense_tracker_auth_session') : null;
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const token = session.google_access_token;
        if (token) {
          getDoc(doc(db, 'users', userId)).then(userSnap => {
            const sheetId = userSnap.data()?.spreadsheet_id;
            if (sheetId) {
              appendExpenseToGoogleSheet(token, sheetId, newTx);
            }
          }).catch(() => {});
        }
      }
    } catch (sheetSyncErr) {}

    return newTx;
  } catch (err) {
    console.error('Error adding transaction to Firestore:', err);
    throw err;
  }
}

/**
 * Update transaction in Firestore
 */
export async function updateTransaction(userId, id, data) {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const docRef = doc(db, 'users', userId, 'transactions', String(id));
    const parsedDate = data.date || new Date().toISOString().slice(0, 10);
    const monthKey = parsedDate.slice(0, 7);
    let amount = parseFloat(data.amount) || 0;
    if (data.is_refund && amount > 0) amount = -amount;

    const updated = {
      ...data,
      date: parsedDate,
      month_key: monthKey,
      amount,
      updated_at: serverTimestamp()
    };

    await updateDoc(docRef, updated);
    return updated;
  } catch (err) {
    console.error('Error updating transaction in Firestore:', err);
    throw err;
  }
}

/**
 * Delete transaction in Firestore
 */
export async function deleteTransaction(userId, id) {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const docRef = doc(db, 'users', userId, 'transactions', String(id));
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.error('Error deleting transaction in Firestore:', err);
    throw err;
  }
}

/**
 * Get categories
 */
export async function getCategories(userId) {
  if (!isFirebaseConfigured || !db) {
    return MINIMAL_DEFAULT_CATEGORIES.map((c, idx) => ({ id: idx + 1, ...c }));
  }

  try {
    const catCol = collection(db, 'users', userId, 'categories');
    const snap = await getDocs(catCol);
    if (snap.empty) {
      await seedDefaultCategories(userId);
      const newSnap = await getDocs(catCol);
      const list = [];
      newSnap.forEach(d => list.push({ id: d.id, ...d.data() }));
      return list;
    }

    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (err) {
    console.error('Error fetching categories:', err);
    return MINIMAL_DEFAULT_CATEGORIES.map((c, idx) => ({ id: idx + 1, ...c }));
  }
}

/**
 * Add custom category
 */
export async function addCategory(userId, catData) {
  if (!isFirebaseConfigured || !db) return { id: Date.now(), ...catData };

  try {
    const catCol = collection(db, 'users', userId, 'categories');
    const docRef = doc(catCol);
    const newCat = {
      id: docRef.id,
      name: catData.name,
      icon: catData.icon || 'Tag',
      color: catData.color || '#6C47FF',
      is_quick: Boolean(catData.is_quick),
      is_system: false,
      created_at: serverTimestamp()
    };
    await setDoc(docRef, newCat);
    return newCat;
  } catch (err) {
    console.error('Error adding category:', err);
    throw err;
  }
}

/**
 * Delete category
 */
export async function deleteCategory(userId, id) {
  if (!isFirebaseConfigured || !db) return { success: true };

  try {
    const docRef = doc(db, 'users', userId, 'categories', String(id));
    await deleteDoc(docRef);
    return { success: true };
  } catch (err) {
    console.error('Error deleting category:', err);
    throw err;
  }
}

/**
 * Get user settings
 */
export async function getSettings(userId) {
  if (!isFirebaseConfigured || !db) {
    return {
      monthly_budget: '0',
      currency: '₹',
      user_name: 'User',
      user_email: '',
      onboarding_completed: false
    };
  }

  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const d = snap.data();
      const isRaj = d.email === 'raaajshinde@gmail.com';
      return {
        monthly_budget: String(d.monthly_budget !== undefined ? d.monthly_budget : (isRaj ? 12000 : 0)),
        currency: d.currency || '₹',
        user_name: d.displayName || (d.email ? d.email.split('@')[0] : 'User'),
        user_email: d.email || '',
        spreadsheet_id: d.spreadsheet_id || '',
        onboarding_completed: Boolean(d.onboarding_completed)
      };
    }
  } catch (err) {
    console.error('Error getting settings:', err);
  }

  return {
    monthly_budget: '0',
    currency: '₹',
    user_name: 'User',
    user_email: '',
    onboarding_completed: false
  };
}

/**
 * Update user settings
 */
export async function updateSettings(userId, settings) {
  if (!isFirebaseConfigured || !db) return settings;

  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...settings,
      updated_at: serverTimestamp()
    });
    return settings;
  } catch (err) {
    console.error('Error updating settings:', err);
    throw err;
  }
}

/**
 * Update monthly budget
 */
export async function updateBudget(userId, month, budget) {
  if (!isFirebaseConfigured || !db) return { success: true };

  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      monthly_budget: parseFloat(budget) || 12000,
      updated_at: serverTimestamp()
    });
    return { success: true };
  } catch (err) {
    console.error('Error updating budget:', err);
    throw err;
  }
}
