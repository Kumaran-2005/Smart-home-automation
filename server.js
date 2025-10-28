const express = require('express');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cors = require('cors');

// Firebase Admin
const admin = require('firebase-admin');

// Try to load service account from environment or local file
let serviceAccount = null;
const svcPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(svcPath)) {
  try {
    serviceAccount = require(svcPath);
  } catch (err) {
    console.warn('Failed to load service account from', svcPath, err.message);
  }
}

let databaseURL = process.env.DATABASE_URL || (serviceAccount && serviceAccount.databaseURL) || null;

// If databaseURL is still the placeholder, ignore it to avoid invalid URL errors
if (typeof databaseURL === 'string' && databaseURL.includes('<')) {
  console.warn('DATABASE_URL contains a placeholder value; ignoring. Set DATABASE_URL env var to your database URL.');
  databaseURL = null;
}

try {
  const initOptions = {};
  if (serviceAccount) initOptions.credential = admin.credential.cert(serviceAccount);
  else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) initOptions.credential = admin.credential.applicationDefault();
  if (databaseURL) initOptions.databaseURL = databaseURL;

  admin.initializeApp(initOptions);
  console.log('Firebase Admin initialized.', databaseURL ? `DB=${databaseURL}` : '(no databaseURL)');
} catch (err) {
  console.error('Error initializing Firebase Admin:', err && err.message ? err.message : err);
}

let db = null;
if (databaseURL) {
  try {
    db = admin.database();
  } catch (err) {
    console.warn('Failed to initialize Realtime Database client:', err && err.message ? err.message : err);
    db = null;
  }
} else {
  console.warn('Realtime Database not configured (no DATABASE_URL). API endpoints that use the DB will return 503.');
}

const app = express();
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend (index.html in project root)
app.use(express.static(path.join(__dirname)));

// Simple API endpoints to read/write device values
app.get('/api/devices', async (req, res) => {
  if (!db) return res.status(503).json({ ok: false, error: 'Realtime Database not configured. Set DATABASE_URL and service account.' });
  try {
    const snapshot = await db.ref('/').once('value');
    res.json({ ok: true, data: snapshot.val() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/device/:id', async (req, res) => {
  const id = req.params.id;
  if (!db) return res.status(503).json({ ok: false, error: 'Realtime Database not configured. Set DATABASE_URL and service account.' });
  try {
    const snapshot = await db.ref(id).once('value');
    res.json({ ok: true, data: snapshot.val() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/device/:id', async (req, res) => {
  const id = req.params.id;
  const value = req.body.value;
  if (typeof value === 'undefined') {
    return res.status(400).json({ ok: false, error: 'Missing "value" in body' });
  }
  if (!db) return res.status(503).json({ ok: false, error: 'Realtime Database not configured. Set DATABASE_URL and service account.' });
  try {
    await db.ref(id).set(value);
    const snapshot = await db.ref(id).once('value');
    res.json({ ok: true, data: snapshot.val() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Health
app.get('/health', (req, res) => res.json({ ok: true, timestamp: Date.now() }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

// Export for tests (optional)
module.exports = app;
