const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const { connectMongo } = require('../../lib/mongo');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const AuditLog = require('../../models/AuditLog');
const ComplianceRecord = require('../../models/ComplianceRecord');

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const app = express();
const PORT = 4001;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

const users = [
  { id: 'USR-001', email: 'admin@cscms.com', password: 'Admin@123', role: 'ADMIN', name: 'Admin User' },
  { id: 'USR-002', email: 'inspector@cscms.com', password: 'Safe@1234', role: 'SAFETY_INSPECTOR', name: 'Ravi Kumar' },
  { id: 'USR-003', email: 'contractor@cscms.com', password: 'Cont@1234', role: 'CONTRACTOR', name: 'Contractor Lead' },
  { id: 'USR-004', email: 'worker@cscms.com', password: 'Work@1234', role: 'WORKER', name: 'Field Worker' },
  { id: 'USR-005', email: 'authority@cscms.com', password: 'Auth@1234', role: 'AUTHORITY', name: 'Government Authority' },
];

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

async function ensureSeedUsers() {
  const existingCount = await User.countDocuments({});
  if (existingCount > 0) return;

  // Seed users for demos/testing.
  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await User.create({
      userId: u.id,
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role,
      phone: '+1 555-0000', // not required for auth
    });
  }
}

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Account not found' });
    }

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.userId, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' },
    );

    return res.json({
      token,
      user: {
        id: user.userId,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', detail: err.message });
  }
});

// Public registration (SRS: secure authentication for all users).
// For safety we allow registration only as WORKER. Admin can manage roles later.
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const allowedRole = String(role || 'WORKER').toUpperCase();
    const finalRole = allowedRole === 'WORKER' ? 'WORKER' : 'WORKER';

    const passwordHash = await bcrypt.hash(String(password), 10);

    const created = await User.create({
      userId: `USR-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: String(name),
      email: normalizedEmail,
      passwordHash,
      role: finalRole,
      phone: phone ? String(phone) : '',
    });

    return res.status(201).json({
      id: created.userId,
      name: created.name,
      email: created.email,
      role: created.role,
      phone: created.phone || '',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', detail: err.message });
  }
});

app.get('/auth/validate', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.json({
      valid: true,
      user: {
        id: payload.id,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      },
    });
  } catch (error) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
});

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }

  const token = authHeader.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
}

// Audit-ready data access (SRS: audit-ready government compliance reports).
app.get('/auth/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.auth.id;
    const items = await Notification.find({ recipientUserId: userId }).sort({ timestamp: -1 }).limit(50);
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch notifications', detail: err.message });
  }
});

app.get('/auth/audit-logs', requireAuth, async (req, res) => {
  try {
    const role = String(req.auth.role || '').toUpperCase();
    if (!['ADMIN', 'AUTHORITY'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const items = await AuditLog.find({}).sort({ timestamp: -1 }).limit(200);
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch audit logs', detail: err.message });
  }
});

app.get('/auth/compliance-records', requireAuth, async (req, res) => {
  try {
    const role = String(req.auth.role || '').toUpperCase();
    if (!['ADMIN', 'AUTHORITY'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const items = await ComplianceRecord.find({}).sort({ createdAt: -1 }).limit(500);
    return res.json({ items, count: items.length });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch compliance records', detail: err.message });
  }
});

function requireAdmin(req, res, next) {
  const role = String(req.auth?.role || '').toUpperCase();
  if (!['ADMIN'].includes(role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
}

// Admin: user management (SRS: Admin manages users and roles).
app.get('/auth/users', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const items = await User.find({})
      .select({ userId: 1, name: 1, email: 1, role: 1, phone: 1, _id: 0 })
      .sort({ createdAt: -1 });

    const mapped = items.map((u) => ({
      id: u.userId,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
    }));
    return res.json({ items: mapped, count: mapped.length });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch users', detail: err.message });
  }
});

app.post('/auth/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(String(password), 10);

    // role must match User model enum: ADMIN, SAFETY_INSPECTOR, CONTRACTOR, WORKER, AUTHORITY
    const created = await User.create({
      userId: `USR-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      name: String(name),
      email: normalizedEmail,
      passwordHash,
      role: String(role).toUpperCase(),
      phone: phone ? String(phone) : '',
    });

    return res.status(201).json({
      id: created.userId,
      name: created.name,
      email: created.email,
      role: created.role,
      phone: created.phone || '',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create user', detail: err.message });
  }
});

app.patch('/auth/users/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, phone, password } = req.body || {};

    const updates = {};
    if (name) updates.name = String(name);
    if (email) updates.email = String(email).toLowerCase();
    if (role) updates.role = String(role).toUpperCase();
    if (phone !== undefined) updates.phone = String(phone);

    if (password) {
      updates.passwordHash = await bcrypt.hash(String(password), 10);
    }

    const updated = await User.findOneAndUpdate({ userId }, { $set: updates }, { new: true });
    if (!updated) return res.status(404).json({ message: 'User not found' });

    return res.json({
      id: updated.userId,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      phone: updated.phone || '',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update user', detail: err.message });
  }
});

app.get('/auth/reports/compliance/pdf', requireAuth, async (req, res) => {
  try {
    const role = String(req.auth.role || '').toUpperCase();
    if (!['ADMIN', 'AUTHORITY'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { from, to } = req.query || {};
    const filter = {};
    if (from) {
      filter["createdAt"] = { ...(filter["createdAt"] || {}), $gte: new Date(String(from)).toISOString() };
    }
    if (to) {
      filter["createdAt"] = { ...(filter["createdAt"] || {}), $lte: new Date(String(to)).toISOString() };
    }

    const items = await ComplianceRecord.find(filter).sort({ createdAt: -1 }).limit(500);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=\"compliance-report.pdf\"');

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(16).text('CSCMS - Compliance Report', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated at: ${new Date().toISOString()}`);
    doc.moveDown(1);

    doc.fontSize(11).text('Compliance Records', { underline: true });
    doc.moveDown(0.5);

    for (const r of items) {
      doc.fontSize(10).text(`ID: ${r.id} | Inspection: ${r.inspectionId}`);
      doc.fontSize(10).text(`Site: ${r.site} | Inspector: ${r.inspectorName}`);
      doc.fontSize(10).text(`Score: ${r.score}%`);
      doc.moveDown(0.75);
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to export PDF', detail: err.message });
  }
});

app.get('/auth/reports/compliance/excel', requireAuth, async (req, res) => {
  try {
    const role = String(req.auth.role || '').toUpperCase();
    if (!['ADMIN', 'AUTHORITY'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { from, to } = req.query || {};
    const filter = {};
    if (from) {
      filter["createdAt"] = { ...(filter["createdAt"] || {}), $gte: new Date(String(from)).toISOString() };
    }
    if (to) {
      filter["createdAt"] = { ...(filter["createdAt"] || {}), $lte: new Date(String(to)).toISOString() };
    }

    const items = await ComplianceRecord.find(filter).sort({ createdAt: -1 }).limit(500);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Compliance');

    sheet.columns = [
      { header: 'Record ID', key: 'id', width: 18 },
      { header: 'Inspection ID', key: 'inspectionId', width: 18 },
      { header: 'Site', key: 'site', width: 20 },
      { header: 'Inspector', key: 'inspectorName', width: 22 },
      { header: 'Score (%)', key: 'score', width: 12 },
      { header: 'Created At', key: 'createdAt', width: 22 },
    ];

    sheet.addRows(items.map((r) => ({
      id: r.id,
      inspectionId: r.inspectionId,
      site: r.site,
      inspectorName: r.inspectorName,
      score: r.score,
      createdAt: r.createdAt,
    })));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=\"compliance-report.xlsx\"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: 'Failed to export Excel', detail: err.message });
  }
});

connectMongo()
  .then(() => ensureSeedUsers())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Auth service running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start auth-service:', err);
    process.exit(1);
  });
