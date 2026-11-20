/**
 * Two-Way Synchronization & Offline Support Service
 * Manages communication between client, local database, and Google Sheets / Apps Script backend.
 */

const BASE_QUEUE_KEY = 'expense_tracker_sync_queue';
const SYNC_CONFIG_KEY = 'expense_tracker_sync_config';
const LAST_SYNC_KEY = 'expense_tracker_last_sync_time';

function getActiveEmail() {
  try {
    const sessionStr = localStorage.getItem('expense_tracker_auth_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session.email) return session.email.trim().toLowerCase();
    }
  } catch (e) {}
  return 'default';
}

function getQueueStorageKey() {
  return `${BASE_QUEUE_KEY}_${getActiveEmail()}`;
}

class SyncService {
  constructor() {
    this.listeners = new Set();
    this.isSyncing = false;
    this.status = navigator.onLine ? 'idle' : 'offline';
    this.lastSyncTime = localStorage.getItem(LAST_SYNC_KEY) || new Date().toISOString();

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.status = 'idle';
      this.notifyListeners();
      this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.status = 'offline';
      this.notifyListeners();
    });

    // Periodic sync check every 90 seconds when online
    setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncNow(true); // silent background sync
      }
    }, 90000);
  }

  // Get current sync configuration
  getConfig() {
    try {
      const saved = localStorage.getItem(SYNC_CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      google_script_url: '',
      auth_secret: 'ET_SECURE_SYNC_KEY_2026',
      auto_sync_enabled: true
    };
  }

  // Update sync configuration
  saveConfig(config) {
    const current = this.getConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(updated));
    this.notifyListeners();
  }

  // Get pending queue
  getQueue() {
    try {
      const queue = localStorage.getItem(getQueueStorageKey());
      return queue ? JSON.parse(queue) : [];
    } catch (e) {
      return [];
    }
  }

  // Save pending queue
  saveQueue(queue) {
    localStorage.setItem(getQueueStorageKey(), JSON.stringify(queue));
    this.notifyListeners();
  }

  // Enqueue a transaction operation (create, update, delete)
  enqueue(action, data, id = null) {
    const queue = this.getQueue();
    const txId = id || data.id || ('TX-' + Date.now() + '-' + Math.floor(Math.random() * 1000));
    
    // Check if item already exists in queue to merge/update
    const existingIdx = queue.findIndex(item => String(item.id) === String(txId));
    const queueItem = {
      id: txId,
      action: action, // 'create' | 'update' | 'delete'
      data: { ...data, id: txId },
      timestamp: new Date().toISOString()
    };

    if (existingIdx !== -1) {
      if (action === 'delete') {
        queue[existingIdx] = queueItem;
      } else {
        queue[existingIdx] = queueItem;
      }
    } else {
      queue.push(queueItem);
    }

    this.saveQueue(queue);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncNow();
    }

    return txId;
  }

  // Subscribe to sync state changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const state = {
      status: this.status,
      isSyncing: this.isSyncing,
      pendingCount: this.getQueue().length,
      lastSyncTime: this.lastSyncTime
    };
    this.listeners.forEach(cb => cb(state));
  }

  // Format relative time (e.g. "Synced 2 min ago")
  getFormattedLastSync() {
    if (!this.lastSyncTime) return 'Never synced';
    const diffMs = Date.now() - new Date(this.lastSyncTime).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Synced just now';
    if (diffMin < 60) return `Synced ${diffMin} min ago`;
    if (diffHours < 24) return `Synced ${diffHours} hr ago`;
    return `Synced ${new Date(this.lastSyncTime).toLocaleDateString()}`;
  }

  // Primary Two-Way Sync Routine
  async syncNow(silent = false) {
    if (this.isSyncing) return;
    if (!navigator.onLine) {
      this.status = 'offline';
      this.notifyListeners();
      return;
    }

    const config = this.getConfig();
    const queue = this.getQueue();

    this.isSyncing = true;
    this.status = 'syncing';
    this.notifyListeners();

    try {
      // 1. If Google Apps Script Web App URL is configured, sync with Google Sheets!
      if (config.google_script_url) {
        const payload = {
          action: 'twoWaySync',
          auth_secret: config.auth_secret || 'ET_SECURE_SYNC_KEY_2026',
          client_changes: queue,
          last_sync_time: this.lastSyncTime
        };

        const res = await fetch(config.google_script_url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.success && json.data) {
          // Clear applied changes from local queue
          const appliedIds = new Set(json.data.applied_ids || []);
          const remainingQueue = queue.filter(item => !appliedIds.has(item.id));
          this.saveQueue(remainingQueue);

          this.lastSyncTime = new Date().toISOString();
          localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
          this.status = 'idle';
          this.notifyListeners();

          return {
            success: true,
            server_records: json.data.server_expenses,
            sync_time: this.lastSyncTime
          };
        } else {
          throw new Error(json.error || 'Google Apps Script sync failed');
        }
      }

      // 2. Otherwise sync with local Express / SQLite API server
      if (queue.length > 0) {
        // Process each pending queue item against local API
        const remainingQueue = [...queue];
        for (const item of queue) {
          try {
            if (item.action === 'create') {
              await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data)
              });
            } else if (item.action === 'update') {
              await fetch(`/api/transactions/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item.data)
              });
            } else if (item.action === 'delete') {
              await fetch(`/api/transactions/${item.id}`, {
                method: 'DELETE'
              });
            }
            // Remove from remaining queue
            const idx = remainingQueue.findIndex(q => q.id === item.id);
            if (idx !== -1) remainingQueue.splice(idx, 1);
          } catch (err) {
            console.warn('Queue item sync deferred:', err);
          }
        }
        this.saveQueue(remainingQueue);
      }

      this.lastSyncTime = new Date().toISOString();
      localStorage.setItem(LAST_SYNC_KEY, this.lastSyncTime);
      this.status = 'idle';
      this.notifyListeners();

      return { success: true, sync_time: this.lastSyncTime };
    } catch (err) {
      console.error('Two-way sync error:', err);
      this.status = 'error';
      this.notifyListeners();
      if (!silent) throw err;
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }
}

export const syncService = new SyncService();
export default syncService;
