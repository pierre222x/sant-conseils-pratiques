import { AlertTriangle, Phone } from "lucide-react";
import { APP_CONFIG } from "@/config/santeclair";
import type { DrapeauRouge } from "@/lib/triage";

export function AlerteUrgence({ drapeaux, message }: { drapeaux: DrapeauRouge[]; message?: string }) {
  return (
    <section
      role="alert"
      aria-live="assertive"
      className="rounded-3xl border-4 border-destructive bg-destructive/10 p-5"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="size-8 shrink-0 text-destructive" aria-hidden />
        <h2 className="text-xl font-bold text-destructive">Urgence possible — agissez maintenant</h2>
      </div>
      <p className="mt-3 text-base font-medium">
        {message ??
          "Appelez immédiatement les services d'urgence de votre pays ou rendez-vous à l'hôpital le plus proche."}
      </p>

      <ul className="mt-4 space-y-2">
        {drapeaux.map((d) => (
          <li key={d.cle} className="rounded-2xl bg-card p-3">
            <p className="font-semibold">{d.libelle}</p>
            <p className="text-sm text-muted-foreground">{d.consigne}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {APP_CONFIG.urgences.map((u) => (
          <a
            key={u.pays}
            href={`tel:${u.numero}`}
            className="flex items-center justify-between rounded-2xl bg-destructive px-4 py-3 text-base font-bold text-destructive-foreground transition hover:opacity-90"
          >
            <span>
              {u.pays} · {u.libelle}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="size-4" aria-hidden />
              {u.numero}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
