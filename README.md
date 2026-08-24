# Santé Conseils Pratiques

Construis directement, en une seule génération, une application web fonctionnelle nommée provisoirement « SantéClair ». Ne me pose pas de questions et ne consomme pas de crédits à expliquer un plan, sauf si une information technique indispensable manque réellement.

OBJECTIF
Créer une application gratuite permettant à l’utilisateur de décrire un ou plusieurs symptômes et de recevoir une pré-évaluation prudente de son état, des conseils pratiques et une orientation vers le professionnel approprié. L’application ne doit jamais se présenter comme un médecin ni promettre un diagnostic certain.

FONCTIONS PRINCIPALES

Une page d’accueil complète expliquant clairement :

ce que fait l’application ;

ses avantages ;

ses limites médicales ;

la protection des données ;

un bouton « Commencer mon évaluation ».

Une authentification sécurisée avec :

connexion par Google ;

inscription et connexion par adresse e-mail et mot de passe ;

récupération du mot de passe ;

déconnexion ;

utilisation de Supabase Auth ou de la solution gratuite la plus simple compatible avec Lovable.

Un tableau de bord permettant de saisir :

un ou plusieurs symptômes ;

la durée, l’intensité et l’évolution ;

l’âge ;

les antécédents, allergies et médicaments, uniquement si l’utilisateur souhaite les indiquer ;

des réponses à quelques questions complémentaires pertinentes.

Après analyse, afficher :

un résumé clair des symptômes ;

le niveau d’urgence : faible, modéré, urgent ou urgence immédiate ;

les causes possibles, toujours présentées comme des hypothèses et jamais comme un diagnostic ;

ce que l’utilisateur peut faire maintenant sans danger ;

le type de professionnel à consulter ;

les signes qui doivent pousser à consulter rapidement ;

une indication claire lorsque les informations sont insuffisantes ou que la réponse n’est pas fiable.

SÉCURITÉ MÉDICALE OBLIGATOIRE
Effectue d’abord une détection des signes d’urgence avant toute analyse par intelligence artificielle. En cas de douleur thoracique importante, difficulté respiratoire, perte de connaissance, signes d’AVC, saignement grave, réaction allergique sévère, convulsions, idées suicidaires ou autre danger immédiat, affiche une alerte très visible conseillant d’appeler les services d’urgence locaux ou de se rendre immédiatement à l’hôpital.

Ne prescris aucun médicament, ne modifie aucun traitement et ne donne aucun dosage personnalisé. Pour les enfants, les femmes enceintes, les personnes âgées ou les personnes présentant une maladie chronique grave, recommande plus rapidement une consultation médicale.

Si le système ne sait pas, affiche clairement : « Je ne peux pas évaluer cette situation de manière suffisamment fiable. Veuillez consulter un professionnel de santé. »

Ajoute sur toutes les pages d’analyse : « Cette application fournit une orientation générale et ne remplace pas un diagnostic, une consultation ou un traitement médical. »

INTERFACE
Créer une interface moderne, rassurante, intuitive et compréhensible par tous :

tableau de bord complet ;

vert et blanc comme couleurs principales ;

dégradés doux ;

cartes arrondies, icônes simples et excellente lisibilité ;

conception d’abord pour téléphone, puis adaptation aux tablettes et ordinateurs ;

navigation claire et gros boutons ;

accessibilité : contraste suffisant, tailles de texte lisibles et navigation au clavier.

Créer un logo original représentant une plante verte qui tourne doucement sur elle-même. L’animation doit être visible dans l’en-tête et sur la page d’accueil, mais désactivée automatiquement lorsque l’utilisateur préfère réduire les animations.

PRÉSENTATION DU TABLEAU DE BORD
Inclure :

« Nouvelle évaluation » ;

« Mes évaluations précédentes » ;

« Conseils de prévention » ;

« Mon profil » ;

« Confidentialité et suppression de mes données ».

PRIVACITÉ ET SÉCURITÉ TECHNIQUE

Ne jamais écrire de clé secrète dans le code côté client.

Utiliser des variables d’environnement et une fonction serveur sécurisée pour l’analyse.

Ne jamais enregistrer les mots de passe directement.

Protéger chaque compte avec des règles d’accès strictes : un utilisateur ne peut voir que ses propres données.

Valider et nettoyer toutes les entrées.

Ajouter une limitation du nombre de requêtes pour éviter les abus.

Ne pas inscrire les symptômes ou données médicales dans les journaux techniques.

Demander le consentement avant d’enregistrer une évaluation.

Permettre à l’utilisateur de supprimer définitivement son historique et son compte.

Si le service d’analyse n’est pas configuré, ne produis pas de faux résultat : affiche une erreur claire et explique à l’administrateur comment ajouter la clé secrète.

ORGANISATION DU CODE
Regroupe dans un fichier de configuration clairement identifié tous les éléments facilement modifiables : nom, logo, couleurs, textes principaux, limites d’utilisation et coordonnées d’urgence. Utilise des composants réutilisables et une structure simple à maintenir.

Prévois tous les états : chargement, aucune donnée, erreur, perte de connexion, analyse indisponible et session expirée. Tous les textes visibles doivent être en français.

Construis maintenant l’application complète, avec les pages, la navigation, l’authentification, la base de données sécurisée, le tableau de bord et des données de démonstration clairement identifiées. Utilise autant que possible les offres gratuites et évite toute dépendance payante obligatoire.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8c00d7aa-2ebf-4c9d-b66a-65badde69287).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
