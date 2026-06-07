/* ============== JS HOOK ============== */
document.documentElement.classList.add('js');

/* ============== CUSTOM CURSOR ============== */
(function() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
  document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
})();

/* ============== NAV SCROLL ============== */
(function() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const onScroll = () => {
    if (scrollY > 50) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ============== REVEAL ============== */
(function() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || (i * 60);
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach(el => io.observe(el));
  setTimeout(() => {
    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-visible');
    });
  }, 250);
  setTimeout(() => els.forEach(el => el.classList.add('is-visible')), 2000);
})();

/* ============== READING PROGRESS BAR (post pages only) ============== */
(function() {
  const bar = document.getElementById('progress');
  if (!bar) return;
  const onScroll = () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = Math.max(0, Math.min(100, pct)) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ============== HAMBURGER MENU ============== */
(function() {
  const btn = document.getElementById('hamBtn');
  const overlay = document.getElementById('hamOverlay');
  const closeBtn = document.getElementById('hamClose');
  if (!btn || !overlay) return;
  const openMenu = () => { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; btn.setAttribute('aria-expanded', 'true'); };
  const closeMenu = () => { overlay.classList.remove('open'); document.body.style.overflow = ''; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  overlay.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
})();

/* ============== CATEGORY FILTER (index only) ============== */
(function() {
  const filters = document.querySelectorAll('[data-filter]');
  const posts = document.querySelectorAll('[data-cat]');
  if (!filters.length) return;
  filters.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      filters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      posts.forEach(p => {
        if (cat === 'all' || p.dataset.cat === cat) {
          p.style.display = '';
        } else {
          p.style.display = 'none';
        }
      });
    });
  });
})();
