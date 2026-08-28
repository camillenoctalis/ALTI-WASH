/* ══════════════════════════════════════════════════════════════
   ALTIWASH FRANCE — Formulaire de demande de devis
   ──────────────────────────────────────────────────────────────
   Le site est un site statique : il n'y a pas de serveur pour
   recevoir le formulaire. L'envoi est délégué à un service
   externe (Formspree, Web3Forms, Netlify Forms…) renseigné
   ci-dessous dans CONFIG.

   Tant que `endpoint` est vide, le formulaire bascule sur un
   repli `mailto:` : la demande s'ouvre dans le logiciel de
   messagerie du visiteur, déjà rédigée. Rien n'est perdu
   silencieusement.
   ══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ────────────────────────────────────────────────────────────
     À RENSEIGNER — voir le README, section « Formulaire de devis »
     ──────────────────────────────────────────────────────────── */
  var CONFIG = {
    /* URL fournie par le service d'envoi. Exemples :
         Formspree   "https://formspree.io/f/xxxxxxxx"
         Web3Forms   "https://api.web3forms.com/submit"
       Laisser vide pour le repli mailto. */
    endpoint: "",

    /* Clé publique, si le service en demande une dans le corps de
       la requête (cas de Web3Forms). Inutile pour Formspree. */
    cleAcces: "",

    /* Destinataire du repli mailto. */
    email: "contact@altiwash.fr",
  };

  var form = document.getElementById("form-devis");
  if (!form) return;

  var MAX_FICHIERS = 3;
  var MAX_OCTETS = 5 * 1024 * 1024;
  var TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
  /* Délai minimal de saisie : en deçà, on suppose un robot. */
  var DELAI_MIN_MS = 2500;

  var debut = Date.now();
  var fichiers = [];
  var envoiEnCours = false;

  var LIBELLES = {
    prenom: "Prénom",
    nom: "Nom",
    societe: "Société",
    email: "E-mail",
    telephone: "Téléphone",
    typeClient: "Type de client",
    prestation: "Prestation",
    ville: "Ville / lieu",
    surface: "Surface approximative",
    message: "Description du besoin",
  };

  /* Correspondance slug → intitulé, pour le pré-remplissage
     depuis les liens « Demander un devis » des prestations. */
  var PRESTATION_PAR_SLUG = {
    photovoltaique: "Photovoltaïque",
    toitures: "Toiture",
    facades: "Façade",
    "monuments-patrimoine": "Monument / patrimoine",
  };

  /* ════════════════════════════════════════════════════════════
     Pré-remplissage depuis l'adresse
     ════════════════════════════════════════════════════════════ */
  var slug = new URLSearchParams(window.location.search).get("prestation");
  if (slug && PRESTATION_PAR_SLUG[slug]) {
    var radio = form.querySelector(
      'input[name="prestation"][value="' + PRESTATION_PAR_SLUG[slug] + '"]',
    );
    if (radio) radio.checked = true;
  }

  /* ════════════════════════════════════════════════════════════
     Validation — mêmes règles que l'ancienne version serveur
     ════════════════════════════════════════════════════════════ */
  function valeurs() {
    var v = {};
    Object.keys(LIBELLES).forEach(function (k) {
      var champ = form.elements[k];
      if (!champ) {
        v[k] = "";
      } else if (champ instanceof RadioNodeList || (champ.length && !champ.tagName)) {
        v[k] = champ.value || "";
      } else {
        v[k] = (champ.value || "").trim();
      }
    });
    return v;
  }

  function valider(v) {
    var e = {};
    if (v.prenom.length < 2) e.prenom = "Indiquez votre prénom.";
    if (v.nom.length < 2) e.nom = "Indiquez votre nom.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) e.email = "Adresse e-mail invalide.";
    if (v.telephone.length < 8) e.telephone = "Numéro de téléphone trop court.";
    else if (!/^[0-9+().\s-]+$/.test(v.telephone)) e.telephone = "Numéro de téléphone invalide.";
    if (!v.typeClient) e.typeClient = "Sélectionnez un type.";
    if (!v.prestation) e.prestation = "Sélectionnez une prestation.";
    if (v.ville.length < 2) e.ville = "Indiquez la ville ou le lieu de l'intervention.";
    if (v.message.length < 20)
      e.message = "Décrivez votre besoin en quelques lignes (20 caractères min.).";
    if (!form.elements.consentement.checked)
      e.consentement = "Votre accord est nécessaire pour traiter la demande.";
    return e;
  }

  function afficherErreurs(e) {
    /* On efface l'affichage précédent avant de le reconstruire. */
    Array.prototype.forEach.call(form.querySelectorAll(".champ__erreur"), function (p) {
      p.textContent = "";
    });
    Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (c) {
      c.removeAttribute("aria-invalid");
    });

    Object.keys(e).forEach(function (cle) {
      var p = document.getElementById(cle + "-error");
      if (p) p.textContent = e[cle];
      var champ = form.elements[cle];
      if (champ && champ.setAttribute) champ.setAttribute("aria-invalid", "true");
    });
  }

  /* Le message d'erreur d'un champ disparaît dès qu'on le corrige. */
  form.addEventListener("input", function (ev) {
    var nom = ev.target.name;
    if (!nom) return;
    var p = document.getElementById(nom + "-error");
    if (p) p.textContent = "";
    ev.target.removeAttribute("aria-invalid");
  });

  /* ════════════════════════════════════════════════════════════
     Pièces jointes
     ════════════════════════════════════════════════════════════ */
  var champFichiers = document.getElementById("pieces");
  var listeFichiers = document.querySelector(".pieces__liste");
  var compteur = document.querySelector(".pieces__compteur");
  var erreurPieces = document.getElementById("pieces-error");

  function dessinerFichiers() {
    listeFichiers.innerHTML = "";
    fichiers.forEach(function (f, i) {
      var li = document.createElement("li");
      var nom = document.createElement("span");
      nom.className = "pieces__nom";
      nom.textContent = f.name;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pieces__retirer";
      btn.textContent = "Retirer";
      btn.addEventListener("click", function () {
        fichiers.splice(i, 1);
        dessinerFichiers();
      });
      li.appendChild(nom);
      li.appendChild(btn);
      listeFichiers.appendChild(li);
    });
    compteur.textContent = fichiers.length
      ? fichiers.length + "/" + MAX_FICHIERS + " sélectionné" + (fichiers.length > 1 ? "s" : "")
      : "";
  }

  if (champFichiers) {
    champFichiers.addEventListener("change", function () {
      var erreur = "";
      Array.prototype.forEach.call(champFichiers.files, function (f) {
        if (fichiers.length >= MAX_FICHIERS) {
          erreur = MAX_FICHIERS + " fichiers maximum.";
        } else if (f.size > MAX_OCTETS) {
          erreur = "« " + f.name + " » dépasse 5 Mo.";
        } else if (TYPES_ACCEPTES.indexOf(f.type) === -1) {
          erreur = "« " + f.name + " » : formats acceptés JPG, PNG, WEBP, HEIC, PDF.";
        } else {
          fichiers.push(f);
        }
      });
      erreurPieces.textContent = erreur;
      champFichiers.value = "";
      dessinerFichiers();
    });
  }

  /* ════════════════════════════════════════════════════════════
     Confirmation
     ════════════════════════════════════════════════════════════ */
  function confirmer(remis) {
    var bloc = document.getElementById("confirmation");
    form.hidden = true;
    bloc.hidden = false;
    /* `remis` est faux quand la demande est partie par le client
       mail : le visiteur doit encore appuyer sur « envoyer ». */
    bloc.querySelector(".confirmation__note").hidden = remis;
    bloc.focus();
    bloc.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "center" });
  }

  function reduceMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function objet(v) {
    var qui = v.societe || v.prenom + " " + v.nom;
    return "Demande de devis — " + v.prestation + " — " + qui + " (" + v.ville + ")";
  }

  /* Repli sans service d'envoi : ouvre le client mail, demande rédigée. */
  function ouvrirMailto(v) {
    var lignes = Object.keys(LIBELLES).map(function (k) {
      return LIBELLES[k] + " : " + (v[k] || "—");
    });
    lignes.push("", "Accord donné pour le traitement de la demande.");
    window.location.href =
      "mailto:" +
      CONFIG.email +
      "?subject=" +
      encodeURIComponent(objet(v)) +
      "&body=" +
      encodeURIComponent(lignes.join("\n"));
  }

  /* ════════════════════════════════════════════════════════════
     Envoi
     ════════════════════════════════════════════════════════════ */
  var bouton = form.querySelector('button[type="submit"]');
  var retour = document.querySelector(".form__retour");

  function message(texte) {
    retour.innerHTML = "";
    if (!texte) return;
    var p = document.createElement("p");
    p.textContent = texte;
    retour.appendChild(p);
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (envoiEnCours) return;

    var v = valeurs();
    var erreurs = valider(v);

    if (Object.keys(erreurs).length) {
      afficherErreurs(erreurs);
      message("Certains champs doivent être complétés avant l'envoi.");
      var premier = form.querySelector("[aria-invalid='true']");
      if (premier && premier.focus) premier.focus();
      return;
    }

    afficherErreurs({});
    message("");

    /* Piège à robots : champ invisible resté vide et saisie d'au
       moins 2,5 s. On affiche la confirmation sans rien envoyer,
       pour ne rien apprendre au robot. */
    if (form.elements.site.value || Date.now() - debut < DELAI_MIN_MS) {
      confirmer(true);
      return;
    }

    /* Aucun service configuré : la demande part par le client mail. */
    if (!CONFIG.endpoint) {
      ouvrirMailto(v);
      confirmer(false);
      return;
    }

    envoiEnCours = true;
    bouton.disabled = true;
    bouton.querySelector(".btn__libelle").textContent = "Envoi en cours…";

    var corps = new FormData();
    Object.keys(v).forEach(function (k) {
      corps.append(k, v[k]);
    });
    corps.append("consentement", "on");
    fichiers.forEach(function (f) {
      corps.append("pieces", f);
    });

    /* Champs de service. `access_key` est requis par Web3Forms ;
       `subject` et `_subject` donnent un objet lisible à l'e-mail
       selon le fournisseur. Les autres les ignorent. */
    if (CONFIG.cleAcces) corps.append("access_key", CONFIG.cleAcces);
    corps.append("subject", objet(v));
    corps.append("_subject", objet(v));

    var echec = function () {
      envoiEnCours = false;
      bouton.disabled = false;
      bouton.querySelector(".btn__libelle").textContent = "Demander mon devis";
      message(
        "L'envoi a échoué. Écrivez-nous à " + CONFIG.email + " ou appelez le 07 84 96 23 28.",
      );
    };

    fetch(CONFIG.endpoint, {
      method: "POST",
      body: corps,
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        /* Les fournisseurs ne répondent pas tous en JSON : on lit ce
           qui vient sans faire échouer l'envoi sur une réponse vide. */
        return r.json().then(
          function (d) {
            return { ok: r.ok, data: d };
          },
          function () {
            return { ok: r.ok, data: null };
          },
        );
      })
      .then(function (res) {
        var refuse = res.data && (res.data.ok === false || res.data.success === false);
        if (!res.ok || refuse) {
          echec();
          return;
        }
        confirmer(true);
      })
      .catch(echec);
  });
})();
