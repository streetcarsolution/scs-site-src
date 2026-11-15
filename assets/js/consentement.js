/* Consentement aux contenus externes — un seul fichier pour les 22 pages.
 *
 * Le site ne dépose lui-même aucun cookie publicitaire ni de mesure d'audience.
 * Trois services extérieurs peuvent en déposer : les vidéos Facebook
 * (témoignages), la carte Google Maps (accueil) et Google Traduction (blog).
 * Ils ne sont chargés qu'après l'accord du visiteur.
 *
 * Dans les pages, un contenu externe se déclare ainsi :
 *   <iframe data-consent="maps" data-consent-src="https://…"></iframe>
 *   <div class="fb-video" data-consent="facebook" data-href="https://…"></div>
 *   <script type="text/plain" data-consent="facebook" data-consent-src="https://…"></script>
 *
 * Le choix est gardé six mois dans le navigateur (clé SCS_CONSENT), puis
 * redemandé. Le lien « Gérer les cookies » du pied de page rouvre le bandeau.
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

  var STYLE =
    '.scs-consent{position:fixed;left:16px;bottom:16px;z-index:99998;width:calc(100% - 32px);max-width:400px;box-sizing:border-box;' +
      'background:#fff;color:#1f2937;border:1px solid #e5e7eb;border-radius:14px;box-shadow:0 12px 28px rgba(0,0,0,.18);' +
      'padding:16px 18px;font-family:Montserrat,system-ui,sans-serif;font-size:14px;line-height:1.5}' +
    '.scs-consent h2{margin:0 0 6px;font-size:15px;font-weight:700;color:#223256}' +
    '.scs-consent p{margin:0 0 12px}' +
    '.scs-consent a{color:#223256;text-decoration:underline}' +
    '.scs-consent-actions{display:flex;gap:10px}' +
    '.scs-btn{flex:1;min-height:44px;padding:10px 14px;border-radius:10px;border:2px solid #223256;font:inherit;font-weight:600;cursor:pointer}' +
    '.scs-btn-plein{background:#223256;color:#fff}' +
    '.scs-btn-contour{background:#fff;color:#223256}' +
    '.scs-btn:hover{opacity:.88}' +
    '.scs-btn:focus-visible,.scs-gerer:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}' +
    '.scs-attente{height:100%;min-height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'gap:10px;padding:16px;text-align:center;background:#eef1f6;color:#1f2937;font-size:14px;line-height:1.45}' +
    '.scs-attente p{margin:0;max-width:26em}' +
    '.scs-attente .scs-btn{flex:none}' +
    '.scs-attente-lien{color:#223256;text-decoration:underline;font-size:13px}' +
    '.scs-gerer{background:none;border:0;padding:0;margin-top:8px;color:inherit;font:inherit;text-decoration:underline;cursor:pointer}' +
    /* Sur téléphone, le bandeau reste au-dessus du bouton du chat. */
    '@media (max-width:640px){.scs-consent{left:12px;width:calc(100% - 24px);max-width:none;bottom:72px;padding:14px}}';

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
    lien.href = (langue === 'fr' ? '/' : '/' + langue + '/') + 'privacy.html#cookies';
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

  function demarrer() {
    var style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);
    activer();
    lienPiedDePage();
    if (!etat) ouvrir();
  }

  window.SCSConsent = { ok: ok, ouvrir: ouvrir, demander: function (service, ensuite) { ouvrir(service, ensuite); } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
