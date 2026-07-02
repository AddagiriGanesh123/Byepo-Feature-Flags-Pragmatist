const router = require('express').Router();
const ctrl = require('../controllers/superadminController');
const { requireRole } = require('../middleware/auth');

router.post('/login', ctrl.login);
router.post('/organizations', requireRole('super_admin'), ctrl.createOrganization);
router.get('/organizations', requireRole('super_admin'), ctrl.listOrganizations);

module.exports = router;
