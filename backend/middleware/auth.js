const jwt = require('jsonwebtoken');

function verifyToken(req) {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch {
    return null;
  }
}

// Restrict route to a specific role (e.g. 'super_admin' or 'org_admin')
function requireRole(role) {
  return (req, res, next) => {
    const decoded = verifyToken(req);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized - missing or invalid token' });
    if (decoded.role !== role) return res.status(403).json({ error: 'Forbidden - insufficient role' });
    req.user = decoded;
    next();
  };
}

module.exports = { verifyToken, requireRole };
