/* =========================================================
   Rejuv4All — Client Login Interactions (login.js)
   Frontend logic with clean backend integration points.
   ========================================================= */
(function () {
  'use strict';

  /* ---- Configuration -------------------------------------------------------
     No authentication backend exists in the project yet. When the backend
     API is available, set loginEndpoint to the appropriate route
     (e.g. '/api/v1/auth/login').
     --------------------------------------------------------------------------- */
  var AUTH_CONFIG = {
    loginEndpoint: ''
  };

  var STORAGE_KEY_REMEMBERED_EMAIL = 'rejuv4all_remembered_email';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var form = $('#login-form');
  if (!form) return;

  var emailInput = $('#login-email');
  var passwordInput = $('#login-password');
  var rememberInput = $('#login-remember');
  var submitBtn = $('#login-submit');
  var statusEl = $('#login-status');

  /* ---- Restore Remembered Email (Email only - NEVER passwords) ---- */
  try {
    var savedEmail = localStorage.getItem(STORAGE_KEY_REMEMBERED_EMAIL);
    if (savedEmail && emailInput && rememberInput) {
      emailInput.value = savedEmail;
      rememberInput.checked = true;
    }
  } catch (err) {
    // localStorage might be unavailable or restricted (e.g. private browsing)
  }

  /* ---- Password Show/Hide Toggle ---- */
  $$('.btn-toggle-pw', form).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wrap = btn.closest('.password-wrap');
      var input = wrap ? $('input', wrap) : null;
      if (!input) return;

      var isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(isPassword));
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');

      var icon = $('i', btn);
      if (icon) {
        icon.className = isPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
      }
    });
  });

  /* ---- Validation Rules ---- */
  var rules = {
    email: function (val) {
      var trimmed = (val || '').trim();
      if (!trimmed) return 'Please enter your email address.';
      if (!EMAIL_RE.test(trimmed)) return 'Please enter a valid email address.';
      return '';
    },
    password: function (val) {
      if (!val) return 'Please enter your password.';
      return '';
    }
  };

  function setFieldError(input, msg) {
    var field = input.closest('.field');
    var errEl = $('#' + input.id + '-err');
    if (field) field.classList.toggle('has-error', !!msg);
    if (errEl) errEl.textContent = msg || '';
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  function validateField(input) {
    var rule = rules[input.name];
    var msg = rule ? rule(input.value) : '';
    setFieldError(input, msg);
    return !msg;
  }

  function setStatus(message, kind) {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.className = 'form-status' + (kind ? ' is-' + kind : '');
  }

  /* ---- Real-time field validation ---- */
  [emailInput, passwordInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener('blur', function () {
      if (input.value) validateField(input);
    });
    input.addEventListener('input', function () {
      var field = input.closest('.field');
      if (field && field.classList.contains('has-error')) {
        validateField(input);
      }
    });
  });

  /* ---- Form Submission Handler ---- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    setStatus('', '');

    // Honeypot spam check
    var hp = form.elements.client_token;
    if (hp && hp.value) return;

    // Validate all fields
    var isValidEmail = validateField(emailInput);
    var isValidPassword = validateField(passwordInput);

    if (!isValidEmail) {
      emailInput.focus();
      return;
    }
    if (!isValidPassword) {
      passwordInput.focus();
      return;
    }

    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var remember = rememberInput ? rememberInput.checked : false;

    // Manage remembered email
    try {
      if (remember) {
        localStorage.setItem(STORAGE_KEY_REMEMBERED_EMAIL, email);
      } else {
        localStorage.removeItem(STORAGE_KEY_REMEMBERED_EMAIL);
      }
    } catch (err) {
      // Ignore storage errors
    }

    // Custom event hook for future backend or framework integration
    var eventPayload = { email: email, remember: remember };
    var customEvt = new CustomEvent('rejuv4all:login', {
      detail: eventPayload,
      cancelable: true
    });
    if (!document.dispatchEvent(customEvt)) return;

    // Honest check: No backend connected yet
    if (!AUTH_CONFIG.loginEndpoint) {
      setStatus('Authentication service is currently being configured. Backend integration will be active soon.', 'notice');
      return;
    }

    // If an endpoint is configured, connect to actual API
    var originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.innerHTML = '<span>Verifying...</span>';

    fetch(AUTH_CONFIG.loginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password,
        remember: remember
      })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        }).catch(function () {
          return { ok: res.ok, status: res.status, data: null };
        });
      })
      .then(function (result) {
        if (result.ok) {
          setStatus('Sign in successful. Redirecting to your account...', 'ok');
          if (result.data && result.data.redirectUrl) {
            window.location.href = result.data.redirectUrl;
          }
        } else {
          var errorMsg = (result.data && (result.data.message || result.data.error)) ||
            'Invalid email or password. Please verify your credentials and try again.';
          setStatus(errorMsg, 'error');
        }
      })
      .catch(function () {
        setStatus('Unable to connect to the authentication service. Please check your connection and try again.', 'error');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        submitBtn.innerHTML = originalBtnHtml;
      });
  });

})();
