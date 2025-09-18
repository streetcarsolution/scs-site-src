(() => {
  // ⬇️ Mets ici l’URL /exec de TON déploiement Apps Script
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbz57dZlrmz9KdkI22SeMCd3ZwQPQUnWV8peC6hzzm9Q49J7LLUIWK8g85XC3u9CuOK_/exec';

  // Textes par langue
  const TXT = {
    fr: {
      ok: 'Merci ! Inscription confirmée ✅',
      ko: 'Oups, une erreur est survenue. Réessaie plus tard.',
      invalid: 'Adresse e-mail invalide.'
    },
    en: {
      ok: 'Thanks! You’re subscribed ✅',
      ko: 'Oops, something went wrong. Try again later.',
      invalid: 'Invalid email.'
    },
    es: {
      ok: '¡Gracias! Suscripción confirmada ✅',
      ko: 'Vaya, ocurrió un error. Inténtalo de nuevo.',
      invalid: 'Correo no válido.'
    }
  };

  // Tous les formulaires Newsletter
  document.querySelectorAll('form[data-newsletter]').forEach((form) => {
    const input = form.querySelector('input[type="email"]');

    // Élément où afficher le message (on en crée un si absent)
    let msg = form.querySelector('.newsletter-msg');
    if (!msg) {
      msg = document.createElement('p');
      msg.className = 'mt-2 text-sm';
      form.parentNode.insertBefore(msg, form.nextSibling);
    }

    // Langue (data-lang sur le form > lang du <html> > fr)
    const lang =
      (form.dataset.lang || document.documentElement.lang || 'fr')
        .slice(0, 2)
        .toLowerCase();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (input.value || '').trim();

      // Validation simple
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = TXT[lang]?.invalid || TXT.fr.invalid;
        msg.className = 'mt-2 text-sm text-red-500';
        return;
      }

      try {
        // ➜ GET pour éviter toute pré-requête (OPTIONS)
        const url =
          `${ENDPOINT}?email=${encodeURIComponent(email)}` +
          `&lang=${encodeURIComponent(lang)}&t=${Date.now()}`;

        const res = await fetch(url, { method: 'GET' });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || 'unknown');

        msg.textContent = TXT[lang]?.ok || TXT.fr.ok;
        msg.className = 'mt-2 text-sm text-green-600';
        input.value = '';
      } catch (err) {
        console.error('Newsletter submit failed:', err);
        msg.textContent = TXT[lang]?.ko || TXT.fr.ko;
        msg.className = 'mt-2 text-sm text-red-500';
      }
    });
  });
})();
