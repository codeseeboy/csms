const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { connectMongo } = require("../../lib/mongo");
const Incident = require("../../models/Incident");
const AuditLog = require("../../models/AuditLog");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const { randomId, nowIso } = require("../../lib/helpers");

dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

const app = express();
const PORT = 4003;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
// Evidence uploads are sent as base64 JSON; increase payload limit.
app.use(express.json({ limit: "25mb" }));

const UPLOAD_DIR =
  process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.resolve(__dirname, "../../uploads/incidents");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeBase = path
      .basename(file.originalname || "upload", ext)
      .replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${Date.now()}_${Math.random().toString(16).slice(2)}_${safeBase}${ext}`);
  },
});

const upload = multer({ storage });

const seedIncidents = [
  {
    id: "INC-2026-001",
    title: "Fall risk near scaffold",
    severity: "High",
    location: "Building A - Floor 3",
    description: "Guardrail was not secured in one section.",
    date: "2026-03-01",
    status: "Open",
    photoUrl: null,
    evidence: [],
    createdByUserId: "USR-002",
  },
  {
    id: "INC-2026-002",
    title: "Minor slip near parking lot",
    severity: "Medium",
    location: "Site B - Parking Lot",
    description: "Wet surface without warning sign.",
    date: "2026-02-27",
    status: "Under Review",
    photoUrl: null,
    evidence: [],
    createdByUserId: "USR-002",
  },
];

function ensureAuthenticated(req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
}

function canCreateIncidents(role) {
  return ["ADMIN", "SAFETY_INSPECTOR", "CONTRACTOR", "WORKER"].includes(String(role || "").toUpperCase());
}

function canUpdateIncident(role) {
  return ["ADMIN"].includes(String(role || "").toUpperCase());
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "incidents-service" });
});

app.use("/incidents", ensureAuthenticated);

app.get("/incidents", async (_req, res) => {
  try {
    const items = await Incident.find({}).sort({ date: -1 });
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch incidents", detail: err.message });
  }
});

app.get("/incidents/:id", async (req, res) => {
  try {
    const incident = await Incident.findOne({ id: req.params.id });
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    return res.json(incident);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch incident", detail: err.message });
  }
});

app.post("/incidents", (req, res, next) => {
  // Multer only works with multipart requests; accept JSON as well (no evidence).
  if (req.is("multipart/form-data")) {
    return upload.single("evidence")(req, res, next);
  }
  return next();
}, async (req, res) => {
  try {
    const role = req.headers["x-user-role"];
    if (!canCreateIncidents(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, severity, location, description, date } = req.body || {};
    if (!title || !severity || !location || !description || !date) {
      return res
        .status(400)
        .json({ message: "title, severity, location, description and date are required" });
    }

    const count = await Incident.countDocuments({});
    const evidence = [];
    let photoUrl = null;

    // 1) Multipart upload path (if gateway supports it in your setup)
    if (req.file) {
      photoUrl = `/uploads/incidents/${req.file.filename}`;
      evidence.push({
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        filename: req.file.filename,
        size: req.file.size,
        path: req.file.path,
        uploadedAt: new Date(),
      });
    }

    // 2) JSON base64 upload path (works with the current gateway JSON forwarding)
    const evidenceBase64 = req.body?.evidenceBase64 ? String(req.body.evidenceBase64) : null;
    if (!photoUrl && evidenceBase64) {
      const evidenceOriginalName = req.body?.evidenceOriginalName ? String(req.body.evidenceOriginalName) : "evidence";
      const evidenceMimeType = req.body?.evidenceMimeType ? String(req.body.evidenceMimeType) : "application/octet-stream";

      const extFromName = path.extname(evidenceOriginalName || "");
      const extFromMime = (() => {
        const m = evidenceMimeType.toLowerCase();
        if (m.includes("png")) return ".png";
        if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
        if (m.includes("pdf")) return ".pdf";
        return "";
      })();

      const ext = extFromName || extFromMime || "";
      const filename = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      const base64 = evidenceBase64.includes(";base64,") ? evidenceBase64.split(";base64,")[1] : evidenceBase64;
      fs.writeFileSync(filePath, Buffer.from(base64, "base64"));

      photoUrl = `/uploads/incidents/${filename}`;
      evidence.push({
        originalName: evidenceOriginalName,
        mimeType: evidenceMimeType,
        filename,
        size: fs.statSync(filePath).size,
        path: filePath,
        uploadedAt: new Date(),
      });
    }

    const incident = await Incident.create({
      id: `INC-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`,
      title,
      severity,
      location,
      description,
      date,
      photoUrl,
      evidence,
      status: "Open",
      createdByUserId: req.headers["x-user-id"],
    });

    const actingUserId = req.headers["x-user-id"];
    await AuditLog.create({
      id: randomId("AUDIT"),
      action: "INCIDENT_CREATED",
      userId: actingUserId,
      module: "/incident-reports",
      details: `${incident.id} (${incident.severity}) at ${incident.location}`,
      timestamp: nowIso(),
    });

    // Alerts: notify admins + government authorities immediately.
    const recipients = await User.find({ role: { $in: ["ADMIN", "AUTHORITY"] } });
    const notifications = [];
    for (const u of recipients) {
      if (u.email) {
        notifications.push({
          id: randomId("NOTIF"),
          channel: "email",
          recipient: u.email,
          recipientUserId: u.userId,
          subject: `CSCMS Alert: ${incident.severity} incident reported`,
          message: `${incident.title} at ${incident.location}. Status: ${incident.status}.`,
          timestamp: nowIso(),
        });
      }
      if (u.phone) {
        notifications.push({
          id: randomId("NOTIF"),
          channel: "sms",
          recipient: u.phone,
          recipientUserId: u.userId,
          message: `CSCMS: ${incident.severity} incident at ${incident.location}. Check dashboard.`,
          timestamp: nowIso(),
        });
      }
    }
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    return res.status(201).json(incident);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create incident", detail: err.message });
  }
});

app.patch("/incidents/:id/status", async (req, res) => {
  try {
    const role = req.headers["x-user-role"];
    if (!canUpdateIncident(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { status } = req.body || {};
    if (!status) {
      return res.status(400).json({ message: "status is required" });
    }

    const updated = await Incident.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status } },
      { new: true },
    );

    if (!updated) return res.status(404).json({ message: "Incident not found" });

    await AuditLog.create({
      id: randomId("AUDIT"),
      action: "INCIDENT_STATUS_UPDATED",
      userId: req.headers["x-user-id"],
      module: "/incident-reports",
      details: `${updated.id} status changed to ${updated.status}`,
      timestamp: nowIso(),
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update incident", detail: err.message });
  }
});

async function ensureSeedIncidents() {
  const existingCount = await Incident.countDocuments({});
  if (existingCount > 0) return;
  await Incident.insertMany(seedIncidents);
}

connectMongo()
  .then(() => ensureSeedIncidents())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Incidents service running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start incidents-service:", err);
    process.exit(1);
  });
