const { Schema, model } = require("mongoose");

const workerSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    contact: { type: String, default: "" },

    // Links this worker profile to an authenticated User (needed for strict Worker RBAC).
    // For Admin/Contractor-created worker profiles, this may be unset.
    userId: { type: String, index: true },

    certStatus: {
      type: String,
      required: true,
      enum: ["Valid", "Expiring", "Expired"],
      index: true,
    },
    trainingStatus: {
      type: String,
      required: true,
      enum: ["Complete", "In Progress", "Overdue"],
      index: true,
    },

    // Kept as a string to match the current frontend shape.
    assignedPPE: { type: String, default: "" },

    // Keep as YYYY-MM-DD string to match current frontend expectations.
    expiryDate: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = model("Worker", workerSchema);

