// Marathon Outdoors: home page interactions
{
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) Header turns solid black (and shows the small logo) after leaving the hero.
  //    The hero photos also drift slightly slower than the page (parallax).
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero');
  const slidesWrap = document.querySelector('.hero-slides');
  const mobileBar = document.querySelector('.mobile-bar');
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > hero.offsetHeight - 120);
    // phones: show the Call / Request a Quote bar once the visitor scrolls past the hero
    mobileBar.classList.toggle('is-shown', y > hero.offsetHeight * 0.6);
    if (!reduceMotion && y < hero.offsetHeight) {
      slidesWrap.style.transform = `translateY(${y * 0.3}px)`;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 1b) Mobile menu: hamburger opens a full-screen menu; tapping a link or Esc closes it
  const toggle = document.querySelector('.nav-toggle');
  const setMenu = (open) => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.querySelectorAll('.main-nav a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // 2) Hero slideshow: cross-fades every 6 seconds; dots jump to a photo
  const slides = [...document.querySelectorAll('.hero .slide')];
  const dots = [...document.querySelectorAll('.hero-dots .dot')];
  let current = 0;
  let timer = null;
  const show = (i) => {
    slides[current].classList.remove('is-active');
    dots[current].classList.remove('is-active');
    current = (i + slides.length) % slides.length;
    slides[current].classList.add('is-active');
    dots[current].classList.add('is-active');
  };
  const start = () => {
    if (reduceMotion) return;
    clearInterval(timer);
    timer = setInterval(() => show(current + 1), 6000);
  };
  dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); start(); }));
  start();

  // 3) Scroll reveals: anything with .reveal fades up when it enters the screen
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);   // animate once
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // 4) Open-graded diagram: start the rain / drainage animation when it's on screen
  const compare = document.getElementById('compare');
  const compareObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        compare.classList.add('in-view');
        compareObserver.disconnect();
      }
    });
  }, { threshold: 0.35 });
  compareObserver.observe(compare);

  // 5) Cross-section textures: draw realistic stone layers as small SVG tiles
  //    (seeded so they look the same on every visit)
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const stoneTile = ({ w = 240, h, size, jitter, colors, base, gap = 0, seed, specks = 0, speckColors = [] }) => {
    const r = rng(seed);
    let shapes = '';
    for (let i = 0; i < specks; i++) {
      const c = speckColors[Math.floor(r() * speckColors.length)];
      shapes += `<circle cx="${(r() * w).toFixed(1)}" cy="${(r() * h).toFixed(1)}" r="${(0.4 + r() * 0.9).toFixed(2)}" fill="${c}"/>`;
    }
    if (size) {
      const cols = Math.max(1, Math.round(w / (size + gap)));
      const step = w / cols;                       // exact fit so the tile repeats with no seam
      const rows = Math.ceil(h / (step * 0.8)) + 1;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = col * step + (row % 2 ? step / 2 : 0) + (r() - 0.5) * jitter;
          const cy = row * step * 0.8 + (r() - 0.5) * jitter;
          const rad = (size / 2) * (0.75 + r() * 0.45);
          const n = 5 + Math.floor(r() * 3);
          const rot = r() * Math.PI;
          const pts = [];
          for (let k = 0; k < n; k++) {
            const a = rot + (k / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
            const rr = rad * (0.7 + r() * 0.38);
            pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.8]);
          }
          const c = colors[Math.floor(r() * colors.length)];
          // draw the stone, plus a copy across the tile edge so neighbouring tiles join cleanly
          [0, -w, w].forEach((dx) => {
            const x0 = cx + dx;
            if (x0 < -rad || x0 > w + rad) return;
            const p = pts.map(([px, py]) => `${(x0 + px).toFixed(1)},${(cy + py).toFixed(1)}`);
            shapes += `<polygon points="${p.join(' ')}" fill="${c}" stroke="rgba(0,0,0,.4)" stroke-width="${size > 8 ? 0.9 : 0.4}"/>`;
            if (size > 8) {   // light facet + shadow edge so big stones look angular, not flat
              shapes += `<polygon points="${p.slice(0, 3).join(' ')} ${x0.toFixed(1)},${cy.toFixed(1)}" fill="rgba(255,255,255,.16)"/>`;
              shapes += `<polygon points="${p.slice(-3).join(' ')} ${x0.toFixed(1)},${cy.toFixed(1)}" fill="rgba(0,0,0,.14)"/>`;
            }
          });
        }
      }
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${base}"/>${shapes}</svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  };
  const textures = {
    sand:   { size: 0, specks: 900, base: '#b9a684', speckColors: ['#d8c8a4', '#9c8a68', '#cbb994', '#8e7d5f'], seed: 3 },
    gravel: { size: 5, gap: -1, jitter: 2, base: '#8a847a', colors: ['#9d978c', '#7d786f', '#b0aa9f', '#6e6a63', '#a39d92'], specks: 500, speckColors: ['#c9c3b8', '#5e5a54'], seed: 7 },
    chips:  { size: 7, gap: 1, jitter: 2, base: '#2a2725', colors: ['#9a958d', '#b5b0a7', '#827d75', '#a8a39a'], seed: 11 },
    stone:  { size: 27, gap: 3, jitter: 8, base: '#141312', colors: ['#8f8b84', '#a7a39b', '#77736d', '#b8b3aa', '#6a6761', '#9b968e'], seed: 19 },
    soil:   { size: 0, specks: 700, base: '#4a3727', speckColors: ['#5c4632', '#3a2b1e', '#6b543d', '#2f2318'], seed: 23 },
  };
  document.querySelectorAll('.cut .layer').forEach((layer) => {
    const kind = Object.keys(textures).find((k) => layer.classList.contains(k));
    if (!kind) return;
    const h = layer.offsetHeight || 120;
    layer.style.backgroundImage = stoneTile({ ...textures[kind], h: Math.max(h, 20) });
  });
}
