/** Everything the browser sends to the Express API goes through here. */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
  let response: Response;
  try {
    const init: RequestInit = { method, credentials: "include" };
    if (body !== undefined) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(body);
    }
    response = await fetch(path, init);
  } catch {
    throw new ApiError(
      0,
      "Can't reach the server. Is it running? Start it with: cd server && npm run dev",
    );
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as { data?: T; error?: string }) : {};

  if (!response.ok) {
    throw new ApiError(response.status, payload.error || `Request failed (${response.status}).`);
  }
  return (payload.data ?? null) as T;
}

export const api = {
  post: <T>(path: string, body?: unknown) => request<T>(path, body, "POST"),
  get: <T>(path: string) => request<T>(path, undefined, "GET"),

  async upload(files: FileList | File[]): Promise<string[]> {
    const form = new FormData();
    for (const file of Array.from(files)) form.append("files", file);
    const response = await fetch("/api/uploads", {
      method: "POST",
      credentials: "include",
      body: form,
    });
    const payload = (await response.json()) as { data?: string[]; error?: string };
    if (!response.ok) throw new ApiError(response.status, payload.error || "Upload failed.");
    return payload.data ?? [];
  },
};
