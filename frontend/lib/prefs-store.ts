import fs from "node:fs";
import path from "node:path";
import {
  defaultPreferences,
  normalizePreferences,
  preferencesSchema,
  type UserPreferences,
} from "./prefs";

const DATA_DIR = path.join(process.cwd(), "data");
const PREFS_FILE = path.join(DATA_DIR, "prefs.json");

type PrefsFile = Record<string, unknown>;

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readFile(): PrefsFile {
  ensureDir();
  if (!fs.existsSync(PREFS_FILE)) return {};
  try {
    const raw = fs.readFileSync(PREFS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as PrefsFile)
      : {};
  } catch {
    return {};
  }
}

function writeFile(data: PrefsFile): void {
  ensureDir();
  const tmp = `${PREFS_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, PREFS_FILE);
}

function mergeWithDefaults(raw: unknown): UserPreferences {
  const base = { ...defaultPreferences };
  if (typeof raw !== "object" || raw === null) {
    return base;
  }
  const o = raw as Record<string, unknown>;
  const swIn = o.sectionWeights;
  const sectionWeights =
    typeof swIn === "object" && swIn !== null && !Array.isArray(swIn)
      ? {
          ...base.sectionWeights,
          ...(swIn as Record<string, number>),
        }
      : base.sectionWeights;
  const candidate = { ...base, ...o, sectionWeights };
  const parsed = preferencesSchema.safeParse(candidate);
  return parsed.success ? normalizePreferences(parsed.data) : base;
}

export function getPreferencesForUser(userId: string): UserPreferences {
  const all = readFile();
  return mergeWithDefaults(all[userId]);
}

export function updatePreferencesForUser(
  userId: string,
  patch: Partial<UserPreferences>
): UserPreferences {
  const all = readFile();
  const current = mergeWithDefaults(all[userId]);
  const mergedFlat = { ...current, ...patch };
  const merged = {
    ...mergedFlat,
    sectionWeights: {
      ...current.sectionWeights,
      ...(patch.sectionWeights ?? {}),
    },
  };
  const validated = preferencesSchema.safeParse(merged);
  if (!validated.success) {
    throw new Error("INVALID_PREFS");
  }
  const next = normalizePreferences(validated.data);
  all[userId] = next;
  writeFile(all);
  return next;
}
