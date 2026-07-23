const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/farmer.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Admin marshruti dinamik /:id marshrutidan oldin turishi shart.
router.get('/admin/all', authorize('SUPERADMIN'), ctrl.getAllFarmers);

// Foydalanuvchi o'z fermerlarini boshqaradi
router.get('/', ctrl.getMyFarmers);
router.get('/:id', ctrl.getFarmer);
router.post('/', ctrl.createFarmer);
router.put('/:id', ctrl.updateFarmer);
router.delete('/:id', ctrl.deleteFarmer);

module.exports = router;
