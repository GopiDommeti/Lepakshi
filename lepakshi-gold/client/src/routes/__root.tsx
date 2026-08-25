import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/lib/cart";
import { onAuthChange } from "@/lib/auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6">
      <div className="max-w-md text-center">
        <p className="eyebrow text-gold-600">Nothing here</p>
        <h1 className="mt-3 font-display text-6xl text-green-900">404</h1>
        <h2 className="mt-4 font-display text-xl">This page has moved on</h2>
        <p className="mt-2 text-sm text-ink-500">
          The link may be old, or the page may have been renamed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-cream-50"
          >
            Go home
          </Link>
          <Link
            to="/shop"
            className="rounded-md border border-line-200 px-5 py-2.5 text-sm font-semibold"
          >
            Shop the range
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl">This page didn't load</h1>
        <p className="mt-2 text-sm text-ink-500">{error.message}</p>
        <p className="mt-2 text-xs text-ink-500">
          If this keeps happening, check that the API is running:{" "}
          <span className="num">cd server &amp;&amp; npm run dev</span>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              void router.invalidate();
              reset();
            }}
            className="rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-cream-50"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-md border border-line-200 px-5 py-2.5 text-sm font-semibold"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  // Signing in or out changes what the whole app is allowed to see.
  useEffect(
    () =>
      onAuthChange(() => {
        void router.invalidate();
        void queryClient.invalidateQueries();
      }),
    [router, queryClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Outlet />
        <Toaster position="top-center" />
      </CartProvider>
    </QueryClientProvider>
  );
}
