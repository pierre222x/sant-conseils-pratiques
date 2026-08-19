import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, History, HeartPulse, Leaf, Shield, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MentionMedicale } from "@/components/MentionMedicale";
import { APP_CONFIG } from "@/config/santeclair";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — SantéClair" },
      { name: "description", content: "Votre espace SantéClair : évaluations, prévention, profil et confidentialité." },
      { property: "og:title", content: "Tableau de bord — SantéClair" },
      { property: "og:description", content: "Gérez vos évaluations de symptômes et vos données en toute sécurité." },
    ],
  }),
  component: TableauDeBord,
});

const CARTES = [
  {
    to: "/evaluation",
    titre: "Nouvelle évaluation",
    texte: "Décrivez vos symptômes et recevez une orientation prudente.",
    icone: ClipboardList,
  },
  {
    to: "/historique",
    titre: "Mes évaluations précédentes",
    texte: "Retrouvez les évaluations que vous avez choisi d'enregistrer.",
    icone: History,
  },
  {
    to: "/prevention",
    titre: "Conseils de prévention",
    texte: "Des gestes simples pour rester en bonne santé au quotidien.",
    icone: Leaf,
  },
  { to: "/profil", titre: "Mon profil", texte: "Âge, antécédents, allergies et médicaments.", icone: User },
  {
    to: "/confidentialite",
    titre: "Confidentialité et suppression",
    texte: "Comprenez et maîtrisez l'usage de vos données.",
    icone: Shield,
  },
] as const;

function TableauDeBord() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Bonjour, bienvenue sur {APP_CONFIG.nom}</h1>
        <p className="text-muted-foreground">{APP_CONFIG.slogan}</p>
      </header>

      <MentionMedicale />

      <div className="grid gap-4 sm:grid-cols-2">
        {CARTES.map(({ to, titre, texte, icone: Icone }) => (
          <Link key={to} to={to} className="rounded-3xl">
            <Card className="h-full rounded-3xl transition hover:ombre-douce">
              <CardHeader className="pb-2">
                <Icone className="size-7 text-primary" aria-hidden />
                <CardTitle className="text-lg">{titre}</CardTitle>
                <CardDescription>{texte}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="rounded-3xl border-destructive/30 bg-destructive/5">
        <CardHeader className="pb-2">
          <HeartPulse className="size-6 text-destructive" aria-hidden />
          <CardTitle className="text-lg">En cas de danger immédiat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {APP_CONFIG.urgences.map((u) => (
            <a
              key={u.pays}
              href={`tel:${u.numero}`}
              className="flex items-center justify-between rounded-2xl bg-card px-4 py-3 font-medium"
            >
              <span>
                {u.pays} · {u.libelle}
              </span>
              <span className="font-bold text-destructive">{u.numero}</span>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
