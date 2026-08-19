import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { APP_CONFIG } from "@/config/santeclair";

export const Route = createFileRoute("/_authenticated/confidentialite")({
  head: () => ({
    meta: [
      { title: "Confidentialité — SantéClair" },
      { name: "description", content: "Comprenez l'usage de vos données et supprimez votre historique ou votre compte." },
      { property: "og:title", content: "Confidentialité — SantéClair" },
      { property: "og:description", content: "Vos données restent privées et supprimables à tout moment." },
    ],
  }),
  component: Confidentialite,
});

function Confidentialite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enCours, setEnCours] = useState(false);

  const supprimerHistorique = async () => {
    setEnCours(true);
    const { error } = await supabase.from("evaluations").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    setEnCours(false);
    if (error) {
      toast.error("Suppression impossible. Réessayez.");
      return;
    }
    toast.success("Votre historique a été supprimé définitivement.");
  };

  const supprimerCompte = async () => {
    if (!user) return;
    setEnCours(true);
    await supabase.from("evaluations").delete().eq("user_id", user.id);
    await supabase.from("analysis_usage").delete().eq("user_id", user.id);
    const { error } = await supabase.from("profiles").delete().eq("id", user.id);
    setEnCours(false);
    if (error) {
      toast.error("Suppression impossible. Réessayez.");
      return;
    }
    await supabase.auth.signOut();
    toast.success("Vos données ont été supprimées et vous êtes déconnecté(e).");
    await navigate({ to: "/" });
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Confidentialité et suppression de mes données</h1>
        <p className="text-muted-foreground">Vous restez maître de vos informations, à tout moment.</p>
      </header>

      <Card className="rounded-3xl">
        <CardHeader>
          <Shield className="size-7 text-primary" aria-hidden />
          <CardTitle>Comment vos données sont protégées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>Une évaluation n'est enregistrée que si vous cochez explicitement votre consentement.</p>
          <p>Des règles d'accès strictes garantissent que vous seul pouvez lire vos évaluations et votre profil.</p>
          <p>Vos symptômes ne sont jamais inscrits dans les journaux techniques.</p>
          <p>Les clés secrètes du service d'analyse restent côté serveur, jamais dans votre navigateur.</p>
          <p>Le nombre d'analyses est limité afin d'éviter les abus.</p>
          <p className="font-medium text-foreground">{APP_CONFIG.avertissement}</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-destructive/40">
        <CardHeader>
          <Trash2 className="size-7 text-destructive" aria-hidden />
          <CardTitle>Suppression définitive</CardTitle>
          <CardDescription>Ces actions sont irréversibles.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={enCours} className="h-12 flex-1 rounded-xl">
                Supprimer tout mon historique
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer tout votre historique ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Toutes vos évaluations enregistrées seront définitivement effacées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                <AlertDialogAction className="rounded-xl" onClick={() => void supprimerHistorique()}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={enCours} className="h-12 flex-1 rounded-xl">
                Supprimer mon compte et mes données
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Votre profil, vos évaluations et votre historique d'utilisation seront définitivement supprimés,
                  puis vous serez déconnecté(e).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Annuler</AlertDialogCancel>
                <AlertDialogAction className="rounded-xl" onClick={() => void supprimerCompte()}>
                  Tout supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
