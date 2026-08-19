/**
 * Configuration centrale de l'application.
 * Modifiez ce fichier pour changer le nom, les textes, les limites ou les
 * numéros d'urgence sans toucher au reste du code.
 */

export const APP_CONFIG = {
  nom: "SantéClair",
  slogan: "Comprendre vos symptômes, en toute prudence.",
  description:
    "SantéClair vous aide à décrire vos symptômes et vous propose une orientation générale, prudente et gratuite vers le bon professionnel de santé.",

  /** Limites d'utilisation (anti-abus) */
  limites: {
    analysesParHeure: 8,
    analysesParJour: 25,
    longueurMaxSymptomes: 1500,
    longueurMaxTexteLibre: 500,
  },

  /** Coordonnées d'urgence — à adapter à votre pays */
  urgences: [
    { pays: "Haïti", numero: "114", libelle: "Ambulance nationale" },
    { pays: "France", numero: "15", libelle: "SAMU" },
    { pays: "Europe", numero: "112", libelle: "Numéro d'urgence européen" },
    { pays: "États-Unis / Canada", numero: "911", libelle: "Urgences" },
  ],

  /** Mention légale affichée sur toutes les pages d'analyse */
  avertissement:
    "Cette application fournit une orientation générale et ne remplace pas un diagnostic, une consultation ou un traitement médical.",

  messageNonFiable:
    "Je ne peux pas évaluer cette situation de manière suffisamment fiable. Veuillez consulter un professionnel de santé.",

  /** Texte affiché à l'administrateur si le service d'analyse n'est pas configuré */
  messageServiceNonConfigure:
    "Le service d'analyse n'est pas configuré. Administrateur : ajoutez la clé secrète LOVABLE_API_KEY dans les variables d'environnement du projet, puis republiez l'application.",
} as const;

export type NiveauUrgence = "faible" | "modere" | "urgent" | "immediate";

export const NIVEAUX_URGENCE: Record<
  NiveauUrgence,
  { libelle: string; description: string; classe: string }
> = {
  faible: {
    libelle: "Urgence faible",
    description: "Situation qui peut probablement être suivie à domicile, avec vigilance.",
    classe: "bg-urgence-faible text-urgence-faible-foreground",
  },
  modere: {
    libelle: "Urgence modérée",
    description: "Une consultation dans les prochains jours est conseillée.",
    classe: "bg-urgence-modere text-urgence-modere-foreground",
  },
  urgent: {
    libelle: "Urgent",
    description: "Consultez un professionnel de santé aujourd'hui même.",
    classe: "bg-urgence-urgent text-urgence-urgent-foreground",
  },
  immediate: {
    libelle: "Urgence immédiate",
    description: "Appelez les services d'urgence ou rendez-vous à l'hôpital immédiatement.",
    classe: "bg-urgence-immediate text-urgence-immediate-foreground",
  },
};

/** Conseils de prévention (contenu éditorial modifiable) */
export const CONSEILS_PREVENTION = [
  {
    titre: "Hydratation quotidienne",
    texte:
      "Buvez de l'eau régulièrement dans la journée, surtout par forte chaleur, en cas de fièvre ou d'effort physique.",
  },
  {
    titre: "Sommeil réparateur",
    texte:
      "Visez des horaires de coucher réguliers. Un sommeil insuffisant affaiblit les défenses immunitaires.",
  },
  {
    titre: "Hygiène des mains",
    texte:
      "Lavez-vous les mains à l'eau et au savon avant les repas et après les transports ou les soins.",
  },
  {
    titre: "Bouger chaque jour",
    texte:
      "Trente minutes de marche par jour réduisent le risque cardiovasculaire et améliorent l'humeur.",
  },
  {
    titre: "Alimentation variée",
    texte:
      "Privilégiez fruits, légumes, légumineuses et céréales complètes. Limitez le sel, le sucre et l'alcool.",
  },
  {
    titre: "Suivi médical régulier",
    texte:
      "Faites contrôler tension, glycémie et vue régulièrement, surtout après 40 ans ou en cas de maladie chronique.",
  },
];

/** Évaluations de démonstration affichées quand l'historique est vide */
export const EVALUATIONS_DEMO = [
  {
    id: "demo-1",
    resume: "Maux de gorge et fièvre légère depuis 2 jours",
    urgence: "faible" as NiveauUrgence,
    professionnel: "Médecin généraliste ou pharmacien",
    created_at: "2026-01-12T10:00:00.000Z",
  },
  {
    id: "demo-2",
    resume: "Douleur abdominale persistante avec vomissements depuis 24 h",
    urgence: "urgent" as NiveauUrgence,
    professionnel: "Service d'urgences ou médecin généraliste le jour même",
    created_at: "2026-01-08T18:30:00.000Z",
  },
];
