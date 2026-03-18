const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const { connectMongo } = require("../../lib/mongo");
const Inspection = require("../../models/Inspection");
const User = require("../../models/User");
const AuditLog = require("../../models/AuditLog");
const Notification = require("../../models/Notification");
const ComplianceRecord = require("../../models/ComplianceRecord");
const { randomId, nowIso } = require("../../lib/helpers");

dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

const app = express();
const PORT = 4004;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
// Evidence uploads are sent as base64 JSON; increase payload limit.
app.use(express.json({ limit: "25mb" }));

const path = require("path");
const fs = require("fs");

const UPLOAD_DIR = path.resolve(__dirname, "../../uploads/inspections");

const seedInspections = [
  {
    id: "INSP-001",
    site: "Site B",
    inspectorEmail: "inspector@cscms.com",
    inspectorName: "Ravi Kumar",
    date: "2026-03-20",
    type: "Electrical Safety",
    status: "Scheduled",
    passed: 0,
    failed: 0,
    score: undefined,
  },
];

function ensureAuthenticated(req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
}

function canSchedule(role) {
  return ["ADMIN"].includes(String(role || "").toUpperCase());
}

function canComplete(role) {
  return ["SAFETY_INSPECTOR"].includes(String(role || "").toUpperCase());
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "inspections-service" });
});

app.use("/inspections", ensureAuthenticated);

app.get("/inspections", async (_req, res) => {
  try {
    const items = await Inspection.find({}).sort({ date: -1 });
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch inspections", detail: err.message });
  }
});

app.post("/inspections", async (req, res) => {
  const role = req.headers["x-user-role"];
  if (!canSchedule(role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { site, inspectorEmail, date, type } = req.body || {};

  if (!site || !inspectorEmail || !date || !type) {
    return res.status(400).json({ message: "site, inspectorEmail, date and type are required" });
  }

  const count = await Inspection.countDocuments({});
  const inspector = await User.findOne({ email: String(inspectorEmail).toLowerCase() });

  const inspection = await Inspection.create({
    id: `INSP-${String(count + 1).padStart(3, "0")}`,
    site,
    inspectorEmail,
    inspectorName: inspector?.name || "Inspector",
    date,
    type,
    status: "Scheduled",
    passed: 0,
    failed: 0,
  });

  await AuditLog.create({
    id: randomId("AUDIT"),
    action: "INSPECTION_SCHEDULED",
    userId: req.headers["x-user-id"],
    module: "/inspections",
    details: `${inspection.id} scheduled for ${site} (${type})`,
    timestamp: nowIso(),
  });

  if (inspector) {
    const notifications = [];
    if (inspector.email) {
      notifications.push({
        id: randomId("NOTIF"),
        channel: "email",
        recipient: inspector.email,
        recipientUserId: inspector.userId,
        subject: "Scheduled inspection assigned",
        message: `Inspection on ${date} at ${site} (${type}).`,
        timestamp: nowIso(),
      });
    }
    if (inspector.phone) {
      notifications.push({
        id: randomId("NOTIF"),
        channel: "sms",
        recipient: inspector.phone,
        recipientUserId: inspector.userId,
        message: `Inspection on ${date} at ${site}.`,
        timestamp: nowIso(),
      });
    }
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  }

  return res.status(201).json(inspection);
});

app.patch("/inspections/:id/complete", async (req, res) => {
  const role = req.headers["x-user-role"];
  if (!canComplete(role)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { passed = 0, failed = 0, checklistItems = [], evidenceBase64, evidenceOriginalName, evidenceMimeType } = req.body || {};
  const total = Number(passed) + Number(failed);
  const score = total > 0 ? Math.round((Number(passed) / total) * 100) : undefined;

  let photoUrl = undefined;
  let evidence = [];
  if (evidenceBase64) {
    const originalName = evidenceOriginalName ? String(evidenceOriginalName) : "evidence";
    const mimeType = evidenceMimeType ? String(evidenceMimeType) : "application/octet-stream";

    const extFromName = path.extname(originalName || "");
    const extFromMime = (() => {
      const m = mimeType.toLowerCase();
      if (m.includes("png")) return ".png";
      if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
      if (m.includes("pdf")) return ".pdf";
      return "";
    })();

    const ext = extFromName || extFromMime || "";
    const filename = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    const base64 = String(evidenceBase64).includes(";base64,")
      ? String(evidenceBase64).split(";base64,")[1]
      : String(evidenceBase64);
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(base64, "base64"));

    photoUrl = `/uploads/inspections/${filename}`;
    evidence = [
      {
        originalName,
        mimeType,
        filename,
        size: fs.statSync(filePath).size,
        path: filePath,
        uploadedAt: new Date(),
      },
    ];
  }

  const updated = await Inspection.findOneAndUpdate(
    { id: req.params.id },
    {
      $set: {
        status: "Completed",
        passed,
        failed,
        score,
        checklistItems,
        ...(photoUrl ? { photoUrl } : {}),
        ...(evidence.length > 0 ? { evidence } : {}),
      },
    },
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: "Inspection not found" });

  await AuditLog.create({
    id: randomId("AUDIT"),
    action: "INSPECTION_COMPLETED",
    userId: req.headers["x-user-id"],
    module: "/inspections",
    details: `${updated.id} completed with score ${score ?? "N/A"}%`,
    timestamp: nowIso(),
  });

  // Compliance record for audit/reporting.
  if (typeof score === "number") {
    await ComplianceRecord.create({
      id: randomId("COMP"),
      inspectionId: updated.id,
      site: updated.site,
      inspectorName: updated.inspectorName || "Inspector",
      score,
      createdAt: nowIso(),
    });
  }

  // Notify admins/government immediately on completion (and highlight violations).
  const recipients = await User.find({ role: { $in: ["ADMIN", "AUTHORITY"] } });
  const notifications = [];
  const hasViolations = Number(failed) > 0;
  for (const u of recipients) {
    if (u.email) {
      notifications.push({
        id: randomId("NOTIF"),
        channel: "email",
        recipient: u.email,
        recipientUserId: u.userId,
        subject: hasViolations ? "CSCMS Alert: Inspection violations detected" : "CSCMS Update: Inspection completed",
        message: hasViolations
          ? `Inspection ${updated.id} for ${updated.site} has violations (passed=${Number(passed)}, failed=${Number(failed)}).`
          : `Inspection ${updated.id} for ${updated.site} completed successfully. Score=${score ?? "N/A"}%.`,
        timestamp: nowIso(),
      });
    }
    if (u.phone) {
      notifications.push({
        id: randomId("NOTIF"),
        channel: "sms",
        recipient: u.phone,
        recipientUserId: u.userId,
        message: hasViolations
          ? `CSCMS: Inspection ${updated.id} (${updated.site}) has violations.`
          : `CSCMS: Inspection ${updated.id} (${updated.site}) completed.`,
        timestamp: nowIso(),
      });
    }
  }
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  return res.json(updated);
});

async function ensureSeedInspections() {
  const existingCount = await Inspection.countDocuments({});
  if (existingCount > 0) return;
  await Inspection.insertMany(seedInspections);
}

connectMongo()
  .then(() => ensureSeedInspections())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Inspections service running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start inspections-service:", err);
    process.exit(1);
  });
