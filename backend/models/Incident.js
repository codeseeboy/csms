const { Schema, model } = require("mongoose");

const evidenceSchema = new Schema(
  {
    originalName: { type: String },
    mimeType: { type: String },
    filename: { type: String, required: true },
    size: { type: Number },
    path: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const incidentSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },

    title: { type: String, required: true },
    severity: { type: String, required: true, enum: ["Low", "Medium", "High", "Critical"] },
    location: { type: String, required: true },
    description: { type: String, required: true },
    // Keep as YYYY-MM-DD string to match frontend expectations.
    date: { type: String, required: true },

    status: { type: String, required: true, enum: ["Open", "Under Review", "Resolved"], index: true },

    photoUrl: { type: String }, // legacy field used by current frontend
    evidence: { type: [evidenceSchema], default: [] },

    createdByUserId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = model("Incident", incidentSchema);

