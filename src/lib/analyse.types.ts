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
});

export type AnalyseInput = z.infer<typeof analyseInputSchema>;

export type AnalyseOk = {
  statut: "ok";
  resume: string;
  urgence: NiveauUrgence;
  causes: string[];
  conseils: string[];
  professionnel: string;
  signesAlerte: string[];
  fiable: boolean;
};

export type AnalyseResultat =
  | AnalyseOk
  | { statut: "urgence"; drapeaux: DrapeauRouge[]; message: string }
  | { statut: "non_configure" }
  | { statut: "limite"; message: string }
  | { statut: "erreur"; message: string };
