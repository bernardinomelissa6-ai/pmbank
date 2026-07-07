import { requireProfile } from "@/lib/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { ensureRecurrenceWindow } from "@/lib/ensure-recurrence-window";
import { AppLayout } from "@/components/layout/AppLayout";

export default async function AppSectionLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  await ensureRecurrenceWindow(profile.user_id);
  const supabase = await createClient();
  const { data: household } = await supabase
    .from("households")
    .select("name")
    .eq("id", profile.household_id)
    .maybeSingle();

  return (
    <AppLayout profile={profile} householdName={household?.name ?? "Minha família"}>
      {children}
    </AppLayout>
  );
}
