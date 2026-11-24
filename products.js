/* Rejuv4All — Products page.
   The catalogue is the existing product (window.Rejuv4All.product, defined in home.js and used by the cart).
   More products can be supplied later by defining window.REJUV4ALL_EXTRA_PRODUCTS *before* this script, e.g.
     [{ id, name, price, currency:'USD', image, size, description, category, badge, originalPrice, createdAt }]
   Category, badge, original price (discount) and "Newest" only appear when the data actually contains them. */
(function () {
  'use strict';

  var R = window.Rejuv4All;
  var grid = document.getElementById('product-grid');
  if (!R || !grid) return;

  var PAGE_SIZE = 8;
  var catalogue = [R.product].concat(Array.isArray(window.REJUV4ALL_EXTRA_PRODUCTS) ? window.REJUV4ALL_EXTRA_PRODUCTS : [])
    .filter(function (p) { return p && p.id && p.name && isFinite(Number(p.price)); });

  var $ = function (s) { return document.getElementById(s); };
  var els = { search: $('shop-search'), clear: $('search-clear'), sort: $('shop-sort'), cat: $('shop-category'), catWrap: $('ctl-category'),
    count: $('result-count'), empty: $('shop-empty'), pager: $('pager'), apply: $('panel-apply'), reset: $('panel-reset'), emptyReset: $('empty-reset'), panel: $('filterPanel') };
  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* ---- options derived from the data ---- */
  var categories = catalogue.map(function (p) { return p.category; }).filter(Boolean).filter(function (c, i, a) { return a.indexOf(c) === i; });
  var hasDates = catalogue.some(function (p) { return p.createdAt; });
  var SORTS = [['featured', 'Featured']];
  if (hasDates) SORTS.push(['newest', 'Newest']);
  SORTS.push(['price-asc', 'Price: Low to High'], ['price-desc', 'Price: High to Low'], ['name-asc', 'Name: A to Z']);
  els.sort.innerHTML = SORTS.map(function (s) { return '<option value="' + s[0] + '">' + s[1] + '</option>'; }).join('');
  if (categories.length) {
    els.cat.innerHTML = '<option value="">All categories</option>' + categories.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
    els.catWrap.hidden = false;
  }

  var state = { q: '', sort: 'featured', cat: '', page: 1 };
  var desktop = window.matchMedia('(min-width: 992px)');

  /* ---- filtering / sorting ---- */
  function view() {
    var q = state.q.trim().toLowerCase();
    var list = catalogue.filter(function (p) {
      return (!q || p.name.toLowerCase().indexOf(q) !== -1) && (!state.cat || p.category === state.cat);
    }).map(function (p, i) { return { p: p, i: i }; });
    var by = {
      'featured': function (a, b) { return a.i - b.i; },
      'newest': function (a, b) { return (Date.parse(b.p.createdAt) || 0) - (Date.parse(a.p.createdAt) || 0) || a.i - b.i; },
      'price-asc': function (a, b) { return Number(a.p.price) - Number(b.p.price) || a.i - b.i; },
      'price-desc': function (a, b) { return Number(b.p.price) - Number(a.p.price) || a.i - b.i; },
      'name-asc': function (a, b) { return a.p.name.localeCompare(b.p.name) || a.i - b.i; }
    };
    return list.sort(by[state.sort] || by.featured).map(function (x) { return x.p; });
  }

  /* ---- rendering ---- */
  function card(p) {
    var price = Number(p.price), was = Number(p.originalPrice);
    var off = was > price ? Math.round((1 - price / was) * 100) : 0;
    var sub = p.size ? '<p class="p-card__sub">' + esc(p.size) + '</p>' : '';
    var desc = p.description ? '<p class="p-card__desc">' + esc(p.description) + '</p>' : '';
    var badge = p.badge ? '<span class="p-badge">' + esc(p.badge) + '</span>' : '';
    var href = p.url || ('product-detail.html?id=' + encodeURIComponent(p.id));
    return '<article class="p-card" data-id="' + esc(p.id) + '">' +
      '<a class="p-card__media" href="' + esc(href) + '" tabindex="-1" aria-hidden="true">' + badge +
        '<img src="' + esc(p.image || '') + '" alt="" loading="lazy" width="600" height="750"></a>' +
      '<div class="p-card__body">' +
        '<h2 class="p-card__name"><a href="' + esc(href) + '">' + esc(p.name) + '</a></h2>' + sub + desc +
        '<div class="p-card__foot">' +
          '<div class="p-price"><span class="p-price__now">' + money.format(price) + '</span>' +
            (off ? '<span class="p-price__was">' + money.format(was) + '</span><span class="p-price__off">' + off + '% off</span>' : '') + '</div>' +
          '<button type="button" class="p-add" data-add="' + esc(p.id) + '"><span>Add to Cart</span></button>' +
        '</div></div></article>';
  }

  function pageList(cur, total) { // 1 … cur-1 cur cur+1 … total
    var out = [], add = function (n) { out.push(n); };
    for (var n = 1; n <= total; n++) {
      if (n === 1 || n === total || Math.abs(n - cur) <= 1 || (cur <= 3 && n <= 4) || (cur >= total - 2 && n >= total - 3)) add(n);
      else if (out[out.length - 1] !== '…') add('…');
    }
    return out;
  }

  function render() {
    var list = view();
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var slice = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);

    grid.innerHTML = slice.map(card).join('');
    grid.hidden = !slice.length;
    els.empty.hidden = !!slice.length;
    els.count.textContent = list.length ? list.length + (list.length === 1 ? ' product' : ' products') : '';

    if (pages > 1) {
      var h = '<button type="button" data-page="' + (state.page - 1) + '" aria-label="Previous page"' + (state.page === 1 ? ' disabled' : '') + '><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>';
      pageList(state.page, pages).forEach(function (n) {
        h += n === '…' ? '<span class="pager__gap" aria-hidden="true">…</span>'
          : '<button type="button" data-page="' + n + '"' + (n === state.page ? ' class="is-current" aria-current="page"' : '') + ' aria-label="Page ' + n + '">' + n + '</button>';
      });
      h += '<button type="button" data-page="' + (state.page + 1) + '" aria-label="Next page"' + (state.page === pages ? ' disabled' : '') + '><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>';
      els.pager.innerHTML = h;
      els.pager.hidden = false;
    } else {
      els.pager.hidden = true;
      els.pager.innerHTML = '';
    }
    els.clear.hidden = !els.search.value;
  }

  /* ---- state <-> controls ---- */
  function readControls() { state.q = els.search.value; state.sort = els.sort.value; state.cat = els.cat.value; state.page = 1; }
  function writeControls() { els.search.value = state.q; els.sort.value = state.sort; els.cat.value = state.cat; }
  function resetAll() { state = { q: '', sort: 'featured', cat: '', page: 1 }; writeControls(); render(); }

  var timer;
  els.search.addEventListener('input', function () {
    els.clear.hidden = !els.search.value;
    if (!desktop.matches) return;               // below 992px the sheet applies on "Apply"
    clearTimeout(timer); timer = setTimeout(function () { readControls(); render(); }, 150);
  });
  [els.sort, els.cat].forEach(function (c) { c.addEventListener('change', function () { if (desktop.matches) { readControls(); render(); } }); });
  els.clear.addEventListener('click', function () { els.search.value = ''; els.clear.hidden = true; els.search.focus(); if (desktop.matches) { readControls(); render(); } });
  els.search.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); readControls(); render(); } });
  els.apply.addEventListener('click', function () {
    readControls(); render();
    var oc = window.bootstrap && bootstrap.Offcanvas.getInstance(els.panel); if (oc) oc.hide();
  });
  els.reset.addEventListener('click', resetAll);
  els.emptyReset.addEventListener('click', resetAll);
  // keep the controls in sync with the applied state when the sheet is re-opened or the viewport changes
  els.panel.addEventListener('show.bs.offcanvas', writeControls);
  desktop.addEventListener && desktop.addEventListener('change', function () { writeControls(); });

  els.pager.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-page]');
    if (!b || b.disabled) return;
    state.page = parseInt(b.getAttribute('data-page'), 10);
    render();
    var top = document.querySelector('.shop-bar').getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: top, behavior: 'smooth' });
  });

  /* ---- add to cart: the existing cart implementation (home.js) ---- */
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-add]');
    if (!b) return;
    var p = catalogue.filter(function (x) { return String(x.id) === b.getAttribute('data-add'); })[0];
    if (!p) return;
    R.addItem(p, 1);
    var label = b.querySelector('span');
    b.classList.add('is-added'); label.textContent = 'Added to Cart';
    clearTimeout(b._t);
    b._t = setTimeout(function () { b.classList.remove('is-added'); label.textContent = 'Add to Cart'; }, 1600);
  });

  render();
})();
