import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA7fu2YN948Cxxbhxs5Ko9gSSxKHYYpno0",
  authDomain: "stock-manager-5dc93.firebaseapp.com",
  projectId: "stock-manager-5dc93",
  storageBucket: "stock-manager-5dc93.firebasestorage.app",
  messagingSenderId: "388830950028",
  appId: "1:388830950028:web:2db031ea84fba7c633c1a9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
