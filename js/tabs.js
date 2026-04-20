/* ── tabs.js ── Tabs de serviços e filtro do portfólio ── */
(function () {

  /* ── Tabs de Serviços ── */
  var svcTabs   = document.querySelectorAll('[data-svc-tab]');
  var svcPanels = document.querySelectorAll('[data-svc-panel]');

  svcTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.dataset.svcTab;

      svcTabs.forEach(function (t) {
        t.classList.toggle('active', t.dataset.svcTab === target);
        t.setAttribute('aria-selected', t.dataset.svcTab === target ? 'true' : 'false');
      });
      svcPanels.forEach(function (p) {
        p.classList.toggle('active', p.dataset.svcPanel === target);
      });
    });
  });

  /* ── Filtro do Portfólio ── */
  var pfTabs  = document.querySelectorAll('[data-pf-filter]');
  var pfItems = document.querySelectorAll('[data-pf-cat]');

  pfTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var filter = tab.dataset.pfFilter;

      pfTabs.forEach(function (t) {
        t.classList.toggle('active', t.dataset.pfFilter === filter);
      });

      pfItems.forEach(function (item) {
        if (filter === 'todos') {
          item.classList.remove('hidden');
        } else {
          var cats = item.dataset.pfCat.split(' ');
          item.classList.toggle('hidden', !cats.includes(filter));
        }
      });
    });
  });

})();
