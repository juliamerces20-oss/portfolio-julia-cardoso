/* ===== JC SHELL — preloader, header fixo e menu overlay =====
   Injetado logo após <body>. Roda de forma síncrona para o preloader
   cobrir a página antes de qualquer pintura de conteúdo. */
(function () {
  'use strict';

  var doc = document;
  var html = doc.documentElement;
  html.classList.add('jc-shell');

  var inBlog = /\/blog\//.test(location.pathname);
  var root = inBlog ? '../' : '';
  var isHome = /(^|\/)(index\.html)?$/.test(location.pathname) && !inBlog;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.innerWidth < 861;

  /* ---------- PRELOADER ---------- */
  var seen = false;
  try { seen = sessionStorage.getItem('jc-preloaded') === '1'; } catch (e) { seen = false; }

  function buildPreloader() {
    var pre = doc.createElement('div');
    pre.className = 'jc-pre';
    pre.setAttribute('role', 'status');
    pre.setAttribute('aria-live', 'polite');
    pre.innerHTML =
      '<div class="jc-pre-name">JÚLIA CARDOSO</div>' +
      '<div class="jc-pre-count">0%</div>' +
      '<div class="jc-pre-rule"></div>';
    doc.body.appendChild(pre);
    html.classList.add('jc-locked');

    var count = pre.querySelector('.jc-pre-count');
    var rule = pre.querySelector('.jc-pre-rule');
    var total = isMobile ? 1200 : 1900;
    var start = performance.now();

    function step(now) {
      var t = Math.min((now - start) / total, 1);
      var pct = Math.round(t * 100);
      count.textContent = pct + '%';
      rule.style.width = pct + '%';
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(finish, 180);
      }
    }

    function finish() {
      pre.classList.add('is-out');
      html.classList.remove('jc-locked');
      html.classList.add('jc-ready');
      doc.dispatchEvent(new CustomEvent('jc:ready'));
      setTimeout(function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 1000);
      try { sessionStorage.setItem('jc-preloaded', '1'); } catch (e) {}
    }

    requestAnimationFrame(step);
  }

  /* ---------- HEADER + MENU ---------- */
  var LINKS = [
    { n: '01', t: 'Trabalhos', h: root + 'index.html#trabalhos' },
    { n: '02', t: 'Reels', h: root + 'index.html#reels' },
    { n: '03', t: 'Posts', h: root + 'index.html#posts' },
    { n: '04', t: 'Sistemas com IA', h: root + 'index.html#sistemas' },
    { n: '05', t: 'Curso', h: root + 'index.html#curso' },
    { n: '06', t: 'Diário', h: root + (inBlog ? 'blog/index.html' : 'index.html#diario') },
    { n: '07', t: 'Info', h: root + 'info.html' },
    { n: '08', t: 'Contato', h: root + 'index.html#contato' }
  ];

  function buildHeader() {
    var hdr = doc.createElement('header');
    hdr.className = 'jc-hdr';
    hdr.id = 'jcHdr';
    hdr.innerHTML =
      '<a class="jc-hdr-brand" href="' + (isHome ? '#hero' : root + 'index.html') + '" data-cursor="hover">JÚLIA CARDOSO</a>' +
      '<span class="jc-hdr-role">Diretora Criativa</span>' +
      '<span class="jc-hdr-clock">GMT−3 <span id="jcClock">--:--</span></span>' +
      '<button class="jc-hdr-menu" id="jcMenuBtn" aria-label="Abrir menu" aria-expanded="false">' +
        '<span class="jc-hdr-menu-track"><span>Menu</span><span>Menu</span></span>' +
      '</button>';

    var menu = doc.createElement('nav');
    menu.className = 'jc-menu';
    menu.id = 'jcMenu';
    menu.setAttribute('aria-hidden', 'true');
    var items = LINKS.map(function (l, i) {
      return '<a href="' + l.h + '" data-cursor="hover" style="transition-delay:' + (0.06 + i * 0.045) + 's">' +
             '<i>' + l.n + '</i>' + l.t + '</a>';
    }).join('');
    menu.innerHTML =
      '<div class="jc-menu-list">' + items + '</div>' +
      '<div class="jc-menu-foot">' +
        '<a href="https://www.instagram.com/juliacardoso.dsgn" target="_blank" rel="noopener" data-cursor="hover">Instagram</a>' +
        '<a href="https://www.linkedin.com/in/j%C3%BAlia-merc%C3%AAs/" target="_blank" rel="noopener" data-cursor="hover">LinkedIn</a>' +
        '<a href="https://www.behance.net/juliaxmerces" target="_blank" rel="noopener" data-cursor="hover">Behance</a>' +
        '<a href="https://tally.so/r/xXNeKr" target="_blank" rel="noopener" data-cursor="hover">Solicitar orçamento</a>' +
      '</div>';

    var close = doc.createElement('button');
    close.className = 'jc-menu-close';
    close.id = 'jcMenuClose';
    close.setAttribute('aria-label', 'Fechar menu');
    close.textContent = 'Fechar';

    doc.body.appendChild(hdr);
    doc.body.appendChild(menu);
    doc.body.appendChild(close);

    var btn = doc.getElementById('jcMenuBtn');
    function open() {
      menu.classList.add('is-open');
      close.classList.add('is-open');
      hdr.classList.add('is-menu-open');
      menu.setAttribute('aria-hidden', 'false');
      btn.setAttribute('aria-expanded', 'true');
      doc.body.style.overflow = 'hidden';
    }
    function shut() {
      menu.classList.remove('is-open');
      close.classList.remove('is-open');
      hdr.classList.remove('is-menu-open');
      menu.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      doc.body.style.overflow = '';
    }
    btn.addEventListener('click', function () {
      menu.classList.contains('is-open') ? shut() : open();
    });
    close.addEventListener('click', shut);
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') shut(); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', shut); });

    /* Fundo do header: transparente sobre a hero escura, branco no resto */
    var hero = doc.getElementById('hero');
    function onScroll() {
      if (!hero) { hdr.classList.add('on-light'); return; }
      hdr.classList.toggle('on-light', window.scrollY > hero.offsetHeight * 0.85);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    /* Relógio do Rio, alimenta o header e o da hero */
    var tick = function () {
      var t = new Date().toLocaleTimeString('pt-BR', {
        timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit'
      });
      var a = doc.getElementById('jcClock');
      if (a) a.textContent = t;
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ---------- ENTRADA POR SCROLL ---------- */
  function buildReveal() {
    if (reduced) return;

    /* Páginas sem marcação própria ganham as seções inteiras */
    if (!doc.querySelector('.reveal')) {
      doc.querySelectorAll('main > section').forEach(function (el) {
        el.classList.add('reveal');
      });
    }

    var els = doc.querySelectorAll('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        var d = entry.target.dataset.delay || i * 90;
        setTimeout(function () { entry.target.classList.add('is-visible'); }, d);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });

    /* Rede de segurança: nada fica invisível se o observer falhar */
    setTimeout(function () {
      els.forEach(function (el) { el.classList.add('is-visible'); });
    }, 2600);
  }

  /* O preloader sobe na hora, antes de qualquer conteúdo pintar.
     O header espera o DOM para poder ler a hero. */
  if (!seen && !reduced && doc.body) {
    buildPreloader();
  } else {
    html.classList.add('jc-ready');
  }

  function boot() { buildHeader(); buildReveal(); }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
