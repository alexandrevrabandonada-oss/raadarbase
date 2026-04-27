"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getInternalAccessMessage,
  isInternalAccessReason,
  isInternalUserActive,
} from "@/lib/supabase/internal-users";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ nextPath, reason }: { nextPath: string; reason: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(
    reason && isInternalAccessReason(reason) ? getInternalAccessMessage(reason) : null,
  );
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const { data: internalUser, error: profileError } = await supabase
        .from("internal_users")
        .select("status")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error(getInternalAccessMessage("setup"));
      }

      if (!internalUser) {
        await supabase.auth.signOut();
        throw new Error(getInternalAccessMessage("missing-profile"));
      }

      if (!isInternalUserActive(internalUser.status)) {
        await supabase.auth.signOut();
        throw new Error(getInternalAccessMessage(internalUser.status));
      }

      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!fullName.trim()) throw new Error("Nome é obrigatório para o cadastro interno.");
      if (password.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
      if (password !== confirmPassword) throw new Error("A confirmação de senha não confere.");

      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      await supabase.auth.signOut();
      setMode("login");
      setFullName("");
      setPassword("");
      setConfirmPassword("");
      setSuccess("Cadastro criado. O acesso fica pendente até um administrador marcar seu perfil como active no Supabase.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar cadastro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex gap-2">
          <Button type="button" variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>Entrar</Button>
          <Button type="button" variant={mode === "signup" ? "default" : "outline"} onClick={() => setMode("signup")}>Cadastrar</Button>
        </div>
        <CardTitle>{mode === "login" ? "Entrar no Radar de Base" : "Cadastrar acesso interno"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={mode === "login" ? handleLogin : handleSignup}>
          {mode === "signup" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Nome</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {mode === "signup" ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
          {mode === "signup" ? (
            <p className="text-sm text-muted-foreground">
              O cadastro cria o usuário no Supabase Auth e um perfil interno com status inicial `pending`.
            </p>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? (mode === "login" ? "Entrando..." : "Criando cadastro...") : mode === "login" ? "Entrar" : "Cadastrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
