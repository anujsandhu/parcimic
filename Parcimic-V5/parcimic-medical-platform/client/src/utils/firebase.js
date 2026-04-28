import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB-6PDfbLTY_3gWXcVZ-NaJOL7wEcrSKiU",
  authDomain: "parcimic.firebaseapp.com",
  projectId: "parcimic",
  storageBucket: "parcimic.firebasestorage.app",
  messagingSenderId: "326887232093",
  appId: "1:326887232093:web:63fe291c7343e37a37b3b4",
  measurementId: "G-NHLPLPQ2M4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

export default app;
