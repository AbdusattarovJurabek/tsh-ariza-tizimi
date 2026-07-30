const router = require('express').Router();
const ctrl = require('../controllers/tasdiqlovchi.controller');
const { authenticate, authorize } = require('../middleware/auth');

const { upload } = require('../middleware/upload');

const allow = authenticate, role = authorize('TASDIQLOVCHI', 'SUPERADMIN');

router.get('/applications', allow, role, ctrl.getAllApplications);
router.get('/applications/:id', allow, role, ctrl.getApplication);
router.patch('/applications/:id/status', allow, role, ctrl.updateStatus);
router.post('/applications/:id/approve-pdf', allow, role, upload.single('pdf_file'), ctrl.approveWithPdf);
router.put('/applications/:id/word-content', allow, role, ctrl.updateWordContent);
router.put('/applications/:id/html-content', allow, role, ctrl.saveHtmlContent);
router.get('/applications/:id/word', allow, role, ctrl.exportWord);
router.get('/applications/:id/pdf', allow, role, ctrl.exportPDF);
router.get('/statistics', allow, role, ctrl.getStatistics);

module.exports = router;
