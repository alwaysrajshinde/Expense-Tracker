const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyA2KjlOKmmsURv_V_qfR7xeG899o1XXjww",
  authDomain: "expense-tracker-d98cd.firebaseapp.com",
  projectId: "expense-tracker-d98cd",
  storageBucket: "expense-tracker-d98cd.firebasestorage.app",
  messagingSenderId: "506613300270",
  appId: "1:506613300270:web:d8795da6f20c0ee85573bf",
  measurementId: "G-WCNGZ844MP"
};

async function testFirebase() {
  console.log('Testing Firebase connection...');
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  console.log('Firebase App initialized:', app.name);

  // Try signing in with a non-existent account to test if Auth API responds
  try {
    await signInWithEmailAndPassword(auth, 'probe_test_999@example.com', 'TestPassword123!');
  } catch (err) {
    console.log('Auth response code:', err.code);
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      console.log('SUCCESS: Firebase Authentication is active and responding!');
    } else {
      console.log('Firebase returned:', err.message);
    }
  }
}

testFirebase();
