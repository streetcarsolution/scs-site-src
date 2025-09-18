// REMPLACE par l’URL /exec de ta Web App
const APPS_SCRIPT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxsf9O6-p2QHtNBszsBQtUNHz94XAg78GXUBBdeaIJoCk3E5mG5sMJvhYPuIGd0GQg4/exec';

function detectLang(form) {
  const attr = form.getAttribute('data-lang');
  if (attr) return attr.toUpperCase();
  const htmlLang = document.documentElement.lang || 'fr';
  return htmlLang.slice(0,2).toUpperCase();
}

function attachNewsletterForms() {
  document.querySelectorAll('form.newsletter-form').forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = form.querySelector('input[type="email"]')?.value.trim();
      if (!email) return;

      const lang = detectLang(form);
      const payload = { email, lang, notes: '' };

      try {
        // Apps Script accepte CORS, mais certains hébergements aiment 'no-cors'
        await fetch(APPS_SCRIPT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        // UI feedback minimal
        form.reset();
        const ok = document.createElement('div');
        ok.textContent = lang === 'FR' ? 'Merci !' : (lang === 'ES' ? '¡Gracias!' : 'Thanks!');
        ok.className = 'mt-2 text-green-600 text-sm';
        form.appendChild(ok);
        setTimeout(() => ok.remove(), 3000);
      } catch (err) {
        console.error('Newsletter error:', err);
        alert('Oups, une erreur est survenue. Réessaie plus tard.');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', attachNewsletterForms);
