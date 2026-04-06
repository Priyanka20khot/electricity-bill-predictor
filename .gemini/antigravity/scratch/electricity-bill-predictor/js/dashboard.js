import { auth, db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APPLIANCE_CATALOG, computeBaseUnits, generateTips } from './appliances.js';
import { initModel, predict, isReady } from './ml-model.js';
import { renderPieChart } from './charts.js';
import { logout, showToast, requireAuth } from './auth.js';

let currentUser = null;
let selectedAppliances = [];

// --- Initialization ---

// ML Model Progress Callback
async function startApp() {
  const overlay = document.getElementById('training-overlay');
  const progressText = document.getElementById('training-progress');
  
  if (overlay) overlay.classList.add('show');
  
  await initModel((percent) => {
    if (progressText) progressText.textContent = percent;
  });

  if (overlay) overlay.classList.remove('show');
  const statusBadge = document.getElementById('model-status');
  if (statusBadge) statusBadge.textContent = 'Model Ready';
  
  const predictBtn = document.getElementById('predict-btn');
  if (predictBtn) predictBtn.disabled = false;
}

// Session Management (Auth / Guest)
requireAuth(async (user) => {
  currentUser = user;
  setupUserUI(user);
  await loadLastStats(user.uid);
  startApp();
});

function setupUserUI(user) {
  const initial = (user.displayName || user.email || 'U')[0].toUpperCase();
  const avatar = document.getElementById('user-avatar');
  if (avatar) avatar.textContent = initial;
  
  const name = document.getElementById('user-name');
  if (name) name.textContent = user.displayName || 'User';
  
  const greet = document.getElementById('greet-name');
  if (greet) greet.textContent = (user.displayName || 'User').split(' ')[0];
  
  const email = document.getElementById('user-email');
  if (email) email.textContent = user.email;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.onclick = logout;
}

async function loadLastStats(uid) {
  try {
    // We remove the server-side orderBy to avoid requiring a composite index.
    const q = query(
      collection(db, 'predictions'),
      where('uid', '==', uid)
    );
    const snap = await getDocs(q);
    // Sort and limit client-side instead
    const docs = snap.docs.map(d => d.data())
      .sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      .slice(0, 10);
    
    if (docs.length > 0) {
      const avg = Math.round(docs.reduce((s, r) => s + r.bill, 0) / docs.length);
      document.getElementById('stat-avg').textContent = avg.toLocaleString('en-IN');
      document.getElementById('stat-last').textContent = docs[0].units;
    }
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

// --- Appliance Catalog Logic ---

function renderCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  grid.innerHTML = '';

  APPLIANCE_CATALOG.forEach(app => {
    const item = document.createElement('div');
    item.className = 'catalog-item';
    item.innerHTML = `
      <div class="catalog-item-icon">${app.icon}</div>
      <div>${app.name}</div>
    `;
    item.onclick = () => addAppliance(app);
    grid.appendChild(item);
  });
}

function addAppliance(template) {
  const instance = {
    ...template,
    instanceId: Date.now() + Math.random(),
    qty: 1,
    hours: template.defaultHours,
    days: template.defaultDays
  };
  selectedAppliances.push(instance);
  renderSelectedList();
}

function removeAppliance(instanceId) {
  selectedAppliances = selectedAppliances.filter(a => a.instanceId !== instanceId);
  renderSelectedList();
}

function updateAppliance(instanceId, field, value) {
  const app = selectedAppliances.find(a => a.instanceId === instanceId);
  if (app) app[field] = parseFloat(value) || 0;
}

function renderSelectedList() {
  const list = document.getElementById('appliances-list');
  if (!list) return;

  if (selectedAppliances.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">➕</div>
        <div class="empty-state-text">Start by adding appliances from the catalog</div>
      </div>`;
    return;
  }

  list.innerHTML = '';
  selectedAppliances.forEach(app => {
    const row = document.createElement('div');
    row.className = 'appliance-row';
    row.innerHTML = `
      <div class="appliance-row-icon">${app.icon}</div>
      <div class="appliance-row-name">
        ${app.name}
        <div class="appliance-row-watts">${app.watts}W</div>
      </div>
      <div>
        <label style="font-size: 10px;">Qty</label>
        <input type="number" value="${app.qty}" min="1" onchange="window.updateAppInstance('${app.instanceId}', 'qty', this.value)">
      </div>
      <div>
        <label style="font-size: 10px;">Hrs/Day</label>
        <input type="number" value="${app.hours}" min="0.1" max="24" step="0.1" onchange="window.updateAppInstance('${app.instanceId}', 'hours', this.value)">
      </div>
      <div>
        <label style="font-size: 10px;">Days</label>
        <input type="number" value="${app.days}" min="1" max="31" onchange="window.updateAppInstance('${app.instanceId}', 'days', this.value)">
      </div>
      <button class="remove-btn" onclick="window.removeAppInstance('${app.instanceId}')">×</button>
    `;
    list.appendChild(row);
  });
}

// Global exposure for event handlers
window.updateAppInstance = updateAppliance;
window.removeAppInstance = removeAppliance;

// --- Prediction Logic ---

async function runPrediction() {
  if (selectedAppliances.length === 0) {
    showToast("Please add at least one appliance.", "info");
    return;
  }

  if (!isReady()) {
    showToast("AI model is still training...", "info");
    return;
  }

  const btn = document.getElementById('predict-btn');
  btn.disabled = true;
  btn.innerHTML = '<span>⚡</span> Calculating...';

  const tariff = parseFloat(document.getElementById('tariff-type').value);
  const period = parseInt(document.getElementById('billing-period').value);
  
  // Normalize days if period is different from 30
  const factor = period / 30;
  const processed = selectedAppliances.map(a => ({ ...a, days: a.days * factor }));

  const res = predict(processed);
  const bill = Math.round(res.predictedUnits * tariff);

  // Update UI
  document.getElementById('res-bill').textContent = bill.toLocaleString('en-IN');
  document.getElementById('res-units').textContent = res.predictedUnits;
  document.getElementById('res-base').textContent = res.baseUnits;
  document.getElementById('res-peak').textContent = res.peakFactor;
  
  document.getElementById('result-panel').classList.add('show');
  
  // Render Chart
  renderPieChart('usage-chart', processed);
  
  // Render Tips
  const tips = generateTips(processed);
  const tipsList = document.getElementById('tips-list');
  tipsList.innerHTML = tips.map(t => `
    <div class="tip-item">
      <span class="tip-icon">${t.icon}</span>
      <span>${t.text}</span>
    </div>
  `).join('');

  // Save to Firestore
  try {
    await addDoc(collection(db, 'predictions'), {
      uid: currentUser.uid,
      units: res.predictedUnits,
      bill: bill,
      tariff: tariff,
      period: period,
      appliances: processed.length,
      topAppliance: processed.sort((a,b) => (b.watts*b.hours) - (a.watts*a.hours))[0]?.name || 'N/A',
      createdAt: serverTimestamp()
    });
    showToast("Prediction saved to history!", "success");
  } catch (err) {
    console.error("Save error:", err);
    showToast("Failed to save history.", "error");
  }

  btn.disabled = false;
  btn.innerHTML = '<span>⚡</span> Generate AI Prediction';
  
  // Scroll to results
  document.getElementById('result-panel').scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('predict-btn').addEventListener('click', runPrediction);

// Start
renderCatalog();
renderSelectedList();
