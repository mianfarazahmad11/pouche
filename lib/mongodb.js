import dns from "dns";
import mongoose from "mongoose";

const rawMongoUri = process.env.MONGODB_URI?.trim();
const MONGODB_URI = rawMongoUri?.startsWith("MONGODB_URI=")
  ? rawMongoUri.slice("MONGODB_URI=".length)
  : rawMongoUri;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
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
