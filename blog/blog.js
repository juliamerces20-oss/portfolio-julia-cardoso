/* ============== JS HOOK ============== */
document.documentElement.classList.add('js');

/* ============== CUSTOM CURSOR ============== */
(function() {
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;
  let mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;
  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  });
  function tick() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(tick);
  }
  tick();
  document.querySelectorAll('a, button, [data-cursor="hover"]').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
  document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
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
