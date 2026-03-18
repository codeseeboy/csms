const mongoose = require("mongoose");

let connectionPromise = null;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

async function connectMongo() {
  if (connectionPromise) return connectionPromise;

  const uri = requireEnv("MONGODB_URI");
  const dbName = process.env.MONGODB_DB; // optional if embedded in URI

  // Cache the promise so concurrent requests don't create multiple connections.
  connectionPromise = mongoose
    .connect(uri, {
      dbName,
      autoIndex: true,
    })
    .then(() => mongoose.connection);

  return connectionPromise;
}

module.exports = {
  connectMongo,
  mongoose,
};

