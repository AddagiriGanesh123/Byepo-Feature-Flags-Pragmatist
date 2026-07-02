const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');

router.post('/signup', ctrl.signup);
router.post('/login', ctrl.login);

router.get('/flags', requireRole('org_admin'), ctrl.listFlags);
router.post('/flags', requireRole('org_admin'), ctrl.createFlag);
router.put('/flags/:id', requireRole('org_admin'), ctrl.updateFlag);
router.delete('/flags/:id', requireRole('org_admin'), ctrl.deleteFlag);

module.exports = router;
