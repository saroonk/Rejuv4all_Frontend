/* Rejuv4All — Cart page.
   Reuses the cart implemented in home.js (window.Rejuv4All): same localStorage key,
   same item shape, same product data and navbar badge. Nothing is duplicated here. */
(function () {
  'use strict';

  var R = window.Rejuv4All;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var filled = $('#cart-filled'), empty = $('#cart-empty'), list = $('#cart-items');
  if (!R || !filled || !empty || !list) return;

  var MAX_QTY = R.maxQty;
  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  var subtitle = $('#cart-subtitle'), live = $('#cart-live');
  var subtotalEl = $('#sum-subtotal'), totalEl = $('#sum-total');
  var checkoutBtn = $('#checkout-btn'), checkoutMsg = $('#checkout-msg');

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  // Sanitise whatever is in storage (tampered / older data) before rendering
  function loadItems() {
    return R.readCart().items.map(function (it) {
      var qty = parseInt(it.qty, 10), price = Number(it.price);
      if (!it || !it.id || !isFinite(price) || price < 0 || isNaN(qty) || qty < 1) return null;
      return { id: String(it.id), name: String(it.name || R.product.name), price: price, qty: Math.min(MAX_QTY, qty) };
    }).filter(Boolean);
  }
  function save(items) {
    R.writeCart({ items: items.map(function (it) { return { id: it.id, name: it.name, price: it.price, currency: 'USD', qty: it.qty }; }) });
    R.renderCount(false);
  }
  function imageFor(item) { return item.id === R.product.id ? R.product.image : ''; }

  function announce(msg) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); } }

  function render(focusSel) {
    var items = loadItems();
    var count = items.reduce(function (n, it) { return n + it.qty; }, 0);
    var subtotal = items.reduce(function (n, it) { return n + it.price * it.qty; }, 0);

    filled.hidden = items.length === 0;
    empty.hidden = items.length !== 0;
    if (subtitle) subtitle.textContent = count ? count + (count === 1 ? ' item' : ' items') + ' in your cart.' : 'Nothing here yet.';
    if (checkoutMsg) checkoutMsg.textContent = '';

    list.innerHTML = items.map(function (it) {
      var img = imageFor(it);
      return '<li class="cart-item" data-id="' + esc(it.id) + '">' +
        '<div class="cart-item__img">' + (img ? '<img src="' + esc(img) + '" alt="' + esc(it.name) + '" width="96" height="96">' : '') + '</div>' +
        '<div class="cart-item__info"><h2 class="cart-item__name">' + esc(it.name) + '</h2>' +
          '<p class="cart-item__price">' + money.format(it.price) + ' each</p>' +
          '<button type="button" class="remove-btn cart-item__remove" data-act="remove" aria-label="Remove ' + esc(it.name) + ' from cart"><i class="fa-regular fa-trash-can" aria-hidden="true"></i> Remove</button></div>' +
        '<div class="cart-item__controls">' +
          '<div class="stepper cart-item__qty" role="group" aria-label="Quantity">' +
            '<button type="button" data-act="dec" aria-label="Decrease quantity"' + (it.qty <= 1 ? ' disabled' : '') + '>−</button>' +
            '<span class="stepper__val" aria-live="polite">' + it.qty + '</span>' +
            '<button type="button" data-act="inc" aria-label="Increase quantity"' + (it.qty >= MAX_QTY ? ' disabled' : '') + '>+</button>' +
          '</div>' +
          '<div class="cart-item__total" aria-label="Line total">' + money.format(it.price * it.qty) + '</div>' +
        '</div></li>';
    }).join('');

    subtotalEl.textContent = money.format(subtotal);
    totalEl.textContent = money.format(subtotal);

    if (focusSel) { var f = $(focusSel); if (f && !f.disabled) f.focus(); }
  }

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var row = btn.closest('.cart-item');
    var id = row.getAttribute('data-id');
    var items = loadItems();
    var item = items.filter(function (it) { return it.id === id; })[0];
    if (!item) return;
    var act = btn.getAttribute('data-act');
    var sel = '.cart-item[data-id="' + id + '"] button[data-act="' + act + '"]';

    if (act === 'remove') {
      items = items.filter(function (it) { return it.id !== id; });
      save(items);
      render();
      announce(item.name + ' removed from your cart.');
      if (!items.length) { var link = $('#cart-empty a'); if (link) link.focus(); }
      return;
    }
    item.qty = Math.max(1, Math.min(MAX_QTY, item.qty + (act === 'inc' ? 1 : -1)));
    save(items);
    render(sel);
    announce('Quantity updated to ' + item.qty + '.');
  });

  if (checkoutBtn) checkoutBtn.addEventListener('click', function () {
    var items = loadItems();
    if (!items.length) return;
    // A listener can cancel the default (open checkout.html) and take over
    var evt = new CustomEvent('rejuv4all:checkout', { detail: { items: items, total: items.reduce(function (n, it) { return n + it.price * it.qty; }, 0), currency: 'USD' }, cancelable: true });
    if (!document.dispatchEvent(evt)) return;
    window.location.href = 'checkout.html';
  });

  // Keep the page in sync if the cart changes in another tab
  window.addEventListener('storage', function (e) { if (e.key === 'rejuv4all_cart') render(); });
  // Back/forward cache restore
  window.addEventListener('pageshow', function (e) { if (e.persisted) { R.renderCount(false); render(); } });

  render();
})();
