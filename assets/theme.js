/* ─── Viha Heritage Theme — Vanilla JS ──────────────────────────────────── */
'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   UTILITIES
══════════════════════════════════════════════════════════════════════════════ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function trapFocus(el) {
  const focusable = $$('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])', el).filter(e => !e.disabled);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  el.addEventListener('keydown', function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
    else             { if (document.activeElement === last)  { e.preventDefault(); first.focus(); } }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   ANNOUNCEMENT BAR — close button
══════════════════════════════════════════════════════════════════════════════ */
(function initAnnouncementBar() {
  const bar = $('.announcement-bar');
  const closeBtn = bar ? $('[data-announcement-close]', bar) : null;
  if (!closeBtn) return;
  closeBtn.addEventListener('click', () => {
    bar.style.display = 'none';
    sessionStorage.setItem('viha_ann_closed', '1');
  });
  if (sessionStorage.getItem('viha_ann_closed')) bar.style.display = 'none';
})();

/* ═══════════════════════════════════════════════════════════════════════════
   MEGA MENU — 160ms hover-intent debounce (same pattern as React fix)
══════════════════════════════════════════════════════════════════════════════ */
(function initMegaMenu() {
  const row2 = $('.header__row-2');
  if (!row2) return;

  const navBtns = $$('[data-mega-trigger]', row2);
  const megaMenu = $('.mega-menu', row2);
  if (!megaMenu) return;

  let timer = null;
  let activeCat = null;

  function openMegaMenu(catId) {
    $$('[data-mega-panel]', megaMenu).forEach(p => {
      p.hidden = p.getAttribute('data-mega-panel') !== catId;
    });
    megaMenu.classList.add('is-open');
    navBtns.forEach(b => b.classList.toggle('is-active', b.getAttribute('data-mega-trigger') === catId));
    activeCat = catId;
  }

  function closeMegaMenu() {
    megaMenu.classList.remove('is-open');
    navBtns.forEach(b => b.classList.remove('is-active'));
    activeCat = null;
  }

  function schedulOpen(catId) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => openMegaMenu(catId), 160);
  }

  function cancelOpen() {
    if (timer) { clearTimeout(timer); timer = null; }
  }

  navBtns.forEach(btn => {
    btn.addEventListener('mouseenter', () => schedulOpen(btn.getAttribute('data-mega-trigger')));
    btn.addEventListener('mouseleave', cancelOpen);
    btn.addEventListener('focus', () => openMegaMenu(btn.getAttribute('data-mega-trigger')));
  });

  row2.addEventListener('mouseleave', () => { cancelOpen(); closeMegaMenu(); });
  megaMenu.addEventListener('mouseleave', () => { cancelOpen(); closeMegaMenu(); });
  megaMenu.addEventListener('mouseenter', () => cancelOpen()); // keep open while inside panel

  document.addEventListener('click', (e) => {
    if (!row2.contains(e.target)) closeMegaMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMegaMenu();
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE MENU DRAWER
══════════════════════════════════════════════════════════════════════════════ */
(function initMobileMenu() {
  const overlay = $('.mobile-menu-overlay');
  const drawer  = $('.mobile-menu');
  const openBtn  = $('[data-mobile-menu-open]');
  const closeBtn = $('[data-mobile-menu-close]');
  if (!overlay || !drawer) return;

  function openMenu() {
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    const firstFocusable = $('button, a', drawer);
    if (firstFocusable) firstFocusable.focus();
    trapFocus(drawer);
  }

  function closeMenu() {
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    if (openBtn) openBtn.focus();
  }

  if (openBtn) openBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
})();

/* ═══════════════════════════════════════════════════════════════════════════
   CART DRAWER
══════════════════════════════════════════════════════════════════════════════ */
const CartDrawer = (function () {
  const overlay = $('.cart-overlay');
  const drawer  = $('.cart-drawer');
  if (!overlay || !drawer) return {};

  function open() {
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    refreshCart();
  }

  function close() {
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  $$('[data-cart-open]').forEach(btn => btn.addEventListener('click', open));
  $$('[data-cart-close]', drawer).forEach(btn => btn.addEventListener('click', close));

  function refreshCart() {
    fetch('/cart.js')
      .then(r => r.json())
      .then(cart => {
        renderCart(cart);
        updateBadge(cart.item_count);
      })
      .catch(console.error);
  }

  function updateBadge(count) {
    $$('[data-cart-badge]').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
    $$('[data-cart-badge-label]').forEach(el => {
      el.textContent = `(${count} item${count === 1 ? '' : 's'})`;
    });
  }

  function renderCart(cart) {
    const body     = $('[data-cart-body]', drawer);
    const subtotal = $('[data-cart-subtotal]', drawer);
    const footer   = $('[data-cart-footer]', drawer);
    if (!body) return;

    if (cart.item_count === 0) {
      body.innerHTML = `
        <div class="cart-drawer__empty">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 9H4L5 9z"/>
          </svg>
          <p>Your cart is empty</p>
          <a href="/collections/all" class="btn btn--primary" style="width:auto;min-height:44px;padding:10px 1.5rem;font-size:11px;">
            Start Shopping
          </a>
        </div>`;
      if (footer) footer.hidden = true;
      return;
    }

    if (footer) footer.hidden = false;

    body.innerHTML = cart.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <img class="cart-item__img" src="${item.image}" alt="${item.product_title}" loading="lazy">
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;">
          <div>
            <a href="${item.url}" class="cart-item__name">${item.product_title}</a>
            ${item.variant_title && item.variant_title !== 'Default Title' ? `<p class="cart-item__cat">${item.variant_title}</p>` : ''}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div class="cart-item__qty">
              <button class="cart-item__qty-btn" aria-label="Decrease quantity" data-qty-minus data-line="${item.key}">−</button>
              <span class="cart-item__qty-num">${item.quantity}</span>
              <button class="cart-item__qty-btn" aria-label="Increase quantity" data-qty-plus data-line="${item.key}">+</button>
            </div>
            <span class="cart-item__price">${formatMoney(item.final_line_price)}</span>
          </div>
        </div>
        <button class="cart-item__remove" aria-label="Remove item" data-remove="${item.key}">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>`).join('');

    if (subtotal) subtotal.textContent = formatMoney(cart.total_price);

    // Wire up qty buttons
    $$('[data-qty-minus]', body).forEach(btn => {
      btn.addEventListener('click', () => updateItemQty(btn.getAttribute('data-line'), -1));
    });
    $$('[data-qty-plus]', body).forEach(btn => {
      btn.addEventListener('click', () => updateItemQty(btn.getAttribute('data-line'), 1));
    });
    $$('[data-remove]', body).forEach(btn => {
      btn.addEventListener('click', () => removeItem(btn.getAttribute('data-remove')));
    });
  }

  function updateItemQty(key, delta) {
    fetch('/cart.js')
      .then(r => r.json())
      .then(cart => {
        const item = cart.items.find(i => i.key === key);
        if (!item) return;
        const newQty = Math.max(0, item.quantity + delta);
        return fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity: newQty })
        });
      })
      .then(r => r && r.json())
      .then(cart => { if (cart) { renderCart(cart); updateBadge(cart.item_count); } })
      .catch(console.error);
  }

  function removeItem(key) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: 0 })
    })
    .then(r => r.json())
    .then(cart => { renderCart(cart); updateBadge(cart.item_count); })
    .catch(console.error);
  }

  function formatMoney(cents) {
    const amount = (cents / 100).toFixed(2);
    return '₹' + amount.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return { open, close, refreshCart, updateBadge };
})();

/* Add to cart — works from any ATC button with data-product-id.
   Only ever touches a [data-atc-label] text span if the button has one —
   never overwrites textContent/innerHTML on the button itself, so the SVG
   icon on icon-only buttons (e.g. product cards) survives every click. */
(function initAddToCart() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;

    const variantId = btn.getAttribute('data-variant-id') || btn.getAttribute('data-add-to-cart');
    if (!variantId) return;

    const label = btn.querySelector('[data-atc-label]');
    const originalLabelText = label ? label.textContent : null;
    const originalAriaLabel = btn.getAttribute('aria-label');

    btn.disabled = true;
    btn.classList.add('is-loading');
    if (label) label.textContent = 'Adding…';
    if (originalAriaLabel) btn.setAttribute('aria-label', 'Adding to cart…');

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    })
    .then(r => r.json())
    .then(() => {
      btn.classList.remove('is-loading');
      btn.classList.add('is-added');
      if (label) label.textContent = 'Added ✓';
      if (originalAriaLabel) btn.setAttribute('aria-label', 'Added to cart');
      if (CartDrawer.refreshCart) CartDrawer.refreshCart();
      if (CartDrawer.open) CartDrawer.open();
      setTimeout(() => {
        btn.classList.remove('is-added');
        if (label) label.textContent = originalLabelText;
        if (originalAriaLabel) btn.setAttribute('aria-label', originalAriaLabel);
        btn.disabled = false;
      }, 2000);
    })
    .catch(() => {
      btn.classList.remove('is-loading');
      if (label) label.textContent = 'Error';
      setTimeout(() => {
        if (label) label.textContent = originalLabelText;
        if (originalAriaLabel) btn.setAttribute('aria-label', originalAriaLabel);
        btn.disabled = false;
      }, 2000);
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════
   SEARCH OVERLAY
══════════════════════════════════════════════════════════════════════════════ */
(function initSearch() {
  const overlay = $('.search-overlay');
  if (!overlay) return;
  const input    = $('[data-search-input]', overlay);
  const results  = $('[data-search-results]', overlay);
  const openBtns = $$('[data-search-open]');
  const closeBtn = $('[data-search-close]', overlay);

  function openSearch() {
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (input) setTimeout(() => input.focus(), 100);
  }

  function closeSearch() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (input) input.value = '';
    if (results) results.innerHTML = '';
  }

  openBtns.forEach(btn => btn.addEventListener('click', openSearch));
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeSearch();
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  });

  if (!input || !results) return;

  let searchTimer = null;
  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (q.length < 2) { results.innerHTML = ''; return; }
    searchTimer = setTimeout(() => performSearch(q), 300);
  });

  function performSearch(q) {
    results.innerHTML = '<p style="color:rgba(45,45,45,0.5);font-size:13px;padding:1rem 0;">Searching…</p>';
    fetch(`/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=6`)
      .then(r => r.json())
      .then(data => {
        const products = (data.resources && data.resources.results && data.resources.results.products) || [];
        if (!products.length) {
          results.innerHTML = '<p style="color:rgba(45,45,45,0.5);font-size:13px;padding:1rem 0;">No results found.</p>';
          return;
        }
        results.innerHTML = `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-top:1.5rem;">
            ${products.map(p => `
              <a href="${p.url}" class="search-result-card">
                ${p.image ? `<img class="search-result-card__img" src="${p.image}" alt="${p.title}" loading="lazy">` : ''}
                <div>
                  <p style="font-family:var(--font-heading);font-size:13px;font-weight:600;color:var(--color-maroon);line-height:1.3;">${p.title}</p>
                  ${p.price ? `<p style="font-size:12px;font-weight:600;color:var(--color-maroon);margin-top:4px;">${formatMoneyCents(p.price)}</p>` : ''}
                </div>
              </a>`).join('')}
          </div>`;
      })
      .catch(() => {
        results.innerHTML = '<p style="color:rgba(45,45,45,0.5);font-size:13px;padding:1rem 0;">Search unavailable. Please try again.</p>';
      });
  }

  function formatMoneyCents(cents) {
    return '₹' + (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
})();

/* ═══════════════════════════════════════════════════════════════════════════
   PRODUCT PAGE — Gallery thumbnails + variant selection
══════════════════════════════════════════════════════════════════════════════ */
(function initProductPage() {
  if (!$('.product-layout')) return;

  /* Thumbnail gallery */
  const mainImg  = $('[data-gallery-main]');
  const thumbs   = $$('[data-gallery-thumb]');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      if (mainImg) mainImg.src = thumb.getAttribute('data-src') || thumb.src;
      thumbs.forEach(t => t.style.opacity = '0.6');
      thumb.style.opacity = '1';
    });
  });

  /* Variant selector */
  const variantSelect = $('[data-variant-select]');
  const atcBtn        = $('[data-add-to-cart]');
  if (variantSelect && atcBtn) {
    variantSelect.addEventListener('change', () => {
      const opt = variantSelect.options[variantSelect.selectedIndex];
      atcBtn.setAttribute('data-variant-id', opt.value);
      const available = opt.getAttribute('data-available') !== 'false';
      atcBtn.disabled = !available;
      atcBtn.textContent = available ? 'Add to Cart' : 'Sold Out';
    });
  }

})();

/* ═══════════════════════════════════════════════════════════════════════════
   ORDER TRACKER
══════════════════════════════════════════════════════════════════════════════ */
(function initOrderTracker() {
  const form = $('[data-tracker-form]');
  if (!form) return;
  const input = $('[data-tracker-input]', form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const orderId = input ? input.value.trim().toUpperCase() : '';
    if (!orderId) return;
    window.location.href = `/apps/track?order=${encodeURIComponent(orderId)}`;
  });
})();

/* ═══════════════════════════════════════════════════════════════════════════
   STICKY HEADER shadow on scroll
══════════════════════════════════════════════════════════════════════════════ */
(function initHeaderScroll() {
  const header = $('.site-header');
  if (!header) return;
  const observer = new IntersectionObserver(
    ([entry]) => header.classList.toggle('is-scrolled', !entry.isIntersecting),
    { rootMargin: '-1px 0px 0px 0px', threshold: 0 }
  );
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'height:1px;pointer-events:none;';
  document.body.insertBefore(sentinel, document.body.firstChild);
  observer.observe(sentinel);
})();

/* ═══════════════════════════════════════════════════════════════════════════
   LAZY-LOAD IMAGES (IntersectionObserver)
══════════════════════════════════════════════════════════════════════════════ */
(function initLazyLoad() {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
        observer.unobserve(img);
      });
    },
    { rootMargin: '0px 0px 200px 0px' }
  );
  $$('img[data-src]').forEach(img => observer.observe(img));
})();

/* ═══════════════════════════════════════════════════════════════════════════
   REDUCED MOTION — disable animations when user prefers
══════════════════════════════════════════════════════════════════════════════ */
(function initReducedMotion() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('motion-reduce');
    const style = document.createElement('style');
    style.textContent = '.motion-reduce *, .motion-reduce *::before, .motion-reduce *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }';
    document.head.appendChild(style);
  }
})();

/* ═══════════════════════════════════════════════════════════════════════════
   COLLECTION — filter + sort (progressive enhancement via URLSearchParams)
══════════════════════════════════════════════════════════════════════════════ */
(function initCollectionFilters() {
  const filterLinks = $$('[data-filter-link]');
  const sortSelect  = $('[data-sort-select]');
  if (!filterLinks.length && !sortSelect) return;

  filterLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const url = new URL(window.location);
      const filterTag = link.getAttribute('data-filter-value');
      if (filterTag === 'all') url.searchParams.delete('filter');
      else url.searchParams.set('filter', filterTag);
      url.searchParams.delete('page');
      window.location.href = url.toString();
    });
  });

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const url = new URL(window.location);
      url.searchParams.set('sort_by', sortSelect.value);
      url.searchParams.delete('page');
      window.location.href = url.toString();
    });
  }
})();

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE BOTTOM NAV — highlight active item
══════════════════════════════════════════════════════════════════════════════ */
(function initMobileBottomNav() {
  const nav = $('.mobile-bottom-nav');
  if (!nav) return;
  const items = $$('.mobile-bottom-nav__item[data-view]', nav);
  const path  = window.location.pathname;

  const viewMap = {
    '/': 'home',
    '/collections': 'shop',
    '/cart': 'cart',
    '/account': 'account',
    '/pages/beauty': 'beauty',
  };

  const active = Object.entries(viewMap).find(([p]) => path === p || path.startsWith(p + '/'));
  const activeView = active ? active[1] : 'home';

  items.forEach(item => {
    item.classList.toggle('is-active', item.getAttribute('data-view') === activeView);
  });
})();

/* ── Wishlist (localStorage) ────────────────────────────────────────────── */
(function() {
  var KEY = 'viha_wishlist';
  function getList() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch(e) { return []; } }
  function saveList(l) { localStorage.setItem(KEY, JSON.stringify(l)); }

  window.vihaWishlistToggle = function(btn, handle) {
    var list = getList();
    var idx = list.indexOf(handle);
    var saved;
    if (idx === -1) { list.push(handle); saved = true; }
    else { list.splice(idx, 1); saved = false; }
    saveList(list);
    btn.classList.toggle('is-saved', saved);
    btn.setAttribute('aria-label', saved ? 'Remove from saved' : 'Save');
    var svg = btn.querySelector('svg');
    if (svg) { svg.setAttribute('fill', saved ? 'currentColor' : 'none'); }
  };

  /* Initialise saved state on page load */
  function initBtns() {
    var list = getList();
    document.querySelectorAll('[data-wishlist-btn]').forEach(function(btn) {
      var handle = btn.getAttribute('data-wishlist-btn');
      var saved = list.indexOf(handle) !== -1;
      btn.classList.toggle('is-saved', saved);
      var svg = btn.querySelector('svg');
      if (svg) { svg.setAttribute('fill', saved ? 'currentColor' : 'none'); }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBtns);
  } else {
    initBtns();
  }

  /* Update bottom-nav "Saved" active state */
  if (window.location.pathname.indexOf('/pages/wishlist') !== -1) {
    var wlNav = document.querySelector('.mobile-bottom-nav__item[data-view="wishlist"]');
    if (wlNav) wlNav.classList.add('is-active');
  }
})();

