const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/admin.controller');
const appCtrl = require('../controllers/application.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('SUPERADMIN'));

router.get('/applications', ctrl.getAllApplications);
router.get('/applications/:id', appCtrl.getApplication);
router.patch('/applications/:id/status', ctrl.updateApplicationStatus);
router.get('/applications/:id/export/pdf', ctrl.exportApplicationPDF);
router.get('/applications/:id/export/word', ctrl.exportApplicationWord);
router.get('/export/applications/excel', ctrl.exportAllApplicationsExcel);
router.get('/statistics', ctrl.getStatistics);

module.exports = router;
