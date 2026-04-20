/* ── form.js ── validação e envio do formulário de contato ── */
(function () {
  var form    = document.getElementById('contact-form');
  var msgEl   = document.getElementById('form-message');
  if (!form) return;

  function showError(fieldId, msg) {
    var field = document.getElementById(fieldId);
    var err   = document.getElementById(fieldId + '-error');
    if (field) field.classList.add('error');
    if (err)   { err.textContent = msg; err.classList.add('visible'); }
  }

  function clearErrors() {
    form.querySelectorAll('.form-input, .form-textarea').forEach(function (el) {
      el.classList.remove('error');
    });
    form.querySelectorAll('.form-error').forEach(function (el) {
      el.classList.remove('visible');
    });
    if (msgEl) { msgEl.className = 'form-message'; msgEl.textContent = ''; }
  }

  function validate() {
    var ok   = true;
    var nome = form.querySelector('#f-nome');
    var mail = form.querySelector('#f-email');
    var msg  = form.querySelector('#f-mensagem');

    if (nome && !nome.value.trim()) {
      showError('f-nome', 'Por favor, informe seu nome.');
      ok = false;
    }
    if (mail) {
      if (!mail.value.trim()) {
        showError('f-email', 'Por favor, informe seu e-mail.');
        ok = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) {
        showError('f-email', 'E-mail inválido.');
        ok = false;
      }
    }
    if (msg && !msg.value.trim()) {
      showError('f-mensagem', 'Por favor, escreva uma mensagem.');
      ok = false;
    }
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();
    if (!validate()) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando…'; }

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    })
    .then(function (res) {
      if (res.ok) {
        form.reset();
        if (msgEl) {
          msgEl.className = 'form-message success';
          msgEl.textContent = 'Mensagem enviada! Em breve entrarei em contato.';
        }
      } else {
        throw new Error('server');
      }
    })
    .catch(function () {
      if (msgEl) {
        msgEl.className = 'form-message error-msg';
        msgEl.textContent = 'Algo deu errado. Tente novamente ou fale pelo WhatsApp.';
      }
    })
    .finally(function () {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enviar mensagem →'; }
    });
  });
})();
