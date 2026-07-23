const { PrismaClient } = require('@prisma/client');
const { generateApplicationWord } = require('../utils/wordExport');
const { canTransition } = require('../utils/applicationRules');
const prisma = new PrismaClient();

const APPLICATION_INCLUDE = {
  user: { select: { full_name: true, username: true, region: true, district: true, phone: true } },
  farmer: true,
  files: { select: { id: true, file_type: true, file_name: true, file_path: true } }
};

// SENT_TO_SIGNER va SIGNED arizalar
exports.getAllApplications = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const where = {
      status: status ? status : { in: ['SENT_TO_SIGNER', 'SIGNED'] }
    };

    if (search) {
      where.OR = [
        { subject_name: { contains: search } },
        { leader_full_name: { contains: search } },
        { app_number: { contains: search } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: APPLICATION_INCLUDE,
        orderBy: { sent_to_signer_at: 'desc' },
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
      include: { ...APPLICATION_INCLUDE, status_history: { orderBy: { created_at: 'desc' }, take: 5, include: { changed_by: { select: { full_name: true, role: true } } } } }
    });
    if (!application || !['SENT_TO_SIGNER', 'SIGNED'].includes(application.status)) {
      return res.status(404).json({ error: 'Ariza topilmadi' });
    }

    if (application.word_content) {
      try { application.word_content = JSON.parse(application.word_content); } catch {}
    }

    res.json(application);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Word mazmunini tahrirlash
exports.updateWordContent = async (req, res) => {
  try {
    const { id } = req.params;
    const wordContent = req.body;

    const application = await prisma.application.findUnique({ where: { id: parseInt(id) } });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });
    if (application.status !== 'SENT_TO_SIGNER') {
      return res.status(400).json({ error: "Bu ariza imzolash bosqichida emas" });
    }

    await prisma.application.update({
      where: { id: parseInt(id) },
      data: { word_content: JSON.stringify(wordContent) }
    });

    res.json({ message: 'Saqlandi', word_content: wordContent });
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
      include: { files: true, user: { select: { full_name: true, region: true, district: true, phone: true } } }
    });
    if (!application || !['SENT_TO_SIGNER', 'SIGNED'].includes(application.status)) {
      return res.status(404).json({ error: 'Ariza topilmadi' });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="TSH-${application.app_number}.docx"`);

    // Tasdiqlovchi HTML saqlagan bo'lsa — shuni ishlatamiz
    if (application.word_html_content) {
      const HTMLtoDOCX = require('html-to-docx');
      const docBuffer = await HTMLtoDOCX(application.word_html_content, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: false,
      });
      return res.send(docBuffer);
    }

    // Aks holda — asl template
    let dataForWord = { ...application };
    if (application.word_content) {
      try {
        const wc = JSON.parse(application.word_content);
        dataForWord = { ...application, ...wc };
      } catch {}
    }
    const docBuffer = await generateApplicationWord(dataForWord);
    res.send(docBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Word yaratishda xato' });
  }
};

// Hujjatni imzolash (SIGNED status)
exports.signApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({ where: { id: parseInt(id) } });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });
    if (!canTransition(application.status, 'SIGNED')) {
      return res.status(400).json({ error: "Ariza imzolash uchun yuborilmagan" });
    }

    const [updated] = await prisma.$transaction([
      prisma.application.update({
        where: { id: parseInt(id) },
        data: { status: 'SIGNED', signed_at: new Date() }
      }),
      prisma.statusHistory.create({
        data: {
          application_id: parseInt(id),
          old_status: 'SENT_TO_SIGNER',
          new_status: 'SIGNED',
          comment: 'Hujjat imzolandi',
          changed_by_id: req.user.id
        }
      })
    ]);

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Imzolashda xato' });
  }
};
