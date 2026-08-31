import type { User } from "@supabase/supabase-js";

const CLE_ATTENTE_VERIF = "santeclair_attente_verif";
const CLE_ENVOI_VERIF = "santeclair_verif_envoi";
const DUREE_ATTENTE_MS = 48 * 60 * 60 * 1000;
const DUREE_ANTI_SPAM_MS = 8 * 60 * 1000;

export function identitesGoogle(user: User): boolean {
  const providers = user.app_metadata?.providers;
  if (Array.isArray(providers) && providers.includes("google")) return true;
  return user.app_metadata?.provider === "google";
}

/** Google et e-mail : accès seulement après le lien de vérification SantéClair. */
export function compteEstVerifie(user: User | null): boolean {
  if (!user) return false;
  if (user.app_metadata?.santeclair_email_ok === true) return true;
  if (identitesGoogle(user)) return false;
  return Boolean(user.email_confirmed_at);
}

export function urlLienVerification() {
  return `${window.location.origin}/auth?verifie=1`;
}

export function enregistrerAttenteVerification(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_ATTENTE_VERIF, JSON.stringify({ email, at: Date.now() }));
}

export function lireAttenteVerification(): string | null {
  if (typeof window === "undefined") return null;
  const brut = localStorage.getItem(CLE_ATTENTE_VERIF);
  if (!brut) return null;
  try {
    const data = JSON.parse(brut) as { email?: string; at?: number };
    if (!data.email || typeof data.at !== "number") return null;
    if (Date.now() - data.at > DUREE_ATTENTE_MS) {
      localStorage.removeItem(CLE_ATTENTE_VERIF);
      return null;
    }
    return data.email;
  } catch {
    localStorage.removeItem(CLE_ATTENTE_VERIF);
    return null;
  }
}

export function effacerAttenteVerification() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLE_ATTENTE_VERIF);
  localStorage.removeItem(CLE_ENVOI_VERIF);
}

export function marquerVerificationEnvoyee(email: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLE_ENVOI_VERIF, JSON.stringify({ email, at: Date.now() }));
}

export function verificationDejaEnvoyee(email: string): boolean {
  if (typeof window === "undefined" || !email) return false;
  const brut = localStorage.getItem(CLE_ENVOI_VERIF);
  if (!brut) return false;
  try {
    const data = JSON.parse(brut) as { email?: string; at?: number };
    if (data.email !== email || typeof data.at !== "number") return false;
    return Date.now() - data.at < DUREE_ANTI_SPAM_MS;
  } catch {
    return false;
  }
}

export function marquerRetourGoogle() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("santeclair_oauth", "1");
    sessionStorage.setItem("santeclair_oauth", "1");
  } catch {
    /* stockage indisponible */
  }
}

export function consommerRetourGoogle(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const local = localStorage.getItem("santeclair_oauth") === "1";
    const session = sessionStorage.getItem("santeclair_oauth") === "1";
    if (!local && !session) return false;
    localStorage.removeItem("santeclair_oauth");
    sessionStorage.removeItem("santeclair_oauth");
    return true;
  } catch {
    return false;
  }
}
