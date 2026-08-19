import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MentionMedicale } from "@/components/MentionMedicale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EVALUATIONS_DEMO, NIVEAUX_URGENCE, type NiveauUrgence } from "@/config/santeclair";

export const Route = createFileRoute("/_authenticated/historique")({
  head: () => ({
    meta: [
      { title: "Mes évaluations — SantéClair" },
      { name: "description", content: "Consultez et supprimez les évaluations de symptômes que vous avez enregistrées." },
      { property: "og:title", content: "Mes évaluations — SantéClair" },
      { property: "og:description", content: "Votre historique privé d'évaluations SantéClair." },
    ],
  }),
  component: Historique,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function Historique() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["evaluations", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const supprimer = async (id: string) => {
    const { error } = await supabase.from("evaluations").delete().eq("id", id);
    if (error) {
      toast.error("Suppression impossible. Réessayez.");
      return;
    }
    toast.success("Évaluation supprimée.");
    await queryClient.invalidateQueries({ queryKey: ["evaluations", user?.id] });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Mes évaluations précédentes</h1>
        <p className="text-muted-foreground">
          Seules les évaluations que vous avez accepté d'enregistrer apparaissent ici.
        </p>
      </header>

      <MentionMedicale />

      {isLoading && <p className="text-muted-foreground">Chargement de vos évaluations…</p>}

      {isError && (
        <Card className="rounded-3xl border-destructive/40">
          <CardContent className="pt-6 text-sm">
            Impossible de charger vos évaluations. Vérifiez votre connexion, puis réessayez.
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <div className="space-y-3">
          <p className="text-muted-foreground">
            Vous n'avez encore aucune évaluation enregistrée. Voici deux exemples de démonstration :
          </p>
          {EVALUATIONS_DEMO.map((e) => (
            <Card key={e.id} className="rounded-3xl border-dashed">
              <CardHeader className="pb-2">
                <Badge variant="secondary" className="w-fit">
                  Exemple de démonstration
                </Badge>
                <CardTitle className="text-base">{e.resume}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <span className={`inline-block rounded-full px-3 py-1 ${NIVEAUX_URGENCE[e.urgence].classe}`}>
                  {NIVEAUX_URGENCE[e.urgence].libelle}
                </span>
                <p>Professionnel conseillé : {e.professionnel}</p>
                <p>{formatDate(e.created_at)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {data?.map((e) => {
          const niveau = NIVEAUX_URGENCE[(e.urgence as NiveauUrgence) ?? "faible"] ?? NIVEAUX_URGENCE.faible;
          return (
            <Card key={e.id} className="rounded-3xl">
              <CardHeader className="pb-2">
                {e.is_demo && (
                  <Badge variant="secondary" className="w-fit">
                    Démonstration
                  </Badge>
                )}
                <CardTitle className="text-base">{e.resume ?? e.symptomes}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <span className={`inline-block rounded-full px-3 py-1 ${niveau.classe}`}>{niveau.libelle}</span>
                {e.professionnel && <p>Professionnel conseillé : {e.professionnel}</p>}
                <p>{formatDate(e.created_at)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => void supprimer(e.id)}
                >
                  <Trash2 className="size-4" aria-hidden /> Supprimer
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
