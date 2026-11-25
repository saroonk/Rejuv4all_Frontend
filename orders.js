/* Rejuv4All — My Orders page.
   DEMONSTRATION DATA ONLY: the orders below are made-up samples so the page can be tested. They are not real customers
   or real orders. To go live, replace fetchOrders() with a call to the backend (e.g. GET /api/orders/?email=...);
   everything else only relies on the order shape documented above DEMO_ORDERS. */
(function () {
  'use strict';

  var R = window.Rejuv4All; // existing catalogue (home.js) — reused for product name, image and price
  var P = (R && R.product) || { name: 'Rejuv4All Botanical Restorative Hair Elixir', price: 68, image: 'assets/images/web/hero_slide3.webp', size: '50 ml / 1.7 fl. oz.' };

  var DEMO_EMAIL = 'demo@rejuv4all.com';

  /* Order shape:
     { id, email, placedAt:'YYYY-MM-DD', status:'delivered'|'shipped'|'pending'|'cancelled',
       items:[{ name, image, size, qty, unitPrice }], shipping:Number,
       deliveredAt?, estimatedDelivery?, cancelledAt?, tracking?:{ carrier, number } }   (tracking is shown only when present) */
  var DEMO_ORDERS = [
    { id: 'R4A-DEMO-1003', email: DEMO_EMAIL, placedAt: '2026-11-22', status: 'pending', shipping: 0,
      estimatedDelivery: 'Nov 28 – Dec 2, 2026',
      items: [{ name: P.name, image: P.image, size: P.size, qty: 2, unitPrice: P.price }] },
    { id: 'R4A-DEMO-1002', email: DEMO_EMAIL, placedAt: '2026-11-02', status: 'cancelled', shipping: 0, cancelledAt: '2026-11-03',
      items: [{ name: P.name, image: P.image, size: P.size, qty: 1, unitPrice: P.price }] },
    { id: 'R4A-DEMO-1001', email: DEMO_EMAIL, placedAt: '2026-10-06', status: 'delivered', shipping: 0, deliveredAt: '2026-10-11',
      items: [{ name: P.name, image: P.image, size: P.size, qty: 1, unitPrice: P.price }] }
  ];

  var STATUS = { delivered: 'Delivered', shipped: 'Shipped', pending: 'Pending', cancelled: 'Cancelled' };

  var $ = function (id) { return document.getElementById(id); };
  var els = { find: $('ord-find'), form: $('ord-form'), email: $('ord-email'), error: $('ord-error'), fill: $('ord-fill'),
    results: $('ord-results'), count: $('ord-count'), list: $('ord-list'), empty: $('ord-empty'), emptyText: $('ord-empty-text'),
    again: $('ord-again'), emptyAgain: $('ord-empty-again') };
  if (!els.form) return;

  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function fmtDate(iso) { var d = new Date(iso + 'T00:00:00'); return isNaN(d) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  function subtotal(o) { return o.items.reduce(function (n, i) { return n + i.qty * i.unitPrice; }, 0); }
  function total(o) { return subtotal(o) + (o.shipping || 0); }

  /* Data access — the only function to swap for a real API call. Resolves with the matching orders, newest first. */
  function fetchOrders(email) {
    var e = email.trim().toLowerCase();
    var found = DEMO_ORDERS.filter(function (o) { return o.email.toLowerCase() === e; })
      .sort(function (a, b) { return a.placedAt < b.placedAt ? 1 : -1; });
    return Promise.resolve(found);
  }

  /* ---- rendering ---- */
  function thumb(item) { return '<span class="ord-thumb"><img src="' + esc(item.image) + '" alt="" width="72" height="72" loading="lazy"></span>'; }

  function statusNote(o) {
    if (o.status === 'pending') return '<p class="ord__note"><i class="fa-regular fa-clock" aria-hidden="true"></i>Your order is being processed.</p>';
    if (o.status === 'shipped') return '<p class="ord__note"><i class="fa-solid fa-truck-fast" aria-hidden="true"></i>Your order is on its way' + (o.estimatedDelivery ? ' &mdash; est. ' + esc(o.estimatedDelivery) : '') + '.</p>';
    if (o.status === 'delivered' && o.deliveredAt) return '<p class="ord__note"><i class="fa-solid fa-check" aria-hidden="true"></i>Delivered on ' + fmtDate(o.deliveredAt) + '</p>';
    if (o.status === 'cancelled') return '<p class="ord__note"><i class="fa-solid fa-ban" aria-hidden="true"></i>This order was cancelled' + (o.cancelledAt ? ' on ' + fmtDate(o.cancelledAt) : '') + '.</p>';
    return '';
  }

  function detail(o) {
    var lines = o.items.map(function (i) {
      return '<li class="ord-line">' + thumb(i) +
        '<p class="ord-line__name">' + esc(i.name) + (i.size ? ' <span>· ' + esc(i.size) + '</span>' : '') + '</p>' +
        '<div class="ord-line__calc"><span>' + i.qty + ' &times; ' + money.format(i.unitPrice) + '</span><strong>' + money.format(i.qty * i.unitPrice) + '</strong></div></li>';
    }).join('');
    var info = '<div><dt>Order date</dt><dd>' + fmtDate(o.placedAt) + '</dd></div>';
    if (o.status === 'delivered' && o.deliveredAt) info += '<div><dt>Delivered</dt><dd>' + fmtDate(o.deliveredAt) + '</dd></div>';
    if ((o.status === 'pending' || o.status === 'shipped') && o.estimatedDelivery) info += '<div><dt>Estimated delivery</dt><dd>' + esc(o.estimatedDelivery) + '</dd></div>';
    if (o.status === 'cancelled' && o.cancelledAt) info += '<div><dt>Cancelled</dt><dd>' + fmtDate(o.cancelledAt) + '</dd></div>';
    if (o.tracking && o.tracking.number && (o.status === 'shipped' || o.status === 'delivered')) info += '<div><dt>Tracking</dt><dd>' + esc(o.tracking.carrier || '') + ' ' + esc(o.tracking.number) + '</dd></div>';
    return '<ul class="ord-lines">' + lines + '</ul><div class="ord__facts">' +
      '<dl class="ord-info">' + info + '</dl>' +
      '<dl class="ord-sum"><div><dt>Subtotal</dt><dd>' + money.format(subtotal(o)) + '</dd></div>' +
      '<div><dt>Shipping</dt><dd>' + (o.shipping ? money.format(o.shipping) : 'Complimentary') + '</dd></div>' +
      '<div class="is-total"><dt>Total</dt><dd>' + money.format(total(o)) + '</dd></div></dl></div>';
  }

  function card(o, idx) {
    var label = STATUS[o.status] || STATUS.pending;
    var items = o.items.map(function (i) {
      return '<li class="ord-item">' + thumb(i) + '<div><p class="ord-item__name">' + esc(i.name) + '</p><p class="ord-item__sub">Qty ' + i.qty + (i.size ? ' · ' + esc(i.size) : '') + '</p></div></li>';
    }).join('');
    var pid = 'ord-panel-' + idx;
    return '<li class="ord ord--' + esc(o.status) + '">' +
      '<div class="ord__head"><dl class="ord__meta"><div><dt>Order</dt><dd>' + esc(o.id) + '</dd></div><div><dt>Placed</dt><dd>' + fmtDate(o.placedAt) + '</dd></div></dl>' +
      '<span class="ord-status ord-status--' + esc(o.status) + '">' + label + '</span></div>' +
      '<div class="ord__body"><ul class="ord__items">' + items + '</ul>' +
      '<div class="ord__side"><span class="ord__total-label">Total</span><span class="ord__total">' + money.format(total(o)) + '</span>' + statusNote(o) + '</div></div>' +
      '<button type="button" class="ord__toggle" aria-expanded="false" aria-controls="' + pid + '"><span>View details</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button>' +
      '<div class="ord__panel" id="' + pid + '"><div class="ord__panel-inner"><div class="ord__detail">' + detail(o) + '</div></div></div></li>';
  }

  function show(email, orders) {
    els.find.hidden = true;
    els.results.hidden = false;
    var has = orders.length > 0;
    els.list.hidden = !has;
    els.empty.hidden = has;
    els.count.innerHTML = has ? '<strong>' + orders.length + (orders.length === 1 ? ' order' : ' orders') + '</strong> found for ' + esc(email) : 'Results for ' + esc(email);
    els.emptyText.textContent = 'We couldn’t find any orders for ' + email + '. Check the spelling, or try the email address you used at checkout.';
    els.list.innerHTML = orders.map(card).join('');
  }

  function reset() {
    els.results.hidden = true;
    els.find.hidden = false;
    els.list.innerHTML = '';
    els.email.focus();
  }

  /* ---- events ---- */
  function setError(msg) {
    els.error.hidden = !msg; els.error.textContent = msg || '';
    els.email.classList.toggle('is-invalid', !!msg);
    els.email.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  els.email.addEventListener('input', function () { if (!els.error.hidden) setError(''); });

  els.form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = els.email.value.trim();
    if (!email) { setError('Please enter your email address.'); els.email.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError('Please enter a valid email address, e.g. name@example.com.'); els.email.focus(); return; }
    setError('');
    fetchOrders(email).then(function (orders) { show(email, orders); });
  });

  els.fill.addEventListener('click', function () { els.email.value = DEMO_EMAIL; setError(''); els.email.focus(); });
  els.again.addEventListener('click', reset);
  els.emptyAgain.addEventListener('click', reset);

  // accordion (delegated: one handler for every order)
  els.list.addEventListener('click', function (e) {
    var btn = e.target.closest('.ord__toggle');
    if (!btn) return;
    var open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('span').textContent = open ? 'Hide details' : 'View details';
    document.getElementById(btn.getAttribute('aria-controls')).classList.toggle('is-open', open);
  });
})();
