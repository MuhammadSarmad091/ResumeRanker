import { createHash } from "node:crypto";
import { defaultPreferences, normalizePreferences, preferencesSchema, type UserPreferences } from "@/lib/prefs";
import type { SubscriptionTier } from "@/lib/plans";
import { connectToDatabase } from "@/lib/server/db";
import { AppError } from "@/lib/server/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createUser, findUserByEmail, findUserById, type UserRecord } from "@/lib/users-store";
import { getPreferencesForUser, updatePreferencesForUser } from "@/lib/prefs-store";
import { PreferenceModel, RefreshSessionModel, SubscriptionModel, UserModel } from "@/lib/server/models";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

type AppUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  salt: string;
  passwordHash: string;
};

function fromFileUser(u: UserRecord): AppUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: "user",
    salt: u.salt,
    passwordHash: u.passwordHash,
  };
}

export async function findUserByEmailDb(email: string): Promise<AppUser | null> {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    const user = findUserByEmail(email);
    return user ? fromFileUser(user) : null;
  }
  const row = await UserModel.findOne({ email: email.trim().toLowerCase() }).lean();
  if (!row) return null;
  return {
    id: String(row._id),
    email: row.email,
    name: row.name,
    role: row.role,
    salt: row.salt,
    passwordHash: row.passwordHash,
  };
}

export async function findUserByIdDb(id: string): Promise<AppUser | null> {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    const row = findUserById(id);
    return row ? fromFileUser(row) : null;
  }
  const row = await UserModel.findById(id).lean();
  if (!row) return null;
  return {
    id: String(row._id),
    email: row.email,
    name: row.name,
    role: row.role,
    salt: row.salt,
    passwordHash: row.passwordHash,
  };
}

export async function createUserDb(input: { email: string; password: string; name: string; selectedTier?: SubscriptionTier }): Promise<AppUser> {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    const { salt, hash } = hashPassword(input.password);
    const user = createUser({ email: input.email, name: input.name, salt, passwordHash: hash });
    return fromFileUser(user);
  }

  const exists = await UserModel.exists({ email: input.email.trim().toLowerCase() });
  if (exists) {
    throw new AppError("AUTH_EMAIL_TAKEN", "An account with this email already exists.", 409, false);
  }
  const { salt, hash } = hashPassword(input.password);
  const user = await UserModel.create({
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    salt,
    passwordHash: hash,
    role: "user",
  });
  await PreferenceModel.create({ userId: String(user._id), value: defaultPreferences });
  await SubscriptionModel.create({
    userId: String(user._id),
    tier: input.selectedTier ?? "basic",
    status: "none",
  });
  return {
    id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    salt: user.salt,
    passwordHash: user.passwordHash,
  };
}

export async function assertPassword(email: string, password: string): Promise<AppUser> {
  const user = await findUserByEmailDb(email);
  if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
    throw new AppError("AUTH_INVALID_CREDENTIALS", "Invalid email or password.", 401, false);
  }
  return user;
}

export async function persistRefreshSession(userId: string, rawToken: string): Promise<void> {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    return;
  }
  await RefreshSessionModel.create({
    userId,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + WEEK_MS),
    revokedAt: null,
  });
}

export async function rotateRefreshSession(userId: string, oldRawToken: string, nextRawToken: string): Promise<boolean> {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    return true;
  }
  const oldHash = hashToken(oldRawToken);
  const row = await RefreshSessionModel.findOne({ userId, tokenHash: oldHash, revokedAt: null });
  if (!row || row.expiresAt.getTime() < Date.now()) {
    return false;
  }
  row.revokedAt = new Date();
  await row.save();
  await persistRefreshSession(userId, nextRawToken);
  return true;
}

export async function revokeRefreshSession(userId: string, rawToken?: string): Promise<void> {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    return;
  }
  if (rawToken) {
    await RefreshSessionModel.updateOne({ userId, tokenHash: hashToken(rawToken), revokedAt: null }, { $set: { revokedAt: new Date() } });
    return;
  }
  await RefreshSessionModel.updateMany({ userId, revokedAt: null }, { $set: { revokedAt: new Date() } });
}

export async function readPreferencesDb(userId: string): Promise<UserPreferences> {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    return getPreferencesForUser(userId);
  }
  const row = await PreferenceModel.findOne({ userId }).lean();
  if (!row) {
    return defaultPreferences;
  }
  const parsed = preferencesSchema.safeParse(row.value);
  if (!parsed.success) return defaultPreferences;
  return normalizePreferences(parsed.data);
}

export async function patchPreferencesDb(userId: string, patch: Partial<UserPreferences>): Promise<UserPreferences> {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    return updatePreferencesForUser(userId, patch);
  }
  const current = await readPreferencesDb(userId);
  const merged = {
    ...current,
    ...patch,
    sectionWeights: {
      ...current.sectionWeights,
      ...(patch.sectionWeights ?? {}),
    },
  };
  const parsed = preferencesSchema.safeParse(merged);
  if (!parsed.success) {
    throw new AppError("PREFERENCES_INVALID", "Invalid preferences", 400, false);
  }
  const next = normalizePreferences(parsed.data);
  await PreferenceModel.updateOne({ userId }, { $set: { value: next } }, { upsert: true });
  return next;
}

export async function getEffectiveTierForUser(userId: string): Promise<SubscriptionTier> {
  await connectToDatabase();
  if (!process.env.MONGODB_URI) {
    const prefs = getPreferencesForUser(userId);
    return prefs.subscriptionTier;
  }

  const sub = await SubscriptionModel.findOne({ userId }).lean();
  if (sub?.tier) {
    return sub.tier;
  }

  const prefs = await readPreferencesDb(userId);
  return prefs.subscriptionTier;
}
