const { PrismaClient } = require('@prisma/client');
const { generateApplicationWord } = require('../utils/wordExport');
const { getWorkingDaysRemaining } = require('../utils/workingDays');
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
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });

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

    const validStatuses = ['UNDER_REVIEW', 'HAS_ISSUES', 'APPROVED', 'REJECTED', 'SENT_TO_SIGNER'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Noto'g'ri status" });

    const application = await prisma.application.findUnique({ where: { id: parseInt(id) } });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });

    const updateData = { status, admin_comment: comment || null };

    if (status === 'APPROVED' && !application.approved_at) updateData.approved_at = new Date();
    if (status !== 'APPROVED' && application.status === 'APPROVED') updateData.approved_at = null;
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

// Word mazmunini saqlash (tahrirlash)
exports.updateWordContent = async (req, res) => {
  try {
    const { id } = req.params;
    const wordContent = req.body;

    const application = await prisma.application.findUnique({ where: { id: parseInt(id) } });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });

    const updated = await prisma.application.update({
      where: { id: parseInt(id) },
      data: { word_content: JSON.stringify(wordContent) }
    });

    res.json({ message: 'Saqlandi', word_content: wordContent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Saqlashda xato' });
  }
};

// Word yuklab olish (word_content dan yoki arizadan)
exports.exportWord = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id: parseInt(id) },
      include: { files: true, user: { select: { full_name: true, region: true, district: true, phone: true } } }
    });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });

    // word_content mavjud bo'lsa, uni application ustiga qo'yamiz
    let dataForWord = { ...application };
    if (application.word_content) {
      try {
        const wc = JSON.parse(application.word_content);
        dataForWord = { ...application, ...wc };
      } catch {}
    }

    const docBuffer = await generateApplicationWord(dataForWord);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="ariza-${application.app_number}.docx"`);
    res.send(docBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Word yaratishda xato' });
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
