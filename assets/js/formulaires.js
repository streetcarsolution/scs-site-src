/*
 * ==========================================================================
 * LES DEUX FORMULAIRES DU SITE : PRE-RESERVATION ET CONTACT
 * ==========================================================================
 *
 * Une seule copie pour les trois langues (/, /en/, /es/). Jusqu'au
 * 29 septembre 2026, chaque page portait la sienne, et elles divergeaient.
 *
 * CE QUE CE FICHIER FAIT, et pourquoi (lot 3, valide par Sabrina le 29/09/2026) :
 *
 *   1. LE BOUTON SE GRISE AU PREMIER CLIC, et un message s'affiche tout de
 *      suite. « Le message d'information met du temps a apparaitre, donc le
 *      client clique plusieurs fois sur le bouton » : 128 demandes en double
 *      sur 1420, dont une cliente trois fois en 2,4 secondes.
 *   2. LA DEMANDE PART DANS L'APP ET DANS LA FEUILLE. L'App la recoit a
 *      l'instant (la pastille du menu s'allume), la feuille reste le filet si
 *      l'App se deploie a ce moment-la. Les deux se reconnaissent : pas de
 *      doublon.
 *   3. LES LIEUX VIENNENT DE L'APP (Reglages, « Lieux du site »). La liste
 *      ecrite dans la page n'est que le secours, si l'App ne repond pas.
 *   4. CHAQUE CHOIX ENVOIE LE MOT FRANCAIS, quelle que soit la langue de la
 *      page : la page anglaise envoyait « Cancún Airport », que l'App ne
 *      savait pas lire, et le navigateur qui traduit la page envoyait du
 *      neerlandais.
 *   5. LA DATE DE NAISSANCE REMPLACE L'AGE, et se tape en huit chiffres, sans
 *      calendrier : quarante ans en arriere, un calendrier est un supplice.
 *      L'annee d'abord sur la page anglaise (YYYY/MM/DD), le jour d'abord
 *      sur les deux autres, et les calendriers des dates de location suivent
 *      le meme ordre (flatpickr, 1er octobre 2026).
 *   6. UN CHAMP PIEGE ET UN CHRONOMETRE contre les robots, avant tout captcha.
 */
(function () {
  'use strict';

  var APP = 'https://street-car-solution.vercel.app';
  var FEUILLE_RESERVATION = 'https://script.google.com/macros/s/AKfycbyxSspD7_p0P1Xkj6lGL7BoW2Y_AA-fThbQON5F-6sqxttRr_GcDGVNVXCnRsfnUjF2ew/exec';
  var FEUILLE_CONTACT = 'https://script.google.com/macros/s/AKfycbw0_Uk_gspyg997J6yA8AVvCJBgjOXt9jHHFXCjkq2tzrLaSJR4fgvO5dlS42kWSopZ/exec';

  // PERSONNE NE REMPLIT CE FORMULAIRE EN TROIS SECONDES, UN ROBOT SI.
  var DELAI_MINIMUM = 3000;
  var ouverte = Date.now();

  var langue = String(document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  if (['fr', 'en', 'es'].indexOf(langue) < 0) langue = 'fr';

  var TEXTES = {
    fr: {
      envoi: 'Envoi en cours…',
      merci: 'Merci ! Votre pré-réservation est bien envoyée.\nVotre conseiller vous contactera rapidement par WhatsApp.',
      echec: "Votre demande n'a pas pu partir. Vérifiez votre connexion et réessayez, ou écrivez-nous sur WhatsApp.",
      naissanceFormat: 'Écrivez la date de naissance en chiffres : jour, mois, année. Par exemple 16/12/1980.',
      naissanceJeune: 'Le conducteur doit avoir au moins 18 ans le jour du départ.',
      naissanceVieux: "Vérifiez l'année de naissance.",
      minimum: 'La location doit contenir un minimum de 3 jours.',
      dateManquante: 'Choisissez la date dans le calendrier.',
      contactEnvoi: 'Envoi…',
      contactMerci: 'Merci, votre message a bien été envoyé !',
      contactEchec: 'Désolé, une erreur est survenue. Réessayez plus tard.'
    },
    en: {
      envoi: 'Sending…',
      merci: 'Thank you! Your pre-booking has been sent.\nYour advisor will contact you shortly on WhatsApp.',
      echec: 'Your request could not be sent. Check your connection and try again, or message us on WhatsApp.',
      naissanceFormat: 'Type the date of birth in digits: year, month, day. For example 1980/12/16.',
      naissanceJeune: 'The driver must be at least 18 years old on the pick-up day.',
      naissanceVieux: 'Please check the year of birth.',
      minimum: 'The rental must be for a minimum of 3 days.',
      dateManquante: 'Please choose the date from the calendar.',
      contactEnvoi: 'Sending…',
      contactMerci: 'Thanks, your message has been sent!',
      contactEchec: 'Sorry, an error occurred. Please try again later.'
    },
    es: {
      envoi: 'Enviando…',
      merci: '¡Gracias! Su pre-reserva ha sido enviada.\nSu asesor se pondrá en contacto con usted rápidamente por WhatsApp.',
      echec: 'Su solicitud no pudo enviarse. Revise su conexión e inténtelo de nuevo, o escríbanos por WhatsApp.',
      naissanceFormat: 'Escriba la fecha de nacimiento en números: día, mes, año. Por ejemplo 16/12/1980.',
      naissanceJeune: 'El conductor debe tener al menos 18 años el día de la entrega.',
      naissanceVieux: 'Revise el año de nacimiento.',
      minimum: 'La renta debe ser de un mínimo de 3 días.',
      dateManquante: 'Elija la fecha en el calendario.',
      contactEnvoi: 'Enviando…',
      contactMerci: '¡Gracias, su mensaje ha sido enviado!',
      contactEchec: 'Lo sentimos, ocurrió un error. Inténtelo más tarde.'
    }
  };
  var T = TEXTES[langue];

  /** Un envoi qui abandonne au bout de `ms`, au lieu d'attendre pour toujours. */
  function envoyer(adresse, options, ms) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var minuterie = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms);
    if (ctrl) options.signal = ctrl.signal;
    return fetch(adresse, options).then(
      function (r) { clearTimeout(minuterie); return r; },
      function (e) { clearTimeout(minuterie); throw e; }
    );
  }

  // ========================================================================
  // LES LIEUX, LUS DANS L'APP
  // ========================================================================
  function remplirLesLieux(lieux) {
    var menus = document.querySelectorAll('select[data-lieux]');
    Array.prototype.forEach.call(menus, function (menu) {
      var choisi = menu.value;
      var premier = menu.options[0];
      // « Sélectionnez » reste en tete ; le petit formulaire du haut n'en a pas.
      var enTete = premier && premier.value === '' ? premier.cloneNode(true) : null;
      while (menu.firstChild) menu.removeChild(menu.firstChild);
      if (enTete) menu.appendChild(enTete);
      lieux.forEach(function (l) {
        var o = document.createElement('option');
        o.value = l.valeur;
        o.textContent = l[langue] || l.fr || l.valeur;
        menu.appendChild(o);
      });
      // UN CHOIX DEJA FAIT NE SE PERD PAS : le client a pu choisir avant que
      // la liste arrive.
      if (choisi) menu.value = choisi;
    });
  }

  function chargerLesLieux() {
    if (!document.querySelector('select[data-lieux]')) return;
    envoyer(APP + '/api/site/lieux', { method: 'GET' }, 5000)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j && j.lieux && j.lieux.length) remplirLesLieux(j.lieux);
      })
      .catch(function () {
        /* LA LISTE ECRITE DANS LA PAGE RESTE : c'est exactement son role. */
      });
  }

  // ========================================================================
  // LA DATE DE NAISSANCE, EN HUIT CHIFFRES
  // ========================================================================
  // L'ORDRE SUIT LA PAGE. Sabrina, le 1er octobre 2026, devant la page
  // anglaise qui montrait DD/MM/YYYY : « C'est une erreur, il devrait montrer
  // YYYY/MM/DD ». Une date qui commence par l'annee ne se lit que d'une
  // facon, quand 01/02 est le 2 janvier pour un Americain et le 1er fevrier
  // pour un Anglais. Le francais et l'espagnol gardent le jour d'abord.
  var ANNEE_DABORD = langue === 'en';
  var GROUPES = ANNEE_DABORD ? [4, 2, 2] : [2, 2, 4];

  function masqueDeDate(champ) {
    champ.addEventListener('input', function () {
      var chiffres = champ.value.replace(/\D/g, '').slice(0, 8);
      var morceaux = [];
      var debut = 0;
      GROUPES.forEach(function (n) {
        if (chiffres.length > debut) morceaux.push(chiffres.slice(debut, debut + n));
        debut += n;
      });
      champ.value = morceaux.join('/');
      champ.setCustomValidity('');
    });
  }

  /** `16/12/1980` (ou `1980/12/16` en anglais) devient `1980-12-16`, et un
   *  31/02 n'existe pas. */
  function naissanceEnIso(texte) {
    var t = String(texte || '').trim();
    var m = ANNEE_DABORD ? /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(t) : /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
    if (!m) return null;
    var annee = ANNEE_DABORD ? m[1] : m[3];
    var jour = ANNEE_DABORD ? m[3] : m[1];
    var j = Number(jour);
    var mo = Number(m[2]);
    var a = Number(annee);
    var d = new Date(Date.UTC(a, mo - 1, j));
    if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== j) return null;
    return annee + '-' + m[2] + '-' + jour;
  }

  // ========================================================================
  // LES CALENDRIERS, AU FORMAT DE LA PAGE
  // ========================================================================
  // Sabrina, le 1er octobre 2026 : « encore des bugs sur la page en anglais
  // avec jj/mm/aaaa au lieu de yyyy/mm/dd, ainsi que pour la page en espagnol
  // qui devrait afficher dd/mm/aaaa ». La case de date du NAVIGATEUR ecrit la
  // date dans la langue du navigateur, jamais dans celle de la page :
  // jj/mm/aaaa sur son Chrome francais, mm/dd/yyyy chez un Americain. Le
  // calendrier flatpickr (copie dans le site, assets/vendor, licence MIT)
  // ecrit celle de la page, comme la date de naissance juste au-dessus, et
  // nomme les mois dans sa langue. La valeur envoyee reste AAAA-MM-JJ.
  //
  // ⚠️ SI LE CALENDRIER NE SE CHARGE PAS, la case du navigateur reste : on
  // perd le format, jamais la demande.
  //
  // ⚠️ SUR UN TELEPHONE, LE CALENDRIER SEUL, sans clavier par-dessus : la case
  // y est en lecture seule. A la souris, on peut aussi taper les huit
  // chiffres, et les barres se posent seules.
  var FORMAT_AFFICHE = ANNEE_DABORD ? 'Y/m/d' : 'd/m/Y';
  var GABARIT = { fr: 'JJ/MM/AAAA', en: 'YYYY/MM/DD', es: 'DD/MM/AAAA' }[langue];
  var TACTILE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

  function calendriers() {
    if (!window.flatpickr) return;
    var style = document.createElement('style');
    style.textContent = '.flatpickr-day.selected,.flatpickr-day.selected:hover,'
      + '.flatpickr-day.selected:focus{background:#1DA1F2;border-color:#1DA1F2}';
    document.head.appendChild(style);
    var traduction = window.flatpickr.l10ns && window.flatpickr.l10ns[langue];
    Array.prototype.forEach.call(document.querySelectorAll('input[type="date"]'), function (champ) {
      champ.setAttribute('placeholder', GABARIT);
      var fp = window.flatpickr(champ, {
        locale: langue !== 'en' && traduction ? traduction : 'default',
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: FORMAT_AFFICHE,
        altInputClass: champ.className,
        allowInput: !TACTILE,
        disableMobile: true,
        minDate: 'today'
      });
      if (!fp || !fp.altInput) return;
      fp.altInput.setAttribute('autocomplete', 'off');
      if (!TACTILE) masqueDeDate(fp.altInput);
      // UNE DATE TAPEE SE LIT A LA SORTIE DE LA CASE, et flatpickr ne le dit
      // a personne : on le dit, pour que les trois jours se recomptent.
      fp.altInput.addEventListener('blur', function () {
        setTimeout(function () { champ.dispatchEvent(new Event('change')); }, 0);
      });
    });
  }

  /** La case que le client voit : celle du calendrier quand il est la. */
  function visible(champ) {
    return champ && champ._flatpickr && champ._flatpickr.altInput ? champ._flatpickr.altInput : champ;
  }

  /** L'age en annees pleines, le jour du depart : c'est ce jour-la qu'il conduit. */
  function ageAu(naissance, jour) {
    var n = naissance.split('-').map(Number);
    var j = jour.split('-').map(Number);
    var age = j[0] - n[0];
    if (j[1] < n[1] || (j[1] === n[1] && j[2] < n[2])) age -= 1;
    return age;
  }

  function refuser(champ, texte) {
    champ.setCustomValidity(texte);
    champ.reportValidity();
    champ.focus();
  }

  // ========================================================================
  // LA PRE-RESERVATION
  // ========================================================================
  function preReservation() {
    var form = document.getElementById('reservationForm');
    if (!form) return;
    var bouton = form.querySelector('button[type="submit"]');
    var etat = document.getElementById('reservationStatus');
    var naissance = document.getElementById('age');
    var libelle = bouton ? bouton.textContent : '';
    var enCours = false;
    if (naissance) masqueDeDate(naissance);

    // TROIS JOURS AU MOINS (Lisa, 1er octobre 2026 : elle recoit « souvent des
    // demandes par le formulaire de pré-réservation pour des locations de
    // moins de 3 jours »). Le message parait SOUS la date de retour des que
    // les deux dates sont choisies, et l'envoi est retenu tant qu'il est la.
    // Les jours se comptent comme dans l'App, colonne « Jours » : du 10 au 12,
    // deux jours.
    var JOURS_MINIMUM = 3;
    var depart = document.getElementById('pickupDate');
    var retour = document.getElementById('returnDate');
    var avis = null;
    if (retour && retour.parentNode) {
      avis = document.createElement('p');
      avis.id = 'dureeMinimum';
      avis.setAttribute('role', 'alert');
      avis.hidden = true;
      avis.style.cssText = 'color:#dc2626;font-weight:600;font-size:.95rem;margin-top:.5rem';
      retour.parentNode.appendChild(avis);
    }
    function joursDemandes() {
      if (!depart || !retour || !depart.value || !retour.value) return null;
      var a = Date.parse(depart.value + 'T00:00:00Z');
      var b = Date.parse(retour.value + 'T00:00:00Z');
      if (!isFinite(a) || !isFinite(b)) return null;
      return Math.round((b - a) / 86400000);
    }
    function dureeAcceptee() {
      var n = joursDemandes();
      var court = n !== null && n < JOURS_MINIMUM;
      if (retour) visible(retour).setCustomValidity(court ? T.minimum : '');
      if (avis) {
        avis.textContent = court ? T.minimum : '';
        avis.hidden = !court;
      }
      return !court;
    }
    [depart, retour].forEach(function (champ) {
      if (!champ) return;
      champ.addEventListener('change', dureeAcceptee);
      champ.addEventListener('input', dureeAcceptee);
      champ.addEventListener('change', function () { manque(champ, false); });
    });
    // LE RETOUR NE SE CHOISIT PAS AVANT LE DEPART : son calendrier commence
    // au jour du depart.
    if (depart && retour && retour._flatpickr) {
      depart.addEventListener('change', function () {
        retour._flatpickr.set('minDate', depart.value || 'today');
      });
    }
    // Apres le merci, le formulaire se vide : le message part avec lui, et
    // les calendriers oublient leur choix.
    form.addEventListener('reset', function () {
      setTimeout(function () {
        [depart, retour].forEach(function (champ) {
          if (champ && champ._flatpickr) champ._flatpickr.clear(false);
        });
        if (retour && retour._flatpickr) retour._flatpickr.set('minDate', 'today');
        dureeAcceptee();
      }, 0);
    });

    // UNE DATE QUI MANQUE SE DIT SOUS SA CASE. La bulle du navigateur ne sait
    // pas se poser sur une case en lecture seule (le calendrier du
    // telephone) : le message s'ecrit dessous, et le calendrier s'ouvre.
    function manque(champ, oui) {
      if (!champ) return;
      var v = visible(champ);
      var p = v.parentNode ? v.parentNode.querySelector('[data-date-manquante]') : null;
      if (!oui) {
        if (p) p.hidden = true;
        return;
      }
      if (!p && v.parentNode) {
        p = document.createElement('p');
        p.setAttribute('data-date-manquante', '');
        p.setAttribute('role', 'alert');
        p.style.cssText = 'color:#dc2626;font-weight:600;font-size:.95rem;margin-top:.5rem';
        v.parentNode.insertBefore(p, v.nextSibling);
      }
      if (p) {
        p.textContent = T.dateManquante;
        p.hidden = false;
      }
      if (v.scrollIntoView) v.scrollIntoView({ block: 'center' });
      if (champ._flatpickr) champ._flatpickr.open();
    }

    function dire(texte, sorte) {
      if (!etat) return;
      etat.textContent = texte;
      etat.hidden = !texte;
      // SUR DEUX LIGNES, comme Sabrina l'a ecrit le 30/09/2026 : le « \n » du
      // texte devient un vrai retour a la ligne.
      etat.className = 'mt-4 text-center font-semibold whitespace-pre-line '
        + (sorte === 'ok' ? 'text-green-700' : sorte === 'mal' ? 'text-red-600' : 'text-gray-700');
      if (texte && etat.scrollIntoView) etat.scrollIntoView({ block: 'nearest' });
    }
    function rendreLaMain() {
      enCours = false;
      if (bouton) {
        bouton.disabled = false;
        bouton.textContent = libelle;
      }
    }
    function reussi() {
      form.reset();
      rendreLaMain();
      dire(T.merci, 'ok');
    }
    function rate() {
      rendreLaMain();
      dire(T.echec, 'mal');
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      // LE DEUXIEME CLIC NE PART JAMAIS : c'etait la cause des doublons.
      if (enCours) return;

      var fd = new FormData(form);
      var piege = String(fd.get('champ_piege') || '').trim();
      var duree = Date.now() - ouverte;

      var naissanceIso = null;
      if (naissance) {
        naissanceIso = naissanceEnIso(naissance.value);
        if (!naissanceIso) return refuser(naissance, T.naissanceFormat);
        // ⚠️ PAS « depart » : ce nom est celui de la case, et un `var` du meme
        // nom la masquait dans toute la fonction (la garde des dates lisait
        // un texte au lieu de la case, et retenait l'envoi sans un mot).
        var jourDuDepart = String(fd.get('pickupDate') || '') || new Date().toISOString().slice(0, 10);
        var age = ageAu(naissanceIso, jourDuDepart);
        if (age < 18) return refuser(naissance, T.naissanceJeune);
        if (age > 99) return refuser(naissance, T.naissanceVieux);
      }
      if (depart && !depart.value) return manque(depart, true);
      if (retour && !retour.value) return manque(retour, true);
      if (!dureeAcceptee()) return refuser(visible(retour), T.minimum);

      enCours = true;
      if (bouton) {
        bouton.disabled = true;
        bouton.textContent = T.envoi;
      }
      dire(T.envoi, 'attente');

      // UN ROBOT CROIT AVOIR REUSSI, pour ne pas chercher un autre chemin.
      if (piege || duree < DELAI_MINIMUM) {
        setTimeout(reussi, 800);
        return;
      }

      // LE MEME CORPS POUR LA FEUILLE ET POUR L'APP, aux memes noms de champs.
      // La case « age » porte desormais la date de naissance, dans la MEME
      // colonne de la feuille : en inserer une decalerait celles de l'equipe.
      var corps = new URLSearchParams();
      fd.forEach(function (v, k) {
        // LE MESSAGE DU CLIENT NE VA PAS A LA FEUILLE : son script range des
        // colonnes fixes, et une case qu'il ne connait pas n'a rien a y
        // faire. L'App le recoit, a cote de l'empreinte (1er octobre 2026).
        if (k === 'champ_piege' || k === 'message' || typeof v !== 'string') return;
        corps.append(k, k === 'age' && naissanceIso ? naissanceIso : v);
      });
      var versLApp = new URLSearchParams(corps.toString());
      versLApp.append('message', String(fd.get('message') || '').trim());
      // LA LANGUE DE LA PAGE, pour le drapeau a cote du nom du client dans
      // l'App (Sabrina, 1er octobre 2026). L'App seule : la feuille range des
      // colonnes fixes.
      versLApp.append('langue', langue);
      versLApp.append('website', piege);
      versLApp.append('duree', String(duree));
      var entete = { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' };

      var laFeuille = envoyer(FEUILLE_RESERVATION, { method: 'POST', headers: entete, body: corps.toString() }, 30000)
        .then(function (r) {
          return r.text().then(function (t) {
            try { return r.ok && JSON.parse(t).ok === true; } catch (e) { return false; }
          });
        })
        .catch(function () { return false; });
      var lApp = envoyer(APP + '/api/site/demande', { method: 'POST', headers: entete, body: versLApp.toString() }, 30000)
        .then(function (r) { return r.ok; })
        .catch(function () { return false; });

      // IL SUFFIT QU'UN DES DEUX L'AIT : l'autre la rattrape, ou le releve.
      Promise.all([laFeuille, lApp]).then(function (res) {
        if (res[0] || res[1]) reussi();
        else rate();
      });
    });
  }

  // ========================================================================
  // LE MESSAGE DE CONTACT
  // ========================================================================
  // ⚠️ L'ADRESSE D'ENVOI N'EST PLUS DANS LE HTML (`action`) : un robot qui
  // remplit les formulaires sans executer de script postait tout droit vers
  // la feuille. Quarante messages sur 137 etaient du pourriel.
  function contact() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var bouton = document.getElementById('contactSubmit');
    var etat = document.getElementById('contactStatus');
    var enCours = false;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (enCours) return;
      enCours = true;
      if (etat) etat.textContent = '';
      var original = bouton ? bouton.textContent : '';
      if (bouton) {
        bouton.disabled = true;
        bouton.textContent = T.contactEnvoi;
      }
      var fd = new FormData(form);
      var robot = String(fd.get('_gotcha') || '').trim() !== '' || Date.now() - ouverte < DELAI_MINIMUM;
      var envoi = robot
        ? new Promise(function (ok) { setTimeout(ok, 800); })
        : envoyer(FEUILLE_CONTACT, { method: 'POST', body: fd, mode: 'no-cors' }, 30000);
      envoi.then(function () {
        form.reset();
        if (etat) {
          etat.textContent = T.contactMerci;
          etat.className = 'mt-3 text-center text-sm text-green-600';
        }
      }, function () {
        if (etat) {
          etat.textContent = T.contactEchec;
          etat.className = 'mt-3 text-center text-sm text-red-600';
        }
      }).then(function () {
        enCours = false;
        if (bouton) {
          bouton.disabled = false;
          bouton.textContent = original;
        }
      });
    });
  }

  // ========================================================================
  // UN LIEN QUI VISE UNE SECTION Y ARRIVE VRAIMENT
  // ========================================================================
  // Sabrina, le 1er octobre 2026, avec deux captures : le lien
  // streetcarsolution.com/#reservation, donne aux clients pour arriver sur le
  // formulaire, s'arretait au-dessus, dans « Témoignages de Nos Clients ». Le
  // navigateur saute a la section des que le HTML est lu ; puis les images
  // et les blocs du haut prennent leur vraie hauteur, et le formulaire
  // descend sans que la page suive.
  //
  // On se recale donc sur la section pendant que la page finit de se
  // construire, trois secondes au plus, et on s'arrete au premier geste du
  // visiteur : il ne faut jamais lui reprendre la page des mains.
  function suivreLAncre() {
    var id = decodeURIComponent(String(location.hash || '').slice(1));
    var cible = id ? document.getElementById(id) : null;
    if (!cible) return;
    var lache = false;
    var lacher = function () { lache = true; };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (t) {
      window.addEventListener(t, lacher, { once: true, passive: true });
    });
    var aligner = function () {
      if (lache) return;
      // `instant` : le site a `scroll-smooth`, et une glissade n'arriverait
      // jamais a rattraper une page qui grandit encore.
      cible.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    // MESURE DU 1er OCTOBRE SUR LE VRAI SITE : a 1280 px, la page finit de
    // charger au bout de six secondes ; a 390 px elle grandit encore apres
    // le saut du navigateur, et le formulaire restait 1 304 px plus bas. On
    // se recale donc pendant trois secondes, puis encore deux apres la fin
    // du chargement, quand les dernieres images ont pris leur place.
    var fin = 0;
    var tourne = false;
    var boucle = function () {
      if (lache || Date.now() > fin) { tourne = false; return; }
      aligner();
      setTimeout(boucle, 250);
    };
    var prolonger = function (ms) {
      fin = Math.max(fin, Date.now() + ms);
      if (!tourne) { tourne = true; boucle(); }
    };
    prolonger(3000);
    window.addEventListener('load', function () { prolonger(2000); });
  }

  function demarrer() {
    calendriers();
    chargerLesLieux();
    preReservation();
    contact();
    suivreLAncre();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
