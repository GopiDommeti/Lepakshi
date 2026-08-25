import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/AdminLayout";
import {
  Btn,
  EmptyState,
  Field,
  Loading,
  Panel,
  Pill,
  Table,
  Td,
  TextArea,
  TextInput,
} from "@/components/admin/ui";
import { simpleListQuery, type EnquiryRow, type FaqRow, type PageRow } from "@/lib/admin";
import { db } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/content")({
  component: ContentScreen,
});

const TABS = ["Home page", "FAQs", "Pages", "Enquiries"] as const;

function ContentScreen() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Home page");

  return (
    <AdminPage title="Content" description="The words and blocks on the public site.">
      <div className="mb-5 flex flex-wrap gap-1 border-b border-line-200">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px border-b-2 px-3.5 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "border-gold-500 text-green-900"
                : "border-transparent text-ink-500 hover:text-ink-900",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Home page" ? <HomeBlocks /> : null}
      {tab === "FAQs" ? <Faqs /> : null}
      {tab === "Pages" ? <Pages /> : null}
      {tab === "Enquiries" ? <Enquiries /> : null}
    </AdminPage>
  );
}

function HomeBlocks() {
  const qc = useQueryClient();
  const blocks = useQuery(simpleListQuery("content_blocks", { column: "sort_order" }));
  const [hero, setHero] = useState({
    eyebrow: "",
    headline: "",
    lead: "",
    primaryLabel: "",
    secondaryLabel: "",
  });
  const [announcement, setAnnouncement] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const rows = (blocks.data ?? []) as { id: string; key: string; data: unknown; is_active: boolean }[];
  if (!hydrated && rows.length > 0) {
    const heroBlock = rows.find((b) => b.key === "home_hero")?.data as Record<string, string> | undefined;
    const annBlock = rows.find((b) => b.key === "announcement")?.data as
      | Record<string, string>
      | undefined;
    setHero({
      eyebrow: heroBlock?.["eyebrow"] ?? "Since 2003 · Andhra Pradesh",
      headline: heroBlock?.["headline"] ?? "Oil the way it was always made.",
      lead:
        heroBlock?.["lead"] ??
        "Organic seed, cold-pressed in small batches, settled naturally and filtered. No heat, no solvents, no shortcuts.",
      primaryLabel: heroBlock?.["primaryLabel"] ?? "Shop the range",
      secondaryLabel: heroBlock?.["secondaryLabel"] ?? "How organic works",
    });
    setAnnouncement(
      annBlock?.["text"] ?? "Certified organic · Cold-pressed to order · Free delivery above ₹999",
    );
    setHydrated(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      const upserts = [
        { key: "home_hero", data: hero, is_active: true, sort_order: 1 },
        { key: "announcement", data: { text: announcement }, is_active: true, sort_order: 0 },
      ];
      for (const row of upserts) {
        const existing = rows.find((b) => b.key === row.key);
        const res = existing
          ? await db.from("content_blocks").update(row).eq("id", existing.id)
          : await db.from("content_blocks").insert(row);
        if (res.error) throw new Error(res.error.message);
      }
    },
    onSuccess: () => {
      toast.success("Home page updated");
      void qc.invalidateQueries({ queryKey: ["admin", "content_blocks"] });
      void qc.invalidateQueries({ queryKey: ["content-block"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (blocks.isLoading) return <Loading rows={6} />;

  return (
    <Panel
      title="Hero and announcement"
      actions={
        <Btn disabled={save.isPending} onClick={() => save.mutate()}>
          Save changes
        </Btn>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Announcement bar" className="sm:col-span-2">
          <TextInput
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
          />
        </Field>
        <Field label="Hero eyebrow">
          <TextInput value={hero.eyebrow} onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })} />
        </Field>
        <Field label="Primary button label">
          <TextInput
            value={hero.primaryLabel}
            onChange={(e) => setHero({ ...hero, primaryLabel: e.target.value })}
          />
        </Field>
        <Field label="Headline" className="sm:col-span-2">
          <TextInput
            value={hero.headline}
            onChange={(e) => setHero({ ...hero, headline: e.target.value })}
          />
        </Field>
        <Field label="Lead paragraph" className="sm:col-span-2">
          <TextArea value={hero.lead} onChange={(e) => setHero({ ...hero, lead: e.target.value })} />
        </Field>
        <Field label="Secondary button label">
          <TextInput
            value={hero.secondaryLabel}
            onChange={(e) => setHero({ ...hero, secondaryLabel: e.target.value })}
          />
        </Field>
      </div>
    </Panel>
  );
}

function Faqs() {
  const qc = useQueryClient();
  const faqs = useQuery(simpleListQuery("faqs", { column: "sort_order" }));
  const [draft, setDraft] = useState({ question: "", answer: "" });

  const rows = (faqs.data ?? []) as FaqRow[];

  const add = useMutation({
    mutationFn: async () => {
      if (!draft.question.trim() || !draft.answer.trim()) {
        throw new Error("Both the question and the answer are needed.");
      }
      const { error } = await db.from("faqs").insert({
        question: draft.question.trim(),
        answer: draft.answer.trim(),
        sort_order: rows.length + 1,
        is_active: true,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("FAQ added");
      setDraft({ question: "", answer: "" });
      void qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      void qc.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async (row: FaqRow) => {
      const { error } = await db
        .from("faqs")
        .update({ is_active: !row.is_active })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      void qc.invalidateQueries({ queryKey: ["faqs"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("faqs").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "faqs"] });
      void qc.invalidateQueries({ queryKey: ["faqs"] });
    },
  });

  return (
    <div className="space-y-5">
      <Panel title="Questions on the site">
        {faqs.isLoading ? (
          <Loading rows={3} />
        ) : rows.length === 0 ? (
          <EmptyState title="No FAQs yet" hint="Answer the questions customers actually ask you on the phone." />
        ) : (
          <Table head={["Question", "Answer", "Shown", ""]}>
            {rows.map((f) => (
              <tr key={f.id}>
                <Td className="max-w-[260px] font-medium">{f.question}</Td>
                <Td className="max-w-[420px] text-sm text-ink-500">{f.answer}</Td>
                <Td>
                  <button type="button" onClick={() => toggle.mutate(f)}>
                    <Pill tone={f.is_active ? "good" : "neutral"}>
                      {f.is_active ? "Live" : "Hidden"}
                    </Pill>
                  </button>
                </Td>
                <Td className="w-12">
                  <button
                    type="button"
                    aria-label="Delete FAQ"
                    className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                    onClick={() => remove.mutate(f.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      <Panel title="Add a question">
        <div className="space-y-4">
          <Field label="Question">
            <TextInput
              value={draft.question}
              placeholder="Why does organic cold-pressed oil cost more than refined oil?"
              onChange={(e) => setDraft({ ...draft, question: e.target.value })}
            />
          </Field>
          <Field label="Answer">
            <TextArea
              value={draft.answer}
              onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
            />
          </Field>
          <Btn onClick={() => add.mutate()}>
            <Plus /> Add FAQ
          </Btn>
        </div>
      </Panel>
    </div>
  );
}

function Pages() {
  const qc = useQueryClient();
  const pages = useQuery(simpleListQuery("pages", { column: "slug" }));
  const rows = (pages.data ?? []) as PageRow[];
  const [editing, setEditing] = useState<{ id: string; title: string; body: string } | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await db
        .from("pages")
        .update({
          title: editing.title,
          content: { body: editing.body },
          updated_at: new Date().toISOString(),
        })
        .eq("id", editing.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Page saved");
      setEditing(null);
      void qc.invalidateQueries({ queryKey: ["admin", "pages"] });
      void qc.invalidateQueries({ queryKey: ["page"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <Panel title="Policy pages">
        {pages.isLoading ? (
          <Loading rows={3} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No pages in the database"
            hint="Shipping, returns, privacy and terms fall back to built-in copy until you add rows here."
          />
        ) : (
          <Table head={["Slug", "Title", "Published", ""]}>
            {rows.map((p) => (
              <tr key={p.id}>
                <Td className="num">{p.slug}</Td>
                <Td className="font-medium">{p.title}</Td>
                <Td>
                  <Pill tone={p.is_published ? "good" : "neutral"}>
                    {p.is_published ? "Live" : "Draft"}
                  </Pill>
                </Td>
                <Td className="w-24">
                  <Btn
                    variant="outline"
                    className="px-2 py-1"
                    onClick={() =>
                      setEditing({
                        id: p.id,
                        title: p.title,
                        body: String((p.content as { body?: string } | null)?.body ?? ""),
                      })
                    }
                  >
                    Edit
                  </Btn>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </Panel>

      {editing ? (
        <Panel
          title="Edit page"
          actions={
            <>
              <Btn variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Btn>
              <Btn onClick={() => save.mutate()}>Save page</Btn>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Title">
              <TextInput
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              />
            </Field>
            <Field label="Body" hint="Plain paragraphs. Leave a blank line between them.">
              <TextArea
                className="min-h-[280px]"
                value={editing.body}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              />
            </Field>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

function Enquiries() {
  const enquiries = useQuery(simpleListQuery("enquiries", { column: "created_at", ascending: false }));
  const rows = (enquiries.data ?? []) as EnquiryRow[];

  return (
    <Panel title="Contact form enquiries">
      {enquiries.isLoading ? (
        <Loading rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState title="No enquiries yet" hint="Messages from the contact page land here." />
      ) : (
        <Table head={["When", "Name", "Phone", "Type", "Message"]}>
          {rows.map((e) => (
            <tr key={e.id}>
              <Td className="whitespace-nowrap text-xs text-ink-500">{dateTime(e.created_at)}</Td>
              <Td className="font-medium">{e.name}</Td>
              <Td className="num text-sm">{e.phone ?? "—"}</Td>
              <Td>
                <Pill>{e.type ?? "general"}</Pill>
              </Td>
              <Td className="max-w-[420px] text-sm text-ink-500">{e.message}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}
