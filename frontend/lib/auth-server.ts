import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";
import { verifySessionToken, type SessionPayload } from "./jwt";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
