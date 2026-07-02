const API = '/api/admin';
const PUBLIC_API = '/api/public';
let token = localStorage.getItem('admin_token');
let orgName = localStorage.getItem('admin_org_name');

if (token) showDashboard();
loadOrgsIntoSelect();

function showTab(tab) {
  document.getElementById('loginBox').classList.toggle('hidden', tab !== 'login');
  document.getElementById('signupBox').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabSignup').classList.toggle('active', tab === 'signup');
}

async function loadOrgsIntoSelect() {
  const res = await fetch(`${PUBLIC_API}/organizations`);
  const data = await res.json();
  const select = document.getElementById('signupOrg');
  if (!res.ok) return;
  data.organizations.forEach((org) => {
    const opt = document.createElement('option');
    opt.value = org.id;
    opt.textContent = org.name;
    select.appendChild(opt);
  });
}

async function signup() {
  const org_id = document.getElementById('signupOrg').value;
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const msg = document.getElementById('signupMsg');
  msg.textContent = '';

  if (!org_id || !email || !password) { msg.textContent = 'All fields are required'; return; }

  try {
    const res = await fetch(`${API}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');

    msg.style.color = '#4ade80';
    msg.textContent = 'Account created. You can now log in.';
    showTab('login');
  } catch (err) {
    msg.style.color = '#fbbf24';
    msg.textContent = err.message;
  }
}

async function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');
  msg.textContent = '';

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    token = data.token;
    orgName = data.user.org_name;
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_org_name', orgName);
    showDashboard();
  } catch (err) {
    msg.textContent = err.message;
  }
}

function logout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_org_name');
  token = null;
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('tabs').classList.remove('hidden');
  showTab('login');
}

function showDashboard() {
  document.getElementById('tabs').classList.add('hidden');
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('signupBox').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('orgLabel').textContent = orgName ? `Organization: ${orgName}` : '';
  loadFlags();
}

async function createFlag() {
  const feature_key = document.getElementById('featureKey').value.trim();
  const msg = document.getElementById('flagMsg');
  msg.textContent = '';
  if (!feature_key) { msg.textContent = 'Enter a feature key'; return; }

  try {
    const res = await fetch(`${API}/flags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ feature_key, enabled: false }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create flag');

    document.getElementById('featureKey').value = '';
    loadFlags();
  } catch (err) {
    msg.textContent = err.message;
  }
}

async function loadFlags() {
  const res = await fetch(`${API}/flags`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  const tbody = document.querySelector('#flagTable tbody');
  tbody.innerHTML = '';
  if (!res.ok) return;

  data.flags.forEach((flag) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${flag.feature_key}</td>
      <td class="${flag.enabled ? 'badge-on' : 'badge-off'}">${flag.enabled ? 'ENABLED' : 'DISABLED'}</td>
      <td>
        <button class="toggle-btn" onclick="toggleFlag(${flag.id}, ${!flag.enabled})">${flag.enabled ? 'Disable' : 'Enable'}</button>
        <button class="delete-btn" onclick="deleteFlag(${flag.id})">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

async function toggleFlag(id, enabled) {
  await fetch(`${API}/flags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ enabled }),
  });
  loadFlags();
}

async function deleteFlag(id) {
  await fetch(`${API}/flags/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  loadFlags();
}
