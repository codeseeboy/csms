const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const { connectMongo } = require('../../lib/mongo');
const Worker = require('../../models/Worker');
const AuditLog = require('../../models/AuditLog');
const TrainingRecord = require('../../models/TrainingRecord');
const { randomId, nowIso } = require('../../lib/helpers');

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const app = express();
const PORT = 4002;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
// Evidence/training uploads are sent as base64 JSON; increase payload limit.
app.use(express.json({ limit: "25mb" }));

const TRAINING_UPLOAD_DIR = path.resolve(__dirname, "../../uploads/training");

const seedWorkers = [
  {
    id: 'WRK-001',
    name: 'James Rodriguez',
    role: 'Crane Operator',
    contact: '+1 555-0101',
    certStatus: 'Valid',
    trainingStatus: 'Complete',
    assignedPPE: 'Helmet, Harness, Gloves',
    expiryDate: '2026-08-15',
  },
  {
    id: 'WRK-002',
    name: 'Sarah Chen',
    role: 'Site Supervisor',
    contact: '+1 555-0102',
    certStatus: 'Expiring',
    trainingStatus: 'Complete',
    assignedPPE: 'Helmet, Vest, Boots',
    expiryDate: '2026-03-20',
  },
  {
    id: 'WRK-003',
    name: 'Mike Thompson',
    role: 'Electrician',
    contact: '+1 555-0103',
    certStatus: 'Valid',
    trainingStatus: 'In Progress',
    assignedPPE: 'Helmet, Gloves, Goggles',
    expiryDate: '2026-11-30',
  },
  {
    id: 'WRK-004',
    name: 'Ana Petrova',
    role: 'Safety Inspector',
    contact: '+1 555-0104',
    certStatus: 'Expiring',
    trainingStatus: 'Overdue',
    assignedPPE: 'Helmet, Vest',
    expiryDate: '2026-03-25',
  },
];

function isAuthorizedRole(role) {
  // SRS RBAC: Admin/Contractor manage worker profiles.
  return ['ADMIN', 'CONTRACTOR'].includes(String(role || '').toUpperCase());
}

function ensureAuthenticated(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'workers-service' });
});

app.use('/workers', ensureAuthenticated);

app.get('/workers', (_req, res) => {
  Worker.find({})
    .sort({ createdAt: -1 })
    .then((items) => res.json({ items, count: items.length }))
    .catch((err) => res.status(500).json({ message: 'Failed to fetch workers', detail: err.message }));
});

app.get('/workers/:id', (req, res) => {
  Worker.findOne({ id: req.params.id })
    .then((worker) => {
      if (!worker) return res.status(404).json({ message: 'Worker not found' });
      return res.json(worker);
    })
    .catch((err) => res.status(500).json({ message: 'Failed to fetch worker', detail: err.message }));
});

app.post('/workers', (req, res) => {
  const userRole = req.headers['x-user-role'];
  if (!isAuthorizedRole(userRole)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { name, role: workerRole, contact, certStatus, trainingStatus, assignedPPE, expiryDate } = req.body || {};
  if (!name || !workerRole) {
    return res.status(400).json({ message: 'name and role are required' });
  }

  Worker.countDocuments({})
    .then(async (count) => {
      const worker = await Worker.create({
        id: `WRK-${String(count + 1).padStart(3, '0')}`,
        name,
        role: workerRole,
        contact: contact || '',
        certStatus: certStatus || 'Valid',
        trainingStatus: trainingStatus || 'In Progress',
        assignedPPE: assignedPPE || '',
        expiryDate: expiryDate || null,
      });
      return res.status(201).json(worker);
    })
    .catch((err) => res.status(500).json({ message: 'Failed to create worker', detail: err.message }));
});

app.put('/workers/:id', (req, res) => {
  const role = req.headers['x-user-role'];
  if (!isAuthorizedRole(role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const updates = req.body || {};
  Worker.findOneAndUpdate(
    { id: req.params.id },
    { $set: updates },
    { new: true },
  )
    .then((worker) => {
      if (!worker) return res.status(404).json({ message: 'Worker not found' });
      return res.json(worker);
    })
    .catch((err) => res.status(500).json({ message: 'Failed to update worker', detail: err.message }));
});

app.post('/workers/:id/training', async (req, res) => {
  try {
    const role = req.headers['x-user-role'];
    if (!['ADMIN', 'CONTRACTOR'].includes(String(role || '').toUpperCase())) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const userId = String(req.headers['x-user-id'] || '');
    const { trainingBase64, trainingOriginalName, trainingMimeType } = req.body || {};

    if (!trainingBase64 || !trainingOriginalName || !trainingMimeType) {
      return res.status(400).json({ message: 'trainingBase64, trainingOriginalName and trainingMimeType are required' });
    }

    const worker = await Worker.findOne({ id: req.params.id });
    if (!worker) return res.status(404).json({ message: 'Worker not found' });

    fs.mkdirSync(TRAINING_UPLOAD_DIR, { recursive: true });

    const extFromName = path.extname(String(trainingOriginalName || ""));
    const extFromMime = (() => {
      const m = String(trainingMimeType || "").toLowerCase();
      if (m.includes('png')) return '.png';
      if (m.includes('jpeg') || m.includes('jpg')) return '.jpg';
      if (m.includes('pdf')) return '.pdf';
      return '';
    })();

    const ext = extFromName || extFromMime || '';
    const filename = `${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`;
    const filePath = path.join(TRAINING_UPLOAD_DIR, filename);

    const base64 = String(trainingBase64).includes(';base64,')
      ? String(trainingBase64).split(';base64,')[1]
      : String(trainingBase64);
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));

    const record = await TrainingRecord.create({
      id: randomId('TRN'),
      workerId: worker.id,
      uploadedByUserId: userId,
      originalName: String(trainingOriginalName),
      mimeType: String(trainingMimeType),
      filename,
      path: filePath,
      size: fs.statSync(filePath).size,
      uploadedAt: nowIso(),
    });

    // Update worker training status after upload.
    await Worker.findOneAndUpdate({ id: worker.id }, { $set: { trainingStatus: 'Complete' } });

    await AuditLog.create({
      id: randomId('AUDIT'),
      action: 'TRAINING_UPLOADED',
      userId,
      module: '/training',
      details: `Training uploaded for worker ${worker.id} (record ${record.id})`,
      timestamp: nowIso(),
    });

    return res.status(201).json(record);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to upload training', detail: err.message });
  }
});

app.delete('/workers/:id', (req, res) => {
  const role = req.headers['x-user-role'];
  if (!isAuthorizedRole(role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  Worker.deleteOne({ id: req.params.id })
    .then((r) => {
      if (!r.deletedCount) return res.status(404).json({ message: 'Worker not found' });
      return res.status(204).send();
    })
    .catch((err) => res.status(500).json({ message: 'Failed to delete worker', detail: err.message }));
});

async function ensureSeedWorkers() {
  const existingCount = await Worker.countDocuments({});
  if (existingCount > 0) return;
  await Worker.insertMany(seedWorkers);
}

connectMongo()
  .then(() => ensureSeedWorkers())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Workers service running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start workers-service:', err);
    process.exit(1);
  });
