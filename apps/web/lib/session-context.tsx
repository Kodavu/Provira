"use client";

// One place the authenticated app reads "who am I": user id, name, the roles
// they hold, and which role is currently active (persisted, so a multi-role
// user's choice sticks across pages). Every page under (app) consumes this
// instead of refetching the profile, and the shell renders nav from it.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { primaryRole, type Role } from "@/lib/auth";

const ACTIVE_ROLE_KEY = "provira.role";

export interface Session {
  userId: string;
  fullName: string | null;
  roles: Role[];
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  /** Re-fetch the profile (e.g. after adding a role). */
  refresh: () => Promise<void>;
}

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

interface Profile {
  fullName: string | null;
  roles: Role[];
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeRole, setActiveRoleState] = useState<Role | null>(null);

  const fetchProfile = useCallback(async (id: string): Promise<Profile> => {
    const u = await api.getUser(id);
    return {
      fullName: u.fullName,
      roles: u.roles.map((r) => r.role as Role),
    };
  }, []);

  const load = useCallback(async () => {
    const id = getUserId();
    if (!id) {
      router.replace("/login");
      return;
    }
    try {
      const p = await fetchProfile(id);
      if (p.roles.length === 0) {
        // Verified but never picked a role — finish onboarding.
        router.replace("/signup");
        return;
      }
      setUserId(id);
      setProfile(p);
      const stored = (typeof window !== "undefined"
        ? (localStorage.getItem(ACTIVE_ROLE_KEY) as Role | null)
        : null);
      const active = stored && p.roles.includes(stored) ? stored : primaryRole(p.roles)!;
      setActiveRoleState(active);
    } catch {
      router.replace("/login");
    }
  }, [router, fetchProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const setActiveRole = useCallback((role: Role) => {
    setActiveRoleState(role);
    if (typeof window !== "undefined") localStorage.setItem(ACTIVE_ROLE_KEY, role);
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setProfile(await fetchProfile(userId));
  }, [userId, fetchProfile]);

  const value = useMemo<Session | null>(() => {
    if (!userId || !profile || !activeRole) return null;
    return {
      userId,
      fullName: profile.fullName,
      roles: profile.roles,
      activeRole,
      setActiveRole,
      refresh,
    };
  }, [userId, profile, activeRole, setActiveRole, refresh]);

  if (!value) return <BootSkeleton />;

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// Full-screen shell skeleton while we resolve the session — matches the app
// layout so there's no jarring flash before content mounts.
function BootSkeleton() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="hidden w-64 shrink-0 border-r border-line bg-surface px-4 py-6 md:block">
        <div className="h-8 w-24 rounded-lg bg-line" />
        <div className="mt-10 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-full rounded-xl bg-line/60" />
          ))}
        </div>
      </aside>
      <div className="flex-1 px-6 py-8">
        <div className="h-14 w-full rounded-2xl bg-line/50" />
        <div className="mx-auto mt-8 max-w-6xl">
          <div className="h-9 w-64 rounded-lg bg-line" />
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-line/50" />
            ))}
          </div>
          <div className="mt-6 h-64 w-full rounded-2xl bg-line/40" />
        </div>
      </div>
    </div>
  );
}
