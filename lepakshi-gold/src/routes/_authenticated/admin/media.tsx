import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AdminPage } from "@/components/admin/AdminLayout";
import {
  Btn,
  EmptyState,
  Field,
  Loading,
  Panel,
  TextInput,
} from "@/components/admin/ui";
import { simpleListQuery, type MediaRow } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/media")({
  component: MediaScreen,
});

const BUCKET = "media";

function MediaScreen() {
  const qc = useQueryClient();
  const media = useQuery(simpleListQuery("media", { column: "created_at", ascending: false }));
  const fileInput = useRef<HTMLInputElement>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [search, setSearch] = useState("");

  const rows = ((media.data ?? []) as MediaRow[]).filter((m) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (m.filename ?? "").toLowerCase().includes(term) || m.url.toLowerCase().includes(term);
  });

  const upload = useMutation({
    mutationFn: async (files: FileList) => {
      for (const file of Array.from(files)) {
        const path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "-")}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
        });
        if (error) {
          throw new Error(
            `${error.message}. Create a public storage bucket called "${BUCKET}" in Supabase, or paste image URLs instead.`,
          );
        }
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        await supabase.from("media").insert({
          url: pub.publicUrl,
          filename: file.name,
          size_bytes: file.size,
          folder: "products",
        });
      }
    },
    onSuccess: () => {
      toast.success("Uploaded");
      void qc.invalidateQueries({ queryKey: ["admin", "media"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addByUrl = useMutation({
    mutationFn: async () => {
      const url = manualUrl.trim();
      if (!/^https?:\/\//.test(url)) throw new Error("Paste a full https:// image URL.");
      const { error } = await supabase.from("media").insert({
        url,
        filename: url.split("/").pop() ?? "image",
        folder: "products",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Image added");
      setManualUrl("");
      void qc.invalidateQueries({ queryKey: ["admin", "media"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("media").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin", "media"] }),
  });

  return (
    <AdminPage
      title="Media"
      description="Product photography. Copy a URL and paste it into a product."
      actions={
        <Btn onClick={() => fileInput.current?.click()}>
          <Upload /> Upload images
        </Btn>
      }
    >
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) upload.mutate(e.target.files);
          e.target.value = "";
        }}
      />

      <Panel className="mb-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Add by URL" hint="Useful while your photos live somewhere else.">
            <div className="flex gap-2">
              <TextInput
                value={manualUrl}
                placeholder="https://…/groundnut-1l.jpg"
                onChange={(e) => setManualUrl(e.target.value)}
              />
              <Btn variant="outline" onClick={() => addByUrl.mutate()}>
                Add
              </Btn>
            </div>
          </Field>
          <Field label="Search library">
            <TextInput
              value={search}
              placeholder="Filename"
              onChange={(e) => setSearch(e.target.value)}
            />
          </Field>
        </div>
      </Panel>

      <Panel title={`${rows.length} images`}>
        {media.isLoading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Nothing uploaded yet"
            hint="Shoot each bottle and tin square on a plain cream background — the whole storefront design leans on these."
          />
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {rows.map((m) => (
              <li key={m.id} className="hairline overflow-hidden rounded-lg bg-card">
                <div className="aspect-square bg-cream-100">
                  <img
                    src={m.url}
                    alt={m.alt_text ?? m.filename ?? ""}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </div>
                <div className="p-2.5">
                  <p className="truncate text-xs text-ink-500" title={m.filename ?? ""}>
                    {m.filename}
                  </p>
                  <div className="mt-2 flex gap-1">
                    <Btn
                      variant="outline"
                      className="flex-1 px-2 py-1 text-xs"
                      onClick={() => {
                        void navigator.clipboard.writeText(m.url);
                        toast.success("URL copied");
                      }}
                    >
                      <Copy /> Copy
                    </Btn>
                    <Btn
                      variant="ghost"
                      className="px-2 py-1"
                      onClick={() => remove.mutate(m.id)}
                      aria-label="Delete image"
                    >
                      <Trash2 />
                    </Btn>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AdminPage>
  );
}
