import { z } from "zod";
import type { DrapeauRouge } from "./triage";
import type { NiveauUrgence } from "@/config/santeclair";

export const analyseInputSchema = z.object({
  symptomes: z.string().trim().min(3, "Décrivez au moins un symptôme").max(1500),
  duree: z.string().trim().max(120).optional(),
  intensite: z.number().int().min(1).max(10).optional(),
  evolution: z.string().trim().max(500).optional(),
  age: z.number().int().min(0).max(120).nullable().optional(),
  antecedents: z.string().trim().max(500).optional(),
  allergies: z.string().trim().max(500).optional(),
  medicaments: z.string().trim().max(500).optional(),
  groupes: z.array(z.string().max(40)).max(10).optional(),
  reponses: z.array(z.string().max(300)).max(10).optional(),
  complements: z
    .array(
      z.object({
        question: z.string().trim().min(3).max(300),
        reponse: z.string().trim().min(1, "Répondez à chaque question complémentaire").max(500),
      }),
    )
    .max(3)
    .optional(),
  questionsPosees: z.array(z.string().trim().min(3).max(300)).max(3).optional(),
  iteration: z.number().int().min(0).max(1).default(0),
});

export type AnalyseInput = z.infer<typeof analyseInputSchema>;

export type AnalyseComplete = {
  statut: "complete";
  resume: string;
  urgence: NiveauUrgence;
  causes: string[];
  conseils: string[];
  professionnel: string;
  signesAlerte: string[];
};

export type AnalyseResultat =
  | AnalyseComplete
  | { statut: "needs_more_info"; missingQuestions: string[] }
  | { statut: "urgent"; drapeaux: DrapeauRouge[]; message: string }
  | { statut: "error"; message: string };
