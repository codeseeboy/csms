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

const inspectionSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },

    site: { type: String, required: true },
    inspectorEmail: { type: String, required: true, index: true },
    inspectorName: { type: String, default: "Inspector" },

    // Keep as YYYY-MM-DD string to match frontend expectations.
    date: { type: String, required: true },
    type: { type: String, required: true },

    status: { type: String, required: true, enum: ["Scheduled", "Completed"], index: true },

    passed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    score: { type: Number },

    checklistItems: {
      type: [
        {
          label: { type: String, required: true },
          compliant: { type: Boolean, required: true },
          notes: { type: String, default: "" },
        },
      ],
      default: [],
    },

    // Optional evidence attachments (photos/videos) for audit trail.
    photoUrl: { type: String },
    evidence: { type: [evidenceSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = model("Inspection", inspectionSchema);

