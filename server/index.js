const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;

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
      res.status(200).send('Expense Tracker API running. Run client dev server or build frontend.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
