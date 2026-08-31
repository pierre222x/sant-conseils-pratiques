import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const marquerEmailVerifie = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    if (error || !data.user) throw new Error("Utilisateur introuvable.");

    const { error: maj } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      app_metadata: {
        ...data.user.app_metadata,
        santeclair_email_ok: true,
      },
    });
    if (maj) throw new Error("Confirmation impossible.");
    return { ok: true as const };
  });
