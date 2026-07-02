const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// POST /api/superadmin/login
// Uses static, config-based credentials (env vars) per assignment spec -
// no DB row for the super admin.
exports.login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const validEmail = process.env.SUPER_ADMIN_EMAIL;
  const validPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (email !== validEmail || password !== validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { email, role: 'super_admin' },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '12h' }
  );

  res.json({ success: true, token, user: { email, role: 'super_admin' } });
};

// POST /api/superadmin/organizations
exports.createOrganization = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Organization name is required' });

    const { rows } = await query(
      'INSERT INTO organizations (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json({ success: true, organization: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Organization name already exists' });
    res.status(500).json({ error: err.message });
  }
};

// GET /api/superadmin/organizations
exports.listOrganizations = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM organizations ORDER BY created_at DESC');
    res.json({ success: true, organizations: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
