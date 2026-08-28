/* ══════════════════════════════════════════════════════════════
   ALTIWASH FRANCE — Mouvement et comportements
   ──────────────────────────────────────────────────────────────
   JavaScript natif, sans dépendance.

   Deux mécanismes, et deux seulement :

     • un observateur, pour ce qui se déclenche une fois — les
       apparitions, les volets, les verrouillages de réticule ;
     • une boucle d'animation unique, pour ce qui suit le
       défilement en continu — parallaxes, trajectoires de vol,
       barre de progression.

   Tout passe par ces deux points d'entrée : pas d'écouteur de
   défilement dispersé, une seule lecture de la géométrie par
   image, et aucune écriture pendant la lecture.

   Le site reste entièrement lisible sans ce fichier.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var racine = document.documentElement;
  racine.classList.remove("no-js");
  racine.classList.add("js");

  var mouvementReduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ════════════════════════════════════════════════════════════
     0. OUVERTURE DU SITE
     ────────────────────────────────────────────────────────────
     Le rideau a été décidé dans le <head>, avant le premier rendu.
     Ici on le construit, on joue la séquence, puis on le retire.

     Le balisage est créé en JavaScript : sans lui, rien de tout
     ceci n'existe et la page s'affiche directement.
     ════════════════════════════════════════════════════════════ */

  /* Tout ce qui se joue au chargement — apparitions du premier écran,
     tracé du hero — attend la levée du rideau, sinon il se déroulerait
     derrière et le visiteur ne verrait rien. */
  var retardOuverture = 0;

  if (racine.classList.contains("ouverture-en-cours")) {
    (function () {
      var LEVEE = 1500;      /* le rideau s'ouvre */
      var RETRAIT = 2500;    /* le rideau quitte le DOM */
      retardOuverture = LEVEE;

      var o = document.createElement("div");
      o.className = "ouverture";
      o.setAttribute("aria-hidden", "true");
      o.innerHTML =
        '<div class="ouverture__pan ouverture__pan--haut"></div>' +
        '<div class="ouverture__pan ouverture__pan--bas"></div>' +
        '<div class="ouverture__marque">' +
          '<img class="ouverture__logo" src="media/logo-altiwash.png" alt="" width="68" height="85">' +
          '<span class="ouverture__reticule"><span></span><span></span><span></span><span></span></span>' +
          '<span class="ouverture__balayage"></span>' +
          '<span class="label-tech ouverture__nom">AltiWash France</span>' +
        '</div>';
      document.body.appendChild(o);

      setTimeout(function () {
        o.classList.add("est-levee");
        racine.classList.remove("ouverture-en-cours");
        racine.classList.add("ouverture-finie");
      }, LEVEE);

      setTimeout(function () {
        if (o.parentNode) o.parentNode.removeChild(o);
        racine.classList.remove("ouverture-finie");
      }, RETRAIT);
    })();
  }

  /* ════════════════════════════════════════════════════════════
     1. APPARITIONS — ce qui ne se joue qu'une fois
     ════════════════════════════════════════════════════════════ */

  var SELECTEUR_APPARITION =
    ".reveal, .reveal-groupe, .lignes, .repere, .volet, .balayage, .faits, .hairlines";
  var aReveler = document.querySelectorAll(SELECTEUR_APPARITION);

  if (mouvementReduit || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(aReveler, function (el) {
      el.classList.add("est-visible");
    });
  } else {
    var observateur = new IntersectionObserver(
      function (entrees) {
        entrees.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add("est-visible");
          observateur.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    var premierPassage = function () {
      Array.prototype.forEach.call(aReveler, function (el) {
        /* Ce qui est déjà à l'écran au chargement s'affiche sans
           attendre un défilement qui ne viendra peut-être jamais. */
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
          el.classList.add("est-visible");
        } else {
          observateur.observe(el);
        }
      });
    };

    if (retardOuverture) setTimeout(premierPassage, retardOuverture);
    else premierPassage();
  }

  /* ════════════════════════════════════════════════════════════
     2. BOUCLE D'ANIMATION — ce qui suit le défilement
     ────────────────────────────────────────────────────────────
     Les effets s'enregistrent dans `effets`. À chaque image, on
     mesure d'abord, on écrit ensuite.
     ════════════════════════════════════════════════════════════ */

  var effets = [];
  var enAttente = false;
  var hauteurVue = window.innerHeight;

  /** Avancement de 0 à 1 de la traversée de l'écran par un élément. */
  function avancement(rect, depart, arrivee) {
    var p = (hauteurVue * depart - rect.top) / (rect.height + hauteurVue * (depart - arrivee));
    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  function image() {
    enAttente = false;
    for (var i = 0; i < effets.length; i++) effets[i]();
  }

  function planifier() {
    if (enAttente) return;
    enAttente = true;
    requestAnimationFrame(image);
  }

  /* ════════════════════════════════════════════════════════════
     3. PARALLAXE
     Chaque plan porte son propre coefficient : c'est l'écart
     entre les vitesses qui crée la profondeur, pas l'amplitude.
     ════════════════════════════════════════════════════════════ */

  if (!mouvementReduit) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-parallaxe]"), function (el) {
      var ampleur = parseFloat(el.dataset.parallaxe) || 24;
      var cadre = el.parentElement;

      effets.push(function () {
        var r = cadre.getBoundingClientRect();
        if (r.bottom < -200 || r.top > hauteurVue + 200) return;
        /* −1 en haut de l'écran, +1 en bas : le plan glisse autour
           de sa position d'équilibre. */
        var t = (r.top + r.height / 2 - hauteurVue / 2) / (hauteurVue / 2 + r.height / 2);
        el.style.transform = "translate3d(0," + (t * ampleur).toFixed(2) + "px,0)";
      });
    });
  }

  /* ════════════════════════════════════════════════════════════
     4. HERO
     La photographie remonte moins vite que le texte, qui s'efface
     à mesure qu'on quitte le premier écran.
     ════════════════════════════════════════════════════════════ */

  var hero = document.querySelector(".hero");
  if (hero && !mouvementReduit) {
    var photoHero = hero.querySelector(".hero__photo");
    var contenuHero = hero.querySelector(".hero__contenu");

    effets.push(function () {
      var r = hero.getBoundingClientRect();
      if (r.bottom < 0) return;
      var p = Math.min(1, Math.max(0, -r.top / (r.height || 1)));
      if (photoHero) photoHero.style.transform = "translate3d(0," + (p * 90).toFixed(1) + "px,0)";
      if (contenuHero) {
        contenuHero.style.transform = "translate3d(0," + (p * 170).toFixed(1) + "px,0)";
        /* Le texte disparaît avant le bas de section, pour ne pas
           traîner sous le bandeau de faits. */
        contenuHero.style.opacity = String(Math.max(0, 1 - p / 0.62));
      }
    });
  }

  /* ════════════════════════════════════════════════════════════
     5. TRAJECTOIRES DE VOL
     Le plan de vol est tracé en pointillé ; la portion parcourue
     se dessine par-dessus, et le drone avance à sa pointe.
     ════════════════════════════════════════════════════════════ */

  Array.prototype.forEach.call(document.querySelectorAll(".trace"), function (trace) {
    var vol = trace.querySelector(".trace__vol");
    var drone = trace.querySelector(".trace__drone");
    var svg = trace.querySelector("svg");
    if (!vol || !svg) return;

    var longueur = vol.getTotalLength();
    vol.style.strokeDasharray = longueur;

    if (mouvementReduit) {
      vol.style.strokeDashoffset = "0";
      return;
    }
    vol.style.strokeDashoffset = longueur;

    /* Le viewBox est étiré par `preserveAspectRatio="none"` : on
       convertit nous-mêmes les coordonnées du tracé en pixels,
       sinon le drone serait déformé avec lui. */
    var vb = svg.viewBox.baseVal;

    /** Place le tracé et le drone à l'avancement `p` (0 → 1). */
    function poser(p, largeur, hauteur) {
      vol.style.strokeDashoffset = String(longueur * (1 - p));
      if (!drone) return;
      if (p <= 0.001 || p >= 0.999) {
        drone.style.opacity = "0";
        return;
      }
      var pt = vol.getPointAtLength(longueur * p);
      drone.style.opacity = "1";
      drone.style.transform =
        "translate3d(" +
        ((pt.x - vb.x) / vb.width * largeur).toFixed(1) + "px," +
        ((pt.y - vb.y) / vb.height * hauteur).toFixed(1) + "px,0)";
    }

    /* Tracé joué au chargement plutôt qu'au défilement : c'est le
       cas du hero, vu avant tout défilement. */
    if (trace.dataset.autoplay) {
      var duree = parseFloat(trace.dataset.autoplay) * 1000 || 2800;
      var depart = null;
      var vole = function (t) {
        if (depart === null) depart = t;
        var p = Math.min(1, (t - depart) / duree);
        var r = trace.getBoundingClientRect();
        /* Adoucissement en sortie : le drone ralentit en fin de course. */
        poser(1 - Math.pow(1 - p, 3), r.width, r.height);
        if (p < 1) requestAnimationFrame(vole);
      };
      setTimeout(function () { requestAnimationFrame(vole); }, 400 + retardOuverture);
      return;
    }

    effets.push(function () {
      var r = trace.getBoundingClientRect();
      if (r.bottom < -100 || r.top > hauteurVue + 100) return;

      poser(avancement(r, 0.88, 0.35), r.width, r.height);
    });
  });

  /* ════════════════════════════════════════════════════════════
     6. MÉTHODE — le rail se remplit au fil du défilement
     La progression du lecteur suit celle du chantier.
     ════════════════════════════════════════════════════════════ */

  var deroule = document.querySelector(".methode__deroule");
  var railPlein = document.querySelector(".methode__rail-plein");

  if (deroule && railPlein) {
    if (mouvementReduit) {
      railPlein.style.transform = "scaleX(1)";
    } else {
      effets.push(function () {
        var r = deroule.getBoundingClientRect();
        railPlein.style.transform = "scaleX(" + avancement(r, 0.78, 0.5).toFixed(3) + ")";
      });
    }
  }

  /* ════════════════════════════════════════════════════════════
     7. EN-TÊTE — fond opaque et barre de progression
     ════════════════════════════════════════════════════════════ */

  var header = document.querySelector(".site-header");
  var progression = document.querySelector(".progression");

  if (header) {
    effets.push(function () {
      header.classList.toggle("est-defile", window.scrollY > 40);

      if (!progression) return;
      var total = document.documentElement.scrollHeight - hauteurVue;
      var p = total > 0 ? window.scrollY / total : 0;
      progression.style.transform = "scaleX(" + Math.min(1, Math.max(0, p)).toFixed(4) + ")";
    });
  }

  /* ── Mise en marche ── */
  if (effets.length) {
    window.addEventListener("scroll", planifier, { passive: true });
    window.addEventListener("resize", function () {
      hauteurVue = window.innerHeight;
      planifier();
    });
    image();
  }

  /* ════════════════════════════════════════════════════════════
     8. MENU PLEIN ÉCRAN
     ════════════════════════════════════════════════════════════ */

  var burger = document.querySelector(".burger");
  var menu = document.getElementById("menu-mobile");

  if (burger && menu) {
    var basculer = function (ouvert) {
      burger.setAttribute("aria-expanded", String(ouvert));
      menu.classList.toggle("est-ouvert", ouvert);
      document.body.classList.toggle("menu-actif", ouvert);
      if (header) header.classList.toggle("menu-ouvert", ouvert);
      burger.querySelector(".burger__libelle").textContent = ouvert
        ? "Fermer le menu"
        : "Ouvrir le menu";
    };

    burger.addEventListener("click", function () {
      basculer(burger.getAttribute("aria-expanded") !== "true");
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("est-ouvert")) basculer(false);
    });

    /* Le menu ne doit pas survivre à un retour en grand écran. */
    var grandEcran = window.matchMedia("(min-width: 1024px)");
    var surChangement = function (e) {
      if (e.matches) basculer(false);
    };
    if (grandEcran.addEventListener) grandEcran.addEventListener("change", surChangement);
    else grandEcran.addListener(surChangement);
  }

  /* ════════════════════════════════════════════════════════════
     9. INDEX DES PRESTATIONS
     L'aperçu suit la ligne survolée. Au repos, le photovoltaïque
     garde la main : le cadre n'est jamais vide et la prestation
     principale reste en avant.
     ════════════════════════════════════════════════════════════ */

  var liste = document.querySelector(".index-prestations__liste");
  var apercus = document.querySelectorAll(".index-prestations__apercu .cadre");

  if (liste && apercus.length) {
    var montrer = function (i) {
      Array.prototype.forEach.call(apercus, function (cadre, j) {
        cadre.classList.toggle("est-active", i === j);
      });
    };

    Array.prototype.forEach.call(liste.querySelectorAll(".prestation-lien"), function (lien, i) {
      var entrer = function () {
        liste.classList.add("a-survol");
        montrer(i);
      };
      lien.addEventListener("mouseenter", entrer);
      lien.addEventListener("focus", entrer);
      lien.addEventListener("blur", function () {
        liste.classList.remove("a-survol");
        montrer(0);
      });
    });

    liste.addEventListener("mouseleave", function () {
      liste.classList.remove("a-survol");
      montrer(0);
    });
    montrer(0);
  }
})();
