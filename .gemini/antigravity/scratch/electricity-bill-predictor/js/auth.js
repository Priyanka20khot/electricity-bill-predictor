import { auth } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();

// Show toast notification
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// Register with email
export async function registerWithEmail(email, password, displayName) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName });
  return cred.user;
}

// Login with email
export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// Login with Google
export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

// Logout
export async function logout() {
  await signOut(auth);
  window.location.href = 'index.html';
}

// Auth state listener — provide GUEST user if not logged in
export function requireAuth(callback) {
  onAuthStateChanged(auth, user => {
    if (!user) {
      // Provide a persistent Guest User for demonstration
      callback({
        uid: 'guest_user_2026',
        displayName: 'Guest User',
        email: 'guest@flashvolt.app'
      });
    } else {
      callback(user);
    }
  });
}

// Auth state listener — disabled for guest mode
export function redirectIfLoggedIn() {
  // We no longer force redirect away from landing
}
