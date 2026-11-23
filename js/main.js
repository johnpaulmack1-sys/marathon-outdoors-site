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
}
