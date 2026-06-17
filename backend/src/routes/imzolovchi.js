const router = require('express').Router();
const ctrl = require('../controllers/imzolovchi.controller');
const { authenticate, authorize } = require('../middleware/auth');

const allow = authenticate, role = authorize('IMZOLOVCHI', 'SUPERADMIN');

router.get('/applications', allow, role, ctrl.getAllApplications);
router.get('/applications/:id', allow, role, ctrl.getApplication);
router.put('/applications/:id/word-content', allow, role, ctrl.updateWordContent);
router.get('/applications/:id/word', allow, role, ctrl.exportWord);
router.post('/applications/:id/sign', allow, role, ctrl.signApplication);

module.exports = router;
