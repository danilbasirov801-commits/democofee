/* ============================================================
   Зерно — интернет-магазин кофе
   Ванильный JS: каталог, фильтры, корзина (localStorage), слайдер.
   ============================================================ */

'use strict';

/* ---------- Данные каталога ---------- */

const PRODUCTS = [
  { id: 1,  name: 'Эфиопия Иргачеффе',  type: 'bean',   roast: 'light',  weight: '250 г',   price: 890,  oldPrice: null, rating: 4.9, badge: 'hit',  popular: 98, notes: 'Бергамот, персик, жасмин' },
  { id: 2,  name: 'Колумбия Супремо',   type: 'bean',   roast: 'medium', weight: '250 г',   price: 690,  oldPrice: null, rating: 4.8, badge: null,   popular: 92, notes: 'Молочный шоколад, апельсин' },
  { id: 3,  name: 'Бразилия Сантос',    type: 'bean',   roast: 'medium', weight: '250 г',   price: 590,  oldPrice: 690,  rating: 4.7, badge: 'sale', popular: 90, notes: 'Орехи, какао, мускат' },
  { id: 4,  name: 'Гватемала Антигуа',  type: 'bean',   roast: 'medium', weight: '250 г',   price: 740,  oldPrice: null, rating: 4.8, badge: null,   popular: 81, notes: 'Специи, чёрный шоколад' },
  { id: 5,  name: 'Кения АА',           type: 'bean',   roast: 'light',  weight: '250 г',   price: 990,  oldPrice: null, rating: 4.9, badge: 'new',  popular: 77, notes: 'Чёрная смородина, грейпфрут' },
  { id: 6,  name: 'Тёмный Мокко',       type: 'bean',   roast: 'dark',   weight: '250 г',   price: 640,  oldPrice: null, rating: 4.8, badge: 'hit',  popular: 95, notes: 'Горький шоколад, карамель' },
  { id: 7,  name: 'Итальянская обжарка', type: 'ground', roast: 'dark',   weight: '250 г',   price: 540,  oldPrice: null, rating: 4.6, badge: null,   popular: 88, notes: 'Плотный вкус, для эспрессо' },
  { id: 8,  name: 'Молотый для турки',  type: 'ground', roast: 'dark',   weight: '250 г',   price: 490,  oldPrice: null, rating: 4.7, badge: null,   popular: 84, notes: 'Насыщенный, восточные специи' },
  { id: 9,  name: 'Дрип-пакеты «Путешествие»', type: 'drip', roast: 'light', weight: '5 × 12 г', price: 590, oldPrice: null, rating: 4.9, badge: 'new', popular: 74, notes: '5 разных сортов, без посуды' },
  { id: 10, name: 'Дегустационный сет', type: 'drip',   roast: 'medium', weight: '4 × 100 г', price: 990, oldPrice: 1150, rating: 5.0, badge: 'sale', popular: 86, notes: '4 сорта по 100 г в подарочной коробке' },
];

const ROAST_LABELS = { light: 'светлая', medium: 'средняя', dark: 'тёмная' };
const FREE_DELIVERY_FROM = 2000;
const DELIVERY_COST = 300;
const PROMO_CODES = { 'ЗЕРНО10': 0.10 };

/* ---------- Состояние ---------- */

const state = {
  type: 'all',
  roast: 'all',
  sort: 'popular',
  cart: loadCart(),   // { [productId]: qty }
  promo: null,        // { code, rate }
};

function loadCart() {
  try { return JSON.parse(localStorage.getItem('zerno-cart')) ?? {}; }
  catch { return {}; }
}

function saveCart() {
  localStorage.setItem('zerno-cart', JSON.stringify(state.cart));
}

const fmtPrice = new Intl.NumberFormat('ru-RU');
const rub = (n) => `${fmtPrice.format(n)} ₽`;

/* ---------- SVG-арт упаковки (генерируется для каждой карточки) ---------- */

const ROAST_COLORS = {
  light:  { bag: '#D9A05B', label: '#FAF7F2', text: '#8F4E1E' },
  medium: { bag: '#B4642D', label: '#F1E7D8', text: '#FAF7F2' },
  dark:   { bag: '#4A3327', label: '#3B2A20', text: '#E9DECD' },
};

function bagSVG(product) {
  const c = ROAST_COLORS[product.roast];
  const short = product.name.slice(0, 12);
  return `
  <svg viewBox="0 0 120 140" width="112" height="130" aria-hidden="true">
    <rect x="24" y="6" width="72" height="18" rx="6" fill="#3B2A20"/>
    <path d="M26 20h68v96a12 12 0 0 1-12 12H38a12 12 0 0 1-12-12V20Z" fill="${c.bag}"/>
    <path d="M26 20h68v14H26z" fill="rgba(0,0,0,.18)"/>
    <rect x="38" y="48" width="44" height="56" rx="8" fill="${c.label}"/>
    <text x="60" y="72" text-anchor="middle" textLength="38" lengthAdjust="spacingAndGlyphs" font-size="8" font-weight="bold" fill="${c.text}" font-family="Georgia, serif">${short}</text>
    <text x="60" y="86" text-anchor="middle" textLength="38" lengthAdjust="spacingAndGlyphs" font-size="7" fill="${c.text}" opacity=".8">${ROAST_LABELS[product.roast]} обжарка</text>
    <text x="60" y="98" text-anchor="middle" textLength="30" lengthAdjust="spacingAndGlyphs" font-size="7" fill="${c.text}" opacity=".8">${product.weight}</text>
  </svg>`;
}

/* ---------- Рендер каталога ---------- */

const gridEl = document.getElementById('catalog-grid');
const emptyEl = document.getElementById('catalog-empty');

const BADGES = {
  hit: { cls: 'card__badge--hit', text: 'Хит' },
  new: { cls: 'card__badge--new', text: 'Новинка' },
  sale: { cls: 'card__badge--sale', text: 'Скидка' },
};

function filteredProducts() {
  let list = PRODUCTS.filter(
    (p) =>
      (state.type === 'all' || p.type === state.type) &&
      (state.roast === 'all' || p.roast === state.roast)
  );
  if (state.sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (state.sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => b.popular - a.popular);
  return list;
}

function renderCatalog() {
  const list = filteredProducts();
  emptyEl.hidden = list.length > 0;
  gridEl.innerHTML = list.map((p) => {
    const badge = p.badge
      ? `<span class="card__badge ${BADGES[p.badge].cls}">${BADGES[p.badge].text}</span>`
      : '';
    const oldPrice = p.oldPrice ? `<s>${rub(p.oldPrice)}</s>` : '';
    const inCart = state.cart[p.id] > 0;
    return `
    <article class="card" data-id="${p.id}">
      <div class="card__media">${badge}${bagSVG(p)}</div>
      <div class="card__body">
        <span class="card__meta">${ROAST_LABELS[p.roast]} · ${p.weight}</span>
        <h3 class="card__name">${p.name}</h3>
        <p class="card__notes">${p.notes}</p>
        <div class="card__rating">★ ${p.rating.toFixed(1)}</div>
        <div class="card__bottom">
          <div class="card__price">${rub(p.price)}${oldPrice}</div>
          <button class="card__add ${inCart ? 'is-in-cart' : ''}" data-add="${p.id}">
            ${inCart ? 'В корзине ✓' : 'В корзину'}
          </button>
        </div>
      </div>
    </article>`;
  }).join('');
}

/* ---------- Корзина ---------- */

const cartEl = document.getElementById('cart');
const overlayEl = document.getElementById('overlay');
const cartBodyEl = document.getElementById('cart-body');
const cartFooterEl = document.getElementById('cart-footer');
const cartEmptyEl = document.getElementById('cart-empty');
const cartCountEl = document.getElementById('cart-count');

const cartQty = () =>
  Object.values(state.cart).reduce((sum, q) => sum + q, 0);

const cartSubtotal = () =>
  PRODUCTS.reduce((sum, p) => sum + (state.cart[p.id] ?? 0) * p.price, 0);

function deliveryCost() {
  const subtotal = cartSubtotal();
  if (subtotal === 0) return 0;
  const method = document.querySelector('input[name="delivery"]:checked')?.value;
  if (method === 'pickup') return 0;
  return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_COST;
}

function openCart() {
  cartEl.classList.add('is-open');
  cartEl.setAttribute('aria-hidden', 'false');
  overlayEl.hidden = false;
  requestAnimationFrame(() => overlayEl.classList.add('is-open'));
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartEl.classList.remove('is-open');
  cartEl.setAttribute('aria-hidden', 'true');
  overlayEl.classList.remove('is-open');
  setTimeout(() => { overlayEl.hidden = true; }, 250);
  document.body.style.overflow = '';
}

function renderCart() {
  const ids = Object.keys(state.cart).filter((id) => state.cart[id] > 0);
  const count = cartQty();

  cartCountEl.hidden = count === 0;
  cartCountEl.textContent = count;

  const hasItems = ids.length > 0;
  cartEmptyEl.hidden = hasItems;
  cartFooterEl.hidden = !hasItems;
  document.querySelector('.cart__body').hidden = !hasItems;

  if (!hasItems) return;

  cartBodyEl.innerHTML = ids.map((id) => {
    const p = PRODUCTS.find((x) => x.id === Number(id));
    const qty = state.cart[p.id];
    return `
    <div class="cart-item">
      <div class="cart-item__art">${bagSVG(p)}</div>
      <div>
        <div class="cart-item__name">${p.name}</div>
        <div class="cart-item__price">${rub(p.price * qty)}</div>
        <div class="cart-item__qty">
          <button data-dec="${p.id}" aria-label="Убавить">−</button>
          <span>${qty}</span>
          <button data-inc="${p.id}" aria-label="Прибавить">+</button>
        </div>
      </div>
      <button class="cart-item__remove" data-remove="${p.id}">Удалить</button>
    </div>`;
  }).join('');

  const subtotal = cartSubtotal();
  const discount = state.promo ? Math.round(subtotal * state.promo.rate) : 0;
  const delivery = deliveryCost();
  const total = subtotal - discount + delivery;

  document.getElementById('subtotal').textContent = rub(subtotal);
  document.getElementById('row-discount').hidden = discount === 0;
  document.getElementById('discount').textContent = `−${rub(discount)}`;
  document.getElementById('delivery-cost').textContent =
    subtotal === 0 ? '—' : delivery === 0 ? 'бесплатно' : rub(delivery);
  document.getElementById('total').textContent = rub(total);
}

function addToCart(id) {
  state.cart[id] = (state.cart[id] ?? 0) + 1;
  saveCart();
  renderCatalog();
  renderCart();
  const p = PRODUCTS.find((x) => x.id === id);
  showToast(`«${p.name}» — добавлен в корзину`);
}

function setQty(id, delta) {
  const next = (state.cart[id] ?? 0) + delta;
  if (next <= 0) delete state.cart[id];
  else state.cart[id] = next;
  saveCart();
  renderCatalog();
  renderCart();
}

function removeItem(id) {
  delete state.cart[id];
  saveCart();
  renderCatalog();
  renderCart();
}

/* ---------- Оформление заказа ---------- */

const checkoutForm = document.getElementById('checkout-form');
const checkoutError = document.getElementById('checkout-error');
const cartSuccess = document.getElementById('cart-success');

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) return digits;
  return null;
}

function validateCheckout() {
  const name = document.getElementById('f-name');
  const phone = document.getElementById('f-phone');
  const address = document.getElementById('f-address');
  const method = document.querySelector('input[name="delivery"]:checked').value;
  [name, phone, address].forEach((f) => f.classList.remove('is-invalid'));

  if (name.value.trim().length < 2) { name.classList.add('is-invalid'); return 'Укажите имя (минимум 2 символа)'; }
  if (!normalizePhone(phone.value)) { phone.classList.add('is-invalid'); return 'Телефон в формате +7 (999) 123-45-67'; }
  if (method === 'courier' && address.value.trim().length < 5) { address.classList.add('is-invalid'); return 'Укажите адрес доставки'; }
  return null;
}

function submitOrder(e) {
  e.preventDefault();
  const error = validateCheckout();
  checkoutError.hidden = !error;
  checkoutError.textContent = error ?? '';
  if (error) return;

  const orderId = 1000 + Math.floor(Math.random() * 9000);
  const name = document.getElementById('f-name').value.trim();

  // Демо-проект: заказ никуда не отправляется, только имитация оформления
  document.getElementById('success-text').textContent =
    `Заказ №${orderId} на имя ${name}. Мы позвоним для подтверждения в течение часа.`;

  state.cart = {};
  state.promo = null;
  saveCart();
  renderCatalog();
  renderCart();

  // renderCart() показывает пустое состояние — глушим его и показываем экран успеха
  cartEmptyEl.hidden = true;
  document.querySelector('.cart__body').hidden = true;
  cartFooterEl.hidden = true;
  cartSuccess.hidden = false;

  checkoutForm.reset();
}

function resetCartView() {
  cartSuccess.hidden = true;
  renderCart();
}

/* ---------- Слайдер отзывов ---------- */

const track = document.getElementById('reviews-track');
const slides = track.children.length;
let current = 0;

function goTo(i) {
  current = (i + slides) % slides;
  track.style.transform = `translateX(-${current * 100}%)`;
  document.querySelectorAll('#rev-dots .slider__dot').forEach((d, j) =>
    d.classList.toggle('is-active', j === current)
  );
}

function initSlider() {
  const dots = document.getElementById('rev-dots');
  for (let i = 0; i < slides; i++) {
    const dot = document.createElement('button');
    dot.className = 'slider__dot';
    dot.setAttribute('aria-label', `Отзыв ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dots.appendChild(dot);
  }
  goTo(0);
  document.getElementById('rev-prev').addEventListener('click', () => goTo(current - 1));
  document.getElementById('rev-next').addEventListener('click', () => goTo(current + 1));
}

/* ---------- Мобильное меню ---------- */

const burger = document.getElementById('burger');
const nav = document.getElementById('nav');

function toggleMenu(open) {
  nav.classList.toggle('is-open', open);
  burger.classList.toggle('is-open', open);
  burger.setAttribute('aria-expanded', String(open));
}

burger.addEventListener('click', () => toggleMenu(!nav.classList.contains('is-open')));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) toggleMenu(false); });

/* ---------- Тосты ---------- */

const toastEl = document.getElementById('toast');
let toastTimer;

function showToast(text) {
  clearTimeout(toastTimer);
  toastEl.textContent = text;
  toastEl.classList.add('is-visible');
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2200);
}

/* ---------- События ---------- */

document.getElementById('filter-type').addEventListener('click', (e) => {
  const btn = e.target.closest('.chip');
  if (!btn) return;
  document.querySelectorAll('#filter-type .chip').forEach((c) => c.classList.remove('is-active'));
  btn.classList.add('is-active');
  state.type = btn.dataset.value;
  renderCatalog();
});

document.getElementById('filter-roast').addEventListener('change', (e) => {
  state.roast = e.target.value;
  renderCatalog();
});

document.getElementById('sort').addEventListener('change', (e) => {
  state.sort = e.target.value;
  renderCatalog();
});

document.getElementById('reset-filters').addEventListener('click', () => {
  state.type = 'all';
  state.roast = 'all';
  state.sort = 'popular';
  document.getElementById('filter-roast').value = 'all';
  document.getElementById('sort').value = 'popular';
  document.querySelectorAll('#filter-type .chip').forEach((c) =>
    c.classList.toggle('is-active', c.dataset.value === 'all')
  );
  renderCatalog();
});

gridEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-add]');
  if (btn) addToCart(Number(btn.dataset.add));
});

document.getElementById('cart-open').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
document.getElementById('cart-empty-close').addEventListener('click', closeCart);
document.getElementById('success-close').addEventListener('click', () => {
  resetCartView();
  closeCart();
});
overlayEl.addEventListener('click', closeCart);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && cartEl.classList.contains('is-open')) closeCart();
});

cartBodyEl.addEventListener('click', (e) => {
  const inc = e.target.closest('[data-inc]');
  const dec = e.target.closest('[data-dec]');
  const rem = e.target.closest('[data-remove]');
  if (inc) setQty(Number(inc.dataset.inc), +1);
  if (dec) setQty(Number(dec.dataset.dec), -1);
  if (rem) removeItem(Number(rem.dataset.remove));
});

// Пересчитать доставку при смене способа
document.querySelectorAll('input[name="delivery"]').forEach((r) =>
  r.addEventListener('change', renderCart)
);

checkoutForm.addEventListener('submit', submitOrder);

document.getElementById('promo-apply').addEventListener('click', () => {
  const input = document.getElementById('promo-input');
  const code = input.value.trim().toUpperCase();
  const rate = PROMO_CODES[code];
  if (rate) {
    state.promo = { code, rate };
    showToast(`Промокод применён: −${rate * 100}%`);
  } else {
    state.promo = null;
    showToast('Такого промокода нет 🤷');
  }
  renderCart();
});

/* ---------- Появление при скролле ---------- */

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

/* ---------- Старт ---------- */

renderCatalog();
renderCart();
initSlider();
