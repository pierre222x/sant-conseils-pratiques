import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MentionMedicale } from "@/components/MentionMedicale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil — SantéClair" },
      { name: "description", content: "Renseignez, si vous le souhaitez, votre âge, vos antécédents, allergies et médicaments." },
      { property: "og:title", content: "Mon profil — SantéClair" },
      { property: "og:description", content: "Vos informations de santé restent privées et facultatives." },
    ],
  }),
  component: Profil,
});

const profilSchema = z.object({
  display_name: z.string().trim().max(80).optional(),
  age: z.number().int().min(0).max(120).nullable(),
  antecedents: z.string().trim().max(500),
  allergies: z.string().trim().max(500),
  medicaments: z.string().trim().max(500),
  consent_save: z.boolean(),
});

function Profil() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    display_name: "",
    age: "",
    antecedents: "",
    allergies: "",
    medicaments: "",
    consent_save: false,
  });
  const [enCours, setEnCours] = useState(false);
  const [nouveauMdp, setNouveauMdp] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["profil", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        display_name: data.display_name ?? "",
        age: data.age === null ? "" : String(data.age),
        antecedents: data.antecedents ?? "",
        allergies: data.allergies ?? "",
        medicaments: data.medicaments ?? "",
        consent_save: data.consent_save,
      });
    }
  }, [data]);

  const enregistrer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const parsed = profilSchema.safeParse({
      display_name: form.display_name,
      age: form.age === "" ? null : Number(form.age),
      antecedents: form.antecedents,
      allergies: form.allergies,
      medicaments: form.medicaments,
      consent_save: form.consent_save,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Informations invalides");
      return;
    }
    setEnCours(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...parsed.data });
    setEnCours(false);
    if (error) {
      toast.error("Enregistrement impossible. Réessayez.");
      return;
    }
    toast.success("Profil enregistré.");
    await queryClient.invalidateQueries({ queryKey: ["profil", user.id] });
  };

  const changerMotDePasse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (nouveauMdp.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: nouveauMdp });
    if (error) {
      toast.error("Modification impossible. Reconnectez-vous puis réessayez.");
      return;
    }
    setNouveauMdp("");
    toast.success("Mot de passe mis à jour.");
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Mon profil</h1>
        <p className="text-muted-foreground">
          Toutes ces informations sont facultatives. Elles servent uniquement à affiner votre orientation.
        </p>
      </header>

      <MentionMedicale />

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Mes informations</CardTitle>
          <CardDescription>Connecté avec {user?.email ?? "votre compte"}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : (
            <form onSubmit={enregistrer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Prénom ou surnom</Label>
                <Input
                  id="nom"
                  className="h-12 rounded-xl"
                  maxLength={80}
                  value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Âge</Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  max={120}
                  className="h-12 rounded-xl"
                  value={form.age}
                  onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="antecedents">Antécédents (facultatif)</Label>
                <Textarea
                  id="antecedents"
                  maxLength={500}
                  className="rounded-xl"
                  value={form.antecedents}
                  onChange={(e) => setForm((f) => ({ ...f, antecedents: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies (facultatif)</Label>
                <Textarea
                  id="allergies"
                  maxLength={500}
                  className="rounded-xl"
                  value={form.allergies}
                  onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicaments">Médicaments en cours (facultatif)</Label>
                <Textarea
                  id="medicaments"
                  maxLength={500}
                  className="rounded-xl"
                  value={form.medicaments}
                  onChange={(e) => setForm((f) => ({ ...f, medicaments: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border p-4">
                <Label htmlFor="consent" className="pr-4 text-sm font-normal">
                  J'accepte que mes évaluations soient enregistrées dans mon historique privé.
                </Label>
                <Switch
                  id="consent"
                  checked={form.consent_save}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, consent_save: v }))}
                />
              </div>
              <Button type="submit" disabled={enCours} className="h-12 w-full rounded-xl text-base">
                Enregistrer mon profil
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <CardTitle>Changer mon mot de passe</CardTitle>
          <CardDescription>Votre mot de passe n'est jamais enregistré en clair.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={changerMotDePasse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mdp-new">Nouveau mot de passe</Label>
              <Input
                id="mdp-new"
                type="password"
                autoComplete="new-password"
                className="h-12 rounded-xl"
                value={nouveauMdp}
                onChange={(e) => setNouveauMdp(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" className="h-12 w-full rounded-xl">
              Mettre à jour
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
