import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ---------- Lenis ---------- */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
window.__lenis = lenis;
if (import.meta.env.DEV) window.__anp = { lenis, ScrollTrigger };

const h0 = document.body.scrollHeight;
document.fonts?.ready.then(() => { if (document.body.scrollHeight !== h0) ScrollTrigger.refresh(); });

/* ---------- Reveals (transform/opacity only, with a sweep so fast scrolls never leave content hidden) ---------- */
const revealEls = [...document.querySelectorAll('[data-reveal]')];
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -8% 0px' });
function show(el) {
  const d = parseFloat(el.dataset.revealDelay || '0');
  if (d) el.style.transitionDelay = d + 's';
  el.classList.add('is-in');
}
revealEls.forEach((el) => io.observe(el));
function sweep() {
  const lim = innerHeight * 0.92;
  for (const el of revealEls) if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < lim) { show(el); io.unobserve(el); }
}
let sweepRaf = 0;
addEventListener('scroll', () => { if (!sweepRaf) sweepRaf = requestAnimationFrame(() => { sweepRaf = 0; sweep(); }); }, { passive: true });

/* ---------- Header ---------- */
const hdr = document.querySelector('[data-header]');
let lastY = scrollY;
function onScroll() {
  const y = scrollY;
  hdr?.classList.toggle('is-solid', y > 40);
  if (!root.classList.contains('menu-open')) hdr?.classList.toggle('is-hidden', y > 400 && y > lastY + 2);
  if (y < lastY - 2) hdr?.classList.remove('is-hidden');
  lastY = y;
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Mobile menu ---------- */
const menuBtn = document.querySelector('[data-menu-btn]');
const menu = document.querySelector('[data-menu]');
function setMenu(open) {
  if (!menuBtn || !menu) return;
  menuBtn.setAttribute('aria-expanded', String(open));
  menu.hidden = !open;
  root.classList.toggle('menu-open', open);
  if (open) { lenis?.stop(); hdr?.classList.remove('is-hidden'); gsap.fromTo(menu.querySelectorAll('.menu__link, .menu__foot'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.04, ease: 'power3.out' }); }
  else lenis?.start();
}
menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* ---------- Page transitions (≤0.35s out, 0.4s in) ---------- */
const pt = document.querySelector('[data-pt]');
const bar = pt?.querySelector('.pt__bar');
if (pt && !reduced) {
  const from = sessionStorage.getItem('pt');
  if (from) {
    sessionStorage.removeItem('pt');
    gsap.set(pt, { scaleY: 1, transformOrigin: 'top' });
    gsap.to(pt, { scaleY: 0, duration: 0.4, ease: 'power3.inOut', delay: 0.02 });
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank' || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash) || url.href === location.href) return;
    if (!/^https?:/.test(url.protocol)) return;
    e.preventDefault();
    sessionStorage.setItem('pt', '1');
    gsap.set(pt, { transformOrigin: 'bottom' });
    gsap.to(bar, { opacity: 1, duration: 0.2, delay: 0.1 });
    gsap.to(pt, { scaleY: 1, duration: 0.32, ease: 'power3.in', onComplete: () => { location.href = url.href; } });
  });
  addEventListener('pageshow', (e) => { if (e.persisted) gsap.set(pt, { scaleY: 0 }); });
}

/* ---------- Cursor (subtle: 24px ring + 6px dot, ~40px on links; hidden on touch) ---------- */
const cur = document.querySelector('[data-cursor]');
if (cur && matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
  const ring = cur.querySelector('.cursor__ring');
  const dot = cur.querySelector('.cursor__dot');
  const rx = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    cur.classList.add('is-on');
    rx(e.clientX); ry(e.clientY);
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    cur.classList.toggle('is-link', !!e.target.closest('a, button, label, [data-hover]'));
  }, { passive: true });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
}

/* ---------- Magnetic buttons ---------- */
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
  document.querySelectorAll('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.2, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.3, ease: 'power3' });
    });
    el.addEventListener('pointerleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }));
  });
}

/* ---------- Parallax on photos marked data-parallax (transform only) ---------- */
if (!reduced) {
  document.querySelectorAll('[data-parallax] img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}
