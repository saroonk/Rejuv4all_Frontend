/* Rejuv4All — Contact page (frontend only, ready for a future backend) */
(function () {
  'use strict';

  /* ---- Configuration -------------------------------------------------------
     No business contact details or form endpoint exist in the project yet, so
     nothing is invented: fill these in when they are available.
       CONTACT.email / phone  -> shown (and linked) in "Contact details"
       CONTACT.social.*       -> full profile URLs; icons stay disabled until set
       CONTACT_ENDPOINT       -> URL that accepts the JSON POST (e.g. a Django view)
     --------------------------------------------------------------------------- */
  var CONTACT = { email: '', phone: '', social: { instagram: '', facebook: '', youtube: '' } };
  var CONTACT_ENDPOINT = '';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---- Contact details ---- */
  function fillDetail(key, href) {
    var el = $('[data-contact="' + key + '"]');
    var val = CONTACT[key];
    if (!el || !val) { if (el) el.classList.add('is-pending'); return; }
    var a = document.createElement('a');
    a.href = href + val.replace(/\s+/g, '');
    a.textContent = val;
    el.textContent = '';
    el.appendChild(a);
  }
  fillDetail('email', 'mailto:');
  fillDetail('phone', 'tel:');
  $$('[data-social]').forEach(function (a) {
    var url = CONTACT.social[a.getAttribute('data-social')];
    if (!url) return;
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.removeAttribute('aria-disabled');
  });

  /* ---- Form ---- */
  var form = $('#contact-form');
  if (!form) return;
  var status = $('#contact-status');
  var submitBtn = $('#contact-submit');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var rules = {
    name: function (v) { return v.trim().length < 2 ? 'Please enter your full name.' : ''; },
    email: function (v) { return !v.trim() ? 'Please enter your email address.' : (!EMAIL_RE.test(v.trim()) ? 'Please enter a valid email address.' : ''); },
    subject: function (v) { return v.trim().length < 3 ? 'Please add a subject.' : ''; },
    message: function (v) { return v.trim().length < 10 ? 'Please write a message of at least 10 characters.' : ''; }
  };

  function showError(input, msg) {
    var wrap = input.closest('.field');
    var out = $('#' + input.id + '-err');
    if (wrap) wrap.classList.toggle('has-error', !!msg);
    if (out) out.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
  }
  function check(input) {
    var rule = rules[input.name];
    var msg = rule ? rule(input.value) : '';
    showError(input, msg);
    return !msg;
  }
  function setStatus(text, kind) {
    status.textContent = text;
    status.className = 'form-status' + (kind ? ' is-' + kind : '');
  }

  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    if (!input) return;
    input.addEventListener('blur', function () { if (input.value) check(input); });
    input.addEventListener('input', function () { if (input.closest('.field').classList.contains('has-error')) check(input); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('', '');
    if (form.elements.website && form.elements.website.value) return; // honeypot filled: silently drop

    var firstBad = null;
    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!check(input) && !firstBad) firstBad = input;
    });
    if (firstBad) { firstBad.focus(); return; }

    var payload = {};
    Object.keys(rules).forEach(function (name) { payload[name] = form.elements[name].value.trim(); });

    // Hook for future integration: listeners can cancel the default behaviour and send the message themselves
    var evt = new CustomEvent('rejuv4all:contact-submit', { detail: payload, cancelable: true });
    if (!document.dispatchEvent(evt)) return;

    if (!CONTACT_ENDPOINT) {
      // Nothing is connected yet: be honest rather than pretending the message was sent
      setStatus('Our contact form is not connected yet, so your message has not been sent. Please check back soon.', 'error');
      return;
    }

    submitBtn.disabled = true;
    var label = submitBtn.innerHTML;
    submitBtn.textContent = 'Sending…';
    fetch(CONTACT_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
      .then(function () { form.reset(); setStatus('Thank you. Your message has been sent.', 'ok'); })
      .catch(function () { setStatus('Sorry, your message could not be sent. Please try again in a moment.', 'error'); })
      .then(function () { submitBtn.disabled = false; submitBtn.innerHTML = label; });
  });
})();
