/* ── lightbox.js ── galeria do Portfólio ── */
(function () {
  var lightbox  = document.querySelector('.lightbox');
  if (!lightbox) return;

  var imgEl      = lightbox.querySelector('.lightbox__img');
  var nameEl     = lightbox.querySelector('.lightbox__project-name');
  var detailsEl  = lightbox.querySelector('.lightbox__details');
  var closeBtn   = lightbox.querySelector('.lightbox__close');
  var prevBtn    = lightbox.querySelector('[data-lb-prev]');
  var nextBtn    = lightbox.querySelector('[data-lb-next]');

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

    if (detailsEl) {
      detailsEl.innerHTML = '';
      var cardTagline = trigger.querySelector('.portfolio-item__tagline');
      var cardDetails = trigger.querySelector('.portfolio-item__details');
      var cardCredit  = trigger.querySelector('.portfolio-item__credit');
      if (cardTagline) detailsEl.appendChild(cardTagline.cloneNode(true));
      if (cardDetails) detailsEl.appendChild(cardDetails.cloneNode(true));
      if (cardCredit)  detailsEl.appendChild(cardCredit.cloneNode(true));
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

  /* Swipe mouse (desktop) */
  var mouseStartX = 0;
  var mouseDragging = false;
  if (imgEl) {
    imgEl.style.cursor = 'grab';
    imgEl.addEventListener('mousedown', function (e) {
      mouseStartX = e.clientX;
      mouseDragging = true;
      imgEl.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mouseup', function (e) {
      if (!mouseDragging) return;
      mouseDragging = false;
      imgEl.style.cursor = 'grab';
      var dx = e.clientX - mouseStartX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) showPhoto(current + 1);
      else        showPhoto(current - 1);
    });
  }

  /* Swipe touch */
  var touchStartX = 0;
  var touchStartY = 0;
  lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  lightbox.addEventListener('touchend', function (e) {
    if (!lightbox.classList.contains('open')) return;
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    /* Só processa se o swipe for majoritariamente horizontal */
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) showPhoto(current + 1);  /* swipe left  → próxima */
    else        showPhoto(current - 1);  /* swipe right → anterior */
  }, { passive: true });
})();
