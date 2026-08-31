import type { User } from "@supabase/supabase-js";

export function identitesGoogle(user: User): boolean {
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.includes("google")) return true;
  return user.app_metadata?.provider === "google";
}

/** Google ne donne pas accès tant que l'e-mail n'a pas été confirmé via le lien SantéClair. */
export function compteEstVerifie(user: User | null): boolean {
  if (!user) return false;
  if (user.app_metadata?.santeclair_email_ok === true) return true;
  if (identitesGoogle(user)) return false;
  return Boolean(user.email_confirmed_at);
}

export function urlLienVerification() {
  return `${window.location.origin}/auth?verifie=1`;
}
