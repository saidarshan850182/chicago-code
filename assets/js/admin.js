/* ===== Chicago Code — admin panel (publishes straight to GitHub) ===== */

// Your repository — this is where products and images are saved.
const GH = {
  owner: 'saidarshan850182',
  repo: 'chicago-code',
  branch: 'main',
  dataPath: 'assets/js/products.js',
  imageDir: 'assets/images/products',
};

const TOKEN_KEY = 'cc_gh_token';
const DRAFT_KEY = 'cc_admin_draft';
const CATEGORIES = [
  { cat: 'tees', category: 'Tees' },
  { cat: 'hoodies', category: 'Hoodies' },
  { cat: 'outerwear', category: 'Outerwear' },
  { cat: 'accessories', category: 'Accessories' },
];

let products = [];

function token() { return localStorage.getItem(TOKEN_KEY) || ''; }
function ghHeaders() {
  return { 'Authorization': `Bearer ${token()}`, 'Accept': 'application/vnd.github+json' };
}

// ---- Garment SVG (same as the store) ----
function garmentSVG(color) {
  return `<svg class="tee-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 18 L20 26 L14 40 L24 46 L28 40 L28 84 L72 84 L72 40 L76 46 L86 40 L80 26 L70 18 L60 18 Q50 30 40 18 Z"
      fill="${color}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
    <text x="50" y="62" font-family="Bebas Neue, sans-serif" font-size="13" fill="rgba(255,255,255,0.85)"
      text-anchor="middle" letter-spacing="1">CC</text>
  </svg>`;
}

// ---- Load: draft if present, else published catalog ----
function loadProducts() {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (draft) {
    try { products = JSON.parse(draft); setStatus('draft'); return; } catch (e) { /* fall through */ }
  }
  products = JSON.parse(JSON.stringify(window.CC_PRODUCTS || []));
  setStatus('clean');
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(products));
  setStatus('draft');
}

function setStatus(state, msg) {
  const el = document.getElementById('draftStatus');
  el.classList.remove('saved');
  if (state === 'draft') { el.textContent = '● Unpublished changes'; el.classList.add('saved'); }
  else if (state === 'clean') { el.textContent = 'No changes yet'; }
  else if (state === 'custom') { el.textContent = msg; }
}

// ---- Render the editable list ----
function render() {
  const list = document.getElementById('adminList');
  list.innerHTML = products.map(p => {
    const thumb = p._preview || p.image; // _preview = local preview before deploy finishes
    return `
    <div class="admin-card" data-id="${p.id}">
      <div class="admin-thumb">
        ${thumb ? `<img src="${thumb}" alt="${escapeAttr(p.name)}" />` : garmentSVG(p.color)}
        <label>Upload<input type="file" accept="image/*" data-field="image" /></label>
      </div>
      <div class="admin-fields">
        <div class="admin-field full">
          <label>Product name</label>
          <input type="text" data-field="name" value="${escapeAttr(p.name)}" />
        </div>
        <div class="admin-field">
          <label>Category</label>
          <select data-field="cat">
            ${CATEGORIES.map(c => `<option value="${c.cat}" ${c.cat === p.cat ? 'selected' : ''}>${c.category}</option>`).join('')}
          </select>
        </div>
        <div class="admin-field">
          <label>Badge (optional)</label>
          <input type="text" data-field="badge" value="${escapeAttr(p.badge || '')}" placeholder="New, Best, Limited…" />
        </div>
        <div class="admin-field">
          <label>Price ($)</label>
          <input type="number" min="0" step="0.01" data-field="price" value="${p.price}" />
        </div>
        <div class="admin-field">
          <label>Stock</label>
          <input type="number" min="0" step="1" data-field="stock" value="${p.stock ?? 0}" />
        </div>
      </div>
      <div class="admin-card-side">
        <span class="id-pill">#${p.id}</span>
        <button class="del-btn" data-act="delete">Delete</button>
      </div>
    </div>`;
  }).join('');
}

function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }

// ---- Editing ----
const listEl = document.getElementById('adminList');

listEl.addEventListener('input', e => {
  const card = e.target.closest('.admin-card');
  if (!card) return;
  const id = Number(card.dataset.id);
  const p = products.find(x => x.id === id);
  const field = e.target.dataset.field;
  if (!p || !field) return;

  if (field === 'price') p.price = parseFloat(e.target.value) || 0;
  else if (field === 'stock') p.stock = parseInt(e.target.value, 10) || 0;
  else if (field === 'cat') {
    p.cat = e.target.value;
    p.category = (CATEGORIES.find(c => c.cat === e.target.value) || {}).category || '';
  }
  else if (field === 'badge') p.badge = e.target.value.trim() || null;
  else if (field === 'name') p.name = e.target.value;
  saveDraft();
});

// ---- Image upload → save the file into assets/images/products/ on GitHub ----
listEl.addEventListener('change', async e => {
  if (e.target.dataset.field !== 'image') return;
  const card = e.target.closest('.admin-card');
  const id = Number(card.dataset.id);
  const p = products.find(x => x.id === id);
  const file = e.target.files[0];
  if (!file || !p) return;
  if (!token()) { showToast('Connect with your GitHub token first'); return; }
  if (file.size > 1.5 * 1024 * 1024) { showToast('Image too big — please use one under 1.5 MB'); return; }

  // Show an instant local preview while the upload happens
  const previewReader = new FileReader();
  previewReader.onload = () => { p._preview = previewReader.result; render(); };
  previewReader.readAsDataURL(file);

  showToast('Uploading image…');
  try {
    const path = await uploadImage(file, p.id);
    p.image = path;        // store the FILE PATH, not the image data
    saveDraft();
    showToast('Image uploaded — click Publish to make it live');
  } catch (err) {
    showToast('Image upload failed: ' + err.message);
  }
});

// Read a file as raw base64 (no data: prefix) for the GitHub API
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function uploadImage(file, productId) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${GH.imageDir}/${productId}-${Date.now()}.${ext}`;
  const content = await fileToBase64(file);
  const res = await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${path}`, {
    method: 'PUT',
    headers: ghHeaders(),
    body: JSON.stringify({ message: `Add product image ${path}`, content, branch: GH.branch }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `status ${res.status}`);
  }
  return path;
}

// ---- Delete ----
listEl.addEventListener('click', e => {
  const btn = e.target.closest('[data-act="delete"]');
  if (!btn) return;
  const card = e.target.closest('.admin-card');
  const id = Number(card.dataset.id);
  const p = products.find(x => x.id === id);
  if (confirm(`Delete "${p.name}"? It will be removed when you publish.`)) {
    products = products.filter(x => x.id !== id);
    saveDraft();
    render();
    showToast('Product removed');
  }
});

// ---- Add product ----
document.getElementById('addBtn').addEventListener('click', () => {
  const nextId = products.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  products.push({
    id: nextId, name: 'New Product', cat: 'tees', category: 'Tees',
    price: 0, stock: 0, badge: 'New', color: '#d6233c', image: null,
  });
  saveDraft();
  render();
  const cards = listEl.querySelectorAll('.admin-card');
  cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast('Product added — fill in the details');
});

// ---- Discard changes ----
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Discard your unpublished changes and reload the live products?')) return;
  localStorage.removeItem(DRAFT_KEY);
  loadProducts();
  render();
  showToast('Changes discarded');
});

// ---- Build the products.js file content ----
function buildFileContent() {
  const lines = products.map(p =>
    `  ${JSON.stringify({
      id: p.id, name: p.name, cat: p.cat, category: p.category,
      price: p.price, stock: p.stock, badge: p.badge, color: p.color, image: p.image || null,
    })},`
  ).join('\n');
  return `/* ===== Chicago Code — product catalog =====
   Managed through admin.html. Published directly to GitHub.
   Do not edit by hand unless you know what you're doing. */
window.CC_PRODUCTS = [
${lines}
];
`;
}

// UTF-8 safe base64 (GitHub API needs base64-encoded content)
function toBase64(str) { return btoa(unescape(encodeURIComponent(str))); }

// ---- Publish straight to GitHub ----
const publishBtn = document.getElementById('publishBtn');

publishBtn.addEventListener('click', async () => {
  if (!token()) { showToast('Connect with your GitHub token first'); return; }
  publishBtn.disabled = true;
  publishBtn.textContent = 'Publishing…';
  setStatus('custom', 'Publishing to GitHub…');

  const apiUrl = `https://api.github.com/repos/${GH.owner}/${GH.repo}/contents/${GH.dataPath}`;
  try {
    // 1. Get the current file's SHA (required to update an existing file)
    let sha;
    const getRes = await fetch(`${apiUrl}?ref=${GH.branch}`, { headers: ghHeaders() });
    if (getRes.ok) { sha = (await getRes.json()).sha; }
    else if (getRes.status !== 404) { throw new Error(`Could not read repo (${getRes.status})`); }

    // 2. Write the new data file
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: ghHeaders(),
      body: JSON.stringify({
        message: 'Update products via admin panel',
        content: toBase64(buildFileContent()),
        branch: GH.branch,
        sha,
      }),
    });
    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(err.message || `Publish failed (${putRes.status})`);
    }

    localStorage.removeItem(DRAFT_KEY);
    products.forEach(p => delete p._preview);
    setStatus('custom', '✓ Published — live in ~1 min');
    showToast('Published! Your store updates in about a minute.');
  } catch (e) {
    setStatus('draft');
    showToast('Publish failed: ' + e.message);
  } finally {
    publishBtn.disabled = false;
    publishBtn.textContent = 'Publish to Live Site';
  }
});

// ---- Toast ----
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ---- Access gate: validate the GitHub token ----
const gate = document.getElementById('gate');
const gateBtn = document.getElementById('gateBtn');

async function tryConnect() {
  const val = document.getElementById('gateInput').value.trim();
  const errEl = document.getElementById('gateErr');
  if (!val) { errEl.textContent = 'Please paste your token.'; return; }
  gateBtn.disabled = true; gateBtn.textContent = 'Connecting…'; errEl.textContent = '';
  try {
    const res = await fetch(`https://api.github.com/repos/${GH.owner}/${GH.repo}`, {
      headers: { 'Authorization': `Bearer ${val}`, 'Accept': 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error('Token rejected — check its repo access and permissions.');
    localStorage.setItem(TOKEN_KEY, val);
    gate.style.display = 'none';
  } catch (e) {
    errEl.textContent = e.message;
  } finally {
    gateBtn.disabled = false; gateBtn.textContent = 'Connect';
  }
}

gateBtn.addEventListener('click', tryConnect);
document.getElementById('gateInput').addEventListener('keydown', e => { if (e.key === 'Enter') tryConnect(); });
document.getElementById('tokenHelpLink').addEventListener('click', e => {
  e.preventDefault();
  const h = document.getElementById('tokenHelp');
  h.style.display = h.style.display === 'none' ? 'block' : 'none';
});

if (token()) gate.style.display = 'none';
else document.getElementById('gateInput').focus();

// ---- Init ----
loadProducts();
render();
