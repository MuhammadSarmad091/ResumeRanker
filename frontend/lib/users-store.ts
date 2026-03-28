import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readAll(): UserRecord[] {
  ensureDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as UserRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(users: UserRecord[]): void {
  ensureDir();
  const tmp = `${USERS_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(users, null, 2), "utf8");
  fs.renameSync(tmp, USERS_FILE);
}

export function findUserByEmail(email: string): UserRecord | undefined {
  const e = email.trim().toLowerCase();
  return readAll().find((u) => u.email === e);
}

export function findUserById(id: string): UserRecord | undefined {
  return readAll().find((u) => u.id === id);
}

export function createUser(input: {
  email: string;
  name: string;
  salt: string;
  passwordHash: string;
}): UserRecord {
  const users = readAll();
  const email = input.email.trim().toLowerCase();
  if (users.some((u) => u.email === email)) {
    throw new Error("EMAIL_TAKEN");
  }
  const user: UserRecord = {
    id: randomUUID(),
    email,
    name: input.name.trim(),
    salt: input.salt,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeAll(users);
  return user;
}
