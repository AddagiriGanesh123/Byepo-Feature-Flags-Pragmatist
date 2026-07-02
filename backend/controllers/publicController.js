const { query } = require('../config/db');

// GET /api/public/organizations - used by the End User page (org dropdown)
// and the Admin signup page.
exports.listOrganizations = async (req, res) => {
  try {
    const { rows } = await query('SELECT id, name FROM organizations ORDER BY name ASC');
    res.json({ success: true, organizations: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/public/check-flag - End User submits org_id + feature_key
exports.checkFlag = async (req, res) => {
  try {
    const { org_id, feature_key } = req.body;
    if (!org_id || !feature_key) {
      return res.status(400).json({ error: 'org_id and feature_key are required' });
    }

    const { rows } = await query(
      'SELECT enabled FROM feature_flags WHERE org_id = $1 AND feature_key = $2',
      [org_id, feature_key.trim()]
    );

    if (!rows[0]) {
      return res.json({ success: true, found: false, enabled: false, message: 'Feature key not configured for this organization' });
    }

    res.json({ success: true, found: true, enabled: rows[0].enabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
