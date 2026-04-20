/* ── accordion.js ── FAQ expandível, um item aberto por vez ── */
(function () {
  var items = document.querySelectorAll('.faq-item');

  items.forEach(function (item) {
    var btn = item.querySelector('.faq-item__btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');

      /* Fechar todos */
      items.forEach(function (i) {
        i.classList.remove('open');
        var b = i.querySelector('.faq-item__btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });

      /* Abrir o clicado (se não estava aberto) */
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();
