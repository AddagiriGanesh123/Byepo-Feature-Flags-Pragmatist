const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// POST /api/admin/signup
exports.signup = async (req, res) => {
  try {
    const { org_id, email, password } = req.body;
    if (!org_id || !email || !password) {
      return res.status(400).json({ error: 'org_id, email and password are required' });
    }

    const org = await query('SELECT id FROM organizations WHERE id = $1', [org_id]);
    if (!org.rows[0]) return res.status(404).json({ error: 'Organization not found' });

    const role = await query("SELECT id FROM roles WHERE name = 'org_admin'");
    const hashed = await bcrypt.hash(password, 10);

    const { rows } = await query(
      'INSERT INTO users (org_id, email, password, role_id) VALUES ($1, $2, $3, $4) RETURNING id, org_id, email',
      [org_id, email, hashed, role.rows[0].id]
    );

    res.status(201).json({ success: true, user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await query(
      `SELECT u.*, o.name AS org_name FROM users u
       JOIN organizations o ON o.id = u.org_id
       WHERE u.email = $1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, org_id: user.org_id, role: 'org_admin' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, org_id: user.org_id, org_name: user.org_name, role: 'org_admin' },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/admin/flags - list flags for the logged-in admin's org
exports.listFlags = async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT * FROM feature_flags WHERE org_id = $1 ORDER BY created_at DESC',
      [req.user.org_id]
    );
    res.json({ success: true, flags: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/admin/flags - create a flag scoped to the admin's org
exports.createFlag = async (req, res) => {
  try {
    const { feature_key, enabled } = req.body;
    if (!feature_key || !feature_key.trim()) {
      return res.status(400).json({ error: 'feature_key is required' });
    }

    const { rows } = await query(
      'INSERT INTO feature_flags (org_id, feature_key, enabled) VALUES ($1, $2, $3) RETURNING *',
      [req.user.org_id, feature_key.trim(), !!enabled]
    );
    res.status(201).json({ success: true, flag: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Feature key already exists for this organization' });
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/admin/flags/:id - enable/disable a flag (must belong to admin's org)
exports.updateFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    const { rows } = await query(
      `UPDATE feature_flags SET enabled = $1, updated_at = NOW()
       WHERE id = $2 AND org_id = $3 RETURNING *`,
      [!!enabled, id, req.user.org_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Flag not found for this organization' });
    res.json({ success: true, flag: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/admin/flags/:id
exports.deleteFlag = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      'DELETE FROM feature_flags WHERE id = $1 AND org_id = $2 RETURNING id',
      [id, req.user.org_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Flag not found for this organization' });
    res.json({ success: true, message: 'Flag deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
