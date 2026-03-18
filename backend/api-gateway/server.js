const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const app = express();
const PORT = Number(process.env.GATEWAY_PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const WORKERS_SERVICE_URL = process.env.WORKERS_SERVICE_URL || 'http://localhost:4002';
const INCIDENTS_SERVICE_URL = process.env.INCIDENTS_SERVICE_URL || 'http://localhost:4003';
const INSPECTIONS_SERVICE_URL = process.env.INSPECTIONS_SERVICE_URL || 'http://localhost:4004';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
// Evidence uploads are sent as base64 JSON; increase the default payload limit.
app.use(express.json({ limit: '25mb' }));

// Serve uploaded evidence files for audit trail.
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

function buildTargetUrl(baseUrl, serviceBasePath, reqUrl) {
  const suffix = reqUrl === '/' ? '' : reqUrl;
  return `${baseUrl}${serviceBasePath}${suffix}`;
}

async function forwardRequest(req, res, baseUrl, serviceBasePath, injectedHeaders = {}) {
  try {
    const targetUrl = buildTargetUrl(baseUrl, serviceBasePath, req.url);
    const headers = {
      'Content-Type': 'application/json',
      ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      ...injectedHeaders,
    };

    const options = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'DELETE') {
      options.body = JSON.stringify(req.body || {});
    }

    const response = await fetch(targetUrl, options);
    const contentType = response.headers.get('content-type') || '';

    // For PDF/Excel exports we must forward binary payloads.
    if (!contentType.includes('application/json')) {
      const cd = response.headers.get('content-disposition');
      const buf = Buffer.from(await response.arrayBuffer());
      if (contentType) res.setHeader('Content-Type', contentType);
      if (cd) res.setHeader('Content-Disposition', cd);
      return res.status(response.status).send(buf);
    }

    const data = await response.json().catch(() => ({ message: 'No response payload' }));
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(502).json({
      message: 'Service unavailable',
      detail: error.message,
    });
  }
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/auth/validate`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ message: 'Unauthorized' }));
      return res.status(response.status).json(data);
    }

    const data = await response.json();
    req.user = data.user;
    return next();
  } catch (error) {
    return res.status(502).json({ message: 'Auth service unavailable', detail: error.message });
  }
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.use('/api/auth', (req, res) => {
  return forwardRequest(req, res, AUTH_SERVICE_URL, '/auth');
});

app.use('/api/workers', authenticate, (req, res) => {
  return forwardRequest(req, res, WORKERS_SERVICE_URL, '/workers', {
    'x-user-id': req.user.id,
    'x-user-role': req.user.role,
  });
});

app.use('/api/incidents', authenticate, (req, res) => {
  return forwardRequest(req, res, INCIDENTS_SERVICE_URL, '/incidents', {
    'x-user-id': req.user.id,
    'x-user-role': req.user.role,
  });
});

app.use('/api/inspections', authenticate, (req, res) => {
  return forwardRequest(req, res, INSPECTIONS_SERVICE_URL, '/inspections', {
    'x-user-id': req.user.id,
    'x-user-role': req.user.role,
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
});
