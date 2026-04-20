/* ── parallax.js ── Parallax via rAF + transform translateY ── */
(function () {
  /* Respeitar preferência de acessibilidade */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var els     = document.querySelectorAll('[data-parallax]');
  if (!els.length) return;

  var ticking = false;

  function update() {
    var vh = window.innerHeight;

    els.forEach(function (el) {
      var speed = parseFloat(el.dataset.parallax) || 0.2;
      var rect  = el.getBoundingClientRect();
      /* Distância do centro do elemento ao centro da viewport */
      var offset = (rect.top + rect.height / 2 - vh / 2) * speed;
      el.style.transform = 'translateY(' + offset.toFixed(2) + 'px) translateZ(0)';
    });

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  /* Atualizar também no resize */
  window.addEventListener('resize', function () {
    requestAnimationFrame(update);
  }, { passive: true });

  update();
})();
