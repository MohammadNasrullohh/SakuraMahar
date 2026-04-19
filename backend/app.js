const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const {
  bundledUploadsDirectory,
  resolveUploadsDirectory
} = require('./utils/runtimePaths');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const runtimeUploadsDirectory = resolveUploadsDirectory();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(runtimeUploadsDirectory));
if (runtimeUploadsDirectory !== bundledUploadsDirectory) {
  app.use('/uploads', express.static(bundledUploadsDirectory));
}

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/mahar', require('./routes/mahar'));
app.use('/api/guests', require('./routes/guests'));
app.use('/api/undangan', require('./routes/undangan'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/site-content', require('./routes/siteContent'));
app.use('/api/media', require('./routes/media'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/analytics', require('./routes/analytics'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sakura Mahar API is running',
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint tidak ditemukan',
    path: req.originalUrl,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500
  });
});

module.exports = app;
