# Règles proposées pour la mémoire du projet SantéClair

Rien n'est construit dans cette étape. Voici les règles que je propose d'ajouter
au fichier de connaissances (`mem://index.md` + fichiers détaillés). Chaque règle
sera enregistrée une fois le plan approuvé. Au moins six règles, dont les quatre
obligatoires demandées (français, monnaie, téléphone, « ne casse rien »).

## 1. Langue : français obligatoire (Core)

Toute l'interface, les messages d'erreur, les toasts, les prompts envoyés à
l'IA et les commentaires de code sont en **français**. Accepter les accents
(é, è, à, ç, œ). Ne jamais introduire de texte en anglais visible par
l'utilisateur. Les exceptions : identifiants techniques, noms de paquets,
clés JSON et code d'API restent en ASCII/anglais.

## 2. Monnaie : aucune fonctionnalité de paiement (Core)

L'application n'a **aucun système de paiement ni de prix**. Ne jamais inventer
ni afficher de montant ou de devise. Si, un jour, une somme doit être
affichée, utiliser la **gourde haïtienne (HTG, symbole « G »)** comme devise
par défaut (public cible principal : Haïti), avec format `1 000 G`. Toute autre
devise doit être explicitement précisée et justifiée.

## 3. Téléphone : numéros d'urgence (Core)

Numéros d'urgence de référence (configurés dans `src/config/santeclair.ts`,
section `urgences`) :
- Haïti : **114** (Ambulance nationale) — public principal
- France : 15 (SAMU)
- Europe : 112
- États-Unis / Canada : 911

Les numéros sont rendus cliquables via `tel:` sans espaces. Ne pas ajouter de
fonctionnalité SMS, d'appel VoIP ou de messagerie. En cas de signe d'urgence
détecté (triage), l'application **bloque l'analyse IA** et oriente vers l'appel
direct des secours.

## 4. « Ne casse rien » (Core)

Ne jamais casser : le build, le typage (`tsgo`), les routes existantes, le
système d'authentification Supabase, ni une migration déjà appliquée. Préserver
le routage **TanStack Router** (jamais `react-router-dom`, `BrowserRouter` ni
`src/App.tsx`). Préserver le middleware d'auth (`src/start.ts`) et les
fichiers auto-générés Supabase. Toute modification d'un fichier existant doit
laisser le projet compiler et toutes les pages répondre (200).

## 5. Design : thème vert & blanc (Core)

Thème vert & blanc, couleurs en **oklch** (tokens dans `src/styles.css`),
cartes arrondies (`rounded-3xl`), dégradés `fond-doux` / `fond-primaire`, ombre
`ombre-douce`, logo plante animé (`logo-anime`, respectant `prefers-reduced-motion`).
**Interdire** le violet/indigo, les dégradés génériques « AI » sur blanc, et les
polices par défaut Inter/Poppins. Couleur primaire : vert (`--primary`). Toujours
utiliser les tokens sémantiques, jamais de couleurs codées en dur.

## 6. Confidentialité & données de santé (Core)

Les **symptômes ne sont jamais inscrits dans les journaux** techniques. Une
évaluation n'est enregistrée en base que si l'utilisateur a donné son
**consentement explicite** (interrupteur « J'accepte… »). RLS strict : un
utilisateur n'accède qu'à ses propres données. La **Mention Médicale**
(`avertissement`) doit apparaître sur toutes les pages d'analyse et de résultat.
L'utilisateur peut supprimer son historique et son compte à tout moment.

## 7. Analyse IA : orientation prudente, jamais un diagnostic (Core)

L'IA fournit une **orientation générale**, jamais un diagnostic, un dosage ou
une prescription de médicament. Réponse structurée en quatre statuts :
`complete`, `needs_more_info`, `urgent`, `error`. Détection des signes d'urgence
**avant** l'analyse IA (côté client et serveur). Questions de suivi : **maximum
3**, avec logique anti-boucle (jamais reposer la même question deux fois, ne pas
dépasser l'itération 1). Délai maximal d'analyse : **60 s** avec annulation
possible.

## 8. Limites anti-abus (Core)

Limites par utilisateur : **8 analyses par heure**, **25 par jour** (table
`analysis_usage`). Désactiver le bouton pendant l'analyse, empêcher les doubles
soumissions (ref `requeteEnCours`), fournir un bouton d'annulation. Longueurs
max : symptômes 1500 caractères, texte libre 500.

---

## Étape suivante (après approbation)

Enregistrer ces huit règles dans la mémoire du projet :
- Créer `mem://index.md` avec une section **Core** (les huit règles en une ligne)
  et une section **Memories** pointant vers les fichiers détaillés.
- Créer les fichiers détaillés : `mem://design/theme`, `mem://features/analyse-ia`,
  `mem://features/confidentialite`, `mem://features/urgences`, `mem://constraints/ne-casse-rien`.

Aucun fichier source ne sera modifié.
