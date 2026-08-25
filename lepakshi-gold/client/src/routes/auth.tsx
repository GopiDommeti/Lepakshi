import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Seo } from "@/lib/seo";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "signin") {
        await auth.signIn(form.email, form.password);
        toast.success("Welcome back");
      } else {
        await auth.signUp(form.email, form.password, form.fullName, form.phone);
        toast.success("Account created");
      }
      const target = search.redirect;
      if (target) window.location.href = target;
      else await navigate({ to: "/account" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo
        title={mode === "signin" ? "Sign in — Lepakshi Gold" : "Create an account — Lepakshi Gold"}
        description="Sign in to see your orders, saved addresses and wishlist."
        noindex
      />
      <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-16">
        <div className="w-full max-w-md">
          <Link to="/" className="block text-center">
            <span className="font-display text-3xl text-green-900">Lepakshi Gold</span>
            <span className="eyebrow mt-1 block text-gold-600">Since 2003</span>
          </Link>

          <div className="hairline mt-8 rounded-xl bg-card p-6">
            <div className="flex gap-1 rounded-lg bg-cream-100 p-1">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    mode === m ? "bg-card text-ink-900 shadow-sm" : "text-ink-500",
                  )}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {mode === "signup" ? (
                <>
                  <Field label="Full name">
                    <input
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Mobile number">
                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                      }
                      className={cn(inputClass, "num")}
                    />
                  </Field>
                </>
              ) : null}
              <Field label="Email">
                <input
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void submit();
                  }}
                  className={inputClass}
                />
                {mode === "signup" ? (
                  <span className="mt-1 block text-xs text-ink-500">At least eight characters.</span>
                ) : null}
              </Field>

              <button
                type="button"
                disabled={busy || !form.email || !form.password}
                onClick={() => void submit()}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-gold-500 px-5 py-3 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-400 disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                {mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-ink-500">
            You don't need an account to order —{" "}
            <Link to="/shop" className="text-green-700 underline">
              shop as a guest
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}

const inputClass =
  "w-full rounded-md border border-line-200 bg-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold">{label}</span>
      {children}
    </label>
  );
}
