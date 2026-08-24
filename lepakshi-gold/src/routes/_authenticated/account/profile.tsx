import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AccountLayout } from "@/components/storefront/AccountLayout";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account/profile")({
  component: Profile,
});

function Profile() {
  const { user } = useSession();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<{ full_name: string; phone: string } | null>(null);
  const [password, setPassword] = useState("");

  const profile = useQuery({
    queryKey: ["account", "profile", user?.id ?? "none"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: Boolean(user),
  });

  if (!draft && profile.data !== undefined) {
    setDraft({
      full_name: profile.data?.full_name ?? "",
      phone: profile.data?.phone ?? "",
    });
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!user || !draft) return;
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: draft.full_name.trim() || null,
        phone: draft.phone.replace(/\D/g, "").slice(-10) || null,
        email: user.email ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Profile updated");
      void qc.invalidateQueries({ queryKey: ["account"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      if (password.length < 8) throw new Error("Use at least eight characters.");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Password changed");
      setPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AccountLayout title="Profile" lead="Your name, phone and password.">
      <div className="space-y-6">
        <section className="hairline rounded-xl bg-card p-6">
          <h2 className="font-display text-xl">Your details</h2>
          {!draft ? (
            <div className="mt-4 h-20 animate-pulse rounded bg-cream-100" />
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold">Full name</span>
                <input
                  value={draft.full_name}
                  onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold">Mobile number</span>
                <input
                  value={draft.phone}
                  onChange={(e) =>
                    setDraft({ ...draft, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                  className={cn(inputClass, "num")}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold">Email</span>
                <input
                  value={user?.email ?? ""}
                  disabled
                  className={cn(inputClass, "opacity-60")}
                />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => save.mutate()}
                  disabled={save.isPending}
                  className="rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-cream-50 disabled:opacity-50"
                >
                  {save.isPending ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="hairline rounded-xl bg-card p-6">
          <h2 className="font-display text-xl">Change password</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className={cn(inputClass, "max-w-xs")}
            />
            <button
              type="button"
              onClick={() => changePassword.mutate()}
              disabled={changePassword.isPending}
              className="rounded-md border border-line-200 px-5 py-2.5 text-sm font-semibold hover:border-gold-500 disabled:opacity-50"
            >
              Update password
            </button>
          </div>
        </section>
      </div>
    </AccountLayout>
  );
}

const inputClass =
  "w-full rounded-md border border-line-200 bg-card px-3 py-2.5 text-sm outline-none focus:border-gold-500";
