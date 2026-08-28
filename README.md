# AltiWash France — site vitrine

Site vitrine B2B d'**AltiWash France**, entreprise de nettoyage technique par drone
basée près de Narbonne et intervenant partout en France.

**Le site est en HTML pur.** Pas de framework, pas d'étape de compilation, pas de
`npm install`. Six pages HTML, une feuille de style, deux fichiers JavaScript et les
images : on ouvre un fichier dans un éditeur, on modifie, on enregistre, on envoie.

---

## Mise en ligne

Envoyez le contenu de ce dossier — **sauf `_projet-next/`** — à la racine web de
l'hébergeur (`www/`, `public_html/`…), par FTP, rsync ou glisser-déposer.

À envoyer :

```
index.html  prestations.html  a-propos.html  contact.html
mentions-legales.html  politique-de-confidentialite.html  404.html
robots.txt  sitemap.xml
css/  js/  media/  fonts/
```

Aucune configuration serveur n'est nécessaire. Pensez seulement à pointer la page
d'erreur de l'hébergeur sur `/404.html`.

Pour prévisualiser en local, un double-clic sur `index.html` suffit. Pour être au plus
près des conditions réelles :

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

---

## Arborescence

```
index.html                         Accueil
prestations.html                   Les quatre prestations
a-propos.html                      L'entreprise et le fondateur
contact.html                       Formulaire de devis
mentions-legales.html              Pages légales
politique-de-confidentialite.html
404.html                           Page d'erreur

css/style.css                      Toute la mise en forme, en 16 sections numérotées
js/site.js                         Menu, apparitions au défilement, aperçus
js/formulaire.js                   Validation et envoi du formulaire de devis
media/                             Photographies (WebP), logo, favicons, image de partage
fonts/                             Les 5 polices, auto-hébergées

_projet-next/                      Ancienne version Next.js, archivée (voir plus bas)
```

---

## Modifier le site

### Changer un texte

Ouvrez la page concernée et modifiez le texte entre les balises. Les commentaires HTML
délimitent chaque section :

```html
<!-- ══════════════════ MÉTHODE ══════════════════ -->
```

**Attention aux informations répétées.** Le téléphone, l'e-mail, l'adresse et les liens
du menu apparaissent dans l'en-tête et le pied de page de **chacune des 7 pages**. Si
vous changez le numéro de téléphone, cherchez-le dans tous les fichiers :

```bash
grep -rl "07 84 96 23 28" *.html      # liste les fichiers concernés
grep -rl "contact@altiwash.fr" *.html
```

C'est la contrepartie du HTML pur : rien n'est centralisé, mais rien n'est caché.

### Changer une couleur, une police, un espacement

Tout est en haut de `css/style.css`, section **02. Jetons de design** :

```css
:root {
  --gold-500: #c9a24a;    /* le doré des accents et des filets */
  --ink-950:  #06070a;    /* le noir de fond */
  --paper:    #edebe6;    /* le blanc cassé du texte */
}
```

Modifier une valeur ici la met à jour sur tout le site.

### Favicon et logo

Le logo source (`_projet-next/LOGO/logo_alti_wash.png`) est un doré sur fond noir, sans
transparence. Les fichiers de `media/` en sont **détourés** : l'artwork étant composité
sur du noir pur, l'opération est inversée pixel par pixel (alpha tiré du canal le plus
fort, puis dé-prémultiplication pour retrouver l'or saturé), la lueur diffuse est
ramenée à zéro, et l'image est recadrée au plus près — le logo n'occupait que 45 % de la
largeur source, l'essentiel du favicon était du vide.

| Fichier | Rôle |
|---|---|
| `media/favicon-32.png` | Onglet du navigateur, taille native |
| `media/favicon.png` | 512 px, pour les autres usages |
| `media/apple-touch-icon.png` | Écran d'accueil iOS — **sur fond `#06070a`**, car iOS aplatit toujours la transparence : autant maîtriser le fond plutôt que de le laisser choisir du blanc |
| `media/logo-altiwash.png` | En-tête et pied de page |

Le script de génération est `_projet-next/.install-favicon.mjs` (nécessite `sharp`,
présent dans l'archive). Relancez-le depuis `_projet-next/` après avoir remplacé le
logo source.

### Lisibilité du formulaire

Les champs sont posés sur une surface légèrement plus claire que le fond
(`--ink-850`) plutôt que sur un simple filet : sur du noir, une ligne seule ne se voyait
pas, et on ne remplit pas un formulaire qu'on ne distingue pas. Le filet inférieur reste
l'accent — il passe au doré au focus, en même temps que le libellé.

Les réglages sont dans la section *12* de `css/style.css` : `.champ__saisie` pour les
zones de saisie, `.pastille` pour les choix, `.consentement` pour la case à cocher.

Contrastes mesurés sur le fond des champs : libellé 14:1, texte saisi 16:1,
texte indicatif 5,7:1 — au-delà du seuil AA dans les trois cas.

### Réseaux sociaux

Les trois liens du pied de page sont en dur dans **chacune des 7 pages**, avec leurs
icônes en SVG intégré — aucun script ni image chargé depuis LinkedIn, Instagram ou
Facebook, donc aucun traçage de vos visiteurs.

Pour changer une adresse, cherchez-la partout à la fois :

```bash
grep -rl "instagram.com/altiwash" *.html
```

| Réseau | Adresse |
|---|---|
| LinkedIn | `https://www.linkedin.com/company/altiwash-france/` |
| Instagram | `https://www.instagram.com/altiwash` |
| Facebook | `https://www.facebook.com/profile.php?id=61592875481585` |

Pour ajouter un réseau, dupliquez un bloc `<a class="reseaux__lien">` et remplacez le
`href`, le libellé du `<span class="sr-only">` et le `<path>` de l'icône.

### Remplacer une photographie

Déposez la nouvelle image dans `media/` et changez le `src` correspondant.
**Redimensionnez-la avant** : les images sont servies telles quelles, une photo
d'appareil photo de 8 Mo ralentirait la page. Visez 1600 px de large et le format WebP.

```bash
# macOS, avec ImageMagick (brew install imagemagick)
magick photo.jpg -resize 1600x -quality 82 media/photo.webp
```

---

## Formulaire de devis

Un site en HTML pur n'a pas de serveur pour recevoir un formulaire : l'envoi est délégué
à un service externe. Le formulaire, sa validation, ses pièces jointes et son piège à
robots sont en place ; **seule l'adresse de destination reste à renseigner.**

Ouvrez `js/formulaire.js` et remplissez `CONFIG`, tout en haut du fichier :

```js
var CONFIG = {
  endpoint: "https://formspree.io/f/xxxxxxxx",
  cleAcces: "",
  email: "contact@altiwash.fr",
};
```

| Service | `endpoint` | `cleAcces` |
|---|---|---|
| [Formspree](https://formspree.io) | `https://formspree.io/f/xxxxxxxx` | — (incluse dans l'URL) |
| [Web3Forms](https://web3forms.com) | `https://api.web3forms.com/submit` | votre « access key » |
| [Netlify Forms](https://docs.netlify.com/forms/setup/) | laisser vide, activer côté Netlify | — |

### Tant que `endpoint` est vide

Le site reste utilisable : le formulaire bascule sur un repli `mailto:`. La demande
s'ouvre dans le logiciel de messagerie du visiteur, déjà rédigée, à destination de
`contact@altiwash.fr`, et l'interface le dit explicitement. Rien n'est perdu
silencieusement — mais **les pièces jointes ne sont alors pas transmises.**

### Pièces jointes

3 fichiers maximum, 5 Mo chacun, JPG / PNG / WEBP / HEIC / PDF. Leur envoi effectif
dépend du service retenu et relève souvent d'une formule payante : vérifiez ce point
avant de mettre en ligne.

### Ce qui reste protégé

- validation complète des champs, avec messages par champ ;
- piège à robots : champ invisible + délai minimal de saisie, sans captcha.

La limitation du nombre d'envois par IP, elle, relève du service d'envoi : les trois
services cités la fournissent.

---

## Direction artistique

- **Palette** — noir profond en fond (`--ink-950`), blanc cassé pour la lecture
  (`--paper`), doré en filets et accents (`--gold-500`), bleu technique hérité du ciel
  des photographies (`--azur`). Le doré n'est jamais employé en aplat large.
- **Typographie** — Archivo (titres, capitales resserrées), Inter (texte),
  IBM Plex Mono (repères techniques), Instrument Serif (patrimoine et citations).
- **Motifs** — calepinage vertical de plan technique, équerres d'angle façon réticule
  de visée, numérotation de sections, trajectoire de vol tracée au défilement.
- **Photographie** — les images sont étalonnées en CSS (`.photo-grade`, `.photo-field`)
  plutôt qu'en dur, pour rester ajustables.

Les photographies fournies étant toutes au format portrait, la mise en page privilégie
les compositions verticales et les panneaux latéraux plutôt que les bandeaux pleine
largeur.

---

## Le mouvement

Le site emprunte son vocabulaire d'animation au vol et à la prise de vue aérienne.
Rien ne bouge pour décorer : chaque effet dit quelque chose du métier, ou hiérarchise
la lecture.

| Effet | Où | Ce que ça raconte |
|---|---|---|
| **Ouverture** | Chaque chargement | Rideau noir, verrouillage de la marque, balayage, puis levée en deux pans. Une fois par onglet. |
| **Trajectoire de vol** | Accueil (hero, entre sections), À propos | Le plan de vol est tracé en pointillé ; la portion parcourue se dessine en plein, et le drone — un carré doré cerclé d'un halo — avance à sa pointe. Dans le hero, il monte du toit jusqu'à l'appareil. |
| **Volet** | Toutes les photographies | Un panneau se relève et découvre l'image, pendant que le cadrage se stabilise (léger dézoom). |
| **Réticule** | Cadres photographiques | Les quatre équerres arrivent de l'extérieur et se posent sur les angles, comme une visée qui accroche sa cible. |
| **Balayage** | Bandeau photovoltaïque | Une passe dorée traverse l'image une seule fois : un relevé, pas un gyrophare. |
| **Parallaxe** | 14 plans, coefficients de 16 à 46 | C'est l'écart entre les vitesses qui crée la profondeur, jamais l'amplitude. |
| **Hero** | Accueil | La photographie remonte trois fois moins vite que le texte, qui s'efface avant le bandeau de faits. |
| **Rail de méthode** | Accueil | Le rail se remplit au défilement : la progression du lecteur suit celle du chantier. |
| **Télémétrie** | En-tête, toutes pages | Un filet doré sous l'en-tête indique l'avancement de la lecture. |
| **Titres ligne à ligne** | Partout | Chaque ligne monte derrière son masque. Le décalage entre lignes donne au titre sa cadence. |

### L'ouverture du site

À la première page vue, un rideau noir couvre l'écran : la marque se pose, un réticule
verrouille sa cible, un balayage doré la traverse, puis le rideau se retire en deux pans
et le hero enchaîne sur sa trajectoire de vol. Environ **2,5 secondes**.

Elle se joue **à chaque chargement et à chaque rechargement**. Elle est sautée en
mouvement réduit, et n'existe pas du tout sans JavaScript — le balisage est créé par le
script, jamais présent dans le HTML.

Le déclenchement se règle par la constante `QUAND`, en haut du `<script>` du `<head>` :

| Valeur | Comportement |
|---|---|
| `"toujours"` | À chaque chargement et rechargement — **réglage actuel** |
| `"arrivee"` | À l'arrivée sur le site et au rechargement, mais pas en passant d'une page à l'autre |
| `"session"` | Une seule fois par onglet |

> Avec `"toujours"`, l'animation se joue aussi à chaque clic sur un lien interne — soit
> 2,5 s avant chaque page. Si cela vous paraît lourd à l'usage, `"arrivee"` est le bon
> compromis : l'effet à l'arrivée, la fluidité ensuite. La valeur est à changer dans les
> 7 pages.

La décision est prise dans un court script du `<head>`, **avant le premier rendu** :
posée plus tard, le contenu apparaîtrait une fraction de seconde avant d'être recouvert.
Ce script pose aussi un filet de sécurité — si `js/site.js` ne se charge pas, le rideau
est levé au bout de 4 s et le contenu s'affiche quand même.

Pour la retirer complètement, supprimez ce bloc `<script>` du `<head>` des 7 pages :

```bash
grep -l "altiwash-vu" *.html
```

Pour changer sa durée, `LEVEE` et `RETRAIT` en haut de `js/site.js` (section 0).

### Comment c'est construit

`js/site.js` n'a que **deux mécanismes**, et volontairement pas plus :

1. **un observateur** (`IntersectionObserver`) pour ce qui ne se joue qu'une fois —
   apparitions, volets, réticules, balayages ;
2. **une boucle d'animation unique** (`requestAnimationFrame`) pour ce qui suit le
   défilement en continu — parallaxes, trajectoires, barre de progression.

Les effets s'enregistrent dans un tableau `effets` ; à chaque image, on mesure d'abord
et on écrit ensuite. Il n'y a donc **qu'un seul écouteur de défilement** sur toute la
page, et pas de lecture/écriture entrelacée du DOM.

### Régler ou retirer une animation

- **Amplitude d'une parallaxe** : l'attribut `data-parallaxe="26"` sur le plan concerné,
  directement dans le HTML. Plus le nombre est grand, plus le plan glisse.
- **Vitesse d'une apparition** : section *15. Mouvement* de `css/style.css`.
- **Durée du tracé du hero** : `data-autoplay="2.8"` (secondes) dans `index.html`.
- **Tout désactiver** : retirez `<script src="js/site.js"></script>`. Le site reste
  entièrement fonctionnel et lisible — c'est exactement le comportement testé sous
  `.no-js`.

> **Mouvement réduit.** Les visiteurs dont le système demande moins d'animations
> (`prefers-reduced-motion`) reçoivent le site complet, immobile. Ce n'est pas un
> repli dégradé : c'est un mode testé au même titre que les autres.

---

## Accessibilité et performance

- `prefers-reduced-motion` respecté : toutes les animations sont neutralisées, et les
  états de départ explicitement annulés — rien ne peut rester invisible.
- **Sans JavaScript, le site reste entièrement lisible** : la classe `no-js` sur
  `<html>` annule les états initiaux d'animation.
- Navigation clavier complète, anneau de focus doré, lien d'évitement, formulaire
  entièrement labellisé, erreurs annoncées via `aria-live`.
- Un seul `<h1>` par page, hiérarchie de titres continue.
- Polices auto-hébergées (176 Ko, sous-ensemble latin) : aucun appel à Google Fonts,
  donc aucune fuite de données vers un tiers.
- Images en WebP, chargement différé hors premier écran.
- Poids total du site : environ 2,2 Mo, dont 1,8 Mo d'images.

---

## SEO

- Métadonnées, canoniques, Open Graph et Twitter Card sur chaque page.
- Données structurées `ProfessionalService` avec catalogue sur l'accueil,
  `Service` + `BreadcrumbList` sur la page Prestations.
- `sitemap.xml` et `robots.txt` à la racine ; pages légales en `noindex, follow`.

**Si le domaine change**, les URL absolues sont à mettre à jour :

```bash
grep -rl "altiwash.fr" *.html sitemap.xml robots.txt
```

---

## L'ancienne version Next.js

Le site a d'abord été développé avec Next.js. Cette version est conservée dans
`_projet-next/` : code source, composants React, pipeline de préparation des images
(`scripts/prepare-media.mjs`), et les photographies d'origine dans `LOGO/` et `Photos/`.

**Ce dossier ne doit pas être mis en ligne.** Il n'est là que comme archive : rien
dans le site actuel n'en dépend.

C'est aussi là que se trouvent les fichiers sources des images, si vous devez
regénérer ou recadrer un visuel.

---

## Points restant à traiter avant mise en ligne

- [ ] Renseigner `endpoint` dans `js/formulaire.js`, puis **envoyer une demande de test**
      et vérifier sa bonne réception.
- [ ] Compléter les coordonnées de l'hébergeur dans `mentions-legales.html`.
- [ ] Pointer la page d'erreur de l'hébergeur sur `/404.html`.
- [ ] Remplacer le visuel `media/photovoltaique.webp` par une photographie de chantier
      réelle dès qu'une intervention aura été photographiée — c'est le seul visuel de
      la prestation principale qui ne provienne pas du terrain.
- [ ] Idem pour `media/patrimoine.webp`, issu du flyer.
- [ ] Ajouter une photographie de Gregory Wolff sur la page À propos.
