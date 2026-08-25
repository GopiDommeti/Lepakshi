import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  FileText,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  Receipt,
  Settings,
  ShoppingCart,
  Star,
  Store,
  Tags,
  Truck,
  Users,
  SlidersHorizontal,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Wordmark } from "@/components/brand/Wordmark";
import { useIsStaff, useSession } from "@/hooks/useSession";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/attributes", label: "Attributes", icon: SlidersHorizontal },
  { to: "/admin/stock", label: "Stock", icon: Boxes },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/coupons", label: "Coupons", icon: Percent },
  { to: "/admin/shipping", label: "Shipping", icon: Truck },
  { to: "/admin/tax", label: "Tax", icon: Receipt },
  { to: "/admin/content", label: "Content", icon: FileText },
  { to: "/admin/media", label: "Media", icon: Image },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/admin" }}
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-cream-100/75 transition-colors hover:bg-green-900 hover:text-cream-50"
          activeProps={{ className: "bg-green-900 text-cream-50" }}
        >
          <Icon className="size-4" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-cream-50">
      <aside className="hidden w-[232px] shrink-0 flex-col bg-green-950 p-4 lg:flex">
        <Link to="/" className="px-2 py-3">
          <Wordmark tone="light" showTagline={false} />
        </Link>
        <div className="mt-4">
          <NavList />
        </div>
        <Link
          to="/"
          className="mt-auto flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-cream-100/60 hover:text-cream-50"
        >
          <Store className="size-3.5" aria-hidden />
          View storefront
        </Link>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-green-950/50"
            role="presentation"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[260px] flex-col overflow-y-auto bg-green-950 p-4">
            <Wordmark tone="light" showTagline={false} />
            <div className="mt-4">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex size-12 items-center justify-center rounded-full bg-green-900 text-cream-50 shadow-lg lg:hidden"
          aria-label="Open admin menu"
        >
          <Menu className="size-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

/**
 * Standard admin page frame. Renders an access notice when the signed-in user
 * has no staff role, so a customer who guesses /admin sees nothing sensitive.
 */
export function AdminPage({
  title,
  description,
  actions,
  ownerOnly = false,
  children,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  ownerOnly?: boolean | undefined;
  children?: ReactNode | undefined;
}) {
  const { user } = useSession();
  const { isStaff, isOwner, loading } = useIsStaff();
  const navigate = useNavigate();

  const blocked = !loading && (!isStaff || (ownerOnly && !isOwner));

  return (
    <AdminLayout>
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-line-200 bg-cream-50/95 px-6 py-4 backdrop-blur">
        <div>
          <h1 className="font-display text-2xl leading-tight">{title}</h1>
          {description ? <p className="mt-0.5 text-xs text-ink-500">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {user ? (
            <button
              type="button"
              onClick={() => {
                void auth.signOut().then(() => navigate({ to: "/" }));
              }}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-xs text-ink-500 hover:text-ink-900"
            >
              <LogOut className="size-3.5" aria-hidden />
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      <div className={cn("p-6", blocked && "pointer-events-none")}>
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-cream-100" />
        ) : blocked ? (
          <div className="hairline rounded-xl bg-card p-10 text-center">
            <h2 className="font-display text-xl">
              {ownerOnly ? "Owner access only" : "Staff access only"}
            </h2>
            <p className="mx-auto mt-2 max-w-[52ch] text-sm text-ink-500">
              {ownerOnly
                ? "This screen shows cost prices and store configuration, so it is limited to the owner account."
                : "This account doesn't have a staff role yet. Ask the owner to add one in Settings, under Users."}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </AdminLayout>
  );
}
