import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Client com a service_role key — ignora RLS por completo.
// NUNCA importar este arquivo em um Client Component. Uso restrito a
// Server Actions que já validaram a permissão do chamador (ex.: is_admin()).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
