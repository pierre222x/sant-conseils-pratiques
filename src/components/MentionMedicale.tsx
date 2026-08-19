import { Info } from "lucide-react";
import { APP_CONFIG } from "@/config/santeclair";
import { cn } from "@/lib/utils";

export function MentionMedicale({ className }: { className?: string }) {
  return (
    <p
      role="note"
      className={cn(
        "flex items-start gap-2 rounded-2xl border border-border bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{APP_CONFIG.avertissement}</span>
    </p>
  );
}
