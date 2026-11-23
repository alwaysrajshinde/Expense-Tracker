const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// In-Memory Rate Limiter for API protection
const ipRateLimitMap = new Map();
app.use('/api', (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 300;

  let record = ipRateLimitMap.get(ip);
  if (!record || now - record.startTime > windowMs) {
    record = { count: 1, startTime: now };
    ipRateLimitMap.set(ip, record);
  } else {
    record.count++;
  }

  if (record.count > maxRequests) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
  }
  next();
});

// Periodic cleanup of stale rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRateLimitMap.entries()) {
    if (now - record.startTime > 60 * 1000) {
      ipRateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API routes
app.use('/api', routes);

// Serve static frontend files if built
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexFile = path.join(clientDist, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.status(200).send('PocketNook API running. Run client dev server or build frontend.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
