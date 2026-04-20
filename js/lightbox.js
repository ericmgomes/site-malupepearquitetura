/* ── lightbox.js ── galeria do Portfólio ── */
(function () {
  var lightbox    = document.querySelector('.lightbox');
  if (!lightbox) return;

  var imgEl    = lightbox.querySelector('.lightbox__img');
  var nameEl   = lightbox.querySelector('.lightbox__project-name');
  var closeBtn = lightbox.querySelector('.lightbox__close');
  var prevBtn  = lightbox.querySelector('[data-lb-prev]');
  var nextBtn  = lightbox.querySelector('[data-lb-next]');

  var items   = [];
  var current = 0;

  /* Collect visible portfolio items */
  function collectItems() {
    items = Array.from(document.querySelectorAll('[data-lb-src]'))
      .filter(function (el) {
        return !el.closest('.portfolio__item-wrap.hidden');
      });
  }

  function showItem(index) {
    if (!items.length) return;
    current = ((index % items.length) + items.length) % items.length;
    var item = items[current];
    var src  = item.dataset.lbSrc  || '';
    var name = item.dataset.lbName || '';

    if (imgEl) {
      imgEl.src = src;
      imgEl.alt = name;
    }
    if (nameEl) nameEl.textContent = name;
  }

  function openLightbox(index) {
    collectItems();
    showItem(index);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* Click on portfolio items */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-lb-src]');
    if (!trigger) return;
    collectItems();
    var idx = items.indexOf(trigger);
    openLightbox(idx >= 0 ? idx : 0);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn)  prevBtn.addEventListener('click', function () { showItem(current - 1); });
  if (nextBtn)  nextBtn.addEventListener('click', function () { showItem(current + 1); });

  /* Backdrop click */
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* Keyboard */
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showItem(current - 1);
    if (e.key === 'ArrowRight') showItem(current + 1);
  });
})();
