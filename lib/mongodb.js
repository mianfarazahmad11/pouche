import dns from "dns";
import mongoose from "mongoose";

const rawMongoUri = process.env.MONGODB_URI?.trim();
const MONGODB_URI = rawMongoUri?.startsWith("MONGODB_URI=")
  ? rawMongoUri.slice("MONGODB_URI=".length)
  : rawMongoUri;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // Next.js imports server modules while collecting page data during builds.
  // Validate connection settings only when a request needs the database.
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI must be configured in the server environment before connecting to the database.");
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = (async () => {
      try {
        return await mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
        });
      } catch (error) {
        const isSrvUri = MONGODB_URI.startsWith("mongodb+srv://");
        const isSrvLookupError =
          error?.code === "ECONNREFUSED" ||
          /querySrv|getaddrinfo|ENOTFOUND|EAI_AGAIN/i.test(error?.message || "");

        if (!isSrvUri || !isSrvLookupError) {
          throw error;
        }

        dns.setServers(["1.1.1.1", "8.8.8.8"]);

        return mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
        });
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
