import { MongoClient } from 'mongodb';

const uri = "mongodb+srv://expressUser:pw123456@cluster0.vrqksry.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
let db;

export async function connectDB() {
  try {
    await client.connect();
    db = client.db('expresscrud');
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}

export function getDB() {
  return db;
}