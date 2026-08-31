import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { EnTete } from "@/components/EnTete";
import { useAuth } from "@/hooks/useAuth";
import { APP_CONFIG } from "@/config/santeclair";
import { compteEstVerifie } from "@/lib/compte-verifie";

export const Route = createFileRoute("/_authenticated")({
  component: EspaceProtege,
});

function EspaceProtege() {
  const { user, chargement } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (chargement) return;
    if (!user || !compteEstVerifie(user)) void navigate({ to: "/auth" });
  }, [user, chargement, navigate]);

  if (chargement) {
    return (
      <div className="flex min-h-screen items-center justify-center fond-doux">
        <p className="text-muted-foreground">Chargement de votre espace…</p>
      </div>
    );
  }

  if (!user || !compteEstVerifie(user)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 fond-doux px-4 text-center">
        <p className="text-lg font-semibold">{user ? "Vérification de l'e-mail…" : "Votre session a expiré"}</p>
        <p className="text-sm text-muted-foreground">
          {user ? "Confirmez votre adresse pour accéder à votre espace." : "Reconnectez-vous pour accéder à votre espace."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen fond-doux">
      <EnTete />
      <main className="mx-auto max-w-4xl px-4 pb-16 pt-6">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-card py-5 text-center text-xs text-muted-foreground">
        {APP_CONFIG.nom} · {APP_CONFIG.avertissement}
      </footer>
    </div>
  );
}
