import mongoose from "mongoose";

let cached = globalThis.__mongooseConn;

export async function connectDB(uri) {
    if (!uri) throw new Error("Missing MONGO_URI");
    if (cached) return cached;

    mongoose.set("strictQuery", true);
    cached = globalThis.__mongooseConn ||= mongoose.connect(uri, { autoIndex: true })
        .then((m) => {
            console.log("✅ MongoDB connected:", m.connection.name);
            return m;
        });

    return cached;
}
