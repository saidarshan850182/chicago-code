/* ===== Chicago Code — store logic ===== */

// ---- Product catalog ----
const PRODUCTS = [
  { id: 1,  name: 'Wrigley Box Tee',        cat: 'tees',        category: 'Tees',        price: 38,  badge: 'New',     color: '#d6233c' },
  { id: 2,  name: 'The Loop Heavy Tee',      cat: 'tees',        category: 'Tees',        price: 42,  badge: null,      color: '#2a2a31' },
  { id: 3,  name: 'Lakefront Pocket Tee',    cat: 'tees',        category: 'Tees',        price: 40,  badge: null,      color: '#41b6e6' },
  { id: 4,  name: 'Lake Effect Hoodie',      cat: 'hoodies',     category: 'Hoodies',     price: 78,  badge: 'Best',    color: '#1b4965' },
  { id: 5,  name: 'Pilsen Press Hoodie',     cat: 'hoodies',     category: 'Hoodies',     price: 82,  badge: null,      color: '#d6233c' },
  { id: 6,  name: 'Second City Crewneck',    cat: 'hoodies',     category: 'Hoodies',     price: 68,  badge: null,      color: '#555' },
  { id: 7,  name: 'Windy City Parka',        cat: 'outerwear',   category: 'Outerwear',   price: 168, badge: 'Limited', color: '#0e0e0f' },
  { id: 8,  name: 'Division St. Bomber',     cat: 'outerwear',   category: 'Outerwear',   price: 142, badge: null,      color: '#1b4965' },
  { id: 9,  name: 'Code Cuffed Beanie',      cat: 'accessories', category: 'Accessories', price: 28,  badge: null,      color: '#d6233c' },
  { id: 10, name: 'Flag Stripe Socks',       cat: 'accessories', category: 'Accessories', price: 16,  badge: null,      color: '#41b6e6' },
  { id: 11, name: 'CC Snapback Cap',         cat: 'accessories', category: 'Accessories', price: 32,  badge: 'New',     color: '#2a2a31' },
  { id: 12, name: 'Riverwalk Tote',          cat: 'accessories', category: 'Accessories', price: 24,  badge: null,      color: '#555' },
];

// Simple SVG "garment" so the site has art with no external images
function garmentSVG(color) {
  return `<svg class="tee-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 18 L20 26 L14 40 L24 46 L28 40 L28 84 L72 84 L72 40 L76 46 L86 40 L80 26 L70 18 L60 18 Q50 30 40 18 Z"
      fill="${color}" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>
    <text x="50" y="62" font-family="Bebas Neue, sans-serif" font-size="13" fill="rgba(255,255,255,0.85)"
      text-anchor="middle" letter-spacing="1">CC</text>
  </svg>`;
}

// ---- Render products ----
const grid = document.getElementById('productGrid');

function renderProducts(filter = 'all') {
  const list = filter === 'all' ? PRODUCTS : PRODUCTS.filter(p => p.cat === filter);
  grid.innerHTML = list.map(p => `
    <div class="product-card" data-cat="${p.cat}">
      <div class="product-img">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        ${garmentSVG(p.color)}
      </div>
      <div class="product-info">
        <span class="product-cat">${p.category}</span>
        <span class="product-name">${p.name}</span>
        <span class="product-price">$${p.price.toFixed(2)}</span>
        <button class="product-add" data-id="${p.id}">Add to Cart</button>
      </div>
    </div>
  `).join('');
}
renderProducts();

// ---- Filters ----
document.getElementById('filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProducts(btn.dataset.filter);
});

// ---- Cart state (persisted) ----
let cart = JSON.parse(localStorage.getItem('cc_cart') || '[]');

const cartCountEl = document.getElementById('cartCount');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');

function saveCart() { localStorage.setItem('cc_cart', JSON.stringify(cart)); }

function addToCart(id) {
  const product = PRODUCTS.find(p => p.id === id);
  const existing = cart.find(i => i.id === id);
  if (existing) existing.qty++;
  else cart.push({ id, name: product.name, price: product.price, color: product.color, qty: 1 });
  saveCart();
  updateCart();
  showToast(`${product.name} added to cart`);
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCart();
}

function removeItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  updateCart();
}

function updateCart() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  cartCountEl.textContent = count;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.<br />Time to wear the city.</p>';
  } else {
    cartItemsEl.innerHTML = cart.map(i => `
      <div class="cart-item">
        <div class="cart-item-img">${garmentSVG(i.color)}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${i.name}</div>
          <div class="cart-item-price">$${i.price.toFixed(2)}</div>
          <div class="qty">
            <button data-act="dec" data-id="${i.id}">−</button>
            <span>${i.qty}</span>
            <button data-act="inc" data-id="${i.id}">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-act="rm" data-id="${i.id}">Remove</button>
      </div>
    `).join('');
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  cartTotalEl.textContent = `$${total.toFixed(2)}`;
}

// Event delegation
grid.addEventListener('click', e => {
  const btn = e.target.closest('.product-add');
  if (btn) addToCart(Number(btn.dataset.id));
});

cartItemsEl.addEventListener('click', e => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (btn.dataset.act === 'inc') changeQty(id, 1);
  if (btn.dataset.act === 'dec') changeQty(id, -1);
  if (btn.dataset.act === 'rm') removeItem(id);
});

// ---- Cart drawer open/close ----
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');

function openCart() { cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); }
function closeCart() { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); }

document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

document.getElementById('checkoutBtn').addEventListener('click', () => {
  if (cart.length === 0) { showToast('Your cart is empty'); return; }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  showToast(`Demo checkout — total $${total.toFixed(2)}. Thanks!`);
  cart = [];
  saveCart();
  updateCart();
  setTimeout(closeCart, 600);
});

// ---- Mobile menu ----
const nav = document.getElementById('nav');
document.getElementById('menuToggle').addEventListener('click', () => nav.classList.toggle('open'));
nav.addEventListener('click', e => { if (e.target.tagName === 'A') nav.classList.remove('open'); });

// ---- Toast ----
let toastTimer;
const toastEl = document.getElementById('toast');
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

// ---- Forms ----
document.getElementById('newsletterForm').addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('newsletterNote').textContent = "You're in. Check your inbox for 15% off.";
  e.target.reset();
});

document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  document.getElementById('contactNote').textContent = "Thanks — we'll get back to you within 24 hours.";
  e.target.reset();
});

// ---- Init ----
updateCart();
