/** Turn any label into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** SKU-safe uppercase token, e.g. "Palli Ganuga" + "1 L" -> "PALLI-GANUGA-1-L". */
export function skuToken(...parts: (string | null | undefined)[]): string {
  return parts
    .filter(Boolean)
    .map((p) => slugify(String(p)))
    .filter(Boolean)
    .join("-")
    .toUpperCase();
}

/** A 13-digit numeric barcode. Not a registered GS1 code — fine for internal use. */
export function generateBarcode(): string {
  let digits = "890";
  for (let i = 0; i < 9; i += 1) digits += Math.floor(Math.random() * 10);
  let sum = 0;
  for (let i = 0; i < 12; i += 1) {
    sum += Number(digits.charAt(i)) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return digits + String(check);
}

export function randomCouponCode(prefix = "LG"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${out}`;
}
