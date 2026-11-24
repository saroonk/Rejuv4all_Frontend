/* Rejuv4All — About page: subtle scroll reveals.
   Elements marked data-ab fade up / wipe in once as they enter the viewport (IntersectionObserver).
   The hidden starting state only exists when the page added .ab-js; reduced-motion visitors and browsers
   without IntersectionObserver see everything immediately. */
(function () {
  'use strict';

  var items = Array.prototype.slice.call(document.querySelectorAll('[data-ab]'));
  if (!items.length) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('is-in'); });
    document.documentElement.classList.remove('ab-js');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

  items.forEach(function (el) { io.observe(el); });
})();
