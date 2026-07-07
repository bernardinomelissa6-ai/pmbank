import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import type { Profile } from "@/types/database";

export function AppLayout({
  profile,
  householdName,
  children,
}: {
  profile: Profile;
  householdName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full bg-background">
      <Sidebar role={profile.role} name={profile.name} householdName={householdName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border-subtle bg-surface px-4 py-3 sm:hidden">
          <div>
            <p className="text-sm font-semibold text-text-primary">CasaFlow</p>
            <p className="text-xs text-text-secondary">{householdName}</p>
          </div>
          <p className="text-xs font-medium text-text-secondary">{profile.name}</p>
        </header>
        <main className="flex-1 px-4 py-5 pb-24 sm:px-8 sm:py-8 sm:pb-8">{children}</main>
      </div>
      <MobileBottomNav role={profile.role} />
    </div>
  );
}
