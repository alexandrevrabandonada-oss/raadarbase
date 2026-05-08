import { getInternalSession } from "@/lib/supabase/auth";
import { USE_MOCKS } from "@/lib/config";
import { Sidebar } from "@/components/sidebar";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getInternalSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <Sidebar userEmail={user?.email ?? undefined} useMocks={USE_MOCKS} />
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
