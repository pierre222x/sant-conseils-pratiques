import { describe, expect, test } from "bun:test";
import { analyseInputSchema } from "./analyse.types";
import { contientUneDuree, parserReponseIA } from "./analyse.server-utils";
import { detecterUrgences } from "./triage";

describe("orientation des symptômes", () => {
  test("un symptôme simple et complet permet une orientation", () => {
    const texte = "Mal de tête léger depuis deux jours, intensité 3/10, sans fièvre, sans vomissement et sans trouble de la vision";
    expect(contientUneDuree(texte)).toBe(true);
    expect(analyseInputSchema.safeParse({ symptomes: texte, intensite: 3 }).success).toBe(true);

    const resultat = parserReponseIA(
      JSON.stringify({
        statut: "complete",
        resume: "Céphalée légère récente sans signe d'alerte décrit.",
        urgence: "faible",
        causes: ["Fatigue ou tension possibles"],
        conseils: ["Repos et hydratation"],
        professionnel: "Médecin généraliste si persistance",
        signesAlerte: ["Aggravation brutale"],
      }),
      false,
    );
    expect(resultat.statut).toBe("complete");
  });

  test("une durée absente est détectée", () => {
    expect(contientUneDuree("J'ai un mal de tête léger sans fièvre")).toBe(false);
  });

  test("une question déjà posée ne crée pas de boucle", () => {
    const question = "Depuis combien de temps ressentez-vous ces symptômes ?";
    const resultat = parserReponseIA(
      JSON.stringify({ statut: "needs_more_info", missingQuestions: [question] }),
      false,
      [question],
    );
    expect(resultat.statut).toBe("error");
  });

  test("les questions manquantes sont limitées à trois", () => {
    const resultat = parserReponseIA(
      JSON.stringify({ statut: "needs_more_info", missingQuestions: ["Question 1 ?", "Question 2 ?", "Question 3 ?", "Question 4 ?"] }),
      false,
    );
    expect(resultat.statut).toBe("needs_more_info");
    if (resultat.statut === "needs_more_info") expect(resultat.missingQuestions).toHaveLength(3);
  });

  test("un signe d'urgence reste détecté immédiatement", () => {
    expect(detecterUrgences("J'ai une douleur thoracique importante")).not.toHaveLength(0);
  });
});