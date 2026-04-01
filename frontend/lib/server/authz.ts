import { getSession } from "@/lib/auth-server";
import { AppError } from "./errors";
import { findUserByIdDb } from "./services/user-service";

export async function requireSessionUser() {
  const session = await getSession();
  if (!session) {
    throw new AppError("AUTH_UNAUTHORIZED", "Unauthorized", 401, false);
  }
  const user = await findUserByIdDb(session.sub);
  if (!user) {
    throw new AppError("AUTH_UNAUTHORIZED", "Unauthorized", 401, false);
  }
  return user;
}

export async function requireAdminUser() {
  const user = await requireSessionUser();
  if (user.role !== "admin") {
    throw new AppError("AUTH_FORBIDDEN", "Forbidden", 403, false);
  }
  return user;
}
