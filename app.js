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

  /* callback modal */
  var modal = document.getElementById('lead-modal');
  function openModal() { if (modal) { modal.hidden = false; document.body.classList.add('nav-lock'); } }
  function closeModal() { if (modal) { modal.hidden = true; document.body.classList.remove('nav-lock'); } }
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('a[href="#order"], .js-order');
    if (opener) { e.preventDefault(); openModal(); return; }
    if (e.target.closest('.js-modal-close')) closeModal();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* smooth anchor scroll (skips #order) */
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

  /* FAQ accordion */
  document.querySelectorAll('.t668__title, .js-faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.t668__wrapper, .js-faq-item') || q.parentElement;
      if (item) item.classList.toggle('is-open');
    });
  });

  /* benefit carousel: arrows + drag, animated via rAF (no native smooth dependency) */
  document.querySelectorAll('.js-carousel').forEach(function (car) {
    var track = car.querySelector('.js-carousel-track');
    if (!track) return;
    var step = function () { return Math.min(track.clientWidth * 0.9, 320); };
    var raf = null;
    function animate(delta) {
      if (raf) cancelAnimationFrame(raf);
      var start = track.scrollLeft;
      var max = track.scrollWidth - track.clientWidth;
      var target = Math.max(0, Math.min(start + delta, max));
      var t0 = performance.now(), dur = 340;
      function frame(now) {
        var p = Math.min((now - t0) / dur, 1);
        var e = 0.5 - Math.cos(p * Math.PI) / 2; /* easeInOutSine */
        track.scrollLeft = start + (target - start) * e;
        if (p < 1) raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    }
    var p = car.querySelector('.js-prev'), n = car.querySelector('.js-next');
    if (p) p.addEventListener('click', function () { animate(-step()); });
    if (n) n.addEventListener('click', function () { animate(step()); });
    /* drag-to-scroll */
    var down = false, sx = 0, sl = 0, moved = false;
    track.addEventListener('pointerdown', function (e) { down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; });
    track.addEventListener('pointermove', function (e) { if (down) { if (Math.abs(e.clientX - sx) > 3) moved = true; track.scrollLeft = sl - (e.clientX - sx); } });
    window.addEventListener('pointerup', function () { down = false; });
    track.addEventListener('click', function (e) { if (moved) e.preventDefault(); }, true);
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
