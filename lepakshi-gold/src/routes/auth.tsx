import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Wordmark } from "@/components/brand/Wordmark";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Lepakshi Gold" },
      { name: "description", content: "Sign in to track orders, save addresses and reorder." },
      { property: "og:title", content: "Sign in — Lepakshi Gold" },
      { property: "og:description", content: "Access your Lepakshi Gold account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/account" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
        } else {
          navigate({ to: "/account" });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/account" });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-16">
      <div className="w-full max-w-[420px]">
        <Wordmark />
        <h1 className="mt-8 font-display text-3xl">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Track orders, save addresses and reorder in a tap.
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          {mode === "signup" ? (
            <label className="flex flex-col gap-1.5 text-sm">
              Full name
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="hairline rounded-md bg-card px-3 py-2.5"
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5 text-sm">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="hairline rounded-md bg-card px-3 py-2.5"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="hairline rounded-md bg-card px-3 py-2.5"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-green-900 px-6 py-3 text-sm font-semibold text-cream-50 transition-colors hover:bg-green-700 disabled:opacity-60"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={onGoogle}
          className="mt-3 w-full rounded-md border border-line-200 bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-cream-100"
        >
          Continue with Google
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 text-sm text-ink-500 underline underline-offset-4"
        >
          {mode === "signin"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
