const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const { generateApplicationWord } = require('../utils/wordExport');
const prisma = new PrismaClient();

const generateAppNumber = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.application.count();
  const num = String(count + 1).padStart(4, '0');
  return `ARA-TSH-${year}-${num}`;
};

// Foydalanuvchi o'z arizasini yaratadi
exports.createApplication = async (req, res) => {
  try {
    const app_number = await generateAppNumber();
    const { farmer_id } = req.body;

    // Fermer tanlangan bo'lsa — uning ma'lumotlarini avtomatik to'ldirish
    let farmerData = {};
    if (farmer_id) {
      const farmer = await prisma.farmer.findFirst({
        where: { id: parseInt(farmer_id), user_id: req.user.id }
      });
      if (farmer) {
        farmerData = {
          leader_full_name: farmer.full_name,
          legal_address: farmer.legal_address,
          stir: farmer.stir,
          total_land_area: farmer.land_area
        };
      }
    }

    const application = await prisma.application.create({
      data: {
        app_number,
        user_id: req.user.id,
        farmer_id: farmer_id ? parseInt(farmer_id) : null,
        status: 'DRAFT',
        ...farmerData,
        ...extractAppData(req.body)
      }
    });
    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ariza yaratishda xato' });
  }
};

// Foydalanuvchi o'z arizalarini ko'radi
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { user_id: req.user.id },
      include: {
        files: true,
        farmer: true
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(applications);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Bitta ariza ko'rish
exports.getApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const where = { id: parseInt(id) };

    // Oddiy foydalanuvchi faqat o'z arizasini
    if (req.user.role === 'USER') {
      where.user_id = req.user.id;
    }

    const application = await prisma.application.findFirst({
      where,
      include: {
        files: true,
        status_history: {
          include: { changed_by: { select: { full_name: true, role: true } } },
          orderBy: { created_at: 'desc' }
        },
        user: { select: { full_name: true, username: true, region: true, district: true, phone: true } }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Ariza topilmadi' });
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Arizani yangilash (faqat DRAFT yoki HAS_ISSUES holatida)
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findFirst({
      where: { id: parseInt(id), user_id: req.user.id }
    });

    if (!application) {
      return res.status(404).json({ error: 'Ariza topilmadi' });
    }

    if (!['DRAFT', 'HAS_ISSUES'].includes(application.status)) {
      return res.status(400).json({ error: 'Bu arizani tahrirlash mumkin emas' });
    }

    const updated = await prisma.application.update({
      where: { id: parseInt(id) },
      data: extractAppData(req.body),
      include: { files: true }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Arizani yangilashda xato' });
  }
};

// Arizani yuborish
exports.submitApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findFirst({
      where: { id: parseInt(id), user_id: req.user.id }
    });

    if (!application) {
      return res.status(404).json({ error: 'Ariza topilmadi' });
    }

    if (!['DRAFT', 'HAS_ISSUES'].includes(application.status)) {
      return res.status(400).json({ error: 'Ariza allaqachon yuborilgan' });
    }

    const updated = await prisma.application.update({
      where: { id: parseInt(id) },
      data: {
        status: 'SUBMITTED',
        submitted_at: new Date()
      }
    });

    await prisma.statusHistory.create({
      data: {
        application_id: parseInt(id),
        old_status: application.status,
        new_status: 'SUBMITTED',
        comment: 'Foydalanuvchi tomonidan yuborildi',
        changed_by_id: req.user.id
      }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Arizani yuborishda xato' });
  }
};

// Fayl yuklash
exports.uploadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const { file_type } = req.body;

    const application = await prisma.application.findFirst({
      where: { id: parseInt(id), user_id: req.user.id }
    });

    if (!application) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Ariza topilmadi' });
    }

    if (!['DRAFT', 'HAS_ISSUES'].includes(application.status)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Bu arizaga fayl yuklab bo\'lmaydi' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Fayl tanlanmadi' });
    }

    const relativePath = path.relative(
      path.join(__dirname, '../../'),
      req.file.path
    ).replace(/\\/g, '/');

    const file = await prisma.applicationFile.create({
      data: {
        application_id: parseInt(id),
        file_type: file_type || 'OTHER',
        file_name: req.file.originalname,
        file_path: relativePath,
        mime_type: req.file.mimetype,
        file_size: req.file.size
      }
    });

    res.status(201).json(file);
  } catch (err) {
    console.error(err);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Fayl yuklashda xato' });
  }
};

// Faylni o'chirish
exports.deleteFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;

    const application = await prisma.application.findFirst({
      where: { id: parseInt(id), user_id: req.user.id }
    });

    if (!application || !['DRAFT', 'HAS_ISSUES'].includes(application.status)) {
      return res.status(400).json({ error: 'Bu faylni o\'chirish mumkin emas' });
    }

    const file = await prisma.applicationFile.findFirst({
      where: { id: parseInt(fileId), application_id: parseInt(id) }
    });

    if (!file) return res.status(404).json({ error: 'Fayl topilmadi' });

    const fullPath = path.join(__dirname, '../../', file.file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    await prisma.applicationFile.delete({ where: { id: parseInt(fileId) } });
    res.json({ message: 'Fayl o\'chirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Faylni o\'chirishda xato' });
  }
};

// Foydalanuvchi o'z tasdiqlangan arizasini Word formatda yuklab oladi
exports.exportMyApplicationWord = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findFirst({
      where: { id: parseInt(id), user_id: req.user.id },
      include: {
        files: true,
        user: { select: { full_name: true, region: true, district: true, phone: true } }
      }
    });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });
    if (application.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Faqat tasdiqlangan arizalarni yuklab olish mumkin' });
    }
    const docBuffer = await generateApplicationWord(application);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="ariza-${application.app_number}.docx"`);
    res.send(docBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Word fayl yaratishda xato' });
  }
};

function extractAppData(body) {
  const fields = [
    'subject_name', 'leader_full_name', 'legal_address', 'stir', 'mfo',
    'bank_account', 'bank_name', 'total_land_area', 'land_specialization',
    'garden_area', 'land_contour', 'garden_address', 'location_url', 'qr_code',
    'land_decision_number', 'land_decision_date', 'lease_contract_number',
    'lease_contract_date', 'registry_number', 'soil_type', 'soil_composition',
    'soil_quality', 'soil_fertility', 'water_supply_info', 'weather_analysis',
    'scientific_recommendation', 'fruit_type', 'fruit_variety', 'planting_scheme',
    'seedling_count', 'planting_period', 'water_source', 'project_amount',
    'permanent_jobs', 'seasonal_jobs', 'supplier_companies'
  ];

  const data = {};
  fields.forEach(f => {
    if (body[f] !== undefined) {
      if (['total_land_area', 'garden_area', 'project_amount'].includes(f)) {
        data[f] = body[f] ? parseFloat(body[f]) : null;
      } else if (['seedling_count', 'permanent_jobs', 'seasonal_jobs'].includes(f)) {
        data[f] = body[f] ? parseInt(body[f]) : null;
      } else {
        data[f] = body[f] || null;
      }
    }
  });
  return data;
}
