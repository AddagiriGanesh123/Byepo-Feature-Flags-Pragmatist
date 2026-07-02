const API = '/api/public';

loadOrgs();

async function loadOrgs() {
  const res = await fetch(`${API}/organizations`);
  const data = await res.json();
  const select = document.getElementById('orgSelect');
  if (!res.ok) return;

  data.organizations.forEach((org) => {
    const opt = document.createElement('option');
    opt.value = org.id;
    opt.textContent = org.name;
    select.appendChild(opt);
  });
}

async function checkFlag() {
  const org_id = document.getElementById('orgSelect').value;
  const feature_key = document.getElementById('featureKey').value.trim();
  const resultBox = document.getElementById('result');
  const resultText = document.getElementById('resultText');

  if (!org_id || !feature_key) {
    resultBox.classList.remove('hidden');
    resultText.innerHTML = '<span class="unknown">Please select an organization and enter a feature key.</span>';
    return;
  }

  try {
    const res = await fetch(`${API}/check-flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ org_id, feature_key }),
    });
    const data = await res.json();
    resultBox.classList.remove('hidden');

    if (!res.ok) {
      resultText.innerHTML = `<span class="unknown">${data.error}</span>`;
      return;
    }
    if (!data.found) {
      resultText.innerHTML = `<span class="unknown">Feature "${feature_key}" is not configured for this organization.</span>`;
      return;
    }
    resultText.innerHTML = data.enabled
      ? `<span class="on">✅ "${feature_key}" is ENABLED</span>`
      : `<span class="off">❌ "${feature_key}" is DISABLED</span>`;
  } catch (err) {
    resultBox.classList.remove('hidden');
    resultText.innerHTML = `<span class="unknown">Something went wrong. Is the server running?</span>`;
  }
}
