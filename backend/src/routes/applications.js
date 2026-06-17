const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/application.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(authenticate);

router.get('/', ctrl.getMyApplications);
router.post('/', ctrl.createApplication);
router.get('/:id', ctrl.getApplication);
router.put('/:id', ctrl.updateApplication);
router.post('/:id/submit', ctrl.submitApplication);
router.get('/:id/export/word', ctrl.exportMyApplicationWord);
router.post('/:id/files', upload.single('file'), ctrl.uploadFile);
router.delete('/:id/files/:fileId', ctrl.deleteFile);

module.exports = router;
