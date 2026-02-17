// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB-6PDfbLTY_3gWXcVZ-NaJOL7wEcrSKiU",
  authDomain: "parcimic.firebaseapp.com",
  projectId: "parcimic",
  storageBucket: "parcimic.firebasestorage.app",
  messagingSenderId: "326887232093",
  appId: "1:326887232093:web:63fe291c7343e37a37b3b4",
  measurementId: "G-NHLPLPQ2M4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);