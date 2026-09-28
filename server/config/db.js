const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured. Add the MongoDB connection string to server/.env.");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    await mongoose.disconnect().catch(() => {});
    const safeMessage = String(error.message).replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, "[MongoDB URI redacted]");
    throw new Error(
      `MongoDB connection failed. Check Atlas Network Access for this machine's public IP, database credentials, and outbound DNS/TCP access. ${safeMessage}`,
      { cause: error }
    );
  }
};

module.exports = connectDB;