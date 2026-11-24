/* Rejuv4All — Checkout page.
   Reads the existing cart (window.Rejuv4All from home.js: same storage, same item shape), shows the order
   summary with the same totals as the cart page, validates the customer/delivery form and prepares the
   payment request. No payment is taken here and nothing is reported as paid. */
(function () {
  'use strict';

  var R = window.Rejuv4All;
  var filled = document.getElementById('co-filled'), empty = document.getElementById('co-empty');
  if (!R || !filled || !empty) return;

  /* ---- Payment configuration ----------------------------------------------------------------
     No payment gateway is integrated yet (the site names Razorpay). To connect it, set
     PAYMENT.createOrderEndpoint to a server URL that accepts the JSON order below and returns the gateway
     order. Until then "Proceed to Pay" validates, stores the order details and says payment is not
     connected; it never shows a success state. A listener on `rejuv4all:pay` can also take over:
       document.addEventListener('rejuv4all:pay', function (e) { e.preventDefault(); // e.detail is the order });  */
  var PAYMENT = { createOrderEndpoint: '' };

  var $ = function (id) { return document.getElementById(id); };
  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---- cart (sanitised exactly like the cart page) ---- */
  function loadItems() {
    return R.readCart().items.map(function (it) {
      var qty = parseInt(it && it.qty, 10), price = Number(it && it.price);
      if (!it || !it.id || !isFinite(price) || price < 0 || isNaN(qty) || qty < 1) return null;
      return { id: String(it.id), name: String(it.name || R.product.name), price: price, qty: Math.min(R.maxQty, qty) };
    }).filter(Boolean);
  }
  var items = loadItems();
  if (!items.length) { empty.hidden = false; return; }
  filled.hidden = false;

  var subtotal = items.reduce(function (n, it) { return n + it.price * it.qty; }, 0);
  // Shipping is "Complimentary" on the cart page, so the total equals the subtotal (same rule as the cart)
  var total = subtotal;

  $('co-items').innerHTML = items.map(function (it) {
    var img = it.id === R.product.id ? R.product.image : '';
    return '<li class="co-item"><div class="co-item__img">' + (img ? '<img src="' + esc(img) + '" alt="" width="56" height="56">' : '') + '<span class="co-item__qty" aria-hidden="true">' + it.qty + '</span></div>' +
      '<div><h3 class="co-item__name">' + esc(it.name) + '</h3><p class="co-item__meta">Qty ' + it.qty + ' × ' + money.format(it.price) + '</p></div>' +
      '<span class="co-item__total">' + money.format(it.price * it.qty) + '</span></li>';
  }).join('');
  $('co-subtotal').textContent = money.format(subtotal);
  $('co-total').textContent = money.format(total);

  /* ---- countries (address) ---- */
  var COUNTRIES = ['Australia', 'Austria', 'Bahrain', 'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'China', 'Czech Republic', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany',
    'Greece', 'Hong Kong', 'India', 'Indonesia', 'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kenya', 'Kuwait', 'Malaysia', 'Maldives', 'Mexico', 'Nepal', 'Netherlands',
    'New Zealand', 'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain',
    'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam'];
  var countrySel = $('co-country');
  countrySel.innerHTML = '<option value="">Select country</option>' + COUNTRIES.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');

  /* ---- phone: flag + dialling-code selector (intl-tel-input), India (+91) by default ---- */
  var phoneEl = $('co-phone'), iti = null, dialTouched = false;
  var DEFAULT_DIAL = '91';
  if (window.intlTelInput) {
    iti = window.intlTelInput(phoneEl, { initialCountry: 'in', separateDialCode: true, countrySearch: true, countryOrder: ['in'] });
    phoneEl.addEventListener('countrychange', function () { if (document.activeElement !== countrySel) dialTouched = true; });
  } else {
    // Library could not be loaded: fall back to a fixed India (+91) prefix next to the number
    var fixed = document.createElement('span');
    fixed.className = 'phone-fixed'; fixed.textContent = '+91';
    phoneEl.parentNode.insertBefore(fixed, phoneEl);
    phoneEl.closest('.field').classList.add('phone-fallback');
  }
  function getDial() { return iti ? String(iti.getSelectedCountryData().dialCode || DEFAULT_DIAL) : DEFAULT_DIAL; }
  // choosing an address country moves the phone flag with it, unless the customer picked a phone country themselves
  countrySel.addEventListener('change', function () {
    if (!iti || dialTouched || !countrySel.value) return;
    var match = window.intlTelInput.getCountryData().filter(function (c) { return c.name.replace(/ \(.*\)$/, '') === countrySel.value; })[0];
    if (match) iti.setCountry(match.iso2);
  });

  /* ---- validation ---- */
  var form = $('checkout-form'), statusEl = $('co-status'), payBtn = $('co-pay');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var rules = {
    name: function (v) { return v.trim().length < 2 ? 'Please enter your full name.' : ''; },
    email: function (v) { return !v.trim() ? 'Please enter your email address.' : (!EMAIL_RE.test(v.trim()) ? 'Please enter a valid email address.' : ''); },
    phone: function (v) {
      var digits = v.replace(/[\s\-().]/g, '');
      if (!digits) return 'Please enter your phone number.';
      if (!/^\d+$/.test(digits)) return 'Use digits only (spaces and dashes are fine).';
      var all = getDial() + digits.replace(/^0+/, '');
      if (digits.length < 6 || all.length > 15) return 'Please enter a valid phone number for the selected country code.';
      return '';
    },
    address: function (v) { return v.trim().length < 5 ? 'Please enter your street address.' : ''; },
    city: function (v) { return v.trim().length < 2 ? 'Please enter your city.' : ''; },
    state: function (v) { return v.trim().length < 2 ? 'Please enter your state.' : ''; },
    pin: function (v) {
      var s = v.trim();
      if (!s) return 'Please enter your PIN / postal code.';
      if (countrySel.value === 'India') return /^[1-9]\d{5}$/.test(s) ? '' : 'Indian PIN codes have 6 digits.';
      return /^[A-Za-z0-9][A-Za-z0-9 \-]{2,9}$/.test(s) ? '' : 'Please enter a valid postal code.';
    },
    country: function (v) { return v ? '' : 'Please select your country.'; }
  };
  var ids = { name: 'co-name', email: 'co-email', phone: 'co-phone', address: 'co-address', city: 'co-city', state: 'co-state', pin: 'co-pin', country: 'co-country' };

  function show(key, msg) {
    var input = $(ids[key]), wrap = input.closest('.field'), out = $(ids[key] + '-err');
    wrap.classList.toggle('has-error', !!msg);
    if (out) out.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function check(key) { var msg = rules[key]($(ids[key]).value); show(key, msg); return !msg; }
  function setStatus(text, kind) { statusEl.textContent = text; statusEl.classList.toggle('is-error', kind === 'error'); }

  Object.keys(ids).forEach(function (key) {
    var el = $(ids[key]);
    el.addEventListener('blur', function () { if (el.value) check(key); });
    el.addEventListener('input', function () { if (el.closest('.field').classList.contains('has-error')) check(key); });
    el.addEventListener('change', function () { if (el.closest('.field').classList.contains('has-error')) check(key); });
  });
  phoneEl.addEventListener('countrychange', function () { if (phoneEl.value) check('phone'); });
  countrySel.addEventListener('change', function () { if ($('co-pin').value) check('pin'); });

  /* ---- submit: validate, then prepare the payment request ---- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('', '');
    var first = null;
    Object.keys(ids).forEach(function (key) { if (!check(key) && !first) first = $(ids[key]); });
    if (first) { first.focus(); setStatus('Please correct the highlighted fields.', 'error'); return; }

    // cart may have changed in another tab since the page loaded
    var latest = loadItems();
    if (!latest.length) { window.location.reload(); return; }
    var latestTotal = latest.reduce(function (n, it) { return n + it.price * it.qty; }, 0);

    var order = {
      customer: { name: $('co-name').value.trim(), email: $('co-email').value.trim(), phone: '+' + getDial() + ' ' + phoneEl.value.replace(/[\s\-().]/g, '').replace(/^0+/, '') },
      address: { line1: $('co-address').value.trim(), line2: $('co-apartment').value.trim(), city: $('co-city').value.trim(), state: $('co-state').value.trim(), postalCode: $('co-pin').value.trim(), country: countrySel.value },
      items: latest.map(function (it) { return { id: it.id, name: it.name, unitPrice: it.price, quantity: it.qty, lineTotal: it.price * it.qty }; }),
      subtotal: latestTotal, shipping: 0, total: latestTotal, currency: 'USD'
    };
    try { sessionStorage.setItem('rejuv4all_checkout', JSON.stringify(order)); } catch (err) { /* storage unavailable */ }

    // Integration hook: a listener may cancel the default behaviour and start the payment itself
    if (!document.dispatchEvent(new CustomEvent('rejuv4all:pay', { detail: order, cancelable: true }))) return;

    if (!PAYMENT.createOrderEndpoint) {
      setStatus('Your details are valid and your cart has been kept, but online payment is not connected yet, so no payment has been taken.', '');
      return;
    }

    payBtn.disabled = true;
    var label = payBtn.innerHTML;
    payBtn.textContent = 'Preparing payment…';
    fetch(PAYMENT.createOrderEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(order) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (gatewayOrder) { document.dispatchEvent(new CustomEvent('rejuv4all:payment-order', { detail: { order: order, gatewayOrder: gatewayOrder } })); })
      .catch(function () { setStatus('We could not start the payment. Please try again in a moment.', 'error'); })
      .then(function () { payBtn.disabled = false; payBtn.innerHTML = label; });
  });
})();
