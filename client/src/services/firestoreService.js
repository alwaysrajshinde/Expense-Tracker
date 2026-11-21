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

// Standard 67 Category Meta Definitions
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
 * Ensures user profile and initializes default state or historical migration
 */
export async function ensureUserProfile(userId, email, displayName = '') {
  if (!isFirebaseConfigured || !db) return;

  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const isRaj = email.toLowerCase() === 'raaajshinde@gmail.com';
      await setDoc(userRef, {
        email: email.toLowerCase(),
        displayName: displayName || (isRaj ? 'Raj Shinde' : email.split('@')[0]),
        monthly_budget: 12000,
        currency: '₹',
        migrated: false,
        created_at: serverTimestamp()
      });

      // If Raj Shinde, run historical data migration
      if (isRaj) {
        await migrateRajHistoricalData(userId);
      } else {
        await seedDefaultCategories(userId);
      }
    } else {
      const data = snap.data();
      const isRaj = email.toLowerCase() === 'raaajshinde@gmail.com';
      if (isRaj && !data.migrated) {
        await migrateRajHistoricalData(userId);
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
 * Seed default categories for new accounts
 */
export async function seedDefaultCategories(userId) {
  if (!isFirebaseConfigured || !db) return;

  try {
    const catCol = collection(db, 'users', userId, 'categories');
    const batch = writeBatch(db);

    const defaultNames = Object.keys(CATEGORY_META);
    defaultNames.forEach((name, idx) => {
      const meta = CATEGORY_META[name];
      const docRef = doc(catCol, `cat_${idx + 1}`);
      batch.set(docRef, {
        name,
        icon: meta.icon,
        color: meta.color,
        is_system: true
      });
    });

    await batch.commit();
  } catch (err) {
    console.error('Error seeding categories:', err);
  }
}

/**
 * Get monthly dashboard data from Firestore
 */
export async function getDashboardData(userId, monthKey = '2026-11') {
  if (!isFirebaseConfigured || !db) return null;

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const profile = userDoc.exists() ? userDoc.data() : { monthly_budget: 12000, currency: '₹' };
    const budget = parseFloat(profile.monthly_budget) || 12000;

    // Query transactions for the selected month
    const txCol = collection(db, 'users', userId, 'transactions');
    const q = query(txCol, where('month_key', '==', monthKey));
    const snap = await getDocs(q);

    const transactions = [];
    snap.forEach(docSnap => transactions.push(docSnap.data()));

    // Get categories
    const categories = await getCategories(userId);

    // Compute dashboard metrics
    return computeDashboardFromTransactions(transactions, monthKey, budget, categories);
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
    return Object.keys(CATEGORY_META).map((name, idx) => ({
      id: idx + 1,
      name,
      icon: CATEGORY_META[name].icon,
      color: CATEGORY_META[name].color
    }));
  }

  try {
    const catCol = collection(db, 'users', userId, 'categories');
    const snap = await getDocs(catCol);
    if (snap.empty) {
      await seedDefaultCategories(userId);
      return getCategories(userId);
    }

    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return list;
  } catch (err) {
    console.error('Error fetching categories:', err);
    return Object.keys(CATEGORY_META).map((name, idx) => ({
      id: idx + 1,
      name,
      icon: CATEGORY_META[name].icon,
      color: CATEGORY_META[name].color
    }));
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
      monthly_budget: '12000',
      currency: '₹',
      user_name: 'Raj Shinde',
      user_email: 'raaajshinde@gmail.com'
    };
  }

  try {
    const docRef = doc(db, 'users', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const d = snap.data();
      return {
        monthly_budget: String(d.monthly_budget || 12000),
        currency: d.currency || '₹',
        user_name: d.displayName || d.email.split('@')[0],
        user_email: d.email
      };
    }
  } catch (err) {
    console.error('Error getting settings:', err);
  }

  return {
    monthly_budget: '12000',
    currency: '₹',
    user_name: 'Raj Shinde',
    user_email: 'raaajshinde@gmail.com'
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
