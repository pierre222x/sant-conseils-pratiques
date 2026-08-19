import type { AnalyseResultat } from "./analyse.types";
import type { NiveauUrgence } from "@/config/santeclair";

export function construirePrompt(groupeSensible: boolean): string {
  return `Tu es un assistant d'orientation santé prudent, en français. Tu N'ES PAS médecin et tu ne poses JAMAIS de diagnostic.
Règles absolues :
- Ne prescris aucun médicament, aucun dosage, aucune modification de traitement.
- Présente toujours les causes comme des hypothèses possibles, jamais comme un diagnostic.
- Ne donne que des conseils sans danger (repos, hydratation, surveillance, quand consulter).
- Si les informations sont insuffisantes ou ambiguës, mets "fiable": false.
${groupeSensible ? '- Le patient appartient à un groupe sensible (enfant, grossesse, personne âgée, maladie chronique) : recommande une consultation médicale plus rapidement et augmente le niveau d\'urgence si nécessaire.' : ""}
Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, au format :
{"resume": string, "urgence": "faible"|"modere"|"urgent"|"immediate", "causes": string[], "conseils": string[], "professionnel": string, "signesAlerte": string[], "fiable": boolean}
Tous les textes doivent être en français, clairs et compréhensibles par tous.`;
}

const URGENCES: NiveauUrgence[] = ["faible", "modere", "urgent", "immediate"];

export function parserReponseIA(contenu: string, groupeSensible: boolean): AnalyseResultat {
  const match = contenu.match(/\{[\s\S]*\}/);
  if (!match) {
    return { statut: "erreur", message: "La réponse du service d'analyse est illisible. Veuillez réessayer." };
  }
  let brut: Record<string, unknown>;
  try {
    brut = JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return { statut: "erreur", message: "La réponse du service d'analyse est illisible. Veuillez réessayer." };
  }

  const liste = (valeur: unknown): string[] =>
    Array.isArray(valeur) ? valeur.filter((v): v is string => typeof v === "string").slice(0, 8) : [];

  const urgenceBrute = typeof brut["urgence"] === "string" ? (brut["urgence"] as string) : "faible";
  let urgence: NiveauUrgence = URGENCES.includes(urgenceBrute as NiveauUrgence)
    ? (urgenceBrute as NiveauUrgence)
    : "modere";
  if (groupeSensible && urgence === "faible") urgence = "modere";

  const resume = typeof brut["resume"] === "string" ? brut["resume"] : "";
  const fiable = brut["fiable"] !== false && resume.length > 0;

  return {
    statut: "ok",
    resume,
    urgence,
    causes: liste(brut["causes"]),
    conseils: liste(brut["conseils"]),
    professionnel:
      typeof brut["professionnel"] === "string" && brut["professionnel"].length > 0
        ? brut["professionnel"]
        : "Médecin généraliste",
    signesAlerte: liste(brut["signesAlerte"]),
    fiable,
  };
}
