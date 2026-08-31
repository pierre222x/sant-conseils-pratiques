import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/santeclair";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { compteEstVerifie } from "@/lib/compte-verifie";

const LIENS = [
  { to: "/tableau-de-bord", label: "Tableau de bord" },
  { to: "/evaluation", label: "Nouvelle évaluation" },
  { to: "/historique", label: "Mes évaluations" },
  { to: "/prevention", label: "Prévention" },
  { to: "/profil", label: "Mon profil" },
  { to: "/confidentialite", label: "Confidentialité" },
] as const;

export function EnTete() {
  const { user } = useAuth();
  const connecte = Boolean(user && compteEstVerifie(user));
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);

  const deconnexion = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 rounded-xl" aria-label={`${APP_CONFIG.nom} — accueil`}>
          <Logo taille={38} />
          <span className="text-lg font-bold tracking-tight">{APP_CONFIG.nom}</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
          {connecte &&
            LIENS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-2">
          {connecte ? (
            <>
              <Button variant="outline" size="sm" onClick={deconnexion} className="rounded-xl">
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl lg:hidden"
                aria-label="Ouvrir le menu"
                aria-expanded={ouvert}
                onClick={() => setOuvert((v) => !v)}
              >
                <Menu className="size-5" aria-hidden />
              </Button>
            </>
          ) : (
            <Button asChild size="sm" className="rounded-xl">
              <Link to="/auth">Se connecter</Link>
            </Button>
          )}
        </div>
      </div>

      {connecte && ouvert && (
        <nav aria-label="Navigation mobile" className="border-t border-border bg-card px-4 py-2 lg:hidden">
          {LIENS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOuvert(false)}
              className="block rounded-xl px-3 py-3 text-base font-medium text-foreground transition hover:bg-secondary"
              activeProps={{ className: "bg-secondary" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
