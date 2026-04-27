import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Suspense fallback={<div className="w-full max-w-md rounded-md border bg-card p-6">Carregando...</div>}>
        <LoginSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function LoginSection({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = (await searchParams) ?? {};
  return <LoginForm nextPath={params.next ?? "/dashboard"} />;
}
