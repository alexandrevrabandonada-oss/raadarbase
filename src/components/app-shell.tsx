import { SemearAppShell } from "@/components/layout/semear-app-shell";
import { USE_MOCKS } from "@/lib/config";
import { getInternalSession } from "@/lib/supabase/auth";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await getInternalSession();

  return (
    <SemearAppShell userEmail={session?.email ?? null} useMocks={USE_MOCKS}>
      {children}
    </SemearAppShell>
  );
}
