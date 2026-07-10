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

  /* composition ("Посмотреть состав") — inline expandable panel like the original (#contopen) */
  function buildSostavPanel() {
    var existing = document.getElementById('sostav-panel');
    if (existing) return existing;
    var src = document.getElementById('rec415753826');
    if (!src) return null;
    var names = [], tips = [];
    src.querySelectorAll('.tn-atom[field^="tn_text"]').forEach(function (e) {
      var t = e.textContent.trim();
      if (t && t.length < 44 && t.indexOf(':') < 0 && t.toLowerCase().indexOf('состав') < 0) names.push(t);
    });
    src.querySelectorAll('.tn-atom__tip-text').forEach(function (e) { tips.push(e.textContent.trim()); });
    if (!names.length) return null;
    var items = '';
    for (var i = 0; i < names.length; i++) {
      items += '<li class="sostav__item"><span class="sostav__badge">' + (i + 1) + '</span>' +
        '<div class="sostav__body"><span class="sostav__name">' + names[i] + '</span>' +
        (tips[i] ? '<span class="sostav__desc">' + tips[i] + '</span>' : '') + '</div></li>';
    }
    var panel = document.createElement('section');
    panel.id = 'sostav-panel'; panel.className = 'sostav-panel'; panel.hidden = true;
    panel.innerHTML = '<div class="sostav-panel__inner"><h2 class="sostav-panel__title">Состав</h2>' +
      '<ul class="sostav__list">' + items + '</ul></div>';
    /* insert right after the "Что такое" record, matching the original position */
    var anchor = document.getElementById('rec415618852') || src;
    anchor.parentNode.insertBefore(panel, anchor.nextSibling);
    return panel;
  }
  function toggleSostav(btn) {
    var panel = buildSostavPanel();
    if (!panel) return;
    var willOpen = panel.hidden;
    panel.hidden = !willOpen;
    if (btn) btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if (willOpen) { panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  }

  document.addEventListener('click', function (e) {
    var sost = e.target.closest('a[href="#contopen"], .js-sostav');
    if (sost) { e.preventDefault(); toggleSostav(sost); return; }
    var opener = e.target.closest('a[href="#order"], .js-order');
    if (opener) { e.preventDefault(); openModal(); return; }
    if (e.target.closest('.js-modal-close')) closeModal();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* smooth anchor scroll (skips #order and #contopen) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2 || id === '#order' || id === '#contopen') return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 70, behavior: 'smooth' });
  });

  /* FAQ accordion (Tilda T668): toggle .t668__opened on the header; CSS reveals .t668__content */
  document.querySelectorAll('.t668__header').forEach(function (h) {
    h.addEventListener('click', function () { h.classList.toggle('t668__opened'); });
  });

  /* benefit carousel: drag/swipe (arrows removed to match the original — original owl nav is disabled) */
  document.querySelectorAll('.js-carousel').forEach(function (car) {
    var track = car.querySelector('.js-carousel-track');
    if (!track) return;
    var step = function () { return Math.min(track.clientWidth * 0.9, 420); };
    var raf = null;
    function animate(delta) {
      if (raf) cancelAnimationFrame(raf);
      var start = track.scrollLeft;
      var max = track.scrollWidth - track.clientWidth;
      var target = Math.max(0, Math.min(start + delta, max));
      var t0 = performance.now(), dur = 340;
      function frame(now) {
        var p = Math.min((now - t0) / dur, 1);
        var e = 0.5 - Math.cos(p * Math.PI) / 2;
        track.scrollLeft = start + (target - start) * e;
        if (p < 1) raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
    }
    var pv = car.querySelector('.js-prev'), nx = car.querySelector('.js-next');
    if (pv) pv.addEventListener('click', function () { animate(-step()); });
    if (nx) nx.addEventListener('click', function () { animate(step()); });
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

/* Tilda zero-block artboard heights per breakpoint (replaces Tilda's JS; keeps native responsive layout) */
(function(){
  var order=['data-artboard-height-res-320','data-artboard-height-res-480','data-artboard-height-res-640','data-artboard-height-res-960','data-artboard-height'];
  function idxFor(w){ return w<=479?0 : w<=639?1 : w<=959?2 : w<=1199?3 : 4; }
  function apply(){
    var w=window.innerWidth, start=idxFor(w);
    document.querySelectorAll('.t396__artboard').forEach(function(art){
      var h=null;
      for(var i=start;i<order.length;i++){ var v=art.getAttribute(order[i]); if(v!=null&&v!==''){ h=v; break; } }
      if(h!=null) art.style.height=h+'px';
    });
  }
  if(document.readyState!=='loading') apply(); else document.addEventListener('DOMContentLoaded',apply);
  window.addEventListener('load',apply);
  var t; window.addEventListener('resize',function(){ clearTimeout(t); t=setTimeout(apply,120); });
})();

/* mobile: order elements by base coords for the scoped-flow blocks only */
(function(){
  var RECS=['rec415602357','rec420197439','rec425260438','rec420198032'];
  function order(){
    var mob=window.matchMedia('(max-width:640px)').matches;
    RECS.forEach(function(id){
      var rec=document.getElementById(id); if(!rec) return;
      rec.querySelectorAll('.t396__artboard').forEach(function(art){
        var els=Array.prototype.slice.call(art.children).filter(function(e){return e.classList&&e.classList.contains('t396__elem');});
        if(!mob){ els.forEach(function(e){e.style.order='';}); return; }
        els.map(function(e){var t=parseFloat(e.getAttribute('data-field-top-value'));if(isNaN(t))t=0;var l=parseFloat(e.getAttribute('data-field-left-value'));if(isNaN(l))l=0;return {e:e,k:t*10000+l};})
           .sort(function(a,b){return a.k-b.k;}).forEach(function(o,i){o.e.style.order=i;});
      });
    });
  }
  if(document.readyState!=='loading') order(); else document.addEventListener('DOMContentLoaded',order);
  window.addEventListener('load',order);
  var t; window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(order,150);});
})();


/* mobile: swap the cropped hero pack for the full clean pack */
(function(){
  function swap(){
    var mob=window.matchMedia('(max-width:640px)').matches;
    var el=document.querySelector('#rec415602357 [data-elem-id="1645164268854"] img');
    if(!el) return;
    if(mob){ if(!el.dataset.orig) el.dataset.orig=el.getAttribute('src'); el.setAttribute('src','mobile-hero-pack.webp'); }
    else if(el.dataset.orig){ el.setAttribute('src',el.dataset.orig); }
  }
  if(document.readyState!=='loading') swap(); else document.addEventListener('DOMContentLoaded',swap);
  var t; window.addEventListener('resize',function(){clearTimeout(t);t=setTimeout(swap,150);});
})();

/* mobile: hide sticky header on scroll-down, reveal on scroll-up */
(function(){
  var h=document.querySelector('.site-header'); if(!h) return;
  var last=0, ticking=false;
  function upd(){
    var y=window.pageYOffset||document.documentElement.scrollTop;
    if(window.innerWidth>640){ h.style.transform=''; last=y; ticking=false; return; }
    if(y>last && y>90){ h.style.transform='translateY(-100%)'; }   /* down -> hide */
    else { h.style.transform='translateY(0)'; }                    /* up -> show */
    last=y<0?0:y; ticking=false;
  }
  h.style.transition='transform .28s ease';
  window.addEventListener('scroll',function(){ if(!ticking){ requestAnimationFrame(upd); ticking=true; } },{passive:true});
})();
