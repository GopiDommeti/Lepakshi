import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Star, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/AdminLayout";
import { Btn, EmptyState, Loading, Panel, Pill, Table, Td } from "@/components/admin/ui";
import { adminProductsQuery, simpleListQuery, type ReviewRow } from "@/lib/admin";
import { db } from "@/lib/db";
import { dateOnly } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: ReviewsScreen,
});

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn("size-3.5", n <= rating ? "fill-gold-500 text-gold-500" : "text-line-200")}
        />
      ))}
    </span>
  );
}

function ReviewsScreen() {
  const qc = useQueryClient();
  const reviews = useQuery(simpleListQuery("reviews", { column: "created_at", ascending: false }));
  const products = useQuery(adminProductsQuery());
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await db.from("reviews").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Review updated");
      void qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
      void qc.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = ((reviews.data ?? []) as ReviewRow[]).filter((r) => r.status === tab);
  const productName = (id: string) =>
    products.data?.find((p) => p.id === id)?.name ?? "Unknown product";

  return (
    <AdminPage title="Reviews" description="Nothing appears on the storefront until you approve it.">
      <div className="mb-4 flex gap-1 border-b border-line-200">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3.5 py-2 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "border-gold-500 text-green-900"
                : "border-transparent text-ink-500 hover:text-ink-900",
            )}
          >
            {t}
            <span className="num ml-1.5 text-xs">
              {((reviews.data ?? []) as ReviewRow[]).filter((r) => r.status === t).length}
            </span>
          </button>
        ))}
      </div>

      <Panel>
        {reviews.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState title={`Nothing ${tab}`} />
        ) : (
          <Table head={["Product", "Rating", "Review", "Author", "Date", ""]}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-cream-100/50">
                <Td className="font-medium">{productName(r.product_id)}</Td>
                <Td>
                  <Stars rating={r.rating} />
                </Td>
                <Td className="max-w-[360px]">
                  {r.title ? <p className="font-medium">{r.title}</p> : null}
                  <p className="text-sm text-ink-500">{r.body}</p>
                </Td>
                <Td className="text-sm">
                  {r.author_name ?? "Anonymous"}
                  {r.author_town ? (
                    <span className="block text-xs text-ink-500">{r.author_town}</span>
                  ) : null}
                  {r.is_verified_purchase ? (
                    <Pill tone="good">Verified</Pill>
                  ) : null}
                </Td>
                <Td className="text-xs text-ink-500">{dateOnly(r.created_at)}</Td>
                <Td className="w-32">
                  <div className="flex justify-end gap-1">
                    {r.status !== "approved" ? (
                      <Btn
                        variant="outline"
                        className="px-2 py-1"
                        onClick={() => setStatus.mutate({ id: r.id, status: "approved" })}
                      >
                        <Check /> Approve
                      </Btn>
                    ) : null}
                    {r.status !== "rejected" ? (
                      <Btn
                        variant="ghost"
                        className="px-2 py-1"
                        onClick={() => setStatus.mutate({ id: r.id, status: "rejected" })}
                      >
                        <X />
                      </Btn>
                    ) : null}
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>
    </AdminPage>
  );
}
