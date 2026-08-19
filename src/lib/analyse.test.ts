import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { analyseInputSchema } from "./analyse.types";
import { contientUneDuree, parserReponseIA } from "./analyse.server-utils";
import { detecterUrgences } from "./triage";

describe("orientation des symptômes", () => {
  test("un symptôme simple et complet permet une orientation", () => {
    const texte = "Mal de tête léger depuis deux jours, intensité 3/10, sans fièvre, sans vomissement et sans trouble de la vision";
    assert.equal(contientUneDuree(texte), true);
    assert.equal(analyseInputSchema.safeParse({ symptomes: texte, intensite: 3 }).success, true);

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
    assert.equal(resultat.statut, "complete");
  });

  test("une durée absente est détectée", () => {
    assert.equal(contientUneDuree("J'ai un mal de tête léger sans fièvre"), false);
  });

  test("une question déjà posée ne crée pas de boucle", () => {
    const question = "Depuis combien de temps ressentez-vous ces symptômes ?";
    const resultat = parserReponseIA(
      JSON.stringify({ statut: "needs_more_info", missingQuestions: [question] }),
      false,
      [question],
    );
    assert.equal(resultat.statut, "error");
  });

  test("les questions manquantes sont limitées à trois", () => {
    const resultat = parserReponseIA(
      JSON.stringify({ statut: "needs_more_info", missingQuestions: ["Question 1 ?", "Question 2 ?", "Question 3 ?", "Question 4 ?"] }),
      false,
    );
    assert.equal(resultat.statut, "needs_more_info");
    if (resultat.statut === "needs_more_info") assert.equal(resultat.missingQuestions.length, 3);
  });

  test("un signe d'urgence reste détecté immédiatement", () => {
    assert.notEqual(detecterUrgences("J'ai une douleur thoracique importante").length, 0);
  });
});