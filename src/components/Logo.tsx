import { cn } from "@/lib/utils";

type LogoProps = {
  taille?: number;
  anime?: boolean;
  className?: string;
};

/**
 * Logo SantéClair : une plante verte qui tourne doucement sur elle-même.
 * L'animation est automatiquement désactivée si l'utilisateur préfère
 * réduire les animations (voir styles.css, prefers-reduced-motion).
 */
export function Logo({ taille = 40, anime = true, className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full fond-primaire ombre-douce",
        className,
      )}
      style={{ width: taille, height: taille }}
    >
      <svg
        role="img"
        aria-label="Logo SantéClair : une jeune plante verte"
        viewBox="0 0 48 48"
        width={taille * 0.68}
        height={taille * 0.68}
        className={anime ? "logo-anime" : undefined}
      >
        <path
          d="M24 42V20"
          stroke="currentColor"
          className="text-primary-foreground"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M24 26C24 26 15 25 12 17c8-1 12 4 12 9Z"
          className="fill-primary-foreground"
          opacity="0.95"
        />
        <path
          d="M24 22C24 22 25 12 34 9c1 9-5 13-10 13Z"
          className="fill-primary-foreground"
          opacity="0.75"
        />
        <circle cx="24" cy="43" r="2.4" className="fill-primary-foreground" opacity="0.6" />
      </svg>
    </span>
  );
}
