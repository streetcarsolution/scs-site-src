/* Maquette du nouveau site — animations, version 3.
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

  /* ---------- Super Car & Prestige : la vitrine ---------- */
  (function () {
    var vitrine = document.getElementById('lux');
    if (!vitrine) return;
    var photos = tous('.lux-frame img', vitrine);
    var fiches = tous('.lux-info', vitrine);
    var onglets = tous('.lux-tabs button', vitrine);
    var actuel = 0, vu = false, image = 0;

    /* La puissance : le chiffre monte et la barre se remplit, sous la photo */
    function regler() {
      var f = fiches[actuel], vers = Number(f.getAttribute('data-ch'));
      var chiffre = f.querySelector('[data-n]'), barre = f.querySelector('.lux-power u');
      barre.style.transition = 'none'; barre.style.setProperty('--p', 0); void barre.offsetWidth;
      barre.style.transition = ''; barre.style.setProperty('--p', Math.min(1, vers / 800));
      cancelAnimationFrame(image);
      var t0 = performance.now();
      function pas(t) {
        var k = Math.min(1, (t - t0) / 1000);
        chiffre.textContent = Math.round(vers * (1 - Math.pow(1 - k, 3)));
        if (k < 1) image = requestAnimationFrame(pas);
      }
      image = requestAnimationFrame(pas);
    }
    function montrer(i, aLaMain) {
      actuel = (i + fiches.length) % fiches.length;
      photos.forEach(function (p, n) { p.classList.toggle('is-on', n === actuel); });
      fiches.forEach(function (f, n) { f.classList.toggle('is-on', n === actuel); });
      onglets.forEach(function (o, n) { o.setAttribute('aria-selected', n === actuel ? 'true' : 'false'); });
      if (vu) regler();
      if (aLaMain) vitrine.classList.add('is-manual');
    }
    onglets.forEach(function (o, n) { o.addEventListener('click', function () { montrer(n, true); }); });
    /* Sans geste du visiteur, la vitrine passe seule à la voiture suivante */
    vitrine.addEventListener('animationend', function (e) { if (e.animationName === 'tab') montrer(actuel + 1); });
    /* Au doigt : on glisse d'une voiture à l'autre */
    var ecran = vitrine.querySelector('.lux-screen'), x0 = null;
    ecran.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    ecran.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) montrer(actuel + (dx < 0 ? 1 : -1), true);
    }, { passive: true });

    function arrive(la) {
      vitrine.classList.toggle('is-live', la);
      if (la && !vu) { vu = true; regler(); }
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { arrive(es[0].isIntersecting); }, { threshold: .3 }).observe(vitrine);
    else arrive(true);
  })();

  /* ==========================================================================
     L'ENVOI DES FORMULAIRES : LES MEMES DEUX CHEMINS QUE LE SITE ACTUEL
     ==========================================================================
     Chaque demande part dans l'App (la pastille du menu s'allume au clic du
     client) ET dans la feuille Google, qui reste le filet si l'App se deploie
     a cet instant. L'App reconnait la meme demande arrivee par les deux
     chemins. Il suffit que l'un des deux reussisse pour dire merci.
     ⚠️ Memes noms de champs et memes valeurs que `assets/js/formulaires.js` du
     site actuel : ne pas en changer ici sans changer l'App. */
  var APP = 'https://street-car-solution.vercel.app';
  var FEUILLE_RESERVATION = 'https://script.google.com/macros/s/AKfycbyxSspD7_p0P1Xkj6lGL7BoW2Y_AA-fThbQON5F-6sqxttRr_GcDGVNVXCnRsfnUjF2ew/exec';
  var FEUILLE_CONTACT = 'https://script.google.com/macros/s/AKfycbw0_Uk_gspyg997J6yA8AVvCJBgjOXt9jHHFXCjkq2tzrLaSJR4fgvO5dlS42kWSopZ/exec';
  /* Personne ne remplit ces formulaires en trois secondes, un robot si. */
  var DELAI_MINIMUM = 3000;
  var ouverte = Date.now();
  var LANGUE = 'fr';
  /* L'App range les voitures sous les noms de categories du site actuel : la
     page montre « Citadine » et « Monospace », l'App recoit ce qu'elle connait. */
  var CATEGORIE_POUR_LAPP = { 'Citadine': 'Standard', 'Monospace 7 ou 8 places': 'SUV 7 places' };
  var URLENCODE = { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' };

  /* Un envoi qui abandonne au bout de `ms`, au lieu d'attendre pour toujours. */
  function envoyer(adresse, options, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var minuterie = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms);
    if (ctrl) options.signal = ctrl.signal;
    return fetch(adresse, options).then(
      function (r) { clearTimeout(minuterie); return r; },
      function (e) { clearTimeout(minuterie); throw e; }
    );
  }
  function annoncer(etat, texte, sorte) {
    etat.textContent = texte;
    etat.hidden = !texte;
    etat.classList.toggle('is-wait', sorte === 'attente');
    etat.classList.toggle('is-bad', sorte === 'mal');
    if (texte && etat.scrollIntoView) etat.scrollIntoView({ block: 'nearest' });
  }
  /* Les lieux se lisent dans l'App ; si elle ne repond pas, la liste ecrite dans la page reste. */
  (function () {
    var menus = tous('select[data-lieux]');
    if (!menus.length) return;
    envoyer(APP + '/api/site/lieux', { method: 'GET' }, 5000)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j || !j.lieux || !j.lieux.length) return;
        menus.forEach(function (menu) {
          var choisi = menu.value, enTete = menu.options[0] && menu.options[0].value === '' ? menu.options[0].cloneNode(true) : null;
          while (menu.firstChild) menu.removeChild(menu.firstChild);
          if (enTete) menu.appendChild(enTete);
          j.lieux.forEach(function (l) {
            var o = document.createElement('option');
            o.value = l.valeur; o.textContent = l[LANGUE] || l.fr || l.valeur;
            menu.appendChild(o);
          });
          if (choisi) menu.value = choisi;
        });
      })
      .catch(function () { /* la liste de la page reste */ });
  })();

  /* ---------- Pré-réservation : le billet se remplit, les règles sont celles du site actuel ---------- */
  var NUMERO_COMPLET = /^\+[0-9]{11,15}$/;
  var TEL_AIDE = "Commencez par « + » et l'indicatif de votre pays : +33 France, +1 Canada, +52 Mexique.";
  var TEL_SANS_PLUS = "Il manque le « + » et l'indicatif de votre pays avant le numéro. Exemples : +33 6 12 34 56 78 (France), +1 514 123 4567 (Canada), +52 998 123 4567 (Mexique).";
  var TEL_INCOMPLET = "Ce numéro semble incomplet. Vérifiez l'indicatif du pays et tous les chiffres, par exemple +33 6 12 34 56 78.";
  var JOURS_MINIMUM = 3;
  var PRIX = { 'Économique': 35, 'Citadine': 40, 'Berline': 47, 'SUV 5 places': 62, 'Monospace 7 ou 8 places': 75, 'Van 14 places': 105 };
  var PHOTO = { 'Économique': 'economique', 'Citadine': 'aveo-agence', 'Berline': 'k3-noire', 'SUV 5 places': 'cx5-agence', 'Monospace 7 ou 8 places': 'sedona-agence', 'Van 14 places': 'van' };
  function id(i) { return document.getElementById(i); }

  var resa = id('resa');
  if (resa) (function () {
    var depart = id('pickupDate'), retour = id('returnDate'), tel = id('phone'), naissance = id('age');
    var aideTel = id('aide-tel'), duree = id('duree'), etat = id('reservationStatus'), billet = id('ticket'), photo = id('t-img');

    function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function choix(nom) { var r = resa.querySelector('input[name="' + nom + '"]:checked'); return r ? r.value : ''; }
    function jour(v) { return v ? new Date(v + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''; }
    function jours() {
      if (!depart.value || !retour.value) return null;
      var n = Math.round((Date.parse(retour.value + 'T00:00:00Z') - Date.parse(depart.value + 'T00:00:00Z')) / 86400000);
      return isFinite(n) ? n : null;
    }
    /* Une case du billet : elle ne s'anime que si son texte change */
    function ecrire(i, texte) {
      var el = id(i), neuf = texte || (el.tagName === 'B' ? '—' : '');
      if (el.textContent === neuf) return;
      el.textContent = neuf;
      el.classList.toggle('is-empty', !texte);
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    }
    function dessiner() {
      ecrire('t-de', id('pickupLocation').value);
      ecrire('t-a', id('returnLocation').value);
      ecrire('t-d1', [jour(depart.value), id('pickupTime').value].filter(Boolean).join(' · '));
      ecrire('t-d2', [jour(retour.value), id('returnTime').value].filter(Boolean).join(' · '));
      var n = jours();
      ecrire('t-jours', n !== null && n >= 1 ? n + (n > 1 ? ' jours' : ' jour') : '');
      var auto = choix('vehicleType');
      ecrire('t-auto', auto);
      ecrire('t-prix', auto ? 'dès ' + PRIX[auto] + ' € / jour' : '');
      if (auto && photo.getAttribute('data-auto') !== auto) {
        photo.setAttribute('data-auto', auto);
        photo.src = 'img/auto-' + PHOTO[auto] + '.webp';
        photo.hidden = false;
        photo.classList.remove('go'); void photo.offsetWidth; photo.classList.add('go');
      }
      ecrire('t-boite', choix('transmission'));
      var p = Number(id('passengers').value) || 0, v = (Number(id('luggage10').value) || 0) + (Number(id('luggage20').value) || 0);
      ecrire('t-bord', p + (p > 1 ? ' passagers' : ' passager') + (v ? ', ' + v + (v > 1 ? ' valises' : ' valise') : ''));
      var o = tous('input[name="option"]:checked', resa).map(function (i) { return i.value; });
      ecrire('t-opts', o.join(' · '));
      id('drop-txt').textContent = o.length ? o.length + (o.length > 1 ? ' options choisies' : ' option choisie') : 'Choisir des options';
    }

    /* Trois jours au moins, et pas de retour avant le départ */
    function dureeAcceptee() {
      var n = jours(), court = n !== null && n < JOURS_MINIMUM;
      retour.setCustomValidity(court ? 'La location doit contenir un minimum de 3 jours.' : '');
      duree.textContent = n === null ? '' : (court ? 'La location doit contenir un minimum de 3 jours.' : n + ' jours de location');
      duree.classList.toggle('is-bad', court);
      return !court;
    }
    depart.min = retour.min = iso(new Date());
    depart.addEventListener('change', function () { retour.min = depart.value || iso(new Date()); });

    /* Le numéro WhatsApp : « + », indicatif, 11 à 15 chiffres */
    function refusDuNumero(brut) {
      var t = String(brut || '').replace(/[\s().\-]/g, '');
      if (t.indexOf('00') === 0) t = '+' + t.slice(2);
      if (!t || t.charAt(0) !== '+') return TEL_SANS_PLUS;
      return NUMERO_COMPLET.test(t) ? null : TEL_INCOMPLET;
    }
    function direTel(refus) {
      tel.setCustomValidity(refus || '');
      aideTel.textContent = refus || TEL_AIDE;
      aideTel.classList.toggle('is-bad', !!refus);
    }
    tel.value = '+';
    tel.addEventListener('focus', function () { if (!tel.value.trim()) tel.value = '+'; });
    tel.addEventListener('blur', function () { direTel(tel.value.trim() === '+' || !tel.value.trim() ? null : refusDuNumero(tel.value)); });
    tel.addEventListener('input', function () { if (aideTel.classList.contains('is-bad')) direTel(refusDuNumero(tel.value)); });

    /* La date de naissance : JJ/MM/AAAA, 18 ans le jour du départ */
    naissance.addEventListener('input', function () {
      var c = naissance.value.replace(/\D/g, '').slice(0, 8);
      naissance.value = c.length > 4 ? c.slice(0, 2) + '/' + c.slice(2, 4) + '/' + c.slice(4) : c.length > 2 ? c.slice(0, 2) + '/' + c.slice(2) : c;
      naissance.setCustomValidity('');
    });
    function refusNaissance() {
      var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(naissance.value.trim());
      var format = 'Écrivez la date de naissance en chiffres : jour, mois, année. Par exemple 16/12/1980.';
      if (!m) return format;
      var j = +m[1], mo = +m[2], a = +m[3], d = new Date(a, mo - 1, j);
      if (d.getFullYear() !== a || d.getMonth() !== mo - 1 || d.getDate() !== j) return format;
      var ref = depart.value ? new Date(depart.value + 'T00:00:00') : new Date();
      var age = ref.getFullYear() - a - (ref.getMonth() < mo - 1 || (ref.getMonth() === mo - 1 && ref.getDate() < j) ? 1 : 0);
      if (age < 18) return 'Le conducteur doit avoir au moins 18 ans le jour du départ.';
      if (age > 100) return "Vérifiez l'année de naissance.";
      return null;
    }

    /* Les boutons − et + */
    tous('.step', resa).forEach(function (bloc) {
      var champ = bloc.querySelector('input');
      bloc.addEventListener('click', function (e) {
        var b = e.target.closest('button');
        if (!b) return;
        var n = (Number(champ.value) || 0) + Number(b.getAttribute('data-step'));
        champ.value = Math.max(Number(champ.min), Math.min(Number(champ.max), n));
        dessiner();
      });
    });

    resa.addEventListener('input', dessiner);
    resa.addEventListener('change', function () { dureeAcceptee(); dessiner(); });
    var bouton = resa.querySelector('button[type="submit"]'), libelle = bouton.innerHTML, enCours = false;
    function rendreLaMain() { enCours = false; bouton.disabled = false; bouton.innerHTML = libelle; }
    function reussi() {
      resa.reset();
      tel.value = '+'; direTel(null);
      retour.min = depart.min = iso(new Date());
      photo.hidden = true; photo.removeAttribute('data-auto');
      dureeAcceptee(); dessiner();
      billet.classList.add('is-stamped');
      rendreLaMain();
      annoncer(etat, 'Merci ! Votre pré-réservation est bien envoyée.\nVotre conseiller vous contactera rapidement par WhatsApp.', 'ok');
    }
    resa.addEventListener('input', function () { billet.classList.remove('is-stamped'); });
    resa.addEventListener('submit', function (e) {
      e.preventDefault();
      /* Le deuxieme clic ne part jamais : c'etait la cause des doublons. */
      if (enCours) return;
      var refusTel = refusDuNumero(tel.value);
      direTel(refusTel);
      naissance.setCustomValidity(naissance.value.trim() ? (refusNaissance() || '') : '');
      dureeAcceptee();
      if (!resa.checkValidity()) { resa.reportValidity(); return; }

      var piege = id('champ_piege').value.trim(), temps = Date.now() - ouverte;
      enCours = true; bouton.disabled = true; bouton.textContent = 'Envoi en cours…';
      annoncer(etat, 'Envoi en cours…', 'attente');
      /* Un robot croit avoir reussi, pour ne pas chercher un autre chemin. */
      if (piege || temps < DELAI_MINIMUM) { setTimeout(reussi, 800); return; }

      var n = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(naissance.value.trim());
      var numero = tel.value.replace(/[\s().\-]/g, '');
      if (numero.indexOf('00') === 0) numero = '+' + numero.slice(2);
      var categorie = choix('vehicleType');
      /* Le meme corps pour la feuille et pour l'App, aux memes noms de champs. */
      var corps = new URLSearchParams();
      [['firstName', id('firstName').value], ['lastName', id('lastName').value], ['permis', choix('permis')],
       ['age', n[3] + '-' + n[2] + '-' + n[1]], ['phone', numero], ['email', id('email').value],
       ['pickupLocation', id('pickupLocation').value], ['returnLocation', id('returnLocation').value],
       ['pickupDate', depart.value], ['pickupTime', id('pickupTime').value],
       ['returnDate', retour.value], ['returnTime', id('returnTime').value],
       ['vehicleType', CATEGORIE_POUR_LAPP[categorie] || categorie], ['transmission', choix('transmission')],
       ['passengers', id('passengers').value], ['luggage10', id('luggage10').value], ['luggage20', id('luggage20').value],
       ['terms', 'on']].forEach(function (c) { corps.append(c[0], String(c[1]).trim()); });
      /* Le message et les options ne vont qu'a l'App : la feuille range des colonnes fixes. */
      var options = tous('input[name="option"]:checked', resa).map(function (i) { return i.value; });
      var texte = id('reservationMessage').value.trim();
      var precisions = [];
      if (options.length) precisions.push('Options souhaitées : ' + options.join(', '));
      if (categorie !== (CATEGORIE_POUR_LAPP[categorie] || categorie)) precisions.push('Catégorie choisie sur le site : ' + categorie);
      var versLApp = new URLSearchParams(corps.toString());
      versLApp.append('message', precisions.concat(texte ? [texte] : []).join('\n'));
      versLApp.append('langue', LANGUE);
      versLApp.append('website', piege);
      versLApp.append('duree', String(temps));

      var laFeuille = envoyer(FEUILLE_RESERVATION, { method: 'POST', headers: URLENCODE, body: corps.toString() }, 30000)
        .then(function (r) { return r.text().then(function (t) { try { return r.ok && JSON.parse(t).ok === true; } catch (x) { return false; } }); })
        .catch(function () { return false; });
      var lApp = envoyer(APP + '/api/site/demande', { method: 'POST', headers: URLENCODE, body: versLApp.toString() }, 30000)
        .then(function (r) { return r.ok; })
        .catch(function () { return false; });
      Promise.all([laFeuille, lApp]).then(function (res) {
        if (res[0] || res[1]) { reussi(); return; }
        rendreLaMain();
        annoncer(etat, "Votre demande n'a pas pu partir. Vérifiez votre connexion et réessayez, ou écrivez-nous sur WhatsApp.", 'mal');
      });
    });
    /* Une flèche de la flotte choisit déjà la catégorie dans le formulaire */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-vehicule]');
      if (!a) return;
      var r = resa.querySelector('input[name="vehicleType"][value="' + a.getAttribute('data-vehicule') + '"]');
      if (r) { r.checked = true; dessiner(); }
    });
    /* Le menu des options se referme quand on touche ailleurs */
    document.addEventListener('click', function (e) { if (id('drop').open && !e.target.closest('#drop')) id('drop').open = false; });
    resa.querySelector('button[type="submit"]').disabled = false;
    dessiner();
  })();

  /* ---------- Message : dans l'App et dans sa feuille ---------- */
  var message = id('message');
  if (message) {
    (function () {
      var etat = id('contactStatus'), bouton = message.querySelector('button[type="submit"]'), libelle = bouton.innerHTML, enCours = false;
      message.addEventListener('submit', function (e) {
        e.preventDefault();
        if (enCours) return;
        if (!message.checkValidity()) { message.reportValidity(); return; }
        enCours = true; bouton.disabled = true; bouton.textContent = 'Envoi…';
        annoncer(etat, '', '');
        var piege = id('cf-piege').value.trim(), temps = Date.now() - ouverte;
        var envoi;
        if (piege || temps < DELAI_MINIMUM) {
          envoi = new Promise(function (ok) { setTimeout(function () { ok(true); }, 800); });
        } else {
          var champs = { name: id('cf-name').value, email: id('cf-email').value, subject: id('cf-subject').value, message: id('cf-message').value };
          var versLApp = new URLSearchParams(), pourLaFeuille = new FormData();
          Object.keys(champs).forEach(function (k) { versLApp.append(k, champs[k]); pourLaFeuille.append(k, champs[k]); });
          pourLaFeuille.append('_gotcha', '');
          versLApp.append('langue', LANGUE);
          versLApp.append('website', piege);
          versLApp.append('duree', String(temps));
          var laFeuille = envoyer(FEUILLE_CONTACT, { method: 'POST', body: pourLaFeuille, mode: 'no-cors' }, 30000)
            .then(function () { return true; }, function () { return false; });
          var lApp = envoyer(APP + '/api/site/message', { method: 'POST', headers: URLENCODE, body: versLApp.toString() }, 30000)
            .then(function (r) { return r.ok; })
            .catch(function () { return false; });
          envoi = Promise.all([laFeuille, lApp]).then(function (r) { return r[0] || r[1]; });
        }
        envoi.then(function (ok) {
          if (ok) { message.reset(); annoncer(etat, 'Merci, votre message a bien été envoyé !', 'ok'); }
          else annoncer(etat, 'Désolé, une erreur est survenue. Réessayez plus tard, ou écrivez-nous sur WhatsApp.', 'mal');
          enCours = false; bouton.disabled = false; bouton.innerHTML = libelle;
        });
      });
    })();
    message.querySelector('button[type="submit"]').disabled = false;
    /* « Demander cette voiture » remplit déjà le sujet */
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-sujet]');
      if (a) id('cf-subject').value = a.getAttribute('data-sujet');
    });
  }

  /* ---------- Page Services : les options choisies suivent le visiteur jusqu'au formulaire ---------- */
  var choix = id('options-form');
  if (choix) (function () {
    var barre = id('opt-bar'), compte = id('opt-n'), lien = id('opt-go');
    function maj() {
      var c = tous('input:checked', choix).map(function (i) { return i.value; });
      barre.hidden = !c.length;
      compte.textContent = c.length + (c.length > 1 ? ' options' : ' option');
      lien.href = './' + (c.length ? '?options=' + encodeURIComponent(c.join(', ')) : '') + '#reserver';
    }
    choix.addEventListener('change', maj);
    choix.addEventListener('submit', function (e) { e.preventDefault(); });
    maj();
  })();
  /* Accueil : on arrive de la page Services avec des options, ou une demande de devis */
  (function () {
    var q;
    try { q = new URLSearchParams(window.location.search); } catch (e) { return; }
    var o = q.get('options'), s = q.get('sujet');
    if (o && id('drop')) {
      var voulues = o.split(', ');
      tous('input[name="option"]', id('drop')).forEach(function (c) {
        if (voulues.indexOf(c.value) < 0) return;
        c.checked = true;
        c.dispatchEvent(new Event('change', { bubbles: true }));
      });
      id('drop').open = true;
    }
    if (s && id('cf-subject')) id('cf-subject').value = s.slice(0, 120);
  })();

  /* ---------- Copier l'adresse email ---------- */
  var copier = id('copier');
  if (copier) copier.addEventListener('click', function () {
    var texte = copier.getAttribute('data-texte'), libelle = "Copier l'adresse";
    function fait() { copier.textContent = 'Adresse copiée ✓'; setTimeout(function () { copier.textContent = libelle; }, 2200); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(fait, function () { window.prompt('Copiez cette adresse :', texte); });
    else window.prompt('Copiez cette adresse :', texte);
  });

  /* ---------- Julie, l'agent virtuel : la même que sur le site actuel ---------- */
  (function () {
    var API = 'https://scs-chat-api.vercel.app/api/scc-chat';
    var ACCUEIL = "Bonjour, je suis Julie, votre conseillère virtuelle.\nComment puis-je vous aider aujourd'hui ?";
    var fab = id('fab'), panneau = id('julie'), fil = id('julie-log'), form = id('julie-form'), champ = id('julie-in');
    if (!fab || !panneau) return;
    var historique = [], occupee = false;

    function bulle(texte, classe) {
      var p = document.createElement('p');
      p.className = 'msg ' + classe;
      p.textContent = texte;
      fil.appendChild(p);
      fil.scrollTop = fil.scrollHeight;
      return p;
    }
    function ouvrir() {
      panneau.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      if (!historique.length) { bulle(ACCUEIL, 'them'); historique.push({ role: 'assistant', content: ACCUEIL }); }
      if (window.matchMedia('(pointer: fine)').matches) champ.focus();
    }
    function fermer() { panneau.hidden = true; fab.setAttribute('aria-expanded', 'false'); }
    fab.addEventListener('click', function () { if (panneau.hidden) ouvrir(); else fermer(); });
    id('julie-x').addEventListener('click', fermer);
    document.addEventListener('click', function (e) { if (e.target.closest('[data-julie]')) ouvrir(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panneau.hidden) fermer(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var texte = champ.value.trim();
      if (!texte || occupee) return;
      champ.value = '';
      bulle(texte, 'me');
      historique.push({ role: 'user', content: texte });
      occupee = true;
      var attente = bulle('', 'them');
      attente.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>';
      function repondre(reponse, garder) {
        attente.textContent = reponse;
        fil.scrollTop = fil.scrollHeight;
        if (garder) historique.push({ role: 'assistant', content: reponse });
        occupee = false;
      }
      /* Si Julie ne répond pas, on ne laisse pas le visiteur sans suite : un conseiller prend le relais */
      function relais() {
        repondre('Je ne peux pas vous répondre pour le moment. Un conseiller prend le relais sur WhatsApp : ', false);
        var a = document.createElement('a');
        a.href = 'https://wa.me/32477813205'; a.target = '_blank'; a.rel = 'noopener noreferrer';
        a.textContent = '+32 477 81 32 05'; a.style.cssText = 'font-weight:700;text-decoration:underline';
        attente.appendChild(a);
      }
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: historique }) })
        .then(function (r) { return r.json(); })
        .then(function (d) { if (d && d.reply) repondre(d.reply, true); else relais(); })
        .catch(relais);
    });
  })();

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
  if (document.querySelector('.hero')) {
  var depart = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 };
  gsap.to('.hero-car', { x: function () { return -window.innerWidth * 1.15; }, ease: 'power1.in', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 35%', scrub: .4, invalidateOnRefresh: true } });
  /* Ces trois éléments ont aussi une entrée en CSS : on donne ici leur état de départ complet,
     pour que GSAP ne fige pas une image prise au milieu de cette entrée. */
  gsap.fromTo('.hero-sun', { x: 0, y: 0, yPercent: 0, scale: 1, rotation: 0 }, { scale: 1.35, yPercent: -14, ease: 'none', scrollTrigger: depart });
  gsap.to('.hero-in', { yPercent: -14, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '18% top', end: '75% top', scrub: true } });
  if (document.querySelector('.hero-word')) gsap.fromTo('.hero-word', { x: 0, y: 0, xPercent: 0, scale: 1, rotation: 0 }, { xPercent: -12, ease: 'none', scrollTrigger: depart });
  if (document.querySelector('.sticker')) gsap.fromTo('.sticker', { x: 0, y: 0, yPercent: 0, scale: 1, rotation: 9 }, { yPercent: -90, rotation: 50, ease: 'none', scrollTrigger: depart });
  }

  /* Les deux bandeaux s'écartent comme des ciseaux */
  if (document.querySelector('.tickers')) {
  gsap.fromTo('.t-blue', { rotation: -6 }, { rotation: -1.5, ease: 'none', scrollTrigger: { trigger: '.tickers', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.t-green', { rotation: 5 }, { rotation: 1, ease: 'none', scrollTrigger: { trigger: '.tickers', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

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
  if (document.querySelector('.stats')) gsap.from('.stats > div', { y: 50, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 88%' } });

  /* ---------- 3. La flotte : la page se fige, le défilement fait passer les voitures ---------- */
  if (document.querySelector('.fleet')) {
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
    gsap.fromTo(img, { xPercent: 4 }, { xPercent: -2, ease: 'none', scrollTrigger: { trigger: img.closest('.car'), containerAnimation: defile, start: 'left right', end: 'right left', scrub: true } });
  });
  gsap.from('.fleet .car', { y: 110, opacity: 0, rotation: 5, duration: 1, stagger: .09, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: fleet, start: 'top 62%' } });
  gsap.from('.fleet-head', { y: 40, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: fleet, start: 'top 70%' } });
  }

  /* ---------- 4. La route : elle se dessine entre les étapes, une voiture la suit ---------- */
  if (document.getElementById('road-wrap')) {
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
  }

  /* ---------- Titres : ils montent en entrant ---------- */
  tous('.road-head, .why-head, .reviews > h2, .reviews > .tag, .mani > .tag, .lux-head, .book-head, .contact-head, .sec-head').forEach(function (el) {
    gsap.from(el, { y: 50, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  /* ---------- 5. La conversation s'écrit, les pictogrammes se dessinent ---------- */
  if (document.getElementById('chat')) {
  var bulles = tous('#chat .msg, #chat .msg-time');
  gsap.set(bulles, { opacity: 0, scale: .5, y: 16 });
  gsap.from('#chat', { y: 70, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '#chat', start: 'top 88%' } });
  gsap.to(bulles, { opacity: 1, scale: 1, y: 0, duration: .55, ease: 'back.out(1.7)', stagger: .7, delay: .3, scrollTrigger: { trigger: '#chat', start: 'top 70%' } });
  tous('.perks li').forEach(function (li) {
    var st = { trigger: li, start: 'top 88%' };
    gsap.from(li, { y: 44, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: st });
    gsap.to(li.querySelectorAll('path'), { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: .2, delay: .2, scrollTrigger: st });
  });
  }

  /* ---------- 6. Avis ---------- */
  if (document.querySelector('.quotes')) {
  gsap.from('.quote', { y: 90, opacity: 0, duration: 1, stagger: .14, ease: 'back.out(1.3)', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.quotes', start: 'top 84%' } });
  }

  /* ---------- Super Car & Prestige : la vitrine entre en scène ---------- */
  if (document.querySelector('.lux-show')) {
  gsap.from('.lux-screen', { y: 90, opacity: 0, scale: .9, duration: 1.2, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.lux-show', start: 'top 84%' } });
  gsap.from('.lux-infos', { y: 60, opacity: 0, duration: 1, delay: .15, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.lux-show', start: 'top 84%' } });
  gsap.from('.lux-tabs button', { y: 46, opacity: 0, duration: .8, stagger: .08, ease: 'back.out(1.6)', clearProps: 'transform,opacity', scrollTrigger: { trigger: '.lux-tabs', start: 'top 96%' } });
  }

  /* ---------- 8. L'arrivée : le soleil passe derrière la pyramide, les palmiers poussent, la voiture arrive ---------- */
  if (document.querySelector('.cta')) {
  var soir = { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: true };
  gsap.fromTo('.cta-sun', { yPercent: -16 }, { yPercent: 14, ease: 'none', scrollTrigger: soir });
  gsap.fromTo('.cta-pyramid', { yPercent: 36 }, { yPercent: 0, ease: 'none', scrollTrigger: soir });
  gsap.fromTo('.cta-hills', { yPercent: 70 }, { yPercent: 0, ease: 'none', scrollTrigger: soir });
  gsap.from('.palm', { scale: .25, opacity: 0, duration: 1.3, stagger: .22, ease: 'back.out(1.5)', scrollTrigger: { trigger: '.cta-art', start: 'top 72%' } });
  gsap.from('.cta-car', { x: function () { return window.innerWidth; }, duration: 1.6, ease: 'power3.out', scrollTrigger: { trigger: '.cta-art', start: 'top 60%' } });
  gsap.from('.cta-in > *', { y: 50, opacity: 0, duration: 1, stagger: .12, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
  gsap.to('.cta h2 em path', { strokeDashoffset: 0, duration: 1, delay: .7, ease: 'power2.out', scrollTrigger: { trigger: '.cta', start: 'top 70%' } });
  }

  /* ---------- 9 et 10. Formulaires et contacts : chaque bloc monte en entrant ---------- */
  tous('.fs, .ticket-col, .way, .msg-form').forEach(function (el) {
    gsap.from(el, { y: 60, opacity: 0, duration: .9, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });

  /* ---------- Page Services : les blocs montent, les pictogrammes se dessinent ---------- */
  tous('[data-reveal]').forEach(function (el) {
    gsap.from(el, { y: 60, opacity: 0, duration: .9, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  tous('.draw').forEach(function (svg) {
    gsap.to(svg.querySelectorAll('path'), { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: .16, delay: .2, scrollTrigger: { trigger: svg, start: 'top 90%' } });
  });

  gsap.from('.foot-wm b', { yPercent: 110, opacity: 0, duration: 1, stagger: .1, ease: 'power4.out', scrollTrigger: { trigger: '.foot', start: 'top 88%' } });

  window.addEventListener('load', function () {
    ScrollTrigger.refresh();
    /* On arrive d'une autre page sur une ancre : la hauteur de la page vient de changer, on s'y replace */
    var cible = window.location.hash.length > 1 && document.getElementById(window.location.hash.slice(1));
    if (!cible) return;
    /* Un bloc qui n'est pas une section entière se place sous le menu */
    var y = Math.max(0, cible.getBoundingClientRect().top + window.scrollY - (cible.tagName === 'SECTION' ? 0 : 150));
    if (lenis) { lenis.resize(); lenis.scrollTo(y, { immediate: true, force: true }); }
    else window.scrollTo(0, y);
  });
})();
