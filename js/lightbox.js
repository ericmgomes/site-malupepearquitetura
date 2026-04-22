/* ── lightbox.js ── galeria do Portfólio ── */
(function () {
  var lightbox  = document.querySelector('.lightbox');
  if (!lightbox) return;

  var imgEl    = lightbox.querySelector('.lightbox__img');
  var nameEl   = lightbox.querySelector('.lightbox__project-name');
  var closeBtn = lightbox.querySelector('.lightbox__close');
  var prevBtn  = lightbox.querySelector('[data-lb-prev]');
  var nextBtn  = lightbox.querySelector('[data-lb-next]');

  /* Estado */
  var portfolioItems = [];  /* todos os itens do portfólio */
  var gallery        = [];  /* fotos do item atual (1 ou N) */
  var current        = 0;
  var projectName    = '';

  /* ── Coleta itens visíveis do portfólio ── */
  function collectPortfolio() {
    portfolioItems = Array.from(document.querySelectorAll('[data-lb-src]'))
      .filter(function (el) {
        return !el.closest('.portfolio__item-wrap.hidden');
      });
  }

  /* ── Exibe foto dentro da galeria atual ── */
  function showPhoto(index) {
    if (!gallery.length) return;
    current = ((index % gallery.length) + gallery.length) % gallery.length;
    if (imgEl)  { imgEl.src = gallery[current]; imgEl.alt = projectName; }
    if (nameEl) {
      nameEl.textContent = gallery.length > 1
        ? projectName + '  ' + (current + 1) + ' / ' + gallery.length
        : projectName;
    }
    /* Esconde setas se só há 1 foto */
    if (prevBtn) prevBtn.style.visibility = gallery.length > 1 ? '' : 'hidden';
    if (nextBtn) nextBtn.style.visibility = gallery.length > 1 ? '' : 'hidden';
  }

  /* ── Abre lightbox para um item do portfólio ── */
  function openForItem(trigger) {
    projectName = trigger.dataset.lbName || '';

    if (trigger.dataset.lbGallery) {
      /* Galeria de múltiplas fotos */
      gallery = trigger.dataset.lbGallery.split(',').map(function (s) { return s.trim(); });
    } else {
      /* Foto única */
      gallery = [trigger.dataset.lbSrc];
    }

    showPhoto(0);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ── Clique nos itens do portfólio ── */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-lb-src]');
    if (!trigger) return;
    collectPortfolio();
    openForItem(trigger);
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn)  prevBtn.addEventListener('click', function () { showPhoto(current - 1); });
  if (nextBtn)  nextBtn.addEventListener('click', function () { showPhoto(current + 1); });

  /* Backdrop */
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* Teclado */
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showPhoto(current - 1);
    if (e.key === 'ArrowRight') showPhoto(current + 1);
  });
})();
