/* Rejuv4All — navbar profile dropdown (inner pages).
   Hover/focus opens it on desktop (CSS); tap/click toggles it everywhere. Closes on outside tap, Escape, or choosing Login. */
(function () {
  'use strict';

  var menu = document.querySelector('[data-profile-menu]');
  if (!menu) return;
  var btn = menu.querySelector('.profile-btn');
  var login = menu.querySelector('a');

  function set(open) {
    menu.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    set(!menu.classList.contains('is-open'));
  });
  if (login) login.addEventListener('click', function () { set(false); });
  var orders = menu.querySelector('.profile-orders');
  if (orders) orders.addEventListener('click', function () { set(false); });

  document.addEventListener('click', function (e) { if (!menu.contains(e.target)) set(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { set(false); btn.focus(); }
  });
  // mouse users: leaving the menu closes a click-opened dropdown too
  menu.addEventListener('mouseleave', function () {
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) set(false);
  });
  // opening the mobile drawer shouldn't leave it hanging
  var burger = document.getElementById('mobile-menu-btn');
  if (burger) burger.addEventListener('click', function () { set(false); });
})();
