# Site streetcarsolution.com

Le site vitrine de Street Car Solution : des pages HTML statiques, en trois
langues, hébergées chez OVH.

## Où sont les choses

| Dossier ou fichier | Contenu |
| --- | --- |
| `*.html` | Les pages françaises (accueil, véhicules, services, témoignages, FAQ, blog, conditions, confidentialité) |
| `en/`, `es/` | Les mêmes pages en anglais et en espagnol (sauf le blog, en français seulement) |
| `assets/js/formulaires.js` | La pré-réservation et le message de contact, pour les trois langues |
| `assets/js/newsletter.js` | L'inscription à la newsletter |
| `assets/js/consentement.js` | Le bandeau cookies : les vidéos Facebook, la carte Google et la traduction du blog attendent l'accord du visiteur |
| `assets/vehicules/` | Les photos des véhicules, en WebP |
| `assets/vendor/` | Le calendrier flatpickr, copié dans le site |
| `.htaccess` | Redirections, cache, compression et en-têtes de sécurité |
| `robots.txt`, `sitemap.xml` | Ce que les moteurs de recherche lisent en premier |

## Mise en ligne

Chaque envoi sur la branche `main` publie le site : GitHub Actions
(`.github/workflows/deploy.yml`) envoie par FTP les fichiers qui ont changé.
Il n'y a pas d'étape de construction.

## À savoir avant de modifier

- **Une page existe en trois exemplaires.** Un changement dans `index.html`
  est à refaire dans `en/index.html` et `es/index.html`.
- **Une nouvelle page** s'ajoute aussi dans `sitemap.xml`, avec ses liens
  `hreflang` vers ses traductions.
- **Les scripts et les styles sont gardés un an par le navigateur.** Après
  une modification de `formulaires.js`, augmenter le numéro dans
  `formulaires.js?v=…` sur les trois pages d'accueil, sinon les visiteurs
  déjà venus gardent l'ancienne version.
- **Le `.htaccess` ne se teste pas en local.** Une erreur dedans coupe tout
  le site : vérifier le site en ligne juste après l'envoi.
- **Les photos** se mettent en WebP dans `assets/`, avec `width` et `height`
  sur la balise, pour que la page ne bouge pas pendant le chargement.
