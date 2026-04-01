import mongoose from "mongoose";
import { env } from "./env";

declare global {
  var __rr_mongoose_conn: Promise<typeof mongoose> | undefined;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (!env.MONGODB_URI) {
    return null;
  }
  if (!global.__rr_mongoose_conn) {
    global.__rr_mongoose_conn = mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
  }
  return global.__rr_mongoose_conn;
}
