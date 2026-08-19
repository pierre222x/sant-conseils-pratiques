/**
 * Détection des signes d'urgence (règles simples, exécutées AVANT toute analyse
 * par intelligence artificielle, côté client et côté serveur).
 */

export type DrapeauRouge = {
  cle: string;
  libelle: string;
  consigne: string;
};

const REGLES: { cle: string; libelle: string; consigne: string; motifs: RegExp }[] = [
  {
    cle: "thorax",
    libelle: "Douleur thoracique importante",
    consigne:
      "Une douleur dans la poitrine, dans le bras gauche ou la mâchoire peut signaler un problème cardiaque.",
    motifs:
      /(douleur|serrement|oppression|poids|brulure)[^.]{0,40}(thorax|poitrine|thoracique|cardiaque|coeur|cœur)|angine de poitrine|infarctus|crise cardiaque/i,
  },
  {
    cle: "respiration",
    libelle: "Difficulté respiratoire",
    consigne: "Une gêne à respirer, des lèvres bleues ou une respiration très rapide sont des urgences.",
    motifs:
      /(difficulte|difficulté|mal|gene|gêne|peine)[^.]{0,25}(respir|souffl)|essouffle|etouffe|étouffe|suffoque|detresse respiratoire|détresse respiratoire|asphyxie|levres bleues|lèvres bleues|cyanose/i,
  },
  {
    cle: "conscience",
    libelle: "Perte de connaissance",
    consigne: "Une syncope, un coma ou une confusion brutale nécessitent une prise en charge immédiate.",
    motifs:
      /perte de (connaissance|conscience)|evanoui|évanoui|syncope|inconscient|coma|ne repond plus|ne répond plus/i,
  },
  {
    cle: "avc",
    libelle: "Signes d'accident vasculaire cérébral (AVC)",
    consigne:
      "Bouche déviée, faiblesse d'un côté du corps, trouble soudain de la parole ou de la vue : chaque minute compte.",
    motifs:
      /avc|attaque cerebrale|attaque cérébrale|paralysie|hemiplegie|hémiplégie|bouche (deviee|déviée|tordue)|(trouble|perte)[^.]{0,25}(parole|vue|vision)|(faiblesse|engourdissement)[^.]{0,30}(cote|côté|bras|jambe|visage)|aphasie|parle difficilement/i,
  },
  {
    cle: "hemorragie",
    libelle: "Saignement grave",
    consigne: "Un saignement abondant qui ne s'arrête pas doit être pris en charge en urgence.",
    motifs:
      /hemorragie|hémorragie|saign[^.]{0,30}(abondant|important|arrete pas|arrête pas|beaucoup|massif)|vomi[^.]{0,15}sang|sang dans (les selles|les vomissements|l'urine)|selles noires/i,
  },
  {
    cle: "allergie",
    libelle: "Réaction allergique sévère",
    consigne: "Gonflement du visage ou de la gorge, urticaire généralisée : risque de choc anaphylactique.",
    motifs:
      /anaphyla|choc allergique|(gonflement|oedeme|œdème|enfle)[^.]{0,30}(gorge|langue|visage|levres|lèvres)|quincke|allergie (grave|severe|sévère)/i,
  },
  {
    cle: "convulsions",
    libelle: "Convulsions",
    consigne: "Une crise convulsive, surtout si elle se prolonge ou se répète, est une urgence.",
    motifs: /convuls|crise d'epilepsie|crise d'épilepsie|epileptique|épileptique|spasmes generalises|tremblements incontrolables/i,
  },
  {
    cle: "psy",
    libelle: "Idées suicidaires ou détresse psychique aiguë",
    consigne:
      "Vous n'êtes pas seul(e). Contactez immédiatement les urgences ou une ligne d'écoute, et restez accompagné(e).",
    motifs:
      /suicid|me tuer|mettre fin a mes jours|mettre fin à mes jours|envie de mourir|automutil|me faire du mal|plus envie de vivre/i,
  },
  {
    cle: "traumatisme",
    libelle: "Traumatisme ou intoxication grave",
    consigne: "Chute grave, choc à la tête, brûlure étendue, empoisonnement : appelez les secours.",
    motifs:
      /intoxication|empoisonn|overdose|brulure (grave|etendue|étendue|au 3|troisieme degre)|brûlure (grave|étendue)|accident de (voiture|moto|circulation)|traumatisme cranien|traumatisme crânien|noyade|electrocut|électrocut/i,
  },
  {
    cle: "fievre-bebe",
    libelle: "Fièvre chez un nourrisson",
    consigne: "Une fièvre chez un bébé de moins de 3 mois nécessite un avis médical immédiat.",
    motifs: /(nourrisson|bebe|bébé|nouveau-ne|nouveau-né)[^.]{0,40}(fievre|fièvre|41|40)/i,
  },
];

/** Groupes nécessitant une orientation médicale plus rapide. */
export const GROUPES_SENSIBLES = [
  "enfant",
  "grossesse",
  "personne-agee",
  "maladie-chronique",
  "immunodeprime",
] as const;
export type GroupeSensible = (typeof GROUPES_SENSIBLES)[number];

export const LIBELLES_GROUPES: Record<GroupeSensible, string> = {
  enfant: "Enfant de moins de 12 ans",
  grossesse: "Grossesse ou allaitement",
  "personne-agee": "Personne de plus de 70 ans",
  "maladie-chronique": "Maladie chronique grave (diabète, cœur, rein, cancer…)",
  immunodeprime: "Immunité affaiblie",
};

export function detecterUrgences(texte: string): DrapeauRouge[] {
  const contenu = (texte ?? "").toLowerCase();
  if (!contenu.trim()) return [];
  return REGLES.filter((r) => r.motifs.test(contenu)).map(({ cle, libelle, consigne }) => ({
    cle,
    libelle,
    consigne,
  }));
}

export function estGroupeSensible(age: number | null, groupes: string[]): boolean {
  if (groupes.length > 0) return true;
  if (age === null || Number.isNaN(age)) return false;
  return age < 12 || age > 70;
}
