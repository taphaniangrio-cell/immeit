# AUDIT COMPLET — SITE WWW.IMMEIT.COM
> Prompt d'injection pour éditeur IA (VSCode / OpenCode / Claude Code)
> Généré le : Juin 2026 | Version auditée : live sur immeit.com

---

## 0. CONTEXTE & MISSION

Tu travailles sur le site statique **IMMEIT** (`www.immeit.com`), une entreprise spécialisée en **méthodes de maintenance et performance industrielle**, basée au **Sénégal (Dakar)** et en **France (Paris)**. Le site est une **vitrine professionnelle** sans CMS, entièrement en **HTML/CSS/JS vanilla**, hébergé sur **Vercel**.

**Fondateur :** Yelli NIANG  
**Secteurs :** Industrie, tertiaire, résidentiel  
**Marchés :** Sénégal, France, Mali, Côte d'Ivoire  
**Partenaires :** P2M (p2m-icm.com), INDUSTRELEC (industrelec.com)

---

## 1. ARCHITECTURE DU SITE

### Pages existantes

| Fichier | URL | Statut |
|---|---|---|
| `index.html` | https://www.immeit.com/ | ✅ Principale |
| `methodes-maintenance.html` | https://www.immeit.com/methodes-maintenance.html | ✅ Active |
| `climatisation.html` | https://www.immeit.com/climatisation.html | ✅ Active |

### Pages manquantes (à créer)

| Fichier à créer | Priorité |
|---|---|
| `mentions-legales.html` | Haute (obligation légale) |
| `politique-confidentialite.html` | Haute (RGPD) |
| `sitemap.xml` | Haute (SEO) |
| `robots.txt` | Moyenne |
| `404.html` | Moyenne |
| Version anglaise (EN) de toutes les pages | Objectif futur |

---

## 2. STRUCTURE DÉTAILLÉE — `index.html`

### 2.1 Balises HEAD

```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="IMMEIT — Installation, Méthodes et Maintenance des Equipements Industriels et Tertiaires. Méthodes maintenance et performance industrielle, maintenance multi-technique, installation de climatisation. Basé à Dakar Sénégal et Paris France.">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="theme-color" content="#111927">

<!-- Open Graph -->
<meta property="og:title" content="IMMEIT — Installation, Méthodes et Maintenance des Equipements Industriels et Tertiaires">
<meta property="og:description" content="IMMEIT - Méthodes maintenance et performance industrielle, maintenance multi-technique, installation de climatisation. Basé à Dakar Sénégal et Paris France.">
<meta property="og:image" content="https://www.immeit.com/logo-immeit.jpeg">
<meta property="og:url" content="https://www.immeit.com">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="IMMEIT — Installation, Méthodes et Maintenance des Equipements Industriels et Tertiaires">
<meta name="twitter:description" content="IMMEIT - Méthodes maintenance et performance industrielle, maintenance multi-technique, installation de climatisation.">

<!-- Canonical -->
<link rel="canonical" href="https://www.immeit.com">

<title>IMMEIT — Installation, Méthodes et Maintenance des Equipements Industriels et Tertiaires</title>
```

**⚠️ Bug identifié :** `<meta name="csrf-token" content="">` présent mais vide — résidu à supprimer (inutile sur site statique).

### 2.2 Navigation principale (index.html)

```
Logo IMMEIT (lien vers /)
├── À propos      → #about
├── Services      → #services
├── Méthodologie  → #methodo
├── Piliers       → #piliers
├── Engagements   → #engagement
├── Pourquoi choisir IMMEIT ? → #why
└── Contact       → #contact
```

### 2.3 Sections de la page (dans l'ordre)

#### SECTION 1 — Hero (`#hero`)
- Image de fond : `indicateur-de-production.jpg` (⚠️ pas d'attribut `alt`)
- Bandeau partenaires : logos P2M et INDUSTRELEC
  - ⚠️ **Bug critique** : noms de fichiers avec espaces → `logo P2M.jpeg` et `logo INDUSTRELEC.jpeg` doivent être renommés en `logo-P2M.jpeg` et `logo-INDUSTRELEC.jpeg`
- Titre H1 : *"Méthodes fiables pour une production durable"*
- Sous-titre : *"IMMEIT est spécialisée dans la méthode maintenance et la performance industrielle..."*
- CTAs : `[Nous contacter → #contact]` `[Nos services → #services]`
- Compteurs animés (JS) : Clients accompagnés / Collaborateurs / Domaines d'expertise
  - ⚠️ Les valeurs finales **ne sont pas dans le HTML source** (valeur "0" visible sans JS)

#### SECTION 2 — À propos (`#about`)
- H2 : *"Expert en méthodes maintenance & performance industrielle"*
- Texte de présentation complète
- Image logo : `logo-immeit.jpeg` (alt="IMMEIT")
- Adresse : Cité Safco Niacoulrab, Villa N°40 – 11515 Keur Massar, Dakar – Sénégal
- Fondée en 2024 par Yelli NIANG
- Références grands groupes : Renault Group, Stellantis, Safran, SNCF, Keolis, Air Liquide, SUEZ, ICM Ingénierie

#### SECTION 3 — Services (`#services`)
- H2 : *"2 domaines d'activités"*
- Carte 1 : **Méthodes Maintenance & Performance Industrielle** → lien `methodes-maintenance.html`
- Carte 2 : **Climatisation** → lien `climatisation.html`

#### SECTION 4 — KPIs / Indicateurs
- H2 : *"Des résultats mesurables et concrets"*
- 4 compteurs % animés (JS) :
  - Taux de disponibilité
  - Réduction des coûts
  - Fiabilité améliorée
  - Satisfaction client
  - ⚠️ Valeurs affichées "0%" sans JS

#### SECTION 5 — Méthodologie (`#methodo`)
- H2 : *"Une approche structurée en 5 étapes"*
- Étape 01 : Analyser — *Analyse de criticité et hiérarchisation des actifs*
- Étape 02 : Stratégie — *Définition de stratégies de maintenance adaptées*
- Étape 03 : Optimiser — *Optimisation des plans et standards d'intervention*
- Étape 04 : Structurer — *Structuration des données techniques et déploiement GMAO*
- Étape 05 : Piloter — *Pilotage par indicateurs clairs et amélioration continue*
- Baseline : *"Performance opérationnelle durable, fiabilité des équipements et maîtrise des coûts"*

#### SECTION 6 — Piliers (`#piliers`)
- H2 : *"Nos 9 piliers d'accompagnement"*
1. Analyse & Diagnostic
2. Organisation & Processus
3. Politique de Maintenance Optimisée
4. Fiabilisation des Installations (AMDEC, RCM)
5. Digitalisation & GMAO
6. Schéma Directeur de Maintenance
7. Gestion des Pièces Stratégiques
8. Rechange & Maîtrise des Stocks Critiques (MTBF, MTTR)
9. Gestion de Projets & Investissements (CAPEX/OPEX)

#### SECTION 7 — Engagements (`#engagement`)
- H2 : *"Une collaboration fondée sur la confiance"*
- Tarifs compétitifs / Transparence totale / Réactivité / Suivi rigoureux

#### SECTION 8 — Pourquoi IMMEIT (`#why`)
- H2 : *"Pourquoi choisir IMMEIT ?"*
- 6 items numérotés (01–06) :
  1. Réduction des arrêts de production
  2. Amélioration de la disponibilité
  3. Optimisation des coûts de maintenance
  4. Renforcement de la sécurité
  5. Respect des obligations réglementaires
  6. Augmentation de la durée de vie
- ⚠️ **Bug contenu** : les items n'ont PAS de description/body — seulement des titres (contenu incomplet ou masqué par CSS)
- CTA : `[Nous contacter → #contact]`
- Banner CTA : *"Envie de performance ? Contactez-nous dès aujourd'hui pour un devis gratuit..."*

#### SECTION 9 — FAQ
- H2 : *"Questions fréquentes"*
- Q1 : Quels secteurs couvrez-vous ? → Industriel, tertiaire, résidentiel (grands comptes + PME + particuliers)
- Q2 : Intervenez-vous uniquement au Sénégal ? → Non, présents au Sénégal, France (Paris), Mali, Côte d'Ivoire
- Q3 : Proposez-vous des contrats de maintenance ? → Oui, préventive et corrective sur mesure
- Q4 : Quels logiciels GMAO maîtrisez-vous ? → Coswin, SAP, Maximo, CARL, DIMOMAINT

#### SECTION 10 — Témoignages
- H2 : *"Ils nous font confiance"*
- Témoignage 1 (RN — Responsable Maintenance, PME France) : *qualité de gestion des rapports, réactivité, travail à distance*
- Témoignage 2 (SB — Responsable Opérationnel France, P2M) : *optimisation du mode de fonctionnement, montée en compétences, fichiers de suivi*
- Témoignage 3 (MS — Responsable d'activités, PME France) : *appels d'offres, réduction des coûts, réactivité malgré la distance*

#### SECTION 11 — Contact (`#contact`)
- H2 : *"Une question, un projet ?"*
- Tel Sénégal : +221 71 033 88 09 → `tel:+221710338809`
- Tel France : +33 7 54 01 19 45 → `tel:+33754011945`
- Email : contact@immeit.com
- **Formulaire de contact** :
  - Prénom * (requis)
  - Nom * (requis)
  - Email * (requis)
  - Téléphone (optionnel)
  - Sujet * (requis)
  - Message * (requis) + compteur de caractères (2000 max, JS)
  - Bouton : "Envoyer"
  - ⚠️ Backend inconnu dans le code source (Formspree ou Nodemailer — à vérifier)

### 2.4 Footer

```
Logo IMMEIT
Navigation : À propos | Services | Méthodologie | Piliers | Engagements
  ⚠️ MANQUE : "Contact" et "Pourquoi choisir IMMEIT" dans le footer nav

Réseaux : LinkedIn | WhatsApp (wa.me/221710338809)
© 2026 IMMEIT
```

---

## 3. STRUCTURE DÉTAILLÉE — `methodes-maintenance.html`

### 3.1 HEAD
- Title : `Méthodes Maintenance & Performance - IMMEIT`
- Meta description : `IMMEIT - Méthodes Maintenance & Performance industrielle`
- ⚠️ **MANQUE** : OG tags, Twitter card, canonical, favicon

### 3.2 Navigation
```
Logo IMMEIT (→ index.html)
├── Accueil     → index.html#hero
├── À propos    → index.html#about
├── Services    → index.html#services
├── Méthodologie → index.html#methodo
├── Piliers     → index.html#piliers
├── Engagements → index.html#engagement
└── Contact     → index.html#contact
```

⚠️ Usage de `index.html#hero` au lieu de `/#hero` — à normaliser.

### 3.3 Contenu

**Introduction :** Présentation de la spécialité méthodes maintenance et performance industrielle.

**8 catégories de services détaillés :**

1. **Audit & Amélioration des Performances**
   - Étude de fiabilisation, analyse de performance, audit qualité des processus

2. **Maintenance Préventive & Stratégie**
   - Plannings maintenance préventive/réglementaire, gammes de maintenance, AMDEC, politique de maintenance

3. **Indicateurs & Pilotage de la maintenance**
   - KPI, tableaux de bord, bilans mensuels/bimestriels/annuels

4. **GMAO & Gestion des données**
   - Analyse données GMAO, déploiement GMAO, structures équipements, ordres de travail, analyse Excel

5. **Gestion Technique & Documentaire**
   - Documents techniques, GED, obsolescence, stocks pièces de rechange, pièces stratégiques

6. **Organisation & Documentation**
   - Processus maintenance, cahiers des charges, appels d'offres

7. **Qualité & HSE**
   - Documents uniques, audits HSE, métrologie, rapports de maintenance, analyses de risques prestataires

8. **Formation & Gestion de Projet**
   - Formations : Méthodes Maintenance, GMAO, stocks, KPI, Pack Office
   - Suivi projets ICM (distance ou site) typologies A, B, C, D, E

**Outils maîtrisés :**

| Catégorie | Logiciels |
|---|---|
| GMAO | Coswin 8i, Compas R3, Maximo, CARL, SAP, DIMOMAINT |
| Plan de Prévention | GERICO, APEX |
| Gestion Documentaire | Docinfo, GED, ADVESO |

---

## 4. STRUCTURE DÉTAILLÉE — `climatisation.html`

### 4.1 HEAD
- Title : `Climatisation - IMMEIT`
- Meta description : `IMMEIT - Climatisation industrielle, tertiaire et résidentielle`
- ⚠️ **MANQUE** : OG tags, Twitter card, canonical, favicon

### 4.2 Navigation
Identique à methodes-maintenance.html (liens vers index.html#sections)

### 4.3 Contenu

**Introduction :** Vente, installation, maintenance préventive et corrective de systèmes de climatisation (industriel, tertiaire, résidentiel)

**4 services :**
1. **Vente** — Climatiseurs adaptés aux besoins et à l'environnement
2. **Installation & Mise en service** — Pose pro, tests de performance, respect des normes
3. **Maintenance Préventive** — Entretien, nettoyage, contrôle fluides, prolongation durée de vie
4. **Maintenance Corrective** — Dépannage rapide, SAV inclus, intervention sous 24h

**5 avantages :**
- Confort thermique optimal toute l'année
- Réduction des consommations énergétiques
- Amélioration de la fiabilité des équipements
- Diminution des coûts de maintenance
- Accompagnement technique personnalisé

⚠️ **Page très courte** — pas de CTA de contact, pas de formulaire, pas de lien retour vers index, pas de footer visible.

---

## 5. INVENTAIRE DES FICHIERS MÉDIAS

| Fichier | Usage | Problème |
|---|---|---|
| `indicateur-de-production.jpg` | Hero background index.html | Alt manquant |
| `logo-immeit.jpeg` | Logo header, about, footer | Alt générique "IMMEIT" |
| `logo P2M.jpeg` | Partenaire | ⚠️ Espace dans le nom — à renommer en `logo-P2M.jpeg` |
| `logo INDUSTRELEC.jpeg` | Partenaire | ⚠️ Espace dans le nom — à renommer en `logo-INDUSTRELEC.jpeg` |

---

## 6. BUGS ET PROBLÈMES IDENTIFIÉS

### 🔴 CRITIQUES

| ID | Problème | Fichier | Correction |
|---|---|---|---|
| BUG-01 | Noms de fichiers avec espaces (`logo P2M.jpeg`, `logo INDUSTRELEC.jpeg`) | index.html | Renommer en `logo-P2M.jpeg` et `logo-INDUSTRELEC.jpeg`, mettre à jour les `src` |
| BUG-02 | Meta `csrf-token` vide et inutile sur site statique | index.html | Supprimer la balise |
| BUG-03 | Valeurs des compteurs animés absentes du HTML (affichent "0" sans JS) | index.html | Ajouter les valeurs finales en `data-target` ou fallback statique |
| BUG-04 | Section `#why` : 6 items sans description/corps de texte | index.html | Ajouter le contenu descriptif sous chaque titre |

### 🟠 IMPORTANTS

| ID | Problème | Fichier | Correction |
|---|---|---|---|
| BUG-05 | Balises OG / Twitter Card absentes | methodes-maintenance.html, climatisation.html | Ajouter les meta complètes |
| BUG-06 | Canonical manquant | methodes-maintenance.html, climatisation.html | Ajouter `<link rel="canonical">` |
| BUG-07 | Favicon non détecté | Tous | Vérifier/ajouter `<link rel="icon">` |
| BUG-08 | URL navigation avec `index.html#section` au lieu de `/#section` | methodes-maintenance.html, climatisation.html | Normaliser les hrefs |
| BUG-09 | Footer incomplet : liens "Contact" et "Pourquoi choisir IMMEIT" manquants | index.html | Ajouter les ancres manquantes |
| BUG-10 | `climatisation.html` sans CTA, sans footer, sans lien de retour | climatisation.html | Ajouter footer standard et CTA |

### 🟡 MINEURS / AMÉLIORATIONS

| ID | Problème | Fichier | Recommandation |
|---|---|---|---|
| IMP-01 | Alt text insuffisants (`alt="IMMEIT"` répété) | index.html | Contextualiser les alts |
| IMP-02 | Pas de `loading="lazy"` sur les images | Tous | Ajouter pour performances |
| IMP-03 | LinkedIn URL avec caractères accentués non encodés | index.html | Encoder ou utiliser un href simplifié |
| IMP-04 | Pas de sitemap.xml | Racine | Créer et soumettre à Google Search Console |
| IMP-05 | Pas de robots.txt | Racine | Créer avec règles minimales |
| IMP-06 | Pas de mentions légales | Racine | Créer `mentions-legales.html` |
| IMP-07 | Pas de politique de confidentialité | Racine | Créer pour conformité RGPD |
| IMP-08 | Format image `.jpeg` pour logo — poids inconnu | — | Convertir en WebP pour perf |
| IMP-09 | `methodes-maintenance.html` sans footer visible | methodes-maintenance.html | Ajouter footer standard |
| IMP-10 | Formulaire sans fallback non-JS | index.html | Vérifier accessibilité form sans JS |
| IMP-11 | Pas de `hreflang` pour version bilingue FR/EN | Tous | Préparer structure bilingue |
| IMP-12 | Responsive design : vérifier breakpoints mobile | Tous | Tests sur 320px, 375px, 768px |

---

## 7. ÉTAT SEO

| Critère | Statut |
|---|---|
| Title tag | ✅ index.html — ⚠️ trop générique sur subpages |
| Meta description | ✅ index.html — ⚠️ basique sur subpages |
| Canonical | ✅ index.html — ❌ absent sur subpages |
| OG tags complets | ✅ index.html — ❌ absents sur subpages |
| Twitter card | ✅ index.html — ❌ absente sur subpages |
| H1 unique par page | ✅ chaque page a un H1 |
| Structure de liens internes | ⚠️ subpages ne renvoient pas vers d'autres subpages |
| sitemap.xml | ❌ À créer |
| robots.txt | ❌ À vérifier |
| Performance images | ⚠️ Pas de WebP, pas de lazy loading |
| HTTPS | ✅ |

---

## 8. IDENTITÉ VISUELLE & DESIGN

### Couleurs (extraites des meta)
- Couleur principale / fond sombre : `#111927` (theme-color)
- (Les autres couleurs CSS sont à extraire du fichier CSS source)

### Typographie
- À extraire du CSS source

### Ton éditorial
- Professionnel, expert, structuré
- Vocabulaire technique industriel (GMAO, AMDEC, RCM, MTBF, MTTR, CAPEX/OPEX)
- Première personne du pluriel (nous)

### Logo
- Fichier : `logo-immeit.jpeg`
- Format texte : "IMMEIT" + "Installation, Méthodes et Maintenance des Equipements Industriels et Tertiaires"

---

## 9. CONTACTS & COORDONNÉES OFFICIELLES

```
Nom commercial  : IMMEIT
Nom complet     : Installation, Méthodes et Maintenance des Equipements Industriels et Tertiaires
Fondateur       : Yelli NIANG
Fondée          : 2024

Siège social    : Cité Safco Niacoulrab, Villa N°40
                  11515 Keur Massar, Dakar – Sénégal

Tél Sénégal     : +221 71 033 88 09
Tél France      : +33 7 54 01 19 45
Email           : contact@immeit.com
Site            : https://www.immeit.com

LinkedIn        : https://www.linkedin.com/company/immeit-installation-méthodes-maintenance-des-équipements-industriels-et-tertiaires/
WhatsApp        : https://wa.me/221710338809

Présence géo    : Sénégal (siège), France (Paris), Mali, Côte d'Ivoire
```

---

## 10. INSTRUCTIONS POUR L'ÉDITEUR IA

### Règles générales
- Le site est en **HTML/CSS/JS vanilla** — ne pas introduire de framework (React, Vue, etc.)
- Respecter la **structure de fichiers existante** (pas de dossier src/, pas de build)
- Le déploiement est sur **Vercel** — les chemins relatifs doivent fonctionner en production
- La langue principale est le **français** — conserver le registre professionnel
- Ne jamais modifier les **coordonnées officielles** sans confirmation explicite
- Les images sont à la **racine du projet** — pas de sous-dossier `/images/` sans migration complète

### Règles de modification
- Avant toute modification d'un fichier, lire l'intégralité du fichier source
- Toujours corriger `logo P2M.jpeg` → `logo-P2M.jpeg` et `logo INDUSTRELEC.jpeg` → `logo-INDUSTRELEC.jpeg`
- Toujours vérifier que les compteurs animés ont des `data-target` ou équivalent en fallback
- Tester mentalement chaque lien avant de valider : `#anchor` vs `page.html#anchor` vs `/page#anchor`
- Ne pas supprimer de sections sans confirmation explicite

### Ordre de priorité pour les corrections
1. BUG-01 : Renommer fichiers médias avec espaces
2. BUG-02 : Supprimer meta csrf-token
3. BUG-05/06 : Ajouter OG + canonical sur subpages
4. BUG-04 : Compléter section #why avec descriptions
5. BUG-09/10 : Compléter footer sur toutes les pages
6. IMP-01 à IMP-12 : Améliorations progressives

### Pour les nouvelles pages à créer
- Utiliser `index.html` comme base de structure (header, nav, footer identiques)
- Adapter les liens de navigation vers `/#section` (racine, pas `index.html#`)
- Ajouter OG, Twitter card, canonical dès la création
- Inclure footer complet avec liens, réseaux sociaux et copyright

---

*Fin de l'audit — Référence complète pour travaux sur www.immeit.com*
