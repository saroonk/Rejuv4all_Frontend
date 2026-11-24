/* =========================================================
   Rejuv4All — Client Registration Interactions (signup.js)
   Frontend logic with phone dialling code & backend integration points.
   ========================================================= */
(function () {
  'use strict';

  /* ---- Configuration -------------------------------------------------------
     No authentication backend exists in the project yet. When the backend
     API is available, set signupEndpoint to the appropriate route
     (e.g. '/api/v1/auth/signup').
     --------------------------------------------------------------------------- */
  var AUTH_CONFIG = {
    signupEndpoint: ''
  };

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var DEFAULT_DIAL = '91';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var form = $('#signup-form');
  if (!form) return;

  var nameInput = $('#signup-name');
  var emailInput = $('#signup-email');
  var phoneInput = $('#signup-phone');
  var passwordInput = $('#signup-password');
  var confirmPasswordInput = $('#signup-confirm-password');
  var submitBtn = $('#signup-submit');
  var statusEl = $('#signup-status');

  /* ---- Phone Input: Flag & Dialling Code Selector (intl-tel-input) ---- */
  var iti = null;
  if (window.intlTelInput && phoneInput) {
    iti = window.intlTelInput(phoneInput, {
      initialCountry: 'in',
      separateDialCode: true,
      countrySearch: true,
      countryOrder: ['in']
    });
  } else if (phoneInput) {
    // Graceful fallback to fixed +91 prefix
    var fixed = document.createElement('span');
    fixed.className = 'phone-fixed';
    fixed.textContent = '+91';
    phoneInput.parentNode.insertBefore(fixed, phoneInput);
    phoneInput.closest('.field').classList.add('phone-fallback');
  }

  function getDial() {
    return iti ? String(iti.getSelectedCountryData().dialCode || DEFAULT_DIAL) : DEFAULT_DIAL;
  }

  /* ---- Password Show/Hide Toggles ---- */
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
    name: function (val) {
      var trimmed = (val || '').trim();
      if (!trimmed) return 'Please enter your full name.';
      if (trimmed.length < 2) return 'Name must be at least 2 characters.';
      return '';
    },
    email: function (val) {
      var trimmed = (val || '').trim();
      if (!trimmed) return 'Please enter your email address.';
      if (!EMAIL_RE.test(trimmed)) return 'Please enter a valid email address.';
      return '';
    },
    phone: function (val) {
      var digits = (val || '').replace(/[\s\-().]/g, '');
      if (!digits) return 'Please enter your phone number.';
      if (!/^\d+$/.test(digits)) return 'Use digits only (spaces and dashes are fine).';
      var all = getDial() + digits.replace(/^0+/, '');
      if (digits.length < 6 || all.length > 15) {
        return 'Please enter a valid phone number for the selected country code.';
      }
      return '';
    },
    password: function (val) {
      if (!val) return 'Please enter a password.';
      if (val.length < 8) return 'Password must be at least 8 characters long.';
      if (!/[A-Za-z]/.test(val) || !/[0-9]/.test(val)) {
        return 'Password must contain at least one letter and one number.';
      }
      return '';
    },
    confirmPassword: function (val) {
      if (!val) return 'Please confirm your password.';
      if (val !== passwordInput.value) return 'Passwords do not match.';
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
  [nameInput, emailInput, phoneInput, passwordInput, confirmPasswordInput].forEach(function (input) {
    if (!input) return;
    input.addEventListener('blur', function () {
      if (input.value) validateField(input);
    });
    input.addEventListener('input', function () {
      var field = input.closest('.field');
      if (field && field.classList.contains('has-error')) {
        validateField(input);
      }
      // If password field changed and confirm password was filled, re-validate confirm password
      if (input === passwordInput && confirmPasswordInput.value) {
        validateField(confirmPasswordInput);
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

    // Validate all fields in order
    var fields = [nameInput, emailInput, phoneInput, passwordInput, confirmPasswordInput];
    var firstBad = null;

    fields.forEach(function (input) {
      if (!validateField(input) && !firstBad) {
        firstBad = input;
      }
    });

    if (firstBad) {
      firstBad.focus();
      return;
    }

    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    var phoneDigits = phoneInput.value.trim().replace(/^0+/, '');
    var dialCode = getDial();
    var fullPhone = '+' + dialCode + ' ' + phoneDigits;
    var password = passwordInput.value;

    // Custom event hook for future backend or framework integration
    var eventPayload = {
      name: name,
      email: email,
      phone: fullPhone,
      countryCode: dialCode
    };
    var customEvt = new CustomEvent('rejuv4all:signup', {
      detail: eventPayload,
      cancelable: true
    });
    if (!document.dispatchEvent(customEvt)) return;

    // Honest check: No backend connected yet
    if (!AUTH_CONFIG.signupEndpoint) {
      setStatus('Account registration is currently being configured. Backend integration will be active soon.', 'notice');
      return;
    }

    // If an endpoint is configured, connect to actual API
    var originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    submitBtn.innerHTML = '<span>Creating Account...</span>';

    fetch(AUTH_CONFIG.signupEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        email: email,
        phone: fullPhone,
        countryCode: dialCode,
        password: password
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
          setStatus('Account created successfully! Redirecting to sign in...', 'ok');
          setTimeout(function () {
            window.location.href = (result.data && result.data.redirectUrl) || 'login.html';
          }, 1500);
        } else {
          var errorMsg = (result.data && (result.data.message || result.data.error)) ||
            'Unable to complete registration. Please check your information and try again.';
          setStatus(errorMsg, 'error');
        }
      })
      .catch(function () {
        setStatus('Unable to connect to the registration service. Please check your connection and try again.', 'error');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.classList.remove('is-loading');
        submitBtn.innerHTML = originalBtnHtml;
      });
  });

})();
