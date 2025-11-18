// server.js
//
// SV13: Extraction CDN server
// Serves Unity Addressables, UI images, maps, and audio logs for the MMO.

const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// ===== Basic config =====
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ===== CORS =====
// Allow game client, API service, and tools to hit this CDN.
// You can tighten this later with specific origins.
app.use(cors());

// ===== Logging =====
app.use(morgan('dev'));

// ===== Cache headers =====
//
// - Versioned Addressables folders (v0.1.0, v0.2.0, etc.) can be heavily cached.
// - Manifest & root JSON should be no-store so the client always sees latest.
const longCachePaths = [
  '/addressables/',
  '/maps/',
  '/ui/',
  '/audio/'
];

app.use((req, res, next) => {
  const url = req.url;

  // Manifest & root JSON: always fetch fresh
  if (url === '/' || url.startsWith('/cdn_manifest')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return next();
  }

  // For versioned static content, allow long-lived caching
  if (longCachePaths.some(p => url.startsWith(p))) {
    // 30 days
    res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
  }

  next();
});

// ===== Static files =====
//
// All CDN content lives under /public, served from root (/).
app.use(express.static(PUBLIC_DIR, {
  setHeaders: (res, filePath) => {
    // Ensure correct content types for Addressables catalogs (JSON/text).
    if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    if (filePath.endsWith('.hash')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
  }
}));

// ===== Healthcheck =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sv-extract-cdn',
    time: new Date().toISOString()
  });
});

// ===== Root route =====
//
// Helpful small info endpoint if you hit the base URL in a browser.
app.get('/', (req, res) => {
  res.json({
    name: 'SV13: Extraction CDN',
    version: '0.1.0',
    manifest: '/cdn_manifest.json',
    examples: {
      standalone_catalog: '/addressables/standalone/v0.1.0/catalog.json',
      android_catalog: '/addressables/android/v0.1.0/catalog.json',
      outpost9_map: '/maps/outpost9/outpost9_base_layout.png',
      sample_audio: '/audio/sigma/sigma_log_01.mp3'
    }
  });
});

// ===== Start =====
app.listen(PORT, () => {
  console.log(`[sv-extract-cdn] Listening on port ${PORT}`);
});
