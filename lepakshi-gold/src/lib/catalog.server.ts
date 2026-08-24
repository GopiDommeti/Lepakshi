import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const loadCategories = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchCategories } = await import("./catalog.data");
  return fetchCategories();
});

export const loadProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ categorySlug: z.string().min(1).optional() }).parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { fetchProducts } = await import("./catalog.data");
    return fetchProducts(data.categorySlug);
  });

export const loadProduct = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { fetchProduct } = await import("./catalog.data");
    return fetchProduct(data.slug);
  });

export const loadReviews = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ productId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { fetchReviews } = await import("./catalog.data");
    return fetchReviews(data.productId);
  });

export const loadSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchSettings } = await import("./catalog.data");
  return fetchSettings();
});

export const loadFaqs = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchFaqs } = await import("./catalog.data");
  return fetchFaqs();
});

export const loadContentBlock = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ key: z.string().min(1).max(80) }).parse(input))
  .handler(async ({ data }) => {
    const { fetchContentBlock } = await import("./catalog.data");
    return fetchContentBlock(data.key);
  });
