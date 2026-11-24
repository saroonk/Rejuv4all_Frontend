/* Rejuv4All — Product detail page.
   The product is chosen with product-detail.html?id=<product id>. Data comes from the same source as the
   products page and the cart: window.Rejuv4All.product (home.js) plus any window.REJUV4ALL_EXTRA_PRODUCTS.
   The purchase section reproduces the homepage #shop section; Add to Cart / Buy Now use the shared cart
   (window.Rejuv4All.addItem) exactly like the homepage buttons. */
(function () {
  'use strict';

  var R = window.Rejuv4All;
  var root = document.getElementById('pd-root');
  if (!R || !root) return;

  /* ---- Extra information ---------------------------------------------------------------------
     The product record carries name, price, image, size and a one-line description. Everything below is
     the content already published on the homepage for this product (product section, FAQ, formula and
     ritual sections), keyed by product id so it is shown for the right product only. Other products can
     provide the same shape as `details` on their own record:
       { eyebrow, badge, shipNote, trust, specs:[[label,value]], gallery:[{src,alt,label,pos}],
         description, ingredients:[], benefits:[], usage:[{title,text}] }
     Sections / rows / thumbnails only appear when they exist. */
  var BUILTIN = {};
  BUILTIN[R.product.id] = {
    eyebrow: 'The Rejuv4All Signature',
    badge: 'Batch 088 • Botanical Elixir',
    shipNote: 'Complimentary worldwide priority shipping on all orders.',
    trust: true,
    specs: [
      ['Bottle Volume', '50 ml / 1.7 fl. oz. (Approx. 90-day supply)'],
      ['Extraction Method', 'Cold-Pressed Virgin Lipids'],
      ['Vessel Material', 'Apothecary Amber UV-Shield Glass']
    ],
    gallery: [
      { src: 'assets/images/web/hero_slide3.webp', alt: 'Rejuv4All amber glass dropper hair oil bottle', label: 'View front of bottle' },
      { src: 'assets/images/web/protocol_pipette.webp', alt: 'Pipette releasing a droplet of golden hair oil', label: 'View pipette dropper' },
      { src: 'assets/images/web/product_macro.webp', alt: 'Close-up of the ornate gold cap and golden oil ripples', label: 'View cap and oil ripples' },
      { src: 'assets/images/web/hero_slide1.webp', alt: 'Rejuv4All bottle on a black pedestal beside the model', label: 'View bottle on pedestal', pos: true },
      { src: 'assets/images/web/product_bottle_closeup.webp', alt: 'Close-up of the Rejuv4All bottle with golden cap', label: 'View bottle close-up' },
      { src: 'assets/images/web/product_label_detail.webp', alt: 'Close-up of the amber bottle label and dropper collar', label: 'View label detail' },
      { src: 'assets/images/web/product_ripples_detail.webp', alt: 'Golden oil ripples with botanical details', label: 'View oil ripples detail' }
    ],
    description: 'Rejuv4All Botanical Restorative Hair Elixir is an ultra-concentrated, cold-pressed treatment engineered to revitalize brittle ends, seal raised cuticles, and nurture scalp health. It pairs active plant lipids with lightweight absorption so hair maintains light, touchable movement.',
    ingredients: [
      '100% cold-pressed Moroccan Argan Oil',
      'Japanese Camellia Tsubaki Seed Oil',
      'Virgin Golden Jojoba Ester',
      'Rosemary Leaf Bio-Ferment',
      'Natural Tocopherol (Vitamin E)',
      'Subtle botanical extracts of Bergamot and Cedarwood',
      'Free from parabens, sulfates, cyclic silicones and phthalates'
    ],
    benefits: [
      'Moroccan Argan Kernel: elasticity and shine',
      'Camellia Tsubaki Seed: weightless smoothness',
      'Virgin Golden Jojoba: scalp harmony',
      'Rosemary Leaf Ferment: root vitality'
    ],
    usage: [
      { title: 'Prepare', text: 'Dispense 2–4 golden drops into warm palms and rub hands together.' },
      { title: 'Apply', text: 'Glide fingers through damp or towel-dried strands, focusing on mid-lengths and dry ends.' },
      { title: 'Massage', text: 'Gently press residual elixir upward into parting lines and temples with slow, circular fingertips.' },
      { title: 'Care', text: 'Style as usual, air-dry, or leave in overnight with a silk scarf.' }
    ]
  };

  var extras = Array.isArray(window.REJUV4ALL_EXTRA_PRODUCTS) ? window.REJUV4ALL_EXTRA_PRODUCTS : [];
  var catalogue = [R.product].concat(extras).filter(function (p) { return p && p.id && p.name; });
  var wanted = new URLSearchParams(location.search).get('id');
  var product = wanted ? catalogue.filter(function (p) { return String(p.id) === wanted; })[0] : catalogue[0];

  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  if (!product) {
    document.title = 'Product not found — Rejuv4All';
    root.innerHTML = '<div class="pd-missing"><h1>Product not found</h1><p>We could not find that product.</p><a class="btn-ink" href="products.html"><span>View all products</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>';
    return;
  }

  var d = product.details || BUILTIN[product.id] || {};
  var price = Number(product.price), was = Number(product.originalPrice);
  var off = was > price ? Math.round((1 - price / was) * 100) : 0;
  var description = d.description || product.description || '';
  var badge = d.badge || product.badge || '';
  var specs = d.specs || (product.size ? [['Bottle Volume', product.size]] : []);
  var gallery = d.gallery && d.gallery.length ? d.gallery : (product.image ? [{ src: product.image, alt: product.name, label: 'View product image' }] : []);

  document.title = product.name + ' — Rejuv4All';

  /* h1: last words in gold <em>, as in the homepage product heading */
  var words = product.name.split(/\s+/);
  var cut = words.length > 3 ? words.length - 2 : Math.max(0, words.length - 1);
  var titleHtml = (cut ? esc(words.slice(0, cut).join(' ')) + ' <br><em>' : '<em>') + esc(words.slice(cut).join(' ')) + '</em>';

  /* ---- tabs (only those with content) ---- */
  var tabs = [];
  if (description) tabs.push({ id: 'description', label: 'Description', html: '<h3>Product Description</h3>' + description.split(/\n+/).map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') });
  if (d.ingredients && d.ingredients.length) tabs.push({ id: 'ingredients', label: 'Ingredients', html: '<h3>Ingredients</h3><ul class="pd-list">' + d.ingredients.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' });
  if (d.benefits && d.benefits.length) tabs.push({ id: 'benefits', label: 'Benefits', html: '<h3>Benefits</h3><ul class="pd-list">' + d.benefits.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' });
  if (d.usage && d.usage.length) tabs.push({ id: 'usage', label: 'How to Use', html: '<h3>How to Use</h3><ol class="pd-steps">' + d.usage.map(function (s) { return '<li><div><strong>' + esc(s.title) + '</strong>' + esc(s.text) + '</div></li>'; }).join('') + '</ol>' });

  var trustBoxes = d.trust ?
    '<div class="row g-2 mt-1 text-center">' +
      '<div class="col-4"><div class="trust-box"><i class="fa-solid fa-shield-halved"></i><span>30-Day Ritual Guarantee</span></div></div>' +
      '<div class="col-4"><div class="trust-box"><i class="fa-solid fa-leaf"></i><span>Amber Recycled Glass</span></div></div>' +
      '<div class="col-4"><div class="trust-box"><i class="fa-solid fa-truck-fast"></i><span>Carbon Neutral Delivery</span></div></div>' +
    '</div>' : '';

  var main = gallery[0];
  root.innerHTML =
    /* breadcrumb */
    '<section class="pd-crumbbar"><div class="container-xl page-wrap"><nav aria-label="Breadcrumb"><ol class="pd-crumbs">' +
      '<li><a href="index.html">Home</a></li><li><a href="products.html">Products</a></li><li><span aria-current="page">' + esc(product.name) + '</span></li>' +
    '</ol></nav></div></section>' +

    /* purchase section — the homepage #shop section */
    '<section class="section section--charcoal shop pd-shop" id="product">' +
      '<div class="glow"></div>' +
      '<div class="container-xl section-pad position-relative"><div class="row g-5 align-items-start">' +
        '<div class="col-lg-7">' +
          '<div class="gallery-main">' +
            (badge ? '<span class="gallery-badge">' + esc(badge) + '</span>' : '') +
            '<img id="gallery-main-image" src="' + esc(main ? main.src : '') + '" alt="' + esc(main ? main.alt : product.name) + '" width="1376" height="768">' +
          '</div>' +
          '<div class="gallery-strip">' +
            '<button type="button" class="strip-btn" id="thumb-prev" aria-label="Previous thumbnails" hidden><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
            '<div class="gallery-thumbs" role="group" aria-label="Product views">' +
              gallery.map(function (g, i) { return '<button type="button" class="gallery-thumb' + (i ? '' : ' is-active') + '" data-src="' + esc(g.src) + '" data-alt="' + esc(g.alt || product.name) + '" aria-label="' + esc(g.label || 'View image ' + (i + 1)) + '"><img src="' + esc(g.src) + '" alt="" loading="lazy" width="200" height="200"' + (g.pos ? ' class="pos-left"' : '') + '></button>'; }).join('') +
            '</div>' +
            '<button type="button" class="strip-btn" id="thumb-next" aria-label="Next thumbnails" hidden><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>' +
          '</div>' +
        '</div>' +

        '<div class="col-lg-5">' +
          '<div class="buy-head">' +
            '<span class="eyebrow eyebrow--light">' + esc(d.eyebrow || product.category || 'Rejuv4All') + '</span>' +
            '<h1 class="h-display h-display--sm">' + titleHtml + '</h1>' +
            '<div class="price-row"><span class="price">' + money.format(price) + ' USD</span>' +
              (off ? '<span class="stock">' + off + '% off</span>' : '') + '</div>' +
            (off ? '<p class="ship-note"><s>' + money.format(was) + '</s></p>' : '') +
            (d.shipNote ? '<p class="ship-note">' + esc(d.shipNote) + '</p>' : '') +
          '</div>' +
          (specs.length ? '<dl class="specs">' + specs.map(function (s) { return '<div><dt>' + esc(s[0]) + '</dt><dd>' + esc(s[1]) + '</dd></div>'; }).join('') + '</dl>' : '') +
          '<div class="buy-actions">' +
            '<span class="micro-light">Select Quantity</span>' +
            '<div class="qty-row"><div class="qty">' +
              '<button type="button" id="qty-minus" aria-label="Decrease quantity">−</button>' +
              '<input id="product-quantity" type="text" value="1" readonly aria-label="Quantity">' +
              '<button type="button" id="qty-plus" aria-label="Increase quantity">+</button>' +
            '</div></div>' +
            '<button type="button" class="btn-gold btn-block" id="add-to-cart"></button>' +
            '<button type="button" class="btn-outline-gold btn-block" id="buy-now">Buy Now — Instant Checkout</button>' +
            '<p class="cart-msg" id="cart-msg" role="status" aria-live="polite"></p>' +
            '<div class="trust"><div class="pay-row"><i class="fa-solid fa-lock" aria-hidden="true"></i><span>Secure payments powered by Razorpay</span></div>' + trustBoxes + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

    /* detailed information: part of the same component, directly under the product */
    (tabs.length ? '<div class="pd-info">' +
      '<div class="pd-tabs" role="tablist" aria-label="Product information">' +
        tabs.map(function (t, i) { return '<button type="button" class="goal-tab' + (i ? '' : ' is-active') + '" role="tab" id="tab-' + t.id + '" aria-controls="panel-' + t.id + '" aria-selected="' + (i ? 'false' : 'true') + '" tabindex="' + (i ? '-1' : '0') + '">' + esc(t.label) + '</button>'; }).join('') +
      '</div>' +
      tabs.map(function (t, i) { return '<div class="pd-panel" role="tabpanel" id="panel-' + t.id + '" aria-labelledby="tab-' + t.id + '"' + (i ? ' hidden' : '') + '>' + t.html + '</div>'; }).join('') +
    '</div>' : '') +
    '</div></section>';

  var $ = function (id) { return document.getElementById(id); };

  /* ---- gallery: thumbnails swap the main image; arrows scroll the strip (same behaviour as the homepage) ---- */
  var mainImg = $('gallery-main-image'), strip = root.querySelector('.gallery-thumbs'), prev = $('thumb-prev'), next = $('thumb-next');
  function updateStrip() {
    var max = strip.scrollWidth - strip.clientWidth, scrollable = max > 2;
    prev.hidden = next.hidden = !scrollable;
    prev.disabled = strip.scrollLeft <= 2;
    next.disabled = strip.scrollLeft >= max - 2;
  }
  strip.addEventListener('click', function (e) {
    var btn = e.target.closest('.gallery-thumb');
    if (!btn || btn.classList.contains('is-active')) return;
    Array.prototype.forEach.call(strip.children, function (b) { b.classList.remove('is-active'); });
    btn.classList.add('is-active');
    mainImg.classList.add('is-fading');
    setTimeout(function () { mainImg.src = btn.dataset.src; mainImg.alt = btn.dataset.alt || ''; mainImg.classList.remove('is-fading'); }, 150);
    var l = btn.offsetLeft - strip.offsetLeft, r = l + btn.offsetWidth;
    if (l < strip.scrollLeft) strip.scrollTo({ left: l - 4, behavior: 'smooth' });
    else if (r > strip.scrollLeft + strip.clientWidth) strip.scrollTo({ left: r - strip.clientWidth + 4, behavior: 'smooth' });
  });
  prev.addEventListener('click', function () { strip.scrollBy({ left: -Math.max(strip.clientWidth * 0.8, 80), behavior: 'smooth' }); });
  next.addEventListener('click', function () { strip.scrollBy({ left: Math.max(strip.clientWidth * 0.8, 80), behavior: 'smooth' }); });
  strip.addEventListener('scroll', updateStrip, { passive: true });
  window.addEventListener('resize', updateStrip);
  window.addEventListener('load', updateStrip);
  updateStrip();

  /* ---- quantity, Add to Cart, Buy Now (same flow as the homepage) ---- */
  var qty = 1, max = R.maxQty;
  var input = $('product-quantity'), addBtn = $('add-to-cart'), msg = $('cart-msg');
  function setQty(q) {
    qty = Math.max(1, Math.min(max, q));
    input.value = qty;
    addBtn.textContent = 'Add to Cart — ' + money.format(price * qty);
  }
  $('qty-minus').addEventListener('click', function () { setQty(qty - 1); });
  $('qty-plus').addEventListener('click', function () { setQty(qty + 1); });
  addBtn.addEventListener('click', function () {
    R.addItem(product, qty);
    msg.textContent = qty + ' × ' + product.name + ' added to your cart.';
  });
  $('buy-now').addEventListener('click', function () {
    R.addItem(product, qty);
    msg.textContent = 'Added to your cart. Checkout will be available soon.';
  });
  setQty(1);

  /* ---- tabs: click + arrow keys ---- */
  var tabEls = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  function select(el, focus) {
    tabEls.forEach(function (t) {
      var on = t === el;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) el.focus();
  }
  tabEls.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var n = tabEls.length, k = e.key, nx = null;
      if (k === 'ArrowRight') nx = tabEls[(i + 1) % n];
      else if (k === 'ArrowLeft') nx = tabEls[(i - 1 + n) % n];
      else if (k === 'Home') nx = tabEls[0];
      else if (k === 'End') nx = tabEls[n - 1];
      if (nx) { e.preventDefault(); select(nx, true); }
    });
  });
})();
