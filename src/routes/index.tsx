import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { HeartPulse, Lock, ShieldCheck, Stethoscope, Sparkles, Clock } from "lucide-react";
import { Logo } from "@/components/Logo";
import { EnTete } from "@/components/EnTete";
import { MentionMedicale } from "@/components/MentionMedicale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_CONFIG } from "@/config/santeclair";
import { useAuth } from "@/hooks/useAuth";
import { compteEstVerifie } from "@/lib/compte-verifie";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SantéClair — Comprendre vos symptômes en toute prudence" },
      {
        name: "description",
        content:
          "SantéClair analyse vos symptômes et vous oriente gratuitement vers le bon professionnel de santé. Orientation générale, jamais un diagnostic.",
      },
      { property: "og:title", content: "SantéClair — Orientation santé gratuite et prudente" },
      {
        property: "og:description",
        content:
          "Décrivez vos symptômes, recevez une pré-évaluation prudente, des conseils sûrs et une orientation vers le bon professionnel.",
      },
    ],
  }),
  component: Accueil,
});

const AVANTAGES = [
  { icone: Sparkles, titre: "Gratuit et simple", texte: "Décrivez vos symptômes avec vos mots, en français." },
  { icone: Clock, titre: "Rapide", texte: "Une orientation claire en moins de deux minutes." },
  { icone: ShieldCheck, titre: "Prudent", texte: "Détection des signes d'urgence avant toute analyse." },
  { icone: Stethoscope, titre: "Utile", texte: "Vous savez quel professionnel consulter et quand." },
];

function Accueil() {
  const { user, chargement } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!chargement && user && !compteEstVerifie(user)) void navigate({ to: "/auth" });
  }, [user, chargement, navigate]);
  return (
    <div className="min-h-screen fond-doux">
      <EnTete />

      <main className="mx-auto max-w-6xl px-4 pb-16">
        <section className="flex flex-col items-center gap-6 py-12 text-center">
          <Logo taille={96} />
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            {APP_CONFIG.nom} — {APP_CONFIG.slogan}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {APP_CONFIG.description}
          </p>
          <Button asChild size="lg" className="h-14 rounded-2xl px-8 text-base font-semibold ombre-douce">
            <Link to="/evaluation">Commencer mon évaluation</Link>
          </Button>
          <MentionMedicale className="max-w-2xl text-left" />
        </section>

        <section aria-labelledby="fonctionnement" className="py-6">
          <h2 id="fonctionnement" className="text-2xl font-bold">
            Ce que fait l'application
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Vous décrivez vos symptômes, leur durée, leur intensité et leur évolution.",
              "L'application recherche d'abord les signes d'urgence connus.",
              "Elle propose ensuite un résumé, un niveau d'urgence et des hypothèses prudentes.",
              "Elle vous indique ce que vous pouvez faire maintenant sans danger.",
              "Elle vous oriente vers le professionnel de santé approprié.",
              "Elle liste les signes qui doivent vous pousser à consulter rapidement.",
            ].map((t) => (
              <Card key={t} className="rounded-3xl border-border/70">
                <CardContent className="pt-6 text-sm leading-relaxed">{t}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="avantages" className="py-6">
          <h2 id="avantages" className="text-2xl font-bold">
            Ses avantages
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AVANTAGES.map(({ icone: Icone, titre, texte }) => (
              <Card key={titre} className="rounded-3xl border-border/70">
                <CardHeader className="pb-2">
                  <Icone className="size-7 text-primary" aria-hidden />
                  <CardTitle className="text-base">{titre}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{texte}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="limites" className="grid gap-4 py-6 lg:grid-cols-2">
          <Card className="rounded-3xl border-destructive/30 bg-destructive/5">
            <CardHeader>
              <HeartPulse className="size-7 text-destructive" aria-hidden />
              <CardTitle id="limites">Ses limites médicales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-relaxed">
              <p>{APP_CONFIG.nom} n'est pas un médecin et ne pose aucun diagnostic.</p>
              <p>Aucun médicament, aucun dosage et aucune modification de traitement ne sont proposés.</p>
              <p>
                En cas de doute, ou si les informations sont insuffisantes, l'application vous invite
                clairement à consulter un professionnel de santé.
              </p>
              <p className="font-medium">{APP_CONFIG.avertissement}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <Lock className="size-7 text-primary" aria-hidden />
              <CardTitle>La protection de vos données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm leading-relaxed">
              <p>Vos évaluations ne sont enregistrées que si vous donnez explicitement votre accord.</p>
              <p>Vous seul pouvez consulter vos données : elles sont protégées par des règles d'accès strictes.</p>
              <p>Vos symptômes ne sont jamais inscrits dans les journaux techniques.</p>
              <p>Vous pouvez supprimer définitivement votre historique et votre compte à tout moment.</p>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl bg-card p-6 ombre-douce">
          <h2 className="text-xl font-bold">Numéros d'urgence</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            En cas de danger immédiat, n'utilisez pas l'application : appelez directement les secours.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {APP_CONFIG.urgences.map((u) => (
              <li key={u.pays}>
                <a
                  href={`tel:${u.numero}`}
                  className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 font-medium transition hover:bg-secondary"
                >
                  <span>
                    {u.pays} · {u.libelle}
                  </span>
                  <span className="font-bold text-primary">{u.numero}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border bg-card py-6 text-center text-sm text-muted-foreground">
        <p>
          {APP_CONFIG.nom} · {APP_CONFIG.avertissement}
        </p>
      </footer>
    </div>
  );
}
