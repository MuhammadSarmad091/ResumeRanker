const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export function getShortlist(userId: string): string[] {
  if (typeof window === "undefined") return [];
  return safeParse<string[]>(
    localStorage.getItem(`rr_shortlist_${userId}`),
    []
  );
}

export function setShortlist(userId: string, keys: string[]) {
  localStorage.setItem(`rr_shortlist_${userId}`, JSON.stringify(keys));
}

export function getNotes(userId: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, string>>(
    localStorage.getItem(`rr_notes_${userId}`),
    {}
  );
}

export function setNotes(userId: string, notes: Record<string, string>) {
  localStorage.setItem(`rr_notes_${userId}`, JSON.stringify(notes));
}

export type HistoryEntry = {
  at: string;
  roleTitle: string;
  resumeCount: number;
  topScore: number;
};

export function pushHistory(userId: string, entry: HistoryEntry) {
  const key = `rr_history_${userId}`;
  const prev = safeParse<HistoryEntry[]>(localStorage.getItem(key), []);
  const next = [entry, ...prev].slice(0, 20);
  localStorage.setItem(key, JSON.stringify(next));
}

export function getHistory(userId: string): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  return safeParse<HistoryEntry[]>(localStorage.getItem(`rr_history_${userId}`), []);
}

export function candidateKey(
  c: { rank: number; email?: string; name?: string },
  index: number
): string {
  const e = (c.email ?? "").toLowerCase();
  const n = (c.name ?? "").toLowerCase();
  return `${e}|${n}|${c.rank}|${index}`;
}
