/* Maquette du nouveau site — animations.
   L'en-tête s'anime en CSS seul. Tout ce qui suit le défilement passe par
   GSAP ; s'il ne se charge pas, la page reste entièrement lisible. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');

  /* ---------- Menu téléphone ---------- */
  function fermerMenu() {
    menu.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    if (!menu.hidden) { fermerMenu(); return; }
    menu.hidden = false;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    document.body.style.overflow = 'hidden';
  });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) fermerMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) fermerMenu(); });

  /* ---------- Le menu s'efface quand on descend, revient quand on remonte ---------- */
  var dernier = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    nav.classList.toggle('is-hidden', y > 500 && y > dernier && menu.hidden);
    dernier = y;
  }, { passive: true });

  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || calme) return;

  gsap.registerPlugin(ScrollTrigger);
  doc.classList.add('anim');

  /* ---------- Défilement adouci (ordinateur) ---------- */
  var lenis = null;
  if (window.Lenis && window.matchMedia('(pointer: fine)').matches) {
    lenis = new Lenis({ duration: 1.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    var cible = a && document.querySelector(a.getAttribute('href'));
    if (!cible) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(cible, { offset: 0 });
    else cible.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- 1. En-tête : la photo et le titre glissent à des vitesses différentes ---------- */
  gsap.to('.hero-media img', { yPercent: -9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-in', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '25% top', end: 'bottom top', scrub: true } });
  gsap.to('.badge', { yPercent: -60, rotate: 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- Bandeau : il penche selon la vitesse du défilement ---------- */
  var pencher = gsap.quickTo('.ticker-track', 'skewX', { duration: .5, ease: 'power3.out' });
  ScrollTrigger.create({
    onUpdate: function (s) { pencher(gsap.utils.clamp(-14, 14, s.getVelocity() / -160)); }
  });

  /* ---------- 2. Le texte s'allume mot à mot ---------- */
  gsap.utils.toArray('[data-words]').forEach(function (el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (m) { return '<span class="w">' + m + '</span>'; }).join(' ');
    gsap.fromTo(el.querySelectorAll('.w'), { opacity: .13 }, {
      opacity: 1, stagger: .08, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true }
    });
  });

  /* Les chiffres comptent */
  gsap.utils.toArray('[data-count]').forEach(function (el) {
    var fin = Number(el.getAttribute('data-count'));
    var brut = el.hasAttribute('data-plain');
    var o = { v: brut ? fin - 40 : 0 };
    gsap.to(o, {
      v: fin, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: function () {
        var n = Math.round(o.v);
        el.textContent = brut ? String(n) : n.toLocaleString('fr-FR').replace(/ | /g, ' ');
      }
    });
  });
  gsap.from('.stats > div', { y: 40, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 88%' } });

  /* ---------- 3. La flotte défile à l'horizontale ---------- */
  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', function () {
    var piste = document.querySelector('.fleet-track');
    function course() { return Math.max(0, piste.scrollWidth - window.innerWidth); }
    gsap.to(piste, {
      x: function () { return -course(); }, ease: 'none',
      scrollTrigger: { trigger: '.fleet', start: 'top top', end: function () { return '+=' + course(); }, pin: true, scrub: .7, invalidateOnRefresh: true }
    });
  });
  mm.add('(max-width: 900px)', function () {
    gsap.from('.car', { x: 70, opacity: 0, duration: .8, stagger: .08, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.fleet-track', start: 'top 85%' } });
  });

  /* ---------- 4. La route se remplit, la voiture descend ---------- */
  var suivi = { trigger: '.road-wrap', start: 'top 62%', end: 'bottom 62%', scrub: .4 };
  gsap.to('.road-fill', { scaleY: 1, ease: 'none', scrollTrigger: suivi });
  gsap.to('.road-car', { top: '100%', ease: 'none', scrollTrigger: suivi });
  gsap.utils.toArray('.stop').forEach(function (stop) {
    var photo = stop.querySelector('.stop-photo');
    var txt = stop.querySelector('.stop-txt') || stop;
    if (photo) {
      gsap.fromTo(photo, { clipPath: 'inset(0% 0% 100% 0% round 26px)' }, { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: stop, start: 'top 78%' } });
      gsap.fromTo(photo.querySelector('img'), { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: stop, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    gsap.from(txt.children, { y: 36, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: stop, start: 'top 72%' } });
  });

  /* ---------- Titres et blocs : ils montent en entrant ---------- */
  gsap.utils.toArray('.fleet-head, .road-head, .why > h2, .why > .tag, .reviews > h2, .reviews > .tag').forEach(function (el) {
    gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  ScrollTrigger.batch('.tile', { start: 'top 90%', once: true, onEnter: function (b) { gsap.from(b, { y: 60, opacity: 0, duration: .9, stagger: .1, ease: 'power3.out', clearProps: 'transform,opacity' }); } });
  gsap.from('.quote', { y: 90, opacity: 0, duration: 1, stagger: .14, ease: 'back.out(1.4)', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.quotes', start: 'top 82%' } });

  /* ---------- 7. Le soleil se couche derrière la pyramide ---------- */
  var soir = { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: true };
  gsap.fromTo('.cta-sun', { yPercent: -70 }, { yPercent: 0, ease: 'none', scrollTrigger: soir });
  gsap.fromTo('.cta-pyramid', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: soir });
  gsap.from('.cta-in > *', { y: 50, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 55%' } });

  gsap.from('.foot-wm b', { yPercent: 110, opacity: 0, duration: 1, stagger: .1, ease: 'power4.out', scrollTrigger: { trigger: '.foot', start: 'top 85%' } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
