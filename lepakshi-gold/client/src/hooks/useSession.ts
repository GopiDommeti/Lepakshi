import { useEffect, useState } from "react";

import { auth, getUser, onAuthChange, type SessionUser } from "@/lib/auth";

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void getUser().then((next) => {
      if (alive) {
        setUser(next);
        setLoading(false);
      }
    });
    const off = onAuthChange((next) => {
      if (alive) setUser(next);
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  return { user, session: user, loading, signOut: auth.signOut };
}

export function useIsStaff() {
  const { user, loading } = useSession();
  return {
    isStaff: Boolean(user?.isStaff),
    isOwner: Boolean(user?.isOwner),
    role: user?.role ?? null,
    loading,
  };
}
