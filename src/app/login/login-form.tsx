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
import { playSynthConfirm } from "@/lib/audio";

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

  const switchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    playSynthConfirm();
    setError(null);
    setSuccess(null);
  };

  return (
    <Card className="w-full max-w-md bloco-concreto shadow-[4px_4px_0px_0px_rgba(11,11,11,1)]">
      <CardHeader>
        <div className="flex flex-col items-center justify-center gap-3 mb-6">
          <div className="flex size-20 items-center justify-center rounded-[4px] border-2 border-burnt-yellow bg-charcoal overflow-hidden shadow-[4px_4px_0px_0px_rgba(242,169,0,0.5)]">
            <img src="/logo.png" className="size-full object-cover" alt="Radar de Base logo" />
          </div>
          <div className="text-center">
            <span className="block text-lg font-black tracking-tight text-charcoal dark:text-off-white">RADAR DE BASE</span>
            <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-burnt-yellow">CONCRETO ZEN</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant={mode === "login" ? "default" : "outline"} 
            className="flex-1 rounded-[2px] border-black" 
            onClick={() => switchMode("login")}
          >
            Entrar
          </Button>
          <Button 
            type="button" 
            variant={mode === "signup" ? "default" : "outline"} 
            className="flex-1 rounded-[2px] border-black" 
            onClick={() => switchMode("signup")}
          >
            Cadastrar
          </Button>
        </div>
        <CardTitle className="mt-4 text-sm font-black uppercase tracking-wider text-charcoal">
          {mode === "login" ? "Entrar no Radar de Base" : "Cadastrar acesso interno"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={mode === "login" ? handleLogin : handleSignup}>
          {mode === "signup" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-wider text-cement">Nome completo</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="border-2 border-black rounded-[2px]" />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-cement">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-2 border-black rounded-[2px]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-wider text-cement">Senha</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="border-2 border-black rounded-[2px]" />
          </div>
          {mode === "signup" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-wider text-cement">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border-2 border-black rounded-[2px]"
              />
            </div>
          ) : null}
          
          {error ? (
            <p className="text-xs font-bold text-rust bg-rust/10 border border-rust/35 p-2.5 rounded-[2px] font-mono leading-relaxed">
              ⚠️ {error}
            </p>
          ) : null}
          {success ? (
            <p className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 p-2.5 rounded-[2px] font-mono leading-relaxed">
              ✅ {success}
            </p>
          ) : null}
          
          {mode === "signup" ? (
            <p className="text-[10px] text-cement leading-normal">
              O cadastro cria o usuário no Supabase Auth e o perfil interno correspondente. O acesso fica pendente até aprovação de um administrador.
            </p>
          ) : null}
          <Button type="submit" disabled={loading} className="rounded-[2px] border-black mt-2">
            {loading ? (mode === "login" ? "Conectando..." : "Criando cadastro...") : mode === "login" ? "Entrar" : "Cadastrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
