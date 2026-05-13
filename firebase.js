// Firebase CDN modular SDK (v10) — works in plain HTML/JS, no build tools.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration (kept exactly as provided)
const firebaseConfig = {
  apiKey: "AIzaSyA7fu2YN948Cxxbhxs5Ko9gSSxKHYYpno0",
  authDomain: "stock-manager-5dc93.firebaseapp.com",
  projectId: "stock-manager-5dc93",
  storageBucket: "stock-manager-5dc93.firebasestorage.app",
  messagingSenderId: "388830950028",
  appId: "1:388830950028:web:2db031ea84fba7c633c1a9",
  measurementId: "G-53F28V1DFM"
};

// Initialize Firebase + Firestore
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
