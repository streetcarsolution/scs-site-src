<!-- /assets/js/newsletter.js -->
<script>
// === RENSEIGNE TON URL DE WEB APP (celle qui finit par /exec) ===
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBe5MT-xwhDmF769gzG_Dq5EqPBsckDTtesuJ3hZf9meUw0MlX4BVUIqjgJottO0Nf/exec';

(function () {
  // langue de la page d'après <html lang="..">
  const langCode = (document.documentElement.lang || 'fr').slice(0,2).toLowerCase();
  const LANG = { fr:'FR', en:'EN', es:'ES' }[langCode] || 'FR';

  // messages par langue
  const I18N = {
    fr: { ok:"Merci ! Vous êtes bien inscrit(e) ✉️", ko:"Erreur d'envoi. Réessayez." },
    en: { ok:"Thanks! You're on the list ✉️",        ko:"Send error. Please try again." },
    es: { ok:"¡Gracias! Te hemos añadido a la lista ✉️", ko:"Error al enviar. Inténtalo de nuevo." },
  };
  const T = I18N[langCode] || I18N.fr;

  // Iframe caché pour fallback (évite un changement de page)
  let iframe = document.getElementById('newsletter_iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.name = 'newsletter_iframe';
    iframe.id   = 'newsletter_iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }

  // Câbler tous les formulaires newsletter du footer (ceux qui ont un input[type=email])
  document.querySelectorAll('footer form').forEach(form => {
    const emailInput = form.querySelector('input[type="email"]');
    const submitBtn  = form.querySelector('button[type="submit"], button:not([type])');
    if (!emailInput || !submitBtn) return; // on ignore les autres forms

    // action/method/target
    form.action = APP_SCRIPT_URL;
    form.method = 'POST';
    form.target = 'newsletter_iframe';

    // champs cachés (lang + page)
    const hiddenLang = document.createElement('input');
    hiddenLang.type = 'hidden'; hiddenLang.name = 'lang'; hiddenLang.value = LANG;
    form.appendChild(hiddenLang);

    const hiddenPage = document.createElement('input');
    hiddenPage.type = 'hidden'; hiddenPage.name = 'page';
    hiddenPage.value = location.pathname.replace(/^\//,'') || 'index.html';
    form.appendChild(hiddenPage);

    // zone messages
    let okMsg = form.parentElement.querySelector('.newsletter-ok-msg');
    let koMsg = form.parentElement.querySelector('.newsletter-ko-msg');
    if (!okMsg) {
      okMsg = document.createElement('p');
      okMsg.className = 'newsletter-ok-msg text-sm mt-2 text-green-700 hidden';
      okMsg.textContent = T.ok;
      form.parentElement.appendChild(okMsg);
    }
    if (!koMsg) {
      koMsg = document.createElement('p');
      koMsg.className = 'newsletter-ko-msg text-sm mt-2 text-red-600 hidden';
      koMsg.textContent = T.ko;
      form.parentElement.appendChild(koMsg);
    }

    // comportement
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      okMsg.classList.add('hidden'); koMsg.classList.add('hidden');

      const email = (emailInput.value || '').trim();
      if (!email) { koMsg.classList.remove('hidden'); return; }

      // UI désactivée pendant l’envoi
      submitBtn.disabled = true;
      submitBtn.classList.add('opacity-60','cursor-not-allowed');

      try {
        // Envoi silencieux
        const body = new URLSearchParams({ email, lang: hiddenLang.value, page: hiddenPage.value });
        await fetch(APP_SCRIPT_URL, { method:'POST', body, mode:'no-cors' });

        // Succès (réponse no-cors = opaque, c’est normal)
        okMsg.classList.remove('hidden');
        form.reset();
      } catch {
        // Fallback: on laisse le navigateur poster via l’iframe
        form.submit();
        okMsg.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-60','cursor-not-allowed');
      }
    });
  });
})();
</script>
