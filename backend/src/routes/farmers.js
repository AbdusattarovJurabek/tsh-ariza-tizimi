const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/farmer.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Foydalanuvchi o'z fermerlarini boshqaradi
router.get('/', ctrl.getMyFarmers);
router.get('/:id', ctrl.getFarmer);
router.post('/', ctrl.createFarmer);
router.put('/:id', ctrl.updateFarmer);
router.delete('/:id', ctrl.deleteFarmer);

// Admin: barcha fermerlar
router.get('/admin/all', authorize('ADMIN', 'SUPER_ADMIN'), ctrl.getAllFarmers);

module.exports = router;
