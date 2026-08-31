import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
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
import { compteEstVerifie, identitesGoogle, urlLienVerification } from "@/lib/compte-verifie";
import { marquerEmailVerifie } from "@/lib/verification.functions";

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

function urlApresConfirmation() {
  return urlLienVerification();
}

async function envoyerLienVerification(mail: string) {
  const redirectTo = urlLienVerification();
  const { error: erreurResend } = await supabase.auth.resend({
    type: "signup",
    email: mail,
    options: { emailRedirectTo: redirectTo },
  });
  if (!erreurResend) return null;
  const { error } = await supabase.auth.signInWithOtp({
    email: mail,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
  });
  return error;
}

function MessageOuVerifier({ email }: { email: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <p className="text-muted-foreground">
        Un e-mail de vérification a été envoyé à{" "}
        <span className="font-medium text-foreground">{email || "votre adresse"}</span>. Cliquez sur le lien pour
        activer votre compte.
      </p>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-foreground dark:border-amber-900/60 dark:bg-amber-950/40">
        <p className="font-semibold">Où vérifier si vous ne le voyez pas :</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>la boîte de réception principale</li>
          <li>le dossier Courriers indésirables / Spam</li>
          <li>l’onglet Promotions, Mises à jour ou Autres (Gmail)</li>
          <li>le dossier Junk (Outlook, Yahoo, iCloud)</li>
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          L’expéditeur peut s’appeler SantéClair, Lovable ou Supabase. Attendez une minute, puis actualisez.
        </p>
      </div>
    </div>
  );
}

function toastEmailEnvoye() {
  toast.success("E-mail envoyé. S'il n'est pas dans la boîte de réception, ouvrez les courriers indésirables (spam).");
}

function PageAuth() {
  const navigate = useNavigate();
  const { user, chargement } = useAuth();
  const confirmerCompte = useServerFn(marquerEmailVerifie);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [modeRecuperation, setModeRecuperation] = useState(false);
  const [attenteVerification, setAttenteVerification] = useState(false);
  const googleVerificationLancee = useRef(false);

  useEffect(() => {
    if (chargement || !user || !compteEstVerifie(user)) return;
    void navigate({ to: "/tableau-de-bord" });
  }, [user, chargement, navigate]);

  useEffect(() => {
    if (chargement || !user || compteEstVerifie(user)) return;

    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const depuisLienEmail =
      params.get("verifie") === "1" ||
      params.get("type") === "magiclink" ||
      hash.get("type") === "magiclink";

    if (depuisLienEmail) {
      void (async () => {
        try {
          await confirmerCompte();
          await supabase.auth.refreshSession();
          toast.success("Adresse e-mail confirmée. Bienvenue.");
          await navigate({ to: "/tableau-de-bord" });
        } catch {
          toast.error("La confirmation a échoué. Demandez un nouvel e-mail.");
          setAttenteVerification(true);
        }
      })();
      return;
    }

    if (!identitesGoogle(user) || googleVerificationLancee.current) return;
    googleVerificationLancee.current = true;
    const mail = user.email?.trim() ?? "";
    if (mail) setEmail(mail);

    void (async () => {
      setEnCours(true);
      const erreur = mail ? await envoyerLienVerification(mail) : new Error("E-mail manquant");
      await supabase.auth.signOut();
      setEnCours(false);
      setAttenteVerification(true);
      if (erreur) {
        toast.error("Impossible d'envoyer l'e-mail de vérification. Réessayez.");
        return;
      }
      toastEmailEnvoye();
    })();
  }, [user, chargement, navigate, confirmerCompte]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const oauthErreur = params.get("error_description") || params.get("error");
    if (oauthErreur) {
      toast.error("Connexion Google annulée ou refusée. Vous pouvez réessayer.");
    }

    const tokenHash = params.get("token_hash");
    const type = params.get("type");
    if (!tokenHash || !type) return;

    void (async () => {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as "email" | "signup" | "recovery" | "invite" | "magiclink" | "email_change",
      });
      if (error) {
        toast.error("Le lien de vérification n'est plus valide. Demandez un nouvel e-mail.");
        setAttenteVerification(true);
        return;
      }
      try {
        await confirmerCompte();
        await supabase.auth.refreshSession();
      } catch {
        /* L'inscription e-mail suffit avec email_confirmed_at. */
      }
      toast.success("Adresse e-mail confirmée. Bienvenue.");
    })();
  }, [confirmerCompte]);

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
      const nonConfirme =
        error.code === "email_not_confirmed" || error.message.toLowerCase().includes("email not confirmed");
      if (nonConfirme) {
        setAttenteVerification(true);
        const erreurEnvoi = await envoyerLienVerification(mail);
        if (erreurEnvoi) toast.error("Confirmez d'abord votre e-mail. S'il n'arrive pas, regardez dans les indésirables.");
        else toastEmailEnvoye();
        return;
      }
      toast.error("Connexion impossible. Vérifiez votre e-mail et votre mot de passe.");
      return;
    }
    const { data: sessionActuelle } = await supabase.auth.getUser();
    if (sessionActuelle.user && !compteEstVerifie(sessionActuelle.user)) {
      setAttenteVerification(true);
      const erreurEnvoi = await envoyerLienVerification(mail);
      await supabase.auth.signOut();
      if (erreurEnvoi) toast.error("Confirmez d'abord votre e-mail. S'il n'arrive pas, regardez dans les indésirables.");
      else toastEmailEnvoye();
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
    const { data, error } = await supabase.auth.signUp({
      email: mail,
      password: m.data,
      options: { emailRedirectTo: urlApresConfirmation() },
    });
    setEnCours(false);
    if (error) {
      const tropFaible =
        error.code === "weak_password" || error.message.toLowerCase().includes("weak password");
      toast.error(
        error.message.includes("already registered")
          ? "Un compte existe déjà avec cette adresse."
          : tropFaible
            ? "Ce mot de passe est trop facile à deviner. Choisissez-en un plus unique."
            : "Inscription impossible. Réessayez plus tard.",
      );
      return;
    }
    if (data.session) {
      const u = data.user ?? data.session.user;
      if (u && !compteEstVerifie(u)) {
        const erreurEnvoi = await envoyerLienVerification(mail);
        await supabase.auth.signOut();
        setAttenteVerification(true);
        if (erreurEnvoi) toast.error("Impossible d'envoyer l'e-mail. Réessayez, puis regardez dans les indésirables.");
        else toastEmailEnvoye();
        return;
      }
      toast.success("Compte créé.");
      await navigate({ to: "/tableau-de-bord" });
      return;
    }
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      const erreurEnvoi = await envoyerLienVerification(mail);
      setAttenteVerification(true);
      if (erreurEnvoi) toast.error("Un compte existe déjà. S'il n'est pas confirmé, cherchez l'e-mail dans les indésirables.");
      else toastEmailEnvoye();
      return;
    }
    setAttenteVerification(true);
    toastEmailEnvoye();
  };

  const renvoyerVerification = async () => {
    const mail = valider();
    if (!mail) return;
    setEnCours(true);
    const erreur = await envoyerLienVerification(mail);
    setEnCours(false);
    if (erreur) {
      toast.error("Envoi impossible. Réessayez dans quelques minutes, puis vérifiez les indésirables.");
      return;
    }
    toastEmailEnvoye();
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
    toast.success("Si un compte existe, un e-mail a été envoyé. Vérifiez aussi les courriers indésirables (spam).");
    setModeRecuperation(false);
  };

  const google = async () => {
    setEnCours(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setEnCours(false);
      toast.error(
        result.error.message.includes("Preview")
          ? "Ouvrez l'application dans un nouvel onglet (pas dans l'aperçu Lovable), puis réessayez Google."
          : "Connexion Google indisponible pour le moment.",
      );
      return;
    }
    if (result.redirected) return;
    setEnCours(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center fond-doux px-4 py-10">
      <Link to="/" className="mb-6 flex items-center gap-3 rounded-xl">
        <Logo taille={52} />
        <span className="text-2xl font-bold">{APP_CONFIG.nom}</span>
      </Link>

      <Card className="w-full max-w-md rounded-3xl ombre-douce">
        <CardHeader>
          <CardTitle>
            {attenteVerification
              ? "Vérifiez votre e-mail"
              : modeRecuperation
                ? "Mot de passe oublié"
                : "Accéder à mon espace"}
          </CardTitle>
          <CardDescription>
            {attenteVerification
              ? "Le message peut arriver dans la boîte de réception ou dans les indésirables."
              : modeRecuperation
                ? "Indiquez votre adresse e-mail pour recevoir un lien de réinitialisation."
                : "Gratuit, sans publicité. Vos données restent privées."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attenteVerification ? (
            <div className="space-y-4">
              <MessageOuVerifier email={email} />
              <Button
                type="button"
                disabled={enCours}
                onClick={() => void renvoyerVerification()}
                className="h-12 w-full rounded-xl text-base"
              >
                Renvoyer l'e-mail de vérification
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full rounded-xl"
                onClick={() => setAttenteVerification(false)}
              >
                Retour à la connexion
              </Button>
            </div>
          ) : modeRecuperation ? (
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
