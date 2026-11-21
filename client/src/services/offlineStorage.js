/**
 * Sovereign Offline Storage Ledger
 * Strictly partitioned by authenticated Firebase UID for multi-user security.
 */

const STORAGE_PREFIX = 'et_offline_ledger_';
const PENDING_SYNC_PREFIX = 'et_pending_sync_';

function getStorageKey(userId) {
  const cleanId = (userId || 'guest').toString().trim().toLowerCase();
  return `${STORAGE_PREFIX}${cleanId}`;
}

function getSyncKey(userId) {
  const cleanId = (userId || 'guest').toString().trim().toLowerCase();
  return `${PENDING_SYNC_PREFIX}${cleanId}`;
}

/**
 * Retrieves the complete offline ledger for the authenticated user
 */
export function getOfflineLedger(userId) {
  if (!userId) return { transactions: [], categories: [], settings: {}, lastUpdated: null };
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        categories: Array.isArray(parsed.categories) ? parsed.categories : [],
        settings: parsed.settings || {},
        lastUpdated: parsed.lastUpdated || null
      };
    }
  } catch (err) {
    console.warn('[OfflineStorage] Error reading offline ledger:', err);
  }

  return { transactions: [], categories: [], settings: {}, lastUpdated: null };
}

/**
 * Saves the entire offline ledger for the user
 */
export function saveOfflineLedger(userId, data) {
  if (!userId) return false;
  try {
    const payload = {
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      categories: Array.isArray(data.categories) ? data.categories : [],
      settings: data.settings || {},
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(getStorageKey(userId), JSON.stringify(payload));
    return true;
  } catch (err) {
    console.error('[OfflineStorage] Failed to save ledger to localStorage:', err);
    return false;
  }
}

/**
 * Adds or updates a single transaction in the local offline ledger
 */
export function addOfflineTransaction(userId, tx) {
  if (!userId || !tx) return;
  const ledger = getOfflineLedger(userId);
  const txs = [...ledger.transactions];
  const idx = txs.findIndex(t => String(t.id) === String(tx.id));

  if (idx !== -1) {
    txs[idx] = { ...txs[idx], ...tx, updated_at: new Date().toISOString() };
  } else {
    txs.unshift({
      ...tx,
      created_at: tx.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  saveOfflineLedger(userId, { ...ledger, transactions: txs });
}

/**
 * Updates an existing transaction in the offline ledger
 */
export function updateOfflineTransaction(userId, id, updates) {
  if (!userId || !id) return;
  const ledger = getOfflineLedger(userId);
  const txs = ledger.transactions.map(t => {
    if (String(t.id) === String(id)) {
      return { ...t, ...updates, updated_at: new Date().toISOString() };
    }
    return t;
  });

  saveOfflineLedger(userId, { ...ledger, transactions: txs });
}

/**
 * Deletes a transaction from the offline ledger
 */
export function deleteOfflineTransaction(userId, id) {
  if (!userId || !id) return;
  const ledger = getOfflineLedger(userId);
  const txs = ledger.transactions.filter(t => String(t.id) !== String(id));
  saveOfflineLedger(userId, { ...ledger, transactions: txs });
}

/**
 * Retrieves offline categories
 */
export function getOfflineCategories(userId) {
  const ledger = getOfflineLedger(userId);
  return ledger.categories || [];
}

/**
 * Saves offline categories
 */
export function saveOfflineCategories(userId, categories) {
  const ledger = getOfflineLedger(userId);
  saveOfflineLedger(userId, { ...ledger, categories });
}

/**
 * Retrieves offline settings (budget, currency, etc.)
 */
export function getOfflineSettings(userId) {
  const ledger = getOfflineLedger(userId);
  return ledger.settings || {};
}

/**
 * Saves offline settings
 */
export function saveOfflineSettings(userId, settings) {
  const ledger = getOfflineLedger(userId);
  saveOfflineLedger(userId, {
    ...ledger,
    settings: { ...ledger.settings, ...settings }
  });
}

/**
 * Retrieves pending mutation queue for background synchronization
 */
export function getPendingMutations(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getSyncKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Enqueues a pending mutation (create, update, delete)
 */
export function enqueuePendingMutation(userId, mutation) {
  if (!userId || !mutation) return;
  try {
    const queue = getPendingMutations(userId);
    // Deduplicate if already present in queue
    const filtered = queue.filter(m => !(m.targetId === mutation.targetId && m.action === mutation.action));
    filtered.push({
      ...mutation,
      mutationId: mutation.mutationId || `mut_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(getSyncKey(userId), JSON.stringify(filtered));
  } catch (err) {
    console.error('[OfflineStorage] Error enqueueing mutation:', err);
  }
}

/**
 * Dequeues a processed mutation from the sync queue
 */
export function dequeuePendingMutation(userId, mutationId) {
  if (!userId || !mutationId) return;
  try {
    const queue = getPendingMutations(userId);
    const updated = queue.filter(m => m.mutationId !== mutationId);
    localStorage.setItem(getSyncKey(userId), JSON.stringify(updated));
  } catch (err) {
    console.error('[OfflineStorage] Error dequeuing mutation:', err);
  }
}

/**
 * Clears all pending mutations for a user
 */
export function clearPendingMutations(userId) {
  if (!userId) return;
  try {
    localStorage.removeItem(getSyncKey(userId));
  } catch (e) {}
}

/**
 * Queries storage usage and quota estimate (if supported by browser)
 */
export async function getStorageQuotaEstimate() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usageMb = Math.round((estimate.usage || 0) / (1024 * 1024) * 10) / 10;
      const quotaMb = Math.round((estimate.quota || 0) / (1024 * 1024));
      return {
        supported: true,
        usageMb,
        quotaMb,
        percent: quotaMb > 0 ? Math.round((usageMb / quotaMb) * 100) : 0
      };
    } catch (e) {}
  }
  return { supported: false, usageMb: 0, quotaMb: 0, percent: 0 };
}
