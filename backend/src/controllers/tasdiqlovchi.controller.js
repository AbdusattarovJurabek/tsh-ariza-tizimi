const { PrismaClient } = require('@prisma/client');
const { generateApplicationWord } = require('../utils/wordExport');
const { generateApplicationPDF } = require('../utils/export');
const { getWorkingDaysRemaining } = require('../utils/workingDays');
const { canTransition } = require('../utils/applicationRules');
const prisma = new PrismaClient();

const APPLICATION_INCLUDE = {
  user: { select: { full_name: true, username: true, region: true, district: true, phone: true } },
  farmer: true,
  files: { select: { id: true, file_type: true, file_name: true, file_path: true } },
  _count: { select: { files: true } }
};

// Barcha arizalar
exports.getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const where = {};

    // Tasdiqlovchi faqat yuborilgan arizalarni ko'radi (DRAFT emas)
    if (status) {
      where.status = status;
    } else {
      where.status = { notIn: ['DRAFT'] };
    }

    if (search) {
      where.OR = [
        { subject_name: { contains: search } },
        { leader_full_name: { contains: search } },
        { stir: { contains: search } },
        { app_number: { contains: search } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: APPLICATION_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.application.count({ where })
    ]);

    res.json({ data: applications, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Bitta ariza
exports.getApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id: parseInt(id) },
      include: { ...APPLICATION_INCLUDE, status_history: { orderBy: { created_at: 'desc' }, take: 10, include: { changed_by: { select: { full_name: true, role: true } } } } }
    });
    if (!application || application.status === 'DRAFT') {
      return res.status(404).json({ error: 'Ariza topilmadi' });
    }

    // word_content JSON parse
    if (application.word_content) {
      try { application.word_content = JSON.parse(application.word_content); } catch {}
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Status o'zgartirish
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const application = await prisma.application.findUnique({ where: { id: parseInt(id) } });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });
    if (!['UNDER_REVIEW', 'APPROVED'].includes(application.status)) {
      return res.status(400).json({ error: 'Bu holatda hujjat mazmunini tahrirlash mumkin emas' });
    }
    if (!canTransition(application.status, status)) {
      return res.status(400).json({
        error: `${application.status} holatidan ${status || 'noma’lum'} holatiga o'tish mumkin emas`
      });
    }
    if (status === 'HAS_ISSUES' && !String(comment || '').trim()) {
      return res.status(400).json({ error: 'Kamchiliklar haqida izoh majburiy' });
    }

    const updateData = { status, admin_comment: comment || null };

    if (status === 'APPROVED' && !application.approved_at) updateData.approved_at = new Date();
    if (status === 'SENT_TO_SIGNER') updateData.sent_to_signer_at = new Date();

    const [updated] = await prisma.$transaction([
      prisma.application.update({ where: { id: parseInt(id) }, data: updateData }),
      prisma.statusHistory.create({
        data: { application_id: parseInt(id), old_status: application.status, new_status: status, comment, changed_by_id: req.user.id }
      })
    ]);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Statusni yangilashda xato' });
  }
};

// Forma maydonlarini saqlash
exports.updateWordContent = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({ where: { id: parseInt(id) } });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });
    if (!['UNDER_REVIEW', 'APPROVED'].includes(application.status)) {
      return res.status(400).json({ error: 'Bu holatda hujjat mazmunini tahrirlash mumkin emas' });
    }
    await prisma.application.update({
      where: { id: parseInt(id) },
      data: { word_content: JSON.stringify(req.body) }
    });
    res.json({ message: 'Saqlandi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Saqlashda xato' });
  }
};

// Tahrirlangan HTML ni saqlash
exports.saveHtmlContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { html } = req.body;
    if (!html) return res.status(400).json({ error: 'HTML yo\'q' });
    const application = await prisma.application.findUnique({ where: { id: parseInt(id) } });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });
    await prisma.application.update({
      where: { id: parseInt(id) },
      data: { word_html_content: html }
    });
    res.json({ message: 'HTML saqlandi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Saqlashda xato' });
  }
};

// Word yuklab olish
exports.exportWord = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id: parseInt(id) },
      include: { user: { select: { full_name: true, region: true, district: true, phone: true } } }
    });
    if (!application || application.status === 'DRAFT') {
      return res.status(404).json({ error: 'Ariza topilmadi' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="TSH-${application.app_number}.docx"`);

    let data = { ...application };
    if (application.word_content) {
      try { data = { ...application, ...JSON.parse(application.word_content) }; } catch {}
    }
    const docBuffer = await generateApplicationWord(data);
    res.send(docBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Word yaratishda xato' });
  }
};

// PDF yuklab olish
exports.exportPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id: parseInt(id) },
      include: {
        files: true,
        user: { select: { full_name: true, region: true, district: true, phone: true } }
      }
    });
    if (!application || application.status === 'DRAFT') {
      return res.status(404).json({ error: 'Ariza topilmadi' });
    }

    const pdfBuffer = await generateApplicationPDF(application);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="TSH-${application.app_number}.html"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF yaratishda xato' });
  }
};

// Statistika
exports.getStatistics = async (req, res) => {
  try {
    const [total, byStatus] = await Promise.all([
      prisma.application.count({ where: { status: { notIn: ['DRAFT'] } } }),
      prisma.application.groupBy({ by: ['status'], _count: true, where: { status: { notIn: ['DRAFT'] } } })
    ]);
    const statusMap = {};
    byStatus.forEach(s => { statusMap[s.status] = s._count; });
    res.json({ total, by_status: statusMap });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
};
