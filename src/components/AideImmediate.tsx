import { LifeBuoy, Phone } from "lucide-react";
import { APP_CONFIG } from "@/config/santeclair";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  /** Pays retenu (profil ou choix manuel). */
  pays: string | null;
  /** Appelé quand l'utilisateur choisit un pays parce qu'il est inconnu. */
  onChoisirPays: (pays: string) => void;
  /** Motif court expliquant l'affichage de la carte. */
  motif?: string;
};

export function AideImmediate({ pays, onChoisirPays, motif }: Props) {
  const contact = APP_CONFIG.urgences.find((u) => u.pays === pays) ?? null;

  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-3xl border-2 border-destructive/40 bg-destructive/5 p-4"
    >
      <div className="flex items-start gap-3">
        <LifeBuoy className="mt-0.5 size-6 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="text-base font-bold text-destructive">Aide immédiate</h2>
            <p className="text-sm text-muted-foreground">
              {motif ?? "Votre description contient un signe potentiellement grave."} En cas de doute,
              appelez les secours sans attendre.
            </p>
          </div>

          {contact ? (
            <a
              href={`tel:${contact.numero}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground transition hover:opacity-90"
            >
              <span className="truncate">
                {contact.pays} · {contact.libelle}
              </span>
              <span className="flex items-center gap-2">
                <Phone className="size-4" aria-hidden />
                {contact.numero}
              </span>
            </a>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pays-urgence" className="text-sm">
                Dans quel pays êtes-vous ?
              </Label>
              <Select onValueChange={onChoisirPays}>
                <SelectTrigger id="pays-urgence" className="h-12 rounded-xl bg-card">
                  <SelectValue placeholder="Choisissez votre pays" />
                </SelectTrigger>
                <SelectContent>
                  {APP_CONFIG.urgences.map((u) => (
                    <SelectItem key={u.pays} value={u.pays}>
                      {u.pays}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vous pouvez enregistrer votre pays dans votre profil pour l'afficher automatiquement.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
