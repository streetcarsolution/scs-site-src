/* Consentement aux contenus externes du NOUVEAU site (copie de assets/js/consentement.js).
 *
 * L'ancien fichier (assets/js/consentement.js) continue de servir les pages de l'ancien
 * site. Celui-ci sert les pages du nouveau site ; son style est dans consentement.css.
 * Les deux lisent et ecrivent le meme choix (cle SCS_CONSENT) : un visiteur qui a deja
 * choisi n'est pas redemande en passant d'une page a l'autre.
 *
 * Le site ne depose lui-meme aucun cookie publicitaire ni de mesure d'audience.
 * Trois services exterieurs peuvent en deposer : les videos Facebook (avis),
 * la carte Google Maps et Google Traduction. Ils ne sont charges qu'apres l'accord
 * du visiteur.
 *
 * Dans les pages, un contenu externe se declare ainsi :
 *   <iframe data-consent="maps" data-consent-src="https://..."></iframe>
 *   <script type="text/plain" data-consent="facebook" data-consent-src="https://..."></script>
 *
 * Une video Facebook s'ouvre dans une fenetre sur la page : il suffit d'un lien
 *   <a href="https://www.facebook.com/.../videos/123/" data-video>...<p>La citation</p>...</a>
 * Sans accord, la fenetre montre un bouton « Afficher les vidéos » et un lien
 * « Ouvrir sur Facebook ». Sans JavaScript, le lien ouvre simplement Facebook.
 *
 * Le choix est garde six mois dans le navigateur, puis redemande. Le lien
 * « Gérer les cookies » du pied de page (bouton data-gerer-cookies, branche dans
 * site.js) rouvre le bandeau.
 */
(function () {
  'use strict';

  var CLE = 'SCS_CONSENT';
  var SERVICES = ['facebook', 'maps', 'translate'];
  var SIX_MOIS = 183 * 24 * 3600 * 1000;

  var langue = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  if (langue !== 'en' && langue !== 'es') langue = 'fr';

  var TEXTES = {
    fr: {
      titre: 'Cookies et contenus externes',
      texte: 'Ce site n’utilise aucun cookie publicitaire. Les vidéos Facebook, la carte Google Maps et la traduction Google peuvent déposer les leurs. Le site fonctionne que vous acceptiez ou non.',
      savoir: 'En savoir plus',
      accepter: 'Accepter',
      refuser: 'Refuser',
      annuler: 'Annuler',
      gerer: 'Gérer les cookies',
      fermer: 'Fermer',
      video: 'Vidéo',
      maps: { texte: 'Cette carte vient de Google Maps, qui peut déposer des cookies.', bouton: 'Afficher la carte' },
      facebook: { texte: 'Cette vidéo vient de Facebook, qui peut déposer des cookies.', bouton: 'Afficher les vidéos', lien: 'Ouvrir sur Facebook' },
      translate: { texte: 'La traduction est faite par Google Traduction, qui peut déposer des cookies.', bouton: 'Traduire' }
    },
    en: {
      titre: 'Cookies and external content',
      texte: 'This site uses no advertising cookies. Facebook videos, the Google map and Google Translate may set their own. The site works whether you accept or not.',
      savoir: 'Learn more',
      accepter: 'Accept',
      refuser: 'Decline',
      annuler: 'Cancel',
      gerer: 'Manage cookies',
      fermer: 'Close',
      video: 'Video',
      maps: { texte: 'This map comes from Google Maps, which may set cookies.', bouton: 'Show the map' },
      facebook: { texte: 'This video comes from Facebook, which may set cookies.', bouton: 'Show the videos', lien: 'Open on Facebook' },
      translate: { texte: 'Translation is done by Google Translate, which may set cookies.', bouton: 'Translate' }
    },
    es: {
      titre: 'Cookies y contenidos externos',
      texte: 'Este sitio no usa cookies publicitarias. Los videos de Facebook, el mapa de Google y el traductor de Google pueden instalar las suyas. El sitio funciona aceptes o no.',
      savoir: 'Más información',
      accepter: 'Aceptar',
      refuser: 'Rechazar',
      annuler: 'Cancelar',
      gerer: 'Gestionar cookies',
      fermer: 'Cerrar',
      video: 'Video',
      maps: { texte: 'Este mapa proviene de Google Maps, que puede instalar cookies.', bouton: 'Mostrar el mapa' },
      facebook: { texte: 'Este video proviene de Facebook, que puede instalar cookies.', bouton: 'Mostrar los videos', lien: 'Abrir en Facebook' },
      translate: { texte: 'La traducción la hace Google Translate, que puede instalar cookies.', bouton: 'Traducir' }
    }
  };
  var T = TEXTES[langue];

  /* ---------- Le choix gardé dans le navigateur ---------- */

  function lire() {
    try {
      var v = JSON.parse(localStorage.getItem(CLE) || 'null');
      if (!v || typeof v.d !== 'number' || !v.s || Date.now() - v.d > SIX_MOIS) return null;
      return v;
    } catch (e) { return null; }
  }

  function ecrire(services) {
    etat = { d: Date.now(), s: services };
    try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) { /* navigation privée : le choix vaut pour cette page */ }
  }

  var etat = lire();
  function ok(service) { return !!(etat && etat.s && etat.s[service]); }

  function choisir(valeur, un) {
    var avant = etat ? etat.s : {};
    var s = {};
    SERVICES.forEach(function (nom) {
      s[nom] = un ? (nom === un ? valeur : !!avant[nom]) : valeur;
    });
    var retire = SERVICES.some(function (nom) { return avant[nom] && !s[nom]; });
    ecrire(s);
    fermer();
    // Un service déjà chargé ne se décharge pas : on repart d'une page propre.
    if (retire) { location.reload(); return; }
    activer();
  }

  /* ---------- Les contenus en attente ---------- */

  function el(balise, classe, texte) {
    var e = document.createElement(balise);
    if (classe) e.className = classe;
    if (texte) e.textContent = texte;
    return e;
  }

  function poserAttente(cible) {
    var service = cible.getAttribute('data-consent');
    if (cible.tagName === 'SCRIPT' || !T[service] || cible.scsAttente) return;
    var boite = el('div', 'scs-attente');
    boite.appendChild(el('p', '', T[service].texte));
    var bouton = el('button', 'scs-btn scs-btn-plein', T[service].bouton);
    bouton.type = 'button';
    bouton.addEventListener('click', function () { choisir(true, service); });
    boite.appendChild(bouton);
    var href = cible.getAttribute('data-href');
    if (href && T[service].lien) {
      var a = el('a', 'scs-attente-lien', T[service].lien);
      a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
      boite.appendChild(a);
    }
    cible.scsAttente = boite;
    cible.scsAffichage = cible.style.display;
    cible.style.display = 'none';
    cible.parentNode.insertBefore(boite, cible);
  }

  function activer() {
    var scripts = [];
    [].forEach.call(document.querySelectorAll('[data-consent]'), function (cible) {
      var service = cible.getAttribute('data-consent');
      if (!ok(service)) { poserAttente(cible); return; }
      if (cible.scsActif) return;
      cible.scsActif = true;
      if (cible.scsAttente) {
        cible.scsAttente.remove();
        cible.scsAttente = null;
        cible.style.display = cible.scsAffichage || '';
      }
      var src = cible.getAttribute('data-consent-src');
      if (cible.tagName === 'SCRIPT') { if (src) scripts.push(cible); }
      else if (src) cible.setAttribute('src', src);
    });
    // Les scripts partent après que leurs emplacements sont redevenus visibles.
    scripts.forEach(function (modele) {
      var s = document.createElement('script');
      s.src = modele.getAttribute('data-consent-src');
      s.async = true;
      if (modele.getAttribute('data-crossorigin')) s.crossOrigin = modele.getAttribute('data-crossorigin');
      document.body.appendChild(s);
    });
  }

  /* ---------- Le bandeau ---------- */

  var bandeau = null;

  function fermer() {
    if (bandeau) { bandeau.remove(); bandeau = null; }
  }

  // service : ne demander l'accord que pour ce service (ex. traduction du blog).
  function ouvrir(service, ensuite) {
    fermer();
    var seul = service && T[service];
    bandeau = el('section', 'scs-consent');
    bandeau.setAttribute('role', 'region');
    bandeau.setAttribute('aria-label', T.titre);
    bandeau.appendChild(el('h2', '', T.titre));

    var p = el('p', '', (seul ? T[service].texte : T.texte) + ' ');
    var lien = el('a', '', T.savoir);
    // Adresse relative : la page de confidentialité est à côté de la page courante
    // (dans le dossier de la langue, ou à la racine pour le français).
    lien.href = 'privacy.html#cookies';
    p.appendChild(lien);
    bandeau.appendChild(p);

    var actions = el('div', 'scs-consent-actions');
    var non = el('button', 'scs-btn scs-btn-contour', seul ? T.annuler : T.refuser);
    var oui = el('button', 'scs-btn scs-btn-plein', seul ? T[service].bouton : T.accepter);
    non.type = oui.type = 'button';
    non.addEventListener('click', function () {
      fermer();
      if (!seul) choisir(false);
    });
    oui.addEventListener('click', function () {
      fermer();
      choisir(true, seul ? service : null);
      if (ensuite) ensuite();
    });
    actions.appendChild(non);
    actions.appendChild(oui);
    bandeau.appendChild(actions);
    document.body.appendChild(bandeau);
  }

  function lienPiedDePage() {
    var pied = document.querySelector('footer');
    if (!pied || pied.querySelector('.scs-gerer')) return;
    var lignes = pied.querySelectorAll('p');
    var droits = null;
    [].forEach.call(lignes, function (l) { if (l.textContent.indexOf('©') !== -1) droits = l; });
    var b = el('button', 'scs-gerer', T.gerer);
    b.type = 'button';
    b.addEventListener('click', function () { ouvrir(); });
    (droits ? droits.parentNode : pied).appendChild(b);
  }

  /* ---------- La fenêtre des vidéos Facebook ---------- */

  var fenetre = null;
  var declencheur = null;
  var SVG = 'http://www.w3.org/2000/svg';

  function croix() {
    var s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', 'M6 6l12 12M18 6L6 18');
    s.appendChild(p);
    return s;
  }

  function fermerVideo() {
    if (!fenetre) return;
    document.removeEventListener('keydown', cleVideo, true);
    fenetre.remove();
    fenetre = null;
    document.documentElement.classList.remove('scs-video-ouverte');
    var retour = declencheur;
    declencheur = null;
    if (retour && retour.focus) retour.focus({ preventScroll: true });
  }

  function cleVideo(e) {
    if (!fenetre) return;
    if (e.key === 'Escape') { e.preventDefault(); fermerVideo(); return; }
    if (e.key !== 'Tab') return;
    // Le clavier reste dans la fenêtre : Tab du dernier élément revient au premier.
    var liste = [].filter.call(fenetre.querySelectorAll('button, a[href], iframe'), function (x) {
      return x.offsetWidth || x.offsetHeight;
    });
    if (!liste.length) return;
    var premier = liste[0];
    var dernier = liste[liste.length - 1];
    var actif = document.activeElement;
    if (!fenetre.contains(actif)) { e.preventDefault(); premier.focus(); }
    else if (e.shiftKey && actif === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && actif === dernier) { e.preventDefault(); premier.focus(); }
  }

  function ouvrirVideo(lien) {
    fermerVideo();
    declencheur = lien;
    var adresse = lien.href;
    var citation = lien.querySelector('p');
    var legende = citation ? citation.textContent : '';

    fenetre = el('div', 'scs-video');
    // Lenis (défilement adouci) laisse alors la page tranquille derrière la fenêtre.
    fenetre.setAttribute('data-lenis-prevent', '');
    var panneau = el('div', 'scs-video-panneau');
    panneau.setAttribute('role', 'dialog');
    panneau.setAttribute('aria-modal', 'true');
    panneau.setAttribute('aria-label', T.video + (legende ? ' : ' + legende : ''));

    var entete = el('div', 'scs-video-entete');
    entete.appendChild(el('p', 'scs-video-citation', legende));
    var fermeture = el('button', 'scs-video-fermer');
    fermeture.type = 'button';
    fermeture.setAttribute('aria-label', T.fermer);
    fermeture.title = T.fermer;
    fermeture.appendChild(croix());
    fermeture.addEventListener('click', fermerVideo);
    entete.appendChild(fermeture);
    panneau.appendChild(entete);

    var scene = el('div', 'scs-video-scene');
    var cadre = document.createElement('iframe');
    cadre.setAttribute('title', T.video + (legende ? ' : ' + legende : ''));
    cadre.setAttribute('allow', 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share');
    cadre.setAttribute('allowfullscreen', '');
    cadre.setAttribute('data-consent', 'facebook');
    cadre.setAttribute('data-href', adresse);
    scene.appendChild(cadre);
    panneau.appendChild(scene);
    fenetre.appendChild(panneau);

    // Un clic sur le fond (hors du panneau) ferme la fenêtre.
    fenetre.addEventListener('mousedown', function (e) { if (e.target === fenetre) fermerVideo(); });

    document.body.appendChild(fenetre);
    document.documentElement.classList.add('scs-video-ouverte');
    // Le lecteur Facebook prend la taille de la scène, mesurée une fois la fenêtre posée.
    var l = Math.round(scene.clientWidth) || 560;
    var h = Math.round(scene.clientHeight) || 315;
    cadre.setAttribute('data-consent-src', 'https://www.facebook.com/plugins/video.php?href=' +
      encodeURIComponent(adresse) + '&show_text=false&width=' + l + '&height=' + h + '&t=0');
    activer();
    document.addEventListener('keydown', cleVideo, true);
    fermeture.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var lien = e.target.closest ? e.target.closest('a[data-video]') : null;
    if (!lien || e.defaultPrevented) return;
    // Ctrl, Maj, Cmd ou clic du milieu : le navigateur ouvre Facebook comme d'habitude.
    if (e.button !== 0 || e.ctrlKey || e.shiftKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    ouvrirVideo(lien);
  });

  /* ---------- Démarrage ---------- */

  function demarrer() {
    activer();
    lienPiedDePage();
    if (!etat) ouvrir();
  }

  window.SCSConsent = { ok: ok, ouvrir: ouvrir, demander: function (service, ensuite) { ouvrir(service, ensuite); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
