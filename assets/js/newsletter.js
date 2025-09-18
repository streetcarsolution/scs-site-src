(() => {
  // ⚠️ Mets ici l'URL "…/exec" du déploiement Apps Script
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbzZTRC3sRt3GZdcAUWysxUqXZaaYyLBxwfV1KW87K-YZYvaa4zpbeGauZmncIBVQnsb/exec';

  // Texte par langue (affiché sous le champ)
  const MSG = {
    fr: { ok: 'Merci ! Adresse enregistrée ✅', ko: 'Oups, une erreur est survenue. Réessaie plus tard.' },
    en: { ok: 'Thanks! Email saved ✅',         ko: 'Oops, something went wrong. Try again later.' },
    es: { ok: '¡Gracias! Correo guardado ✅',   ko: 'Vaya, ocurrió un error. Inténtalo más tarde.' },
  };

  // Cible tous les formulaires newsletter du site
  document.querySelectorAll('form[data-newsletter]').forEach((form) => {
    const emailEl = form.querySelector('input[type="email"]');
    const msgEl   = form.querySelector('.newsletter-msg') || form.nextElementSibling;
    const lang    = (form.dataset.lang || document.documentElement.lang || 'fr').slice(0,2).toLowerCase();

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const email = (emailEl?.value || '').trim();

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        show(MSG[lang]?.ko || MSG.fr.ko);
        return;
      }

      try {
        const res = await fetch(GAS_URL, {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' }, // OK avec Apps Script
          body: JSON.stringify({ email, lang, notes: '' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || `HTTP_${res.status}`);

        show(MSG[lang]?.ok || MSG.fr.ok);
        form.reset();
      } catch (err) {
        console.error('Newsletter submit failed:', err);
        show(MSG[lang]?.ko || MSG.fr.ko);
      }
    });

    function show(txt) {
      if (msgEl) {
        msgEl.textContent = txt;
        msgEl.classList.remove('hidden');
      } else {
        alert(txt);
      }
    }
  });
})();
