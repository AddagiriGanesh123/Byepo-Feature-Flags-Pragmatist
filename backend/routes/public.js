const router = require('express').Router();
const ctrl = require('../controllers/publicController');

router.get('/organizations', ctrl.listOrganizations);
router.post('/check-flag', ctrl.checkFlag);

module.exports = router;
