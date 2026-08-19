import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_CONFIG } from "@/config/santeclair";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — SantéClair" },
      { name: "description", content: "Connectez-vous ou créez un compte gratuit SantéClair pour évaluer vos symptômes." },
      { property: "og:title", content: "Connexion — SantéClair" },
      { property: "og:description", content: "Accédez à votre espace SantéClair en toute sécurité." },
    ],
  }),
  component: PageAuth,
});

const emailSchema = z.string().trim().email("Adresse e-mail invalide").max(255);
const mdpSchema = z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(128);

function PageAuth() {
  const navigate = useNavigate();
  const { user, chargement } = useAuth();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [modeRecuperation, setModeRecuperation] = useState(false);

  useEffect(() => {
    if (!chargement && user) void navigate({ to: "/tableau-de-bord" });
  }, [user, chargement, navigate]);

  const valider = () => {
    const e = emailSchema.safeParse(email);
    if (!e.success) {
      toast.error(e.error.issues[0]?.message ?? "Adresse e-mail invalide");
      return null;
    }
    return e.data;
  };

  const connexion = async (event: React.FormEvent) => {
    event.preventDefault();
    const mail = valider();
    if (!mail) return;
    setEnCours(true);
    const { error } = await supabase.auth.signInWithPassword({ email: mail, password: motDePasse });
    setEnCours(false);
    if (error) {
      toast.error("Connexion impossible. Vérifiez votre e-mail et votre mot de passe.");
      return;
    }
    await navigate({ to: "/tableau-de-bord" });
  };

  const inscription = async (event: React.FormEvent) => {
    event.preventDefault();
    const mail = valider();
    if (!mail) return;
    const m = mdpSchema.safeParse(motDePasse);
    if (!m.success) {
      toast.error(m.error.issues[0]?.message ?? "Mot de passe trop court");
      return;
    }
    setEnCours(true);
    const { error } = await supabase.auth.signUp({
      email: mail,
      password: m.data,
      options: { emailRedirectTo: `${window.location.origin}/tableau-de-bord` },
    });
    setEnCours(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Un compte existe déjà avec cette adresse."
          : "Inscription impossible. Réessayez plus tard.",
      );
      return;
    }
    toast.success("Compte créé. Vérifiez votre boîte e-mail si une confirmation est demandée.");
    await navigate({ to: "/tableau-de-bord" });
  };

  const recuperation = async (event: React.FormEvent) => {
    event.preventDefault();
    const mail = valider();
    if (!mail) return;
    setEnCours(true);
    const { error } = await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: `${window.location.origin}/profil`,
    });
    setEnCours(false);
    if (error) {
      toast.error("Envoi impossible. Réessayez plus tard.");
      return;
    }
    toast.success("Si un compte existe, un e-mail de réinitialisation vient d'être envoyé.");
    setModeRecuperation(false);
  };

  const google = async () => {
    setEnCours(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setEnCours(false);
      toast.error("Connexion Google indisponible pour le moment.");
      return;
    }
    if (result.redirected) return;
    await navigate({ to: "/tableau-de-bord" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center fond-doux px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-3 rounded-xl">
        <Logo taille={52} />
        <span className="text-2xl font-bold">{APP_CONFIG.nom}</span>
      </Link>

      <Card className="w-full max-w-md rounded-3xl ombre-douce">
        <CardHeader>
          <CardTitle>{modeRecuperation ? "Mot de passe oublié" : "Accéder à mon espace"}</CardTitle>
          <CardDescription>
            {modeRecuperation
              ? "Indiquez votre adresse e-mail pour recevoir un lien de réinitialisation."
              : "Gratuit, sans publicité. Vos données restent privées."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modeRecuperation ? (
            <form onSubmit={recuperation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-recup">Adresse e-mail</Label>
                <Input
                  id="email-recup"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <Button type="submit" disabled={enCours} className="h-12 w-full rounded-xl text-base">
                Envoyer le lien
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-xl"
                onClick={() => setModeRecuperation(false)}
              >
                Retour à la connexion
              </Button>
            </form>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={google}
                disabled={enCours}
                className="h-12 w-full rounded-xl text-base"
              >
                Continuer avec Google
              </Button>

              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                ou par e-mail
                <span className="h-px flex-1 bg-border" />
              </div>

              <Tabs defaultValue="connexion">
                <TabsList className="grid w-full grid-cols-2 rounded-xl">
                  <TabsTrigger value="connexion">Connexion</TabsTrigger>
                  <TabsTrigger value="inscription">Inscription</TabsTrigger>
                </TabsList>

                <TabsContent value="connexion">
                  <form onSubmit={connexion} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Adresse e-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mdp">Mot de passe</Label>
                      <Input
                        id="mdp"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <Button type="submit" disabled={enCours} className="h-12 w-full rounded-xl text-base">
                      Se connecter
                    </Button>
                    <Button
                      type="button"
                      variant="link"
                      className="w-full"
                      onClick={() => setModeRecuperation(true)}
                    >
                      Mot de passe oublié ?
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="inscription">
                  <form onSubmit={inscription} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email-new">Adresse e-mail</Label>
                      <Input
                        id="email-new"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mdp-new">Mot de passe (8 caractères minimum)</Label>
                      <Input
                        id="mdp-new"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        className="h-12 rounded-xl"
                      />
                    </div>
                    <Button type="submit" disabled={enCours} className="h-12 w-full rounded-xl text-base">
                      Créer mon compte gratuit
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>

      <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">{APP_CONFIG.avertissement}</p>
    </div>
  );
}
