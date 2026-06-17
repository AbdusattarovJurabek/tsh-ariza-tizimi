const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/temp')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}.xlsx`)
});
const uploadExcel = multer({
  storage: excelStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel') || file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat Excel (.xlsx) fayl qabul qilinadi'));
    }
  }
});

const fs = require('fs');
const tempDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/', ctrl.getAllUsers);
router.post('/', ctrl.createUser);
router.put('/:id', ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);
router.post('/:id/reset-password', ctrl.resetPassword);
router.post('/import/excel', uploadExcel.single('file'), ctrl.importUsersFromExcel);
router.get('/export/excel', ctrl.exportUsersExcel);

module.exports = router;
