/* ── nav.js ── sticky nav, hamburger drawer, active state por scroll ── */
(function () {
  var navbar   = document.querySelector('.navbar');
  var hamburger = document.querySelector('.navbar__hamburger');
  var drawer   = document.querySelector('.navbar__drawer');
  var backdrop = document.querySelector('.navbar__drawer-backdrop');
  var closeBtn = document.querySelector('.navbar__drawer-close');
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.navbar__links a');

  /* ── Scrolled class ── */
  function onScroll() {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    setActiveLink();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Active link by scroll position ── */
  function setActiveLink() {
    var scrollY = window.scrollY + parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue('--nav-height')) + 8;

    var current = '';
    sections.forEach(function (sec) {
      if (scrollY >= sec.offsetTop) {
        current = sec.id;
      }
    });

    navLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  /* ── Drawer open/close ── */
  function openDrawer() {
    drawer.classList.add('open');
    hamburger.classList.add('open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }

  if (hamburger) hamburger.addEventListener('click', function () {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  if (backdrop) backdrop.addEventListener('click', closeDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  /* Close drawer when a drawer link is clicked */
  if (drawer) {
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
  }

  /* ── Keyboard: close on Escape ── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });
})();
