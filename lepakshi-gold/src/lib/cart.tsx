import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  variationId: string;
  productId: string;
  slug: string;
  productName: string;
  variationLabel: string;
  sku: string;
  price: number;
  weightGrams: number;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  weightGrams: number;
  add: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  setQuantity: (variationId: string, quantity: number) => void;
  remove: (variationId: string) => void;
  clear: () => void;
};

const KEY = "lg-cart-v1";
const Ctx = createContext<CartContextValue | null>(null);

function read(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    setLines(read());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.price * l.quantity, 0),
      weightGrams: lines.reduce((s, l) => s + l.weightGrams * l.quantity, 0),
      add: (line, quantity = 1) =>
        setLines((prev) => {
          const existing = prev.find((l) => l.variationId === line.variationId);
          if (existing) {
            return prev.map((l) =>
              l.variationId === line.variationId
                ? { ...l, ...line, quantity: Math.min(99, l.quantity + quantity) }
                : l,
            );
          }
          return [...prev, { ...line, quantity }];
        }),
      setQuantity: (variationId, quantity) =>
        setLines((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.variationId !== variationId)
            : prev.map((l) =>
                l.variationId === variationId ? { ...l, quantity: Math.min(99, quantity) } : l,
              ),
        ),
      remove: (variationId) => setLines((prev) => prev.filter((l) => l.variationId !== variationId)),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
