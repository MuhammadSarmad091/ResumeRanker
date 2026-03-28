import * as jose from "jose";

export function getJwtSecretKey(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set (min 16 chars) in production");
    }
    return new TextEncoder().encode("dev-resume-ranker-secret-min-16");
  }
  return new TextEncoder().encode(raw);
}

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new jose.SignJWT({
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getJwtSecretKey());
    const sub = payload.sub;
    const email = payload.email;
    const name = payload.name;
    if (
      typeof sub !== "string" ||
      typeof email !== "string" ||
      typeof name !== "string"
    ) {
      return null;
    }
    return { sub, email, name };
  } catch {
    return null;
  }
}
