const { Schema, model } = require("mongoose");

const trainingRecordSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },
    workerId: { type: String, required: true, index: true },

    uploadedByUserId: { type: String, required: true, index: true },

    originalName: { type: String },
    mimeType: { type: String },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    size: { type: Number },

    uploadedAt: { type: String, required: true }, // ISO string
  },
  { timestamps: false }
);

module.exports = model("TrainingRecord", trainingRecordSchema);

