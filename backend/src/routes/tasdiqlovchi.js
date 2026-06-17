const router = require('express').Router();
const ctrl = require('../controllers/tasdiqlovchi.controller');
const { authenticate, authorize } = require('../middleware/auth');

const allow = authenticate, role = authorize('TASDIQLOVCHI', 'SUPERADMIN');

router.get('/applications', allow, role, ctrl.getAllApplications);
router.get('/applications/:id', allow, role, ctrl.getApplication);
router.patch('/applications/:id/status', allow, role, ctrl.updateStatus);
router.put('/applications/:id/word-content', allow, role, ctrl.updateWordContent);
router.get('/applications/:id/word', allow, role, ctrl.exportWord);
router.get('/statistics', allow, role, ctrl.getStatistics);

module.exports = router;
