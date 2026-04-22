/* ── tabs.js ── Tabs de serviços e filtro do portfólio ── */
(function () {

  /* ── Tabs de Serviços ── */
  var svcTabs   = document.querySelectorAll('[data-svc-tab]');
  var svcPanels = document.querySelectorAll('[data-svc-panel]');

  function activateSvcTab(target) {
    svcTabs.forEach(function (t) {
      t.classList.toggle('active', t.dataset.svcTab === target);
      t.setAttribute('aria-selected', t.dataset.svcTab === target ? 'true' : 'false');
    });
    svcPanels.forEach(function (p) {
      p.classList.toggle('active', p.dataset.svcPanel === target);
    });
  }

  svcTabs.forEach(function (tab) {
    tab.addEventListener('click',      function () { activateSvcTab(tab.dataset.svcTab); });
    tab.addEventListener('mouseenter', function () { activateSvcTab(tab.dataset.svcTab); });
  });

  /* ── Process Steps — bolinha acende no clique ── */
  var steps = document.querySelectorAll('.process-step');

  steps.forEach(function (step) {
    step.addEventListener('click', function () {
      steps.forEach(function (s) { s.classList.add('process-step--muted'); });
      step.classList.remove('process-step--muted');
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
