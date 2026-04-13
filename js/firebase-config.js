// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  projectId: "priyanka-academic-2026",
  appId: "1:231854065811:web:8e426cd8047b90b0f2e566",
  storageBucket: "priyanka-academic-2026.firebasestorage.app",
  apiKey: "AIzaSyB5q-6TboWWml1idQhbzLlIni9gn1DvKB8",
  authDomain: "priyanka-academic-2026.firebaseapp.com",
  messagingSenderId: "231854065811",
  measurementId: "G-W0G86CDX5X"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
