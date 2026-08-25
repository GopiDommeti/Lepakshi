import { api, ApiError } from "@/lib/api";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: "owner" | "manager" | "staff" | null;
  isStaff: boolean;
  isOwner: boolean;
};

type Listener = (user: SessionUser | null) => void;

let cached: SessionUser | null = null;
let loaded = false;
let inflight: Promise<SessionUser | null> | null = null;
const listeners = new Set<Listener>();

function broadcast() {
  for (const listener of listeners) listener(cached);
}

/** Reads the session cookie through the API. Cached so screens don't all refetch. */
export async function getUser(force = false): Promise<SessionUser | null> {
  if (loaded && !force) return cached;
  if (!inflight || force) {
    inflight = (async () => {
      try {
        const response = await fetch("/api/auth/me", { credentials: "include" });
        const payload = (await response.json()) as { user: SessionUser | null };
        cached = payload.user ?? null;
      } catch {
        cached = null;
      }
      loaded = true;
      inflight = null;
      broadcast();
      return cached;
    })();
  }
  return inflight;
}

export function onAuthChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const auth = {
  getUser,

  async signIn(email: string, password: string) {
    await api.post("/api/auth/login", { email, password });
    await getUser(true);
  },

  async signUp(email: string, password: string, fullName?: string, phone?: string) {
    await api.post("/api/auth/register", { email, password, fullName, phone });
    await getUser(true);
  },

  async signOut() {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* signing out locally still matters */
    }
    cached = null;
    loaded = true;
    broadcast();
  },

  async updatePassword(password: string) {
    await api.post("/api/auth/password", { password });
    cached = null;
    loaded = true;
    broadcast();
  },

  isApiError: (error: unknown): error is ApiError => error instanceof ApiError,
};
