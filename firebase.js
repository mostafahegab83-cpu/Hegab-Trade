import { app } from "./firebase.js";
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA7fu2YN948Cxxbhxs5Ko9gSSxKHYYpno0",
  authDomain: "stock-manager-5dc93.firebaseapp.com",
  projectId: "stock-manager-5dc93",
  storageBucket: "stock-manager-5dc93.firebasestorage.app",
  messagingSenderId: "388830950028",
  appId: "1:388830950028:web:2db031ea84fba7c633c1a9",
  measurementId: "G-53F28V1DFM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);