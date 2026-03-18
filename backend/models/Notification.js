const { Schema, model } = require("mongoose");

const notificationSchema = new Schema(
  {
    id: { type: String, unique: true, index: true },

    channel: { type: String, required: true, enum: ["email", "sms"] },
    recipient: { type: String, required: true }, // email or phone
    recipientUserId: { type: String, required: false, index: true },

    subject: { type: String },
    message: { type: String, required: true },
    timestamp: { type: String, required: true }, // ISO string
  },
  { timestamps: false }
);

module.exports = model("Notification", notificationSchema);

