const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/public.controller');

// Ariza holatini ochiq ko'rish (login talab qilinmaydi)
router.get('/track/:app_number', ctrl.trackApplication);
router.get('/download/:app_number', ctrl.downloadSignedDocument);

module.exports = router;
