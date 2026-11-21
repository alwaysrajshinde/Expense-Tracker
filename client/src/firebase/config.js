import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

// Default Firebase configuration loader
// Supports:
// 1. Vite environment variables (VITE_FIREBASE_*)
// 2. Window runtime config (window.FIREBASE_CONFIG in public/firebase-config.js)
// 3. LocalStorage override for custom user configurations
function getFirebaseConfig() {
  // 1. Check window.FIREBASE_CONFIG (runtime injection)
  if (typeof window !== 'undefined' && window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) {
    return window.FIREBASE_CONFIG;
  }

  // 2. Check localStorage
  try {
    const stored = localStorage.getItem('expense_tracker_firebase_config');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.apiKey) return parsed;
    }
  } catch (e) {}

  // 3. Check Vite import.meta.env
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  };

  if (envConfig.apiKey && envConfig.projectId && !envConfig.apiKey.includes('YOUR_')) {
    return envConfig;
  }

  return null;
}

const firebaseConfig = getFirebaseConfig();
export const isFirebaseConfigured = Boolean(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);

    // Initialize Firestore with IndexedDB persistent offline cache
    try {
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
    } catch (cacheErr) {
      console.warn('Persistent Firestore cache fallback to default:', cacheErr);
      db = getFirestore(app);
    }
  } catch (err) {
    console.error('Error initializing Firebase SDK:', err);
  }
}

export { app, auth, db };
export default app;
