const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    userId: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["ADMIN", "SAFETY_INSPECTOR", "CONTRACTOR", "WORKER", "AUTHORITY"],
      index: true,
    },
    phone: { type: String },
    site: { type: String },
  },
  { timestamps: true }
);

module.exports = model("User", userSchema);

