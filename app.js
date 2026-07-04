/* fbr12.com — vanilla behaviours (replaces jQuery + tilda-* + owl + scrollbooster) */
(function () {
  'use strict';

  /* mobile burger */
  var burger = document.querySelector('.js-burger');
  var header = document.querySelector('.site-header');
  if (burger && header) {
    burger.addEventListener('click', function () {
      var open = header.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('nav-lock', open);
    });
    header.querySelectorAll('.site-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        header.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('nav-lock');
      });
    });
  }

  /* callback modal (opens on any link/button to #order) */
  var modal = document.getElementById('lead-modal');
  function openModal() { if (modal) { modal.hidden = false; document.body.classList.add('nav-lock'); } }
  function closeModal() { if (modal) { modal.hidden = true; document.body.classList.remove('nav-lock'); } }
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('a[href="#order"], .js-order');
    if (opener) { e.preventDefault(); openModal(); return; }
    if (e.target.closest('.js-modal-close')) closeModal();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* smooth anchor scroll (skips #order which opens the modal) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2 || id === '#order') return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
  });

  /* FAQ accordion (T668) */
  document.querySelectorAll('.t668__title, .js-faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.t668__wrapper, .js-faq-item') || q.parentElement;
      if (item) item.classList.toggle('is-open');
    });
  });

  /* benefit carousel controls + drag (replaces owl + scrollbooster) */
  document.querySelectorAll('.js-carousel').forEach(function (car) {
    var track = car.querySelector('.js-carousel-track');
    if (!track) return;
    var step = function () { return Math.min(track.clientWidth * 0.9, 360); };
    var p = car.querySelector('.js-prev'), n = car.querySelector('.js-next');
    if (p) p.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (n) n.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    var down = false, sx = 0, sl = 0;
    track.addEventListener('pointerdown', function (e) { down = true; sx = e.clientX; sl = track.scrollLeft; });
    track.addEventListener('pointermove', function (e) { if (down) track.scrollLeft = sl - (e.clientX - sx); });
    window.addEventListener('pointerup', function () { down = false; });
  });

  /* lead form -> Cloudflare Worker (Telegram) */
  document.querySelectorAll('form.js-lead').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]');
      var status = form.querySelector('.js-form-status');
      var data = Object.fromEntries(new FormData(form).entries());
      if (btn) btn.disabled = true;
      function show(msg) { if (status) { status.textContent = msg; status.hidden = false; } }
      fetch(form.action, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
      }).then(function (r) {
        if (!r.ok) throw new Error();
        form.reset(); show('Спасибо! Мы свяжемся с вами.');
      }).catch(function () { show('Ошибка отправки. Напишите на hello@fbr12.com'); })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  });
})();
