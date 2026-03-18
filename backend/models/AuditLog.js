const { Schema, model } = require("mongoose");

const auditLogSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    action: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    module: { type: String, required: true },
    details: { type: String, default: "" },
    timestamp: { type: String, required: true }, // ISO string
  },
  { timestamps: false }
);

module.exports = model("AuditLog", auditLogSchema);

