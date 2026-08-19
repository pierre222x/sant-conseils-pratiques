import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyseInputSchema, type AnalyseInput, type AnalyseResultat } from "./analyse.types";
import { detecterUrgences, estGroupeSensible } from "./triage";
import { construirePrompt, contientUneDuree, parserReponseIA } from "./analyse.server-utils";

export const analyserSymptomes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AnalyseInput) => analyseInputSchema.parse(input))
  .handler(async ({ data, context }): Promise<AnalyseResultat> => {
    const { supabase, userId } = context;

    // 1. Limitation du nombre de requêtes (anti-abus)
    const uneHeure = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const unJour = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: countJour } = await supabase
      .from("analysis_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", unJour);
    const { count: countHeure } = await supabase
      .from("analysis_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", uneHeure);

    if ((countHeure ?? 0) >= 8 || (countJour ?? 0) >= 25) {
      return {
        statut: "error",
        message:
          "Vous avez atteint la limite d'analyses autorisées. Réessayez plus tard ou consultez un professionnel de santé.",
      };
    }

    // 2. Détection des signes d'urgence AVANT toute analyse par IA
    const drapeaux = detecterUrgences(
      [
        data.symptomes,
        data.evolution ?? "",
        data.reponses?.join(" ") ?? "",
        ...(data.complements ?? []).map(({ reponse }) => reponse),
      ].join(" "),
    );
    if (drapeaux.length > 0) {
      return {
        statut: "urgent",
        drapeaux,
        message:
          "Des signes d'urgence ont été détectés. Appelez immédiatement les services d'urgence ou rendez-vous à l'hôpital le plus proche.",
      };
    }

    // 3. Analyse par IA
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { statut: "error", message: "Le service d'analyse n'est pas configuré pour le moment." };
    }

    const texteComplet = [
      data.symptomes,
      data.duree ?? "",
      ...(data.complements ?? []).map(({ question, reponse }) => `${question} ${reponse}`),
    ].join(" ");
    const dureePresente = Boolean(data.duree?.trim()) || contientUneDuree(texteComplet);
    const questionDuree = "Depuis combien de temps ressentez-vous ces symptômes ?";
    if (!dureePresente && data.iteration === 0) {
      return { statut: "needs_more_info", missingQuestions: [questionDuree] };
    }

    await supabase.from("analysis_usage").insert({ user_id: userId });

    const sensible = estGroupeSensible(data.age ?? null, data.groupes ?? []);

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.5-flash",
          max_tokens: 1200,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: construirePrompt(sensible) },
            { role: "user", content: JSON.stringify(data) },
          ],
        }),
      });
    } catch {
      return {
        statut: "error",
        message: "Le service d'analyse est momentanément injoignable. Vérifiez votre connexion et réessayez.",
      };
    }

    if (response.status === 429) {
      return { statut: "error", message: "Le service d'analyse est saturé. Réessayez dans quelques minutes." };
    }
    if (!response.ok) {
      const erreur = (await response.json().catch(() => null)) as { message?: string; error?: { message?: string } } | null;
      const message = erreur?.message ?? erreur?.error?.message;
      return {
        statut: "error",
        message: message?.slice(0, 500) || "L'analyse n'a pas pu être réalisée. Veuillez réessayer.",
      };
    }

    const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const contenu = json.choices?.[0]?.message?.content ?? "";
    const resultat = parserReponseIA(contenu, sensible, data.questionsPosees ?? []);
    return resultat;
  });
