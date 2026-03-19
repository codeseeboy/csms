/**
 * Unified CSCMS backend server for production deployment (Render, etc.).
 * Consolidates API Gateway + Auth + Workers + Incidents + Inspections
 * into a single Express process on a single port.
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const { connectMongo } = require("./lib/mongo");
const { randomId, nowIso } = require("./lib/helpers");

const User = require("./models/User");
const Worker = require("./models/Worker");
const Incident = require("./models/Incident");
const Inspection = require("./models/Inspection");
const AuditLog = require("./models/AuditLog");
const Notification = require("./models/Notification");
const ComplianceRecord = require("./models/ComplianceRecord");
const TrainingRecord = require("./models/TrainingRecord");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";

const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "25mb" }));

const UPLOAD_ROOT = path.resolve(__dirname, "uploads");
app.use("/uploads", express.static(UPLOAD_ROOT));

// ─────────────────────── JWT helpers ───────────────────────

function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const payload = verifyToken(req.headers.authorization);
  if (!payload) return res.status(401).json({ message: "Unauthorized" });
  req.auth = payload;
  return next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    const role = String(req.auth?.role || "").toUpperCase();
    if (!roles.includes(role)) return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}

// Classify incident severity automatically (SRS: automatic severity classification).
function classifySeverityFromText({ title, description }) {
  const text = `${title ?? ""} ${description ?? ""}`.toLowerCase();

  // Critical signals
  if (["fatal", "deadly", "life-threatening", "critical", "electrocution", "immediate"].some((k) => text.includes(k))) {
    return "Critical";
  }

  // High signals
  if (["fall", "guardrail", "scaffold", "serious", "major", "collision", "fire", "unsecured", "no harness", "harness", "injury"].some((k) => text.includes(k))) {
    return "High";
  }

  // Medium signals
  if (["minor slip", "near miss", "near-miss", "wet surface", "unsafe", "violation", "improper", "non-compliant", "non compliant"].some((k) => text.includes(k))) {
    return "Medium";
  }

  return "Low";
}

// ─────────────────────── Health ───────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "cscms-unified" });
});

// ═══════════════════════════════════════════════════════
//  AUTH ROUTES (/api/auth/*)
// ═══════════════════════════════════════════════════════

const authRouter = express.Router();

const seedUsers = [
  { id: "USR-001", email: "admin@cscms.com", password: "Admin@123", role: "ADMIN", name: "Admin User" },
  { id: "USR-002", email: "inspector@cscms.com", password: "Safe@1234", role: "SAFETY_INSPECTOR", name: "Ravi Kumar" },
  { id: "USR-003", email: "contractor@cscms.com", password: "Cont@1234", role: "CONTRACTOR", name: "Contractor Lead" },
  { id: "USR-004", email: "worker@cscms.com", password: "Work@1234", role: "WORKER", name: "Field Worker" },
  { id: "USR-005", email: "authority@cscms.com", password: "Auth@1234", role: "AUTHORITY", name: "Government Authority" },
];

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ message: "Account not found" });

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.userId, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.json({
      token,
      user: { id: user.userId, email: user.email, role: user.role, name: user.name, phone: user.phone },
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", detail: err.message });
  }
});

authRouter.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: "name, email and password are required" });

    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const ALLOWED_ROLES = ["ADMIN", "SAFETY_INSPECTOR", "CONTRACTOR", "WORKER", "AUTHORITY"];
    const requestedRole = String(role || "WORKER").toUpperCase();
    const finalRole = ALLOWED_ROLES.includes(requestedRole) ? requestedRole : "WORKER";

    const passwordHash = await bcrypt.hash(String(password), 10);
    const created = await User.create({
      userId: `USR-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: String(name),
      email: normalizedEmail,
      passwordHash,
      role: finalRole,
      phone: phone ? String(phone) : "",
    });

    return res.status(201).json({ id: created.userId, name: created.name, email: created.email, role: created.role, phone: created.phone || "" });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed", detail: err.message });
  }
});

authRouter.get("/validate", (req, res) => {
  const payload = verifyToken(req.headers.authorization);
  if (!payload) return res.status(401).json({ message: "Token expired or invalid" });
  return res.json({ valid: true, user: { id: payload.id, email: payload.email, role: payload.role, name: payload.name } });
});

authRouter.get("/notifications", requireAuth, async (req, res) => {
  try {
    const role = String(req.auth?.role || "").toUpperCase();

    // SRS: send reminders for renewals (certifications expiring soon).
    // Generate reminders at fetch time to avoid a background job.
    if (["ADMIN", "AUTHORITY", "WORKER"].includes(role)) {
      const me = await User.findOne({ userId: req.auth.id });

      if (me?.email) {
        const now = new Date();
        const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const cutoffDedup = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const cutoffIso = cutoffDedup.toISOString();

        const allWorkers = await Worker.find({});
        const expiringSoon = allWorkers
          .filter((w) => {
            if (!w.expiryDate) return false;
            const exp = new Date(String(w.expiryDate));
            if (Number.isNaN(exp.getTime())) return false;
            return exp >= now && exp <= in7 && w.certStatus !== "Expired";
          })
          .slice(0, 10);

        for (const w of expiringSoon) {
          const existing = await Notification.findOne({
            recipientUserId: req.auth.id,
            subject: "Certification expiry reminder",
            timestamp: { $gte: cutoffIso },
            message: { $regex: w.id, $options: "i" },
          });

          if (existing) continue;

          await Notification.create({
            id: randomId("NOTIF"),
            channel: "email",
            recipient: me.email,
            recipientUserId: req.auth.id,
            subject: "Certification expiry reminder",
            message: `Your certification for worker ${w.name} (${w.id}) expires on ${w.expiryDate}. Please renew immediately.`,
            timestamp: nowIso(),
          });
        }
      }
    }

    const items = await Notification.find({ recipientUserId: req.auth.id }).sort({ timestamp: -1 }).limit(50);
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch notifications", detail: err.message });
  }
});

authRouter.get("/audit-logs", requireAuth, requireRole("ADMIN", "AUTHORITY"), async (_req, res) => {
  try {
    const items = await AuditLog.find({}).sort({ timestamp: -1 }).limit(200);
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch audit logs", detail: err.message });
  }
});

authRouter.get("/compliance-records", requireAuth, requireRole("ADMIN", "AUTHORITY"), async (_req, res) => {
  try {
    const items = await ComplianceRecord.find({}).sort({ createdAt: -1 }).limit(500);
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch compliance records", detail: err.message });
  }
});

authRouter.get("/users", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  try {
    const items = await User.find({}).select({ userId: 1, name: 1, email: 1, role: 1, phone: 1, _id: 0 }).sort({ createdAt: -1 });
    const mapped = items.map((u) => ({ id: u.userId, name: u.name, email: u.email, role: u.role, phone: u.phone || "" }));
    return res.json({ items: mapped, count: mapped.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users", detail: err.message });
  }
});

authRouter.post("/users", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body || {};
    if (!name || !email || !password || !role) return res.status(400).json({ message: "name, email, password and role are required" });

    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const created = await User.create({
      userId: `USR-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: String(name),
      email: normalizedEmail,
      passwordHash,
      role: String(role).toUpperCase(),
      phone: phone ? String(phone) : "",
    });

    return res.status(201).json({ id: created.userId, name: created.name, email: created.email, role: created.role, phone: created.phone || "" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to create user", detail: err.message });
  }
});

authRouter.patch("/users/:userId", requireAuth, requireRole("ADMIN"), async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, phone, password } = req.body || {};

    const updates = {};
    if (name) updates.name = String(name);
    if (email) updates.email = String(email).toLowerCase();
    if (role) updates.role = String(role).toUpperCase();
    if (phone !== undefined) updates.phone = String(phone);
    if (password) updates.passwordHash = await bcrypt.hash(String(password), 10);

    const updated = await User.findOneAndUpdate({ userId }, { $set: updates }, { new: true });
    if (!updated) return res.status(404).json({ message: "User not found" });

    return res.json({ id: updated.userId, name: updated.name, email: updated.email, role: updated.role, phone: updated.phone || "" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update user", detail: err.message });
  }
});

authRouter.get("/reports/compliance/pdf", requireAuth, requireRole("ADMIN", "AUTHORITY"), async (req, res) => {
  try {
    const { from, to } = req.query || {};
    const filter = {};
    if (from) filter.createdAt = { ...(filter.createdAt || {}), $gte: new Date(String(from)).toISOString() };
    if (to) filter.createdAt = { ...(filter.createdAt || {}), $lte: new Date(String(to)).toISOString() };

    const items = await ComplianceRecord.find(filter).sort({ createdAt: -1 }).limit(500);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="compliance-report.pdf"');

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);
    doc.fontSize(16).text("CSCMS - Compliance Report", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated at: ${new Date().toISOString()}`);
    doc.moveDown(1);
    doc.fontSize(11).text("Compliance Records", { underline: true });
    doc.moveDown(0.5);

    for (const r of items) {
      doc.fontSize(10).text(`ID: ${r.id} | Inspection: ${r.inspectionId}`);
      doc.fontSize(10).text(`Site: ${r.site} | Inspector: ${r.inspectorName}`);
      doc.fontSize(10).text(`Score: ${r.score}%`);
      doc.moveDown(0.75);
    }
    doc.end();
  } catch (err) {
    res.status(500).json({ message: "Failed to export PDF", detail: err.message });
  }
});

authRouter.get("/reports/compliance/excel", requireAuth, requireRole("ADMIN", "AUTHORITY"), async (req, res) => {
  try {
    const { from, to } = req.query || {};
    const filter = {};
    if (from) filter.createdAt = { ...(filter.createdAt || {}), $gte: new Date(String(from)).toISOString() };
    if (to) filter.createdAt = { ...(filter.createdAt || {}), $lte: new Date(String(to)).toISOString() };

    const items = await ComplianceRecord.find(filter).sort({ createdAt: -1 }).limit(500);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Compliance");
    sheet.columns = [
      { header: "Record ID", key: "id", width: 18 },
      { header: "Inspection ID", key: "inspectionId", width: 18 },
      { header: "Site", key: "site", width: 20 },
      { header: "Inspector", key: "inspectorName", width: 22 },
      { header: "Score (%)", key: "score", width: 12 },
      { header: "Created At", key: "createdAt", width: 22 },
    ];
    sheet.addRows(items.map((r) => ({ id: r.id, inspectionId: r.inspectionId, site: r.site, inspectorName: r.inspectorName, score: r.score, createdAt: r.createdAt })));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="compliance-report.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: "Failed to export Excel", detail: err.message });
  }
});

app.use("/api/auth", authRouter);

// ═══════════════════════════════════════════════════════
//  WORKERS ROUTES (/api/workers/*)
// ═══════════════════════════════════════════════════════

const workersRouter = express.Router();
workersRouter.use(requireAuth);

const seedWorkers = [
  { id: "WRK-001", name: "James Rodriguez", role: "Crane Operator", contact: "+1 555-0101", certStatus: "Valid", trainingStatus: "Complete", assignedPPE: "Helmet, Harness, Gloves", expiryDate: "2026-08-15" },
  { id: "WRK-002", name: "Sarah Chen", role: "Site Supervisor", contact: "+1 555-0102", certStatus: "Expiring", trainingStatus: "Complete", assignedPPE: "Helmet, Vest, Boots", expiryDate: "2026-03-20" },
  { id: "WRK-003", name: "Mike Thompson", role: "Electrician", contact: "+1 555-0103", certStatus: "Valid", trainingStatus: "In Progress", assignedPPE: "Helmet, Gloves, Goggles", expiryDate: "2026-11-30" },
  { id: "WRK-004", name: "Ana Petrova", role: "Safety Inspector", contact: "+1 555-0104", certStatus: "Expiring", trainingStatus: "Overdue", assignedPPE: "Helmet, Vest", expiryDate: "2026-03-25" },
];

workersRouter.get("/", async (_req, res) => {
  try {
    const items = await Worker.find({}).sort({ createdAt: -1 });
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch workers", detail: err.message });
  }
});

workersRouter.get("/:id", async (req, res) => {
  try {
    const worker = await Worker.findOne({ id: req.params.id });
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    return res.json(worker);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch worker", detail: err.message });
  }
});

workersRouter.post("/", requireRole("ADMIN", "CONTRACTOR"), async (req, res) => {
  try {
    const { name, role: workerRole, contact, certStatus, trainingStatus, assignedPPE, expiryDate } = req.body || {};
    if (!name || !workerRole) return res.status(400).json({ message: "name and role are required" });

    const count = await Worker.countDocuments({});
    const worker = await Worker.create({
      id: `WRK-${String(count + 1).padStart(3, "0")}`,
      name, role: workerRole, contact: contact || "", certStatus: certStatus || "Valid",
      trainingStatus: trainingStatus || "In Progress", assignedPPE: assignedPPE || "", expiryDate: expiryDate || null,
    });
    return res.status(201).json(worker);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create worker", detail: err.message });
  }
});

workersRouter.put("/:id", requireRole("ADMIN", "CONTRACTOR"), async (req, res) => {
  try {
    const worker = await Worker.findOneAndUpdate({ id: req.params.id }, { $set: req.body || {} }, { new: true });
    if (!worker) return res.status(404).json({ message: "Worker not found" });
    return res.json(worker);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update worker", detail: err.message });
  }
});

workersRouter.delete("/:id", requireRole("ADMIN", "CONTRACTOR"), async (req, res) => {
  try {
    const r = await Worker.deleteOne({ id: req.params.id });
    if (!r.deletedCount) return res.status(404).json({ message: "Worker not found" });
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete worker", detail: err.message });
  }
});

workersRouter.post("/:id/training", requireRole("ADMIN", "CONTRACTOR"), async (req, res) => {
  try {
    const { trainingBase64, trainingOriginalName, trainingMimeType } = req.body || {};
    if (!trainingBase64 || !trainingOriginalName || !trainingMimeType) {
      return res.status(400).json({ message: "trainingBase64, trainingOriginalName and trainingMimeType are required" });
    }

    const worker = await Worker.findOne({ id: req.params.id });
    if (!worker) return res.status(404).json({ message: "Worker not found" });

    const dir = path.join(UPLOAD_ROOT, "training");
    fs.mkdirSync(dir, { recursive: true });

    const ext = path.extname(String(trainingOriginalName)) || "";
    const filename = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
    const filePath = path.join(dir, filename);

    const base64 = String(trainingBase64).includes(";base64,") ? String(trainingBase64).split(";base64,")[1] : String(trainingBase64);
    fs.writeFileSync(filePath, Buffer.from(base64, "base64"));

    const record = await TrainingRecord.create({
      id: randomId("TRN"), workerId: worker.id, uploadedByUserId: req.auth.id,
      originalName: String(trainingOriginalName), mimeType: String(trainingMimeType),
      filename, path: filePath, size: fs.statSync(filePath).size, uploadedAt: nowIso(),
    });

    await Worker.findOneAndUpdate({ id: worker.id }, { $set: { trainingStatus: "Complete" } });
    await AuditLog.create({ id: randomId("AUDIT"), action: "TRAINING_UPLOADED", userId: req.auth.id, module: "/training", details: `Training uploaded for worker ${worker.id} (record ${record.id})`, timestamp: nowIso() });

    return res.status(201).json(record);
  } catch (err) {
    return res.status(500).json({ message: "Failed to upload training", detail: err.message });
  }
});

app.use("/api/workers", workersRouter);

// ═══════════════════════════════════════════════════════
//  INCIDENTS ROUTES (/api/incidents/*)
// ═══════════════════════════════════════════════════════

const incidentsRouter = express.Router();
incidentsRouter.use(requireAuth);

const seedIncidents = [
  { id: "INC-2026-001", title: "Fall risk near scaffold", severity: "High", location: "Building A - Floor 3", description: "Guardrail was not secured in one section.", date: "2026-03-01", status: "Open", photoUrl: null, evidence: [], createdByUserId: "USR-002" },
  { id: "INC-2026-002", title: "Minor slip near parking lot", severity: "Medium", location: "Site B - Parking Lot", description: "Wet surface without warning sign.", date: "2026-02-27", status: "Under Review", photoUrl: null, evidence: [], createdByUserId: "USR-002" },
];

incidentsRouter.get("/", async (_req, res) => {
  try {
    const items = await Incident.find({}).sort({ date: -1 });
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch incidents", detail: err.message });
  }
});

incidentsRouter.get("/:id", async (req, res) => {
  try {
    const incident = await Incident.findOne({ id: req.params.id });
    if (!incident) return res.status(404).json({ message: "Incident not found" });
    return res.json(incident);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch incident", detail: err.message });
  }
});

incidentsRouter.post("/", requireRole("ADMIN", "SAFETY_INSPECTOR", "CONTRACTOR", "WORKER"), async (req, res) => {
  try {
    const { title, location, description, date } = req.body || {};
    if (!title || !location || !description || !date) {
      return res.status(400).json({ message: "title, location, description and date are required" });
    }

    const count = await Incident.countDocuments({});
    let photoUrl = null;
    const evidence = [];

    const evidenceBase64 = req.body?.evidenceBase64 ? String(req.body.evidenceBase64) : null;
    if (evidenceBase64) {
      const eName = req.body?.evidenceOriginalName ? String(req.body.evidenceOriginalName) : "evidence";
      const eMime = req.body?.evidenceMimeType ? String(req.body.evidenceMimeType) : "application/octet-stream";

      const extFromName = path.extname(eName) || "";
      const lowerMime = String(eMime).toLowerCase();
      const extFromMime = (() => {
        if (lowerMime.includes("png")) return ".png";
        if (lowerMime.includes("jpeg") || lowerMime.includes("jpg")) return ".jpg";
        if (lowerMime.includes("pdf")) return ".pdf";
        if (lowerMime.includes("mp4")) return ".mp4";
        if (lowerMime.includes("webm")) return ".webm";
        if (lowerMime.includes("quicktime") || lowerMime.includes("mov")) return ".mov";
        if (lowerMime.includes("matroska") || lowerMime.includes("mkv")) return ".mkv";
        if (lowerMime.includes("ogg")) return ".ogg";
        return "";
      })();

      const ext = extFromName || extFromMime || "";
      const filename = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
      const dir = path.join(UPLOAD_ROOT, "incidents");
      fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, filename);

      const raw = evidenceBase64.includes(";base64,") ? evidenceBase64.split(";base64,")[1] : evidenceBase64;
      fs.writeFileSync(filePath, Buffer.from(raw, "base64"));

      photoUrl = `/uploads/incidents/${filename}`;
      evidence.push({ originalName: eName, mimeType: eMime, filename, size: fs.statSync(filePath).size, path: filePath, uploadedAt: new Date() });
    }

    const incidentSeverity = classifySeverityFromText({ title, description });

    const incident = await Incident.create({
      id: `INC-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`,
      title,
      severity: incidentSeverity,
      location,
      description,
      date,
      photoUrl,
      evidence,
      status: "Open",
      createdByUserId: req.auth.id,
    });

    await AuditLog.create({ id: randomId("AUDIT"), action: "INCIDENT_CREATED", userId: req.auth.id, module: "/incident-reports", details: `${incident.id} (${incident.severity}) at ${incident.location}`, timestamp: nowIso() });

    const recipients = await User.find({ role: { $in: ["ADMIN", "AUTHORITY"] } });
    const notifications = [];
    for (const u of recipients) {
      if (u.email) notifications.push({ id: randomId("NOTIF"), channel: "email", recipient: u.email, recipientUserId: u.userId, subject: `CSCMS Alert: ${incident.severity} incident reported`, message: `${incident.title} at ${incident.location}. Status: ${incident.status}.`, timestamp: nowIso() });
      if (u.phone) notifications.push({ id: randomId("NOTIF"), channel: "sms", recipient: u.phone, recipientUserId: u.userId, message: `CSCMS: ${incident.severity} incident at ${incident.location}. Check dashboard.`, timestamp: nowIso() });
    }
    if (notifications.length > 0) await Notification.insertMany(notifications);

    return res.status(201).json(incident);
  } catch (err) {
    return res.status(500).json({ message: "Failed to create incident", detail: err.message });
  }
});

incidentsRouter.patch("/:id/status", requireRole("ADMIN"), async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: "status is required" });

    const updated = await Incident.findOneAndUpdate({ id: req.params.id }, { $set: { status } }, { new: true });
    if (!updated) return res.status(404).json({ message: "Incident not found" });

    await AuditLog.create({ id: randomId("AUDIT"), action: "INCIDENT_STATUS_UPDATED", userId: req.auth.id, module: "/incident-reports", details: `${updated.id} status changed to ${updated.status}`, timestamp: nowIso() });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update incident", detail: err.message });
  }
});

app.use("/api/incidents", incidentsRouter);

// ═══════════════════════════════════════════════════════
//  INSPECTIONS ROUTES (/api/inspections/*)
// ═══════════════════════════════════════════════════════

const inspectionsRouter = express.Router();
inspectionsRouter.use(requireAuth);

const seedInspections = [
  { id: "INSP-001", site: "Site B", inspectorEmail: "inspector@cscms.com", inspectorName: "Ravi Kumar", date: "2026-03-20", type: "Electrical Safety", status: "Scheduled", passed: 0, failed: 0 },
];

inspectionsRouter.get("/", async (_req, res) => {
  try {
    const items = await Inspection.find({}).sort({ date: -1 });
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch inspections", detail: err.message });
  }
});

inspectionsRouter.post("/", requireRole("ADMIN"), async (req, res) => {
  try {
    const { site, inspectorEmail, date, type } = req.body || {};
    if (!site || !inspectorEmail || !date || !type) return res.status(400).json({ message: "site, inspectorEmail, date and type are required" });

    const count = await Inspection.countDocuments({});
    const inspector = await User.findOne({ email: String(inspectorEmail).toLowerCase() });

    const inspection = await Inspection.create({
      id: `INSP-${String(count + 1).padStart(3, "0")}`, site, inspectorEmail, inspectorName: inspector?.name || "Inspector", date, type, status: "Scheduled", passed: 0, failed: 0,
    });

    await AuditLog.create({ id: randomId("AUDIT"), action: "INSPECTION_SCHEDULED", userId: req.auth.id, module: "/inspections", details: `${inspection.id} scheduled for ${site} (${type})`, timestamp: nowIso() });

    if (inspector) {
      const notifs = [];
      if (inspector.email) notifs.push({ id: randomId("NOTIF"), channel: "email", recipient: inspector.email, recipientUserId: inspector.userId, subject: "Scheduled inspection assigned", message: `Inspection on ${date} at ${site} (${type}).`, timestamp: nowIso() });
      if (inspector.phone) notifs.push({ id: randomId("NOTIF"), channel: "sms", recipient: inspector.phone, recipientUserId: inspector.userId, message: `Inspection on ${date} at ${site}.`, timestamp: nowIso() });
      if (notifs.length > 0) await Notification.insertMany(notifs);
    }

    return res.status(201).json(inspection);
  } catch (err) {
    return res.status(500).json({ message: "Failed to schedule inspection", detail: err.message });
  }
});

inspectionsRouter.patch("/:id/complete", requireRole("SAFETY_INSPECTOR"), async (req, res) => {
  try {
    const { passed = 0, failed = 0, checklistItems = [], evidenceBase64, evidenceOriginalName, evidenceMimeType } = req.body || {};
    const total = Number(passed) + Number(failed);
    const score = total > 0 ? Math.round((Number(passed) / total) * 100) : undefined;

    let photoUrl;
    let evidence = [];
    if (evidenceBase64) {
      const origName = evidenceOriginalName ? String(evidenceOriginalName) : "evidence";
      const mime = evidenceMimeType ? String(evidenceMimeType) : "application/octet-stream";
      const ext = path.extname(origName) || "";
      const filename = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
      const dir = path.join(UPLOAD_ROOT, "inspections");
      fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, filename);

      const raw = String(evidenceBase64).includes(";base64,") ? String(evidenceBase64).split(";base64,")[1] : String(evidenceBase64);
      fs.writeFileSync(filePath, Buffer.from(raw, "base64"));

      photoUrl = `/uploads/inspections/${filename}`;
      evidence = [{ originalName: origName, mimeType: mime, filename, size: fs.statSync(filePath).size, path: filePath, uploadedAt: new Date() }];
    }

    const updated = await Inspection.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: "Completed", passed, failed, score, checklistItems, ...(photoUrl ? { photoUrl } : {}), ...(evidence.length > 0 ? { evidence } : {}) } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Inspection not found" });

    await AuditLog.create({ id: randomId("AUDIT"), action: "INSPECTION_COMPLETED", userId: req.auth.id, module: "/inspections", details: `${updated.id} completed with score ${score ?? "N/A"}%`, timestamp: nowIso() });

    if (typeof score === "number") {
      await ComplianceRecord.create({ id: randomId("COMP"), inspectionId: updated.id, site: updated.site, inspectorName: updated.inspectorName || "Inspector", score, createdAt: nowIso() });
    }

    const recipients = await User.find({ role: { $in: ["ADMIN", "AUTHORITY"] } });
    const hasViolations = Number(failed) > 0;

    if (hasViolations) {
      // SRS: IF checklist fails -> create incident/violation record and generate alerts.
      const violatedLabels = (updated.checklistItems || [])
        .filter((it) => !it.compliant)
        .map((it) => it.label)
        .filter(Boolean);

      const totalItems = Number(passed) + Number(failed);
      const ratio = totalItems > 0 ? Number(failed) / totalItems : 0;
      const severityFromRatio = (() => {
        if (ratio >= 0.5) return "Critical";
        if (ratio >= 0.34) return "High";
        if (ratio >= 0.17) return "Medium";
        return "Low";
      })();

      const title = `Inspection Violation - ${updated.id}`;
      const description = `Non-compliant checklist items: ${violatedLabels.join(", ") || "N/A"}. Passed=${passed}, Failed=${failed}. Score=${score ?? "N/A"}%.`;

      // Let keyword classifier refine/override the ratio-derived severity.
      const computed = classifySeverityFromText({ title, description });
      const incidentSeverity = computed || severityFromRatio;

      const incidentCount = await Incident.countDocuments({});
      const incident = await Incident.create({
        id: `INC-${new Date().getFullYear()}-${String(incidentCount + 1).padStart(3, "0")}`,
        title,
        severity: incidentSeverity,
        location: updated.site,
        description,
        date: updated.date,
        photoUrl: photoUrl ?? null,
        evidence: evidence ?? [],
        status: "Open",
        createdByUserId: req.auth.id,
      });

      await AuditLog.create({
        id: randomId("AUDIT"),
        action: "INCIDENT_CREATED",
        userId: req.auth.id,
        module: "/incident-reports",
        details: `${incident.id} (${incident.severity}) at ${incident.location}`,
        timestamp: nowIso(),
      });

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
      if (notifications.length > 0) await Notification.insertMany(notifications);
    } else {
      const notifs = [];
      for (const u of recipients) {
        if (u.email) {
          notifs.push({
            id: randomId("NOTIF"),
            channel: "email",
            recipient: u.email,
            recipientUserId: u.userId,
            subject: "CSCMS Update: Inspection completed",
            message: `Inspection ${updated.id} for ${updated.site} completed. Score=${score ?? "N/A"}%.`,
            timestamp: nowIso(),
          });
        }
        if (u.phone) {
          notifs.push({
            id: randomId("NOTIF"),
            channel: "sms",
            recipient: u.phone,
            recipientUserId: u.userId,
            message: `CSCMS: Inspection ${updated.id} (${updated.site}) completed.`,
            timestamp: nowIso(),
          });
        }
      }
      if (notifs.length > 0) await Notification.insertMany(notifs);
    }

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ message: "Failed to complete inspection", detail: err.message });
  }
});

app.use("/api/inspections", inspectionsRouter);

// ═══════════════════════════════════════════════════════
//  STARTUP
// ═══════════════════════════════════════════════════════

async function seedDatabase() {
  const userCount = await User.countDocuments({});
  if (userCount === 0) {
    for (const u of seedUsers) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      await User.create({ userId: u.id, name: u.name, email: u.email, passwordHash, role: u.role, phone: "+1 555-0000" });
    }
    console.log("Seeded users");
  }

  const workerCount = await Worker.countDocuments({});
  if (workerCount === 0) {
    await Worker.insertMany(seedWorkers);
    console.log("Seeded workers");
  }

  const incidentCount = await Incident.countDocuments({});
  if (incidentCount === 0) {
    await Incident.insertMany(seedIncidents);
    console.log("Seeded incidents");
  }

  const inspectionCount = await Inspection.countDocuments({});
  if (inspectionCount === 0) {
    await Inspection.insertMany(seedInspections);
    console.log("Seeded inspections");
  }
}

connectMongo()
  .then(() => seedDatabase())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CSCMS unified server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
