/* Maquette du nouveau site — animations, version 2.
   L'ouverture et l'en-tête s'animent en CSS seul. Tout ce qui suit le
   défilement passe par GSAP ; s'il ne se charge pas, la page reste lisible. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  function tous(sel, racine) { return Array.prototype.slice.call((racine || document).querySelectorAll(sel)); }

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

  /* ---------- Le menu s'efface quand on descend ; la barre du haut suit la lecture ---------- */
  var dernier = 0;
  var barre = document.getElementById('progress');
  function suivre() {
    var y = window.scrollY;
    nav.classList.toggle('is-hidden', y > 500 && y > dernier && menu.hidden);
    dernier = y;
    var max = doc.scrollHeight - window.innerHeight;
    if (barre) barre.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
  }
  window.addEventListener('scroll', suivre, { passive: true });
  suivre();

  var calme = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger || calme) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
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
    var y = cible.getBoundingClientRect().top + window.scrollY;
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: 'smooth' });
  });

  /* ---------- 1. En-tête : en descendant, la voiture démarre et quitte l'écran ---------- */
  var depart = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 };
  gsap.to('.hero-car', { x: function () { return -window.innerWidth * 1.15; }, ease: 'power1.in', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 35%', scrub: .4, invalidateOnRefresh: true } });
  /* Ces trois éléments ont aussi une entrée en CSS : on donne ici leur état de départ complet,
     pour que GSAP ne fige pas une image prise au milieu de cette entrée. */
  gsap.fromTo('.hero-sun', { x: 0, y: 0, yPercent: 0, scale: 1, rotation: 0 }, { scale: 1.35, yPercent: -14, ease: 'none', scrollTrigger: depart });
  gsap.to('.hero-in', { yPercent: -14, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '18% top', end: '75% top', scrub: true } });
  gsap.fromTo('.hero-word', { x: 0, y: 0, xPercent: 0, scale: 1, rotation: 0 }, { xPercent: -12, ease: 'none', scrollTrigger: depart });
  gsap.fromTo('.sticker', { x: 0, y: 0, yPercent: 0, scale: 1, rotation: 9 }, { yPercent: -90, rotation: 50, ease: 'none', scrollTrigger: depart });

  /* Les deux bandeaux s'écartent comme des ciseaux */
  gsap.fromTo('.t-blue', { rotation: -6 }, { rotation: -1.5, ease: 'none', scrollTrigger: { trigger: '.tickers', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.t-green', { rotation: 5 }, { rotation: 1, ease: 'none', scrollTrigger: { trigger: '.tickers', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- 2. Le texte s'allume mot à mot ---------- */
  tous('[data-words]').forEach(function (el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (m) { return '<span class="w">' + m + '</span>'; }).join(' ');
    gsap.fromTo(el.querySelectorAll('.w'), { opacity: .14 }, {
      opacity: 1, stagger: .08, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 50%', scrub: true }
    });
  });

  /* Les chiffres comptent */
  tous('[data-count]').forEach(function (el) {
    var fin = Number(el.getAttribute('data-count'));
    var brut = el.hasAttribute('data-plain');
    var o = { v: brut ? fin - 40 : 0 };
    gsap.to(o, {
      v: fin, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: function () {
        var n = Math.round(o.v);
        el.textContent = brut ? String(n) : n.toLocaleString('fr-FR').replace(/[  ]/g, ' ');
      }
    });
  });
  gsap.from('.stats > div', { y: 50, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 88%' } });

  /* ---------- 3. La flotte : la page se fige, le défilement fait passer les voitures ---------- */
  var fleet = document.querySelector('.fleet');
  var scene = fleet.querySelector('.fleet-stage');
  var piste = document.getElementById('fleet-track');
  var numero = document.getElementById('fleet-n');
  var jauge = document.getElementById('fleet-bar');
  function course() { return Math.max(0, piste.scrollWidth - window.innerWidth); }
  function mesurer() { fleet.style.height = (scene.offsetHeight + course()) + 'px'; }
  mesurer();
  ScrollTrigger.addEventListener('refreshInit', mesurer);
  var defile = gsap.to(piste, {
    x: function () { return -course(); }, ease: 'none',
    scrollTrigger: {
      trigger: fleet, start: 'top top', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true,
      onUpdate: function (s) {
        numero.textContent = '0' + Math.min(6, Math.floor(s.progress * 6.4) + 1);
        jauge.style.transform = 'scaleX(' + Math.max(.02, s.progress) + ')';
      }
    }
  });
  /* Chaque voiture avance dans sa carte pendant que la carte traverse l'écran */
  tous('.car-pic img').forEach(function (img) {
    gsap.fromTo(img, { xPercent: 12 }, { xPercent: -7, ease: 'none', scrollTrigger: { trigger: img.closest('.car'), containerAnimation: defile, start: 'left right', end: 'right left', scrub: true } });
  });
  gsap.from('.fleet .car', { y: 110, opacity: 0, rotation: 5, duration: 1, stagger: .09, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: fleet, start: 'top 62%' } });
  gsap.from('.fleet-head', { y: 40, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: fleet, start: 'top 70%' } });

  /* ---------- 4. La route : elle se dessine entre les étapes, une voiture la suit ---------- */
  var bloc = document.getElementById('road-wrap');
  var dessin = document.getElementById('road-svg');
  var rBase = document.getElementById('r-base');
  var rFait = document.getElementById('r-done');
  var rTirets = document.getElementById('r-dash');
  var rReperes = document.getElementById('r-pins');
  var rAuto = document.getElementById('r-car');
  var degrade = dessin.querySelector('#g-road');
  var etapes = tous('.stop', bloc);
  var longueur = 0, seuils = [], reperes = [], echelle = 1, avance = { p: 0 };

  function longueurPourY(y) {
    var a = 0, b = longueur, i, m;
    for (i = 0; i < 22; i++) { m = (a + b) / 2; if (rBase.getPointAtLength(m).y < y) a = m; else b = m; }
    return (a + b) / 2;
  }
  function tracer() {
    var L = bloc.clientWidth, H = bloc.clientHeight, large = window.innerWidth >= 980;
    var cx = large ? L / 2 : 24, amp = large ? Math.min(84, L * .07) : 9;
    echelle = large ? .95 : .62;
    dessin.setAttribute('viewBox', '0 0 ' + L + ' ' + H);
    degrade.setAttribute('y2', H);
    var pts = [[cx, -40]];
    etapes.forEach(function (s, i) {
      var y = s.offsetTop + (large ? s.offsetHeight / 2 : 24);
      var cote = large ? (s.offsetLeft > L / 4 ? 1 : -1) : (i % 2 ? 1 : -1);
      pts.push([cx + cote * amp, y]);
    });
    pts.push([cx, H + 20]);
    var d = 'M' + pts[0][0] + ' ' + pts[0][1], i, a, b, m;
    for (i = 1; i < pts.length; i++) {
      a = pts[i - 1]; b = pts[i]; m = (a[1] + b[1]) / 2;
      d += ' C' + a[0] + ' ' + m + ' ' + b[0] + ' ' + m + ' ' + b[0] + ' ' + b[1];
    }
    rBase.setAttribute('d', d); rFait.setAttribute('d', d); rTirets.setAttribute('d', d);
    longueur = rBase.getTotalLength();
    rFait.style.strokeDasharray = longueur;
    while (rReperes.firstChild) rReperes.removeChild(rReperes.firstChild);
    seuils = []; reperes = [];
    etapes.forEach(function (s, i) {
      var p = pts[i + 1];
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('class', 'r-pin'); c.setAttribute('cx', p[0]); c.setAttribute('cy', p[1]); c.setAttribute('r', large ? 9 : 7);
      rReperes.appendChild(c); reperes.push(c);
      seuils.push(longueurPourY(p[1]) / longueur);
    });
    placer();
  }
  function placer() {
    if (!longueur) return;
    var l = Math.max(1, Math.min(longueur - 1, avance.p * longueur));
    var pt = rBase.getPointAtLength(l), av = rBase.getPointAtLength(l - 1), ap = rBase.getPointAtLength(l + 1);
    var angle = Math.atan2(ap.y - av.y, ap.x - av.x) * 180 / Math.PI + 90;
    rAuto.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ') rotate(' + angle.toFixed(1) + ') scale(' + echelle + ')');
    rFait.style.strokeDashoffset = longueur - l;
    etapes.forEach(function (s, i) {
      var passe = avance.p >= seuils[i] - .006;
      s.classList.toggle('is-on', passe);
      reperes[i].classList.toggle('on', passe);
    });
  }
  tracer();
  ScrollTrigger.addEventListener('refresh', tracer);
  gsap.to(avance, { p: 1, ease: 'none', onUpdate: placer, scrollTrigger: { trigger: bloc, start: 'top 58%', end: 'bottom 62%', scrub: .5 } });

  etapes.forEach(function (stop) {
    var photo = stop.querySelector('.stop-photo');
    var txt = stop.querySelector('.stop-txt');
    if (photo) {
      gsap.fromTo(photo, { clipPath: 'inset(0% 0% 100% 0% round 26px)' }, { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: stop, start: 'top 80%' } });
      gsap.fromTo(photo.querySelector('img'), { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: stop, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    gsap.from(txt.children, { y: 36, opacity: 0, duration: .8, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: txt, start: 'top 86%' } });
  });

  /* ---------- Titres : ils montent en entrant ---------- */
  tous('.road-head, .why-head, .reviews > h2, .reviews > .tag, .mani > .tag').forEach(function (el) {
    gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* ---------- 5. La conversation s'écrit, les pictogrammes se dessinent ---------- */
  var bulles = tous('#chat .msg, #chat .msg-time');
  gsap.set(bulles, { opacity: 0, scale: .5, y: 16 });
  gsap.from('#chat', { y: 70, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '#chat', start: 'top 88%' } });
  gsap.to(bulles, { opacity: 1, scale: 1, y: 0, duration: .55, ease: 'back.out(1.7)', stagger: .7, delay: .3, scrollTrigger: { trigger: '#chat', start: 'top 70%' } });
  tous('.perks li').forEach(function (li) {
    var st = { trigger: li, start: 'top 88%' };
    gsap.from(li, { y: 44, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: st });
    gsap.to(li.querySelectorAll('path'), { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: .2, delay: .2, scrollTrigger: st });
  });

  /* ---------- 6. Avis ---------- */
  gsap.from('.quote', { y: 90, opacity: 0, duration: 1, stagger: .14, ease: 'back.out(1.3)', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.quotes', start: 'top 84%' } });

  /* ---------- 7. Le soleil descend derrière la pyramide, la voiture arrive ---------- */
  var soir = { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: true };
  gsap.fromTo('.cta-sun', { yPercent: -26 }, { yPercent: 10, ease: 'none', scrollTrigger: soir });
  gsap.fromTo('.cta-pyramid', { yPercent: 45 }, { yPercent: 0, ease: 'none', scrollTrigger: soir });
  gsap.from('.cta-car', { x: function () { return window.innerWidth; }, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 30%' } });
  gsap.from('.cta-in > *', { y: 50, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 60%' } });

  gsap.from('.foot-wm b', { yPercent: 110, opacity: 0, duration: 1, stagger: .1, ease: 'power4.out', scrollTrigger: { trigger: '.foot', start: 'top 88%' } });

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
