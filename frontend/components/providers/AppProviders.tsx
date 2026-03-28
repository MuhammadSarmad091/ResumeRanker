"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultPreferences, type UserPreferences } from "@/lib/prefs";
import { applyThemeToDocument } from "@/lib/theme";

type User = { id: string; email: string; name: string } | null;

type UserCtx = {
  user: User;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserCtx | null>(null);

export function useUser() {
  const c = useContext(UserContext);
  if (!c) throw new Error("useUser outside AppProviders");
  return c;
}

type PrefsCtx = {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<boolean>;
  setLocalPreferences: (p: UserPreferences) => void;
};

const PreferencesContext = createContext<PrefsCtx | null>(null);

export function usePreferences() {
  const c = useContext(PreferencesContext);
  if (!c) throw new Error("usePreferences outside AppProviders");
  return c;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>(
    defaultPreferences
  );
  const [prefsLoading, setPrefsLoading] = useState(false);

  const refreshUser = useCallback(async () => {
    setUserLoading(true);
    try {
      const r = await fetch("/api/auth/me", { credentials: "include" });
      const data = (await r.json()) as { user: User };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loadPrefs = useCallback(async () => {
    setPrefsLoading(true);
    try {
      const r = await fetch("/api/me/preferences", { credentials: "include" });
      if (!r.ok) return;
      const data = (await r.json()) as { preferences: UserPreferences };
      setPreferences(data.preferences);
    } catch {
      /* ignore */
    } finally {
      setPrefsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadPrefs();
    } else {
      setPreferences(defaultPreferences);
    }
  }, [user, loadPrefs]);

  useEffect(() => {
    applyThemeToDocument(preferences.theme);
  }, [preferences.theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (preferences.theme === "system") {
        applyThemeToDocument("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preferences.theme]);

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      try {
        const r = await fetch("/api/me/preferences", {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!r.ok) return false;
        const data = (await r.json()) as { preferences: UserPreferences };
        setPreferences(data.preferences);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    setPreferences(defaultPreferences);
    applyThemeToDocument(defaultPreferences.theme);
  }, []);

  const userValue = useMemo(
    () => ({
      user,
      loading: userLoading,
      refreshUser,
      logout,
    }),
    [user, userLoading, refreshUser, logout]
  );

  const prefsValue = useMemo(
    () => ({
      preferences,
      loading: prefsLoading,
      updatePreferences,
      setLocalPreferences: setPreferences,
    }),
    [preferences, prefsLoading, updatePreferences]
  );

  return (
    <UserContext.Provider value={userValue}>
      <PreferencesContext.Provider value={prefsValue}>
        {children}
      </PreferencesContext.Provider>
    </UserContext.Provider>
  );
}
