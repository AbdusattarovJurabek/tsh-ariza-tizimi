const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Foydalanuvchining fermerlarini ko'rish
exports.getMyFarmers = async (req, res) => {
  try {
    const farmers = await prisma.farmer.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(farmers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Bitta fermerni ko'rish
exports.getFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const farmer = await prisma.farmer.findFirst({
      where: { id: parseInt(id), user_id: req.user.id }
    });
    if (!farmer) return res.status(404).json({ error: 'Fermer topilmadi' });
    res.json(farmer);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Fermer yaratish
exports.createFarmer = async (req, res) => {
  try {
    const { full_name, leader_full_name, legal_address, stir, region, district, land_area } = req.body;

    // Majburiy maydonlar tekshiruvi
    if (!full_name)         return res.status(400).json({ error: 'Fermer nomi majburiy' });
    if (!leader_full_name)  return res.status(400).json({ error: 'Direktor F.I.Sh. majburiy' });
    if (!stir)              return res.status(400).json({ error: 'INN majburiy' });
    if (!/^\d{9}$/.test(stir.trim())) return res.status(400).json({ error: "INN aynan 9 ta raqamdan iborat bo'lishi kerak" });
    if (!region)            return res.status(400).json({ error: 'Viloyat majburiy' });
    if (!district)          return res.status(400).json({ error: 'Tuman majburiy' });
    if (!legal_address)     return res.status(400).json({ error: 'Yuridik manzil majburiy' });
    if (!land_area || parseFloat(land_area) <= 0) return res.status(400).json({ error: 'Yer maydoni majburiy' });

    const farmer = await prisma.farmer.create({
      data: {
        user_id:         req.user.id,
        full_name:       full_name.trim(),
        leader_full_name: leader_full_name.trim(),
        legal_address:   legal_address.trim(),
        stir:            stir.trim(),
        region,
        district,
        land_area:       parseFloat(land_area)
      }
    });

    res.status(201).json(farmer);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Bu INN allaqachon bazada mavjud' });
    }
    res.status(500).json({ error: 'Fermer yaratishda xato' });
  }
};

// Fermerni yangilash
exports.updateFarmer = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, leader_full_name, legal_address, stir, region, district, land_area } = req.body;

    // Majburiy maydonlar tekshiruvi
    if (!full_name)         return res.status(400).json({ error: 'Fermer nomi majburiy' });
    if (!leader_full_name)  return res.status(400).json({ error: 'Direktor F.I.Sh. majburiy' });
    if (!stir)              return res.status(400).json({ error: 'INN majburiy' });
    if (!/^\d{9}$/.test(stir.trim())) return res.status(400).json({ error: "INN aynan 9 ta raqamdan iborat bo'lishi kerak" });
    if (!region)            return res.status(400).json({ error: 'Viloyat majburiy' });
    if (!district)          return res.status(400).json({ error: 'Tuman majburiy' });
    if (!legal_address)     return res.status(400).json({ error: 'Yuridik manzil majburiy' });
    if (!land_area || parseFloat(land_area) <= 0) return res.status(400).json({ error: 'Yer maydoni majburiy' });

    const existing = await prisma.farmer.findFirst({
      where: { id: parseInt(id), user_id: req.user.id }
    });
    if (!existing) return res.status(404).json({ error: 'Fermer topilmadi' });

    const farmer = await prisma.farmer.update({
      where: { id: parseInt(id) },
      data: {
        full_name:        full_name.trim(),
        leader_full_name: leader_full_name.trim(),
        legal_address:    legal_address.trim(),
        stir:             stir.trim(),
        region,
        district,
        land_area:        parseFloat(land_area)
      }
    });

    res.json(farmer);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Bu INN allaqachon bazada mavjud' });
    }
    res.status(500).json({ error: 'Fermerni yangilashda xato' });
  }
};

// Fermerni o'chirish
exports.deleteFarmer = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.farmer.findFirst({
      where: { id: parseInt(id), user_id: req.user.id }
    });
    if (!existing) return res.status(404).json({ error: 'Fermer topilmadi' });

    // Bog'liq arizalar bormi?
    const appCount = await prisma.application.count({
      where: { farmer_id: parseInt(id) }
    });
    if (appCount > 0) {
      return res.status(400).json({
        error: `Bu fermerni o'chirib bo'lmaydi — ${appCount} ta ariza bog'langan`
      });
    }

    await prisma.farmer.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Fermer o\'chirildi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Fermerni o\'chirishda xato' });
  }
};

// Admin: barcha fermerlarni ko'rish
exports.getAllFarmers = async (req, res) => {
  try {
    const { search, region } = req.query;
    const where = {};

    if (region) where.region = { contains: region };
    if (search) {
      where.OR = [
        { full_name: { contains: search } },
        { stir: { contains: search } }
      ];
    }

    const farmers = await prisma.farmer.findMany({
      where,
      include: {
        user: { select: { full_name: true, username: true } },
        _count: { select: { applications: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(farmers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};
