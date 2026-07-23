const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/application.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(authenticate);

router.get('/', authorize('USER'), ctrl.getMyApplications);
router.post('/', authorize('USER'), ctrl.createApplication);
router.get('/:id/files/:fileId/download', ctrl.downloadFile);
router.get('/:id', authorize('USER'), ctrl.getApplication);
router.put('/:id', authorize('USER'), ctrl.updateApplication);
router.post('/:id/submit', authorize('USER'), ctrl.submitApplication);
router.get('/:id/export/word', authorize('USER'), ctrl.exportMyApplicationWord);
router.post('/:id/files', authorize('USER'), upload.single('file'), ctrl.uploadFile);
router.delete('/:id/files/:fileId', authorize('USER'), ctrl.deleteFile);

module.exports = router;
