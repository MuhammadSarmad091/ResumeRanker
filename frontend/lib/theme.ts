export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "rr-theme";

export function applyThemeToDocument(mode: ThemePreference): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const useDark = mode === "dark" || (mode === "system" && mq.matches);
  root.classList.toggle("dark", useDark);
  root.style.colorScheme = useDark ? "dark" : "light";
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* private mode */
  }
}

export function readStoredThemeMode(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* ignore */
  }
  return null;
}
