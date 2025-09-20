// app.js - frontend logic
const currencyRates = { USD: 1, AED: 3.67, EUR: 0.92 }; // simple static example
let products = [];
let currentCurrency = 'USD';
let currentLang = 'en';

document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  await fetchProducts();
  setupUI();
  updateCartCount();
}

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();
    renderCollections();
    renderProducts(products);
  } catch (err) {
    console.error('Failed to load products', err);
    document.getElementById('productsRow').innerHTML = '<p class="text-danger">Failed to load products.</p>';
  }
}

function renderCollections() {
  const collections = Array.from(new Set(products.map(p => p.collection || 'Others')));
  const menu = document.getElementById('collectionsMenu');
  menu.innerHTML = '';
  const liAll = document.createElement('li');
  liAll.className = 'nav-item';
  liAll.innerHTML = `<a class="nav-link" href="#" onclick="filterCollection('All')">All</a>`;
  menu.appendChild(liAll);
  collections.forEach(c => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    li.innerHTML = `<a class="nav-link" href="#" onclick="filterCollection('${escapeHtml(c)}')">${c}</a>`;
    menu.appendChild(li);
  });
}

function renderProducts(list) {
  const row = document.getElementById('productsRow');
  row.innerHTML = '';
  if (!list.length) {
    row.innerHTML = '<p class="text-muted">No products found.</p>';
    return;
  }
  list.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-4';
    col.innerHTML = `
      <div class="card product-card h-100">
        <img src="${p.image}" class="card-img-top" alt="${escapeHtml(p.title)}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.title}</h5>
          <p class="card-text small text-muted">${p.collection || ''}</p>
          <p class="card-text">${p.description || ''}</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <strong>${formatPrice(p.priceUSD)}</strong>
            <div>
              <button class="btn btn-sm btn-outline-primary" onclick="openDetails(${p.id})">Details</button>
              <button class="btn btn-sm btn-primary" onclick="addToCart(${p.id})">Add</button>
            </div>
          </div>
        </div>
      </div>`;
    row.appendChild(col);
  });
}

function filterCollection(name) {
  if (name === 'All') {
    renderProducts(products);
  } else {
    renderProducts(products.filter(p => p.collection === name));
  }
}

function openDetails(id) {
  const p = products.find(x => x.id === id);
  if (!p) return alert('Product not found');
  alert(`${p.title}\n\n${p.description}\n\nPrice: ${formatPrice(p.priceUSD)}`);
}

function addToCart(id) {
  const cart = JSON.parse(localStorage.getItem('elke_cart') || '[]');
  cart.push({ id, qty: 1 });
  localStorage.setItem('elke_cart', JSON.stringify(cart));
  updateCartCount();
  showToast('Added to cart');
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('elke_cart') || '[]');
  document.getElementById('cartCount').innerText = cart.length || 0;
}

function showToast(msg) {
  // simple browser notification
  const el = document.createElement('div');
  el.style = 'position:fixed;right:20px;bottom:20px;background:#222;color:white;padding:10px 14px;border-radius:6px;z-index:9999';
  el.innerText = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function setupUI() {
  document.getElementById('currencySelect').addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    renderProducts(products);
  });
  document.getElementById('langSelect').addEventListener('change', (e) => {
    currentLang = e.target.value;
    applyLanguage();
  });
  document.getElementById('cartBtn').addEventListener('click', () => {
    renderCartModal();
    const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
    cartModal.show();
  });
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return renderProducts(products);
    const filtered = products.filter(p => (p.title + ' ' + p.description + ' ' + (p.collection||'')).toLowerCase().includes(q));
    renderProducts(filtered);
  });
  document.getElementById('contactForm').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const name = document.getElementById('c-name').value;
    const email = document.getElementById('c-email').value;
    const message = document.getElementById('c-message').value;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });
      const j = await res.json();
      document.getElementById('contactResult').innerText = j.message || j.error || 'Sent';
      document.getElementById('contactForm').reset();
    } catch (err) {
      document.getElementById('contactResult').innerText = 'Failed to send. Try again.';
    }
  });

  document.getElementById('checkoutBtn').addEventListener('click', () => {
    // simple simulated checkout
    localStorage.removeItem('elke_cart');
    updateCartCount();
    const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
    cartModal.hide();
    alert('Checkout simulated. To add real payments integrate Stripe or PayPal.');
  });
}

function renderCartModal() {
  const cart = JSON.parse(localStorage.getItem('elke_cart') || '[]');
  if (!cart.length) {
    document.getElementById('cartModalBody').innerHTML = '<p>Your cart is empty.</p>';
    return;
  }
  const items = cart.map(it => {
    const p = products.find(x => x.id === it.id) || {};
    return { ...p, qty: it.qty || 1 };
  });
  let html = `<div class="list-group">`;
  items.forEach((it, idx) => {
    html += `<div class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <strong>${escapeHtml(it.title)}</strong><br>
        <small class="text-muted">${escapeHtml(it.collection || '')}</small>
      </div>
      <div class="text-end">
        <div>${formatPrice(it.priceUSD)} x ${it.qty}</div>
        <button class="btn btn-sm btn-link text-danger" onclick="removeFromCart(${idx})">Remove</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  document.getElementById('cartModalBody').innerHTML = html;
}

function removeFromCart(index) {
  const cart = JSON.parse(localStorage.getItem('elke_cart') || '[]');
  cart.splice(index, 1);
  localStorage.setItem('elke_cart', JSON.stringify(cart));
  updateCartCount();
  renderCartModal();
}

function formatPrice(usd) {
  const rate = currencyRates[currentCurrency] || 1;
  const v = (usd * rate).toFixed(2);
  if (currentCurrency === 'USD') return `$${v}`;
  if (currentCurrency === 'AED') return `AED ${v}`;
  if (currentCurrency === 'EUR') return `€${v}`;
  return `${v} ${currentCurrency}`;
}

function applyLanguage() {
  if (currentLang === 'ar') {
    document.documentElement.dir = 'rtl';
    document.getElementById('heroTitle').innerText = 'إلكي كلكشنز';
    document.getElementById('heroSub').innerText = 'عطور ومنتجات العناية بالبشرة';
    document.getElementById('contactTitle').innerText = 'اتصل بنا';
  } else {
    document.documentElement.dir = 'ltr';
    document.getElementById('heroTitle').innerText = 'Elke Collections';
    document.getElementById('heroSub').innerText = 'Fine perfumes & skin care — curated collections';
    document.getElementById('contactTitle').innerText = 'Contact us';
  }
  // re-render to reflect direction changes
  renderProducts(products);
}

function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
function renderPageProducts(list, containerId) {
  const row = document.getElementById(containerId);
  row.innerHTML = '';
  list.forEach(p => {
    const col = document.createElement('div');
    col.className = 'col-md-4';
    col.innerHTML = `
      <div class="card h-100">
        <img src="${p.image}" class="card-img-top" alt="${p.title}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.title}</h5>
          <p>${p.description}</p>
          <div class="mt-auto d-flex justify-content-between">
            <span class="fw-bold">$${p.priceUSD}</span>
            <button class="btn btn-sm btn-dark" onclick="addToCart(${p.id})">Add</button>
          </div>
        </div>
      </div>`;
    row.appendChild(col);
  });
}
