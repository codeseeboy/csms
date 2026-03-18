const { Schema, model } = require("mongoose");

const complianceRecordSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },

    inspectionId: { type: String, required: true, index: true },
    site: { type: String, required: true, index: true },
    inspectorName: { type: String, required: true },
    score: { type: Number, required: true },
    createdAt: { type: String, required: true }, // ISO string
  },
  { timestamps: false }
);

module.exports = model("ComplianceRecord", complianceRecordSchema);

