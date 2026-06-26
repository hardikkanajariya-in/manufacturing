const AUTH_KEY = "mes_auth";
const USER_KEY = "mes_user";
const UNIT_KEY = "mes_active_unit";

import type { UserProfile } from "@/lib/types";

export function persistSession(user: UserProfile, activeUnitId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, "true");
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(UNIT_KEY, activeUnitId);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(UNIT_KEY);
}

export function readSession(): {
  isAuthenticated: boolean;
  user: UserProfile | null;
  activeUnitId: string | null;
} {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null, activeUnitId: null };
  }

  const isAuthenticated = localStorage.getItem(AUTH_KEY) === "true";
  const userRaw = localStorage.getItem(USER_KEY);
  const activeUnitId = localStorage.getItem(UNIT_KEY);

  let user: UserProfile | null = null;
  if (userRaw) {
    try {
      user = JSON.parse(userRaw) as UserProfile;
    } catch {
      user = null;
    }
  }

  return { isAuthenticated, user, activeUnitId };
}

export function persistActiveUnit(unitId: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(UNIT_KEY, unitId);
}
