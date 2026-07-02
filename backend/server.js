require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/public', require('./routes/public'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Three separate front-end applications, each served as its own static app
app.use('/super-admin', express.static(path.join(__dirname, '../frontend/super-admin')));
app.use('/admin', express.static(path.join(__dirname, '../frontend/admin')));
app.use('/user', express.static(path.join(__dirname, '../frontend/user')));

// Simple landing page linking to the three apps
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Feature Flag System</title>
      <style>
        body{font-family:Segoe UI,Arial,sans-serif;background:#0f172a;color:#e2e8f0;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;}
        h1{color:#38bdf8;}
        a{display:block;margin:10px;padding:14px 28px;background:#1e293b;color:#38bdf8;text-decoration:none;border-radius:8px;border:1px solid #334155;font-weight:600;}
        a:hover{background:#334155;}
      </style>
      </head>
      <body>
        <h1>Multi-Tenant Feature Flag System</h1>
        <a href="/super-admin">Super Admin Portal</a>
        <a href="/admin">Organization Admin Portal</a>
        <a href="/user">End User Portal</a>
      </body>
    </html>
  `);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚩 Feature Flag System running on port ${PORT}`);
  console.log(`   Home:        http://localhost:${PORT}`);
  console.log(`   Super Admin: http://localhost:${PORT}/super-admin`);
  console.log(`   Org Admin:   http://localhost:${PORT}/admin`);
  console.log(`   End User:    http://localhost:${PORT}/user`);
  console.log(`   API health:  http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
