import { Link } from "@tanstack/react-router";
import { Heart, LogOut, MapPin, Package, Star, User } from "lucide-react";
import type { ReactNode } from "react";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/account", label: "Overview", icon: User },
  { to: "/account/orders", label: "My orders", icon: Package },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/reviews", label: "My reviews", icon: Star },
  { to: "/account/profile", label: "Profile", icon: User },
] as const;

export function AccountLayout({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string | undefined;
  children: ReactNode;
}) {
  return (
    <StoreLayout>
      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <p className="eyebrow text-gold-600">Your account</p>
        <h1 className="mt-3 font-display text-4xl">{title}</h1>
        {lead ? <p className="mt-3 max-w-[62ch] text-ink-500">{lead}</p> : null}

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_1fr]">
          <nav aria-label="Account" className="h-fit space-y-0.5">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/account" }}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
                activeProps={{ className: "bg-cream-100 text-ink-900 font-medium" }}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                void supabase.auth.signOut();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-500 hover:text-destructive"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </nav>

          <div className={cn("min-w-0")}>{children}</div>
        </div>
      </div>
    </StoreLayout>
  );
}
