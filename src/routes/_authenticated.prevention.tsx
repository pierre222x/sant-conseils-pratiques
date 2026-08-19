import { createFileRoute } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MentionMedicale } from "@/components/MentionMedicale";
import { CONSEILS_PREVENTION } from "@/config/santeclair";

export const Route = createFileRoute("/_authenticated/prevention")({
  head: () => ({
    meta: [
      { title: "Conseils de prévention — SantéClair" },
      { name: "description", content: "Gestes simples de prévention : hydratation, sommeil, hygiène, activité physique." },
      { property: "og:title", content: "Conseils de prévention — SantéClair" },
      { property: "og:description", content: "Des habitudes sûres pour préserver votre santé au quotidien." },
    ],
  }),
  component: Prevention,
});

function Prevention() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Conseils de prévention</h1>
        <p className="text-muted-foreground">
          Des gestes simples et sans danger, valables pour la plupart des personnes.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {CONSEILS_PREVENTION.map((c) => (
          <Card key={c.titre} className="rounded-3xl">
            <CardHeader className="pb-2">
              <Leaf className="size-6 text-primary" aria-hidden />
              <CardTitle className="text-lg">{c.titre}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed text-muted-foreground">{c.texte}</CardContent>
          </Card>
        ))}
      </div>

      <MentionMedicale />
    </div>
  );
}
