const API = '/api/superadmin';
let token = localStorage.getItem('sa_token');

if (token) showDashboard();

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
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
    localStorage.setItem('sa_token', token);
    showDashboard();
  } catch (err) {
    msg.textContent = err.message;
  }
}

function logout() {
  localStorage.removeItem('sa_token');
  token = null;
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('loginBox').classList.remove('hidden');
}

function showDashboard() {
  document.getElementById('loginBox').classList.add('hidden');
  document.getElementById('dashboard').classList.remove('hidden');
  loadOrgs();
}

async function createOrg() {
  const name = document.getElementById('orgName').value.trim();
  const msg = document.getElementById('orgMsg');
  msg.textContent = '';
  if (!name) { msg.textContent = 'Enter an organization name'; return; }

  try {
    const res = await fetch(`${API}/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create organization');

    document.getElementById('orgName').value = '';
    loadOrgs();
  } catch (err) {
    msg.textContent = err.message;
  }
}

async function loadOrgs() {
  const res = await fetch(`${API}/organizations`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  const tbody = document.querySelector('#orgTable tbody');
  tbody.innerHTML = '';
  if (!res.ok) return;

  data.organizations.forEach((org) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${org.id}</td><td>${org.name}</td><td>${new Date(org.created_at).toLocaleDateString()}</td>`;
    tbody.appendChild(tr);
  });
}
