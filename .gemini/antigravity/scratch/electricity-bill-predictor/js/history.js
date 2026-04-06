import { db } from './firebase-config.js';
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { renderLineChart } from './charts.js';
import { requireAuth } from './auth.js';
import { logout } from './auth.js';

let currentUser = null;
let allRecords = [];

requireAuth(async (user) => {
  currentUser = user;
  setupUI(user);
  await loadHistory(user.uid);
});

function setupUI(user) {
  const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
  const el = document.getElementById('user-avatar');
  if (el) el.textContent = initial;
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = user.displayName || 'User';
  const emailEl = document.getElementById('user-email');
  if (emailEl) emailEl.textContent = user.email;
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

async function loadHistory(uid) {
  const loading = document.getElementById('loading-state');
  const empty = document.getElementById('empty-state');
  const tableWrapper = document.getElementById('table-wrapper');
  const chartSection = document.getElementById('chart-section');

  if (loading) loading.style.display = 'flex';

  try {
    // We remove the server-side orderBy to avoid requiring a composite index.
    // Index creation link: https://console.firebase.google.com/project/priyanka-academic-2026/firestore/indexes
    const q = query(
      collection(db, 'predictions'),
      where('uid', '==', uid)
    );
    const snap = await getDocs(q);
    // Sort client-side instead
    allRecords = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

    if (loading) loading.style.display = 'none';

    if (allRecords.length === 0) {
      if (empty) empty.style.display = 'flex';
      if (tableWrapper) tableWrapper.style.display = 'none';
      if (chartSection) chartSection.style.display = 'none';
      return;
    }

    if (empty) empty.style.display = 'none';
    if (tableWrapper) tableWrapper.style.display = 'block';
    if (chartSection) chartSection.style.display = 'block';

    renderTable(allRecords);
    renderLineChart('history-chart', allRecords.map(r => ({
      date: r.createdAt?.toDate?.() || new Date(),
      bill: r.bill,
      units: r.units
    })));

    // Update summary stats
    const avgBill = Math.round(allRecords.reduce((s,r)=>s+r.bill,0) / allRecords.length);
    const maxBill = Math.max(...allRecords.map(r=>r.bill));
    const minBill = Math.min(...allRecords.map(r=>r.bill));
    setText('stat-total', allRecords.length);
    setText('stat-avg', '₹' + avgBill.toLocaleString('en-IN'));
    setText('stat-max', '₹' + maxBill.toLocaleString('en-IN'));
    setText('stat-min', '₹' + minBill.toLocaleString('en-IN'));

  } catch (err) {
    if (loading) loading.style.display = 'none';
    console.error(err);
  }
}

function renderTable(records) {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  records.forEach(r => {
    const date = r.createdAt?.toDate?.() || new Date();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</td>
      <td class="td-units">${r.units} kWh</td>
      <td class="td-bill">₹${r.bill.toLocaleString('en-IN')}</td>
      <td>${r.tariff || 6} ₹/kWh</td>
      <td>${r.appliances || '—'}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteRecord('${r.id}')">🗑️ Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

window.deleteRecord = async (id) => {
  if (!confirm('Delete this prediction?')) return;
  await deleteDoc(doc(db, 'predictions', id));
  allRecords = allRecords.filter(r => r.id !== id);
  renderTable(allRecords);
  if (allRecords.length === 0) {
    document.getElementById('empty-state').style.display = 'flex';
    document.getElementById('table-wrapper').style.display = 'none';
    document.getElementById('chart-section').style.display = 'none';
  }
};

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
