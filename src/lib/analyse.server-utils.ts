import type { AnalyseResultat } from "./analyse.types";
import type { NiveauUrgence } from "@/config/santeclair";

export function construirePrompt(groupeSensible: boolean): string {
  return `Tu es un assistant d'orientation santé prudent, en français. Tu N'ES PAS médecin et tu ne poses JAMAIS de diagnostic.
Règles absolues :
- Ne prescris aucun médicament, aucun dosage, aucune modification de traitement.
- Présente toujours les causes comme des hypothèses possibles, jamais comme un diagnostic.
- Ne donne que des conseils sans danger (repos, hydratation, surveillance, quand consulter).
- Une certitude diagnostique n'est PAS nécessaire : dès qu'une orientation générale prudente est possible, utilise le statut "complete".
- Utilise "needs_more_info" uniquement lorsqu'une information concrète et indispensable empêche réellement toute orientation prudente. Pose alors 1 à 3 questions courtes et précises.
- Ne redemande jamais une information déjà présente dans les données ou les compléments. Si iteration vaut 1, fournis l'orientation la plus prudente possible avec "complete" au lieu de poser d'autres questions.
- Si un signe d'urgence apparaît dans les données, utilise "urgent".
${groupeSensible ? '- Le patient appartient à un groupe sensible (enfant, grossesse, personne âgée, maladie chronique) : recommande une consultation médicale plus rapidement et augmente le niveau d\'urgence si nécessaire.' : ""}
Réponds UNIQUEMENT par un objet JSON valide, sans texte autour, au format :
{"statut":"complete","resume":string,"urgence":"faible"|"modere"|"urgent"|"immediate","causes":string[],"conseils":string[],"professionnel":string,"signesAlerte":string[]}
ou {"statut":"needs_more_info","missingQuestions":string[]}
ou {"statut":"urgent","message":string}.
Limites : résumé 600 caractères ; 5 éléments maximum dans chaque liste ; chaque élément 250 caractères.
Tous les textes doivent être en français, clairs et compréhensibles par tous.`;
}

const URGENCES: NiveauUrgence[] = ["faible", "modere", "urgent", "immediate"];

const texteLimite = (valeur: unknown, maximum: number): string =>
  typeof valeur === "string" ? valeur.trim().slice(0, maximum) : "";

export function parserReponseIA(
  contenu: string,
  groupeSensible: boolean,
  questionsDejaPosees: string[] = [],
): AnalyseResultat {
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
    Array.isArray(valeur)
      ? valeur
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.trim().slice(0, 250))
          .filter(Boolean)
          .slice(0, 5)
      : [];

  if (brut["statut"] === "needs_more_info") {
    const dejaPosees = new Set(questionsDejaPosees.map((q) => q.trim().toLocaleLowerCase("fr")));
    const missingQuestions = liste(brut["missingQuestions"])
      .filter((q) => !dejaPosees.has(q.toLocaleLowerCase("fr")))
      .slice(0, 3);
    return missingQuestions.length > 0
      ? { statut: "needs_more_info", missingQuestions }
      : {
          statut: "error",
          message: "Le service a redemandé des informations déjà fournies. Vous pouvez relancer l'analyse.",
        };
  }

  if (brut["statut"] === "urgent") {
    return {
      statut: "urgent",
      drapeaux: [],
      message: texteLimite(brut["message"], 600) || "Consultez immédiatement un service d'urgence.",
    };
  }

  const urgenceBrute = typeof brut["urgence"] === "string" ? (brut["urgence"] as string) : "faible";
  let urgence: NiveauUrgence = URGENCES.includes(urgenceBrute as NiveauUrgence)
    ? (urgenceBrute as NiveauUrgence)
    : "modere";
  if (groupeSensible && urgence === "faible") urgence = "modere";

  const resume = texteLimite(brut["resume"], 600);
  if (!resume) {
    return { statut: "error", message: "La réponse du service d'analyse est incomplète. Veuillez réessayer." };
  }

  return {
    statut: "complete",
    resume,
    urgence,
    causes: liste(brut["causes"]),
    conseils: liste(brut["conseils"]),
    professionnel: texteLimite(brut["professionnel"], 250) || "Médecin généraliste",
    signesAlerte: liste(brut["signesAlerte"]),
  };
}
