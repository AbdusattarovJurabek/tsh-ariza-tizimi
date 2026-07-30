const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const { generateApplicationPDF } = require('../utils/export');
const { generateApplicationWord } = require('../utils/wordExport');
const { getWorkingDaysRemaining, getDeadlineDate } = require('../utils/workingDays');
const { canTransition } = require('../utils/applicationRules');
const prisma = new PrismaClient();

// Barcha arizalar (filter + pagination)
exports.getAllApplications = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, status, subject_name, stir,
      leader_full_name, region, district, fruit_type,
      date_from, date_to, min_amount, max_amount,
      min_area, max_area, search
    } = req.query;

    const where = {};

    if (status) where.status = status;
    if (stir) where.stir = { contains: stir, mode: 'insensitive' };
    if (fruit_type) where.fruit_type = { contains: fruit_type, mode: 'insensitive' };

    if (min_amount || max_amount) {
      where.project_amount = {};
      if (min_amount) where.project_amount.gte = parseFloat(min_amount);
      if (max_amount) where.project_amount.lte = parseFloat(max_amount);
    }

    if (min_area || max_area) {
      where.garden_area = {};
      if (min_area) where.garden_area.gte = parseFloat(min_area);
      if (max_area) where.garden_area.lte = parseFloat(max_area);
    }

    if (date_from || date_to) {
      where.submitted_at = {};
      if (date_from) where.submitted_at.gte = new Date(date_from);
      if (date_to) where.submitted_at.lte = new Date(date_to);
    }

    if (search || subject_name || leader_full_name) {
      where.OR = [];
      const term = search || '';
      if (term) {
        where.OR.push(
          { subject_name: { contains: term, mode: 'insensitive' } },
          { leader_full_name: { contains: term, mode: 'insensitive' } },
          { stir: { contains: term, mode: 'insensitive' } },
          { app_number: { contains: term, mode: 'insensitive' } }
        );
      }
      if (subject_name) where.OR.push({ subject_name: { contains: subject_name, mode: 'insensitive' } });
      if (leader_full_name) where.OR.push({ leader_full_name: { contains: leader_full_name, mode: 'insensitive' } });
    }

    if (region || district) {
      where.user = {};
      if (region) where.user.region = { contains: region, mode: 'insensitive' };
      if (district) where.user.district = { contains: district, mode: 'insensitive' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          user: { select: { full_name: true, username: true, region: true, district: true, phone: true } },
          files: { select: { id: true, file_type: true, file_name: true } },
          _count: { select: { files: true } }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.application.count({ where })
    ]);

    res.json({
      data: applications,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Ariza statusini o'zgartirish
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    const application = await prisma.application.findUnique({ where: { id: parseInt(id) } });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });
    if (!canTransition(application.status, status)) {
      return res.status(400).json({
        error: `${application.status} holatidan ${status || 'noma’lum'} holatiga o'tish mumkin emas`
      });
    }
    if (status === 'HAS_ISSUES' && !String(comment || '').trim()) {
      return res.status(400).json({ error: 'Kamchiliklar haqida izoh majburiy' });
    }

    // APPROVED statusida approved_at vaqtini belgilash
    const updateData = { status, admin_comment: comment || null };
    if (status === 'APPROVED' && !application.approved_at) {
      updateData.approved_at = new Date();
    }
    const [updated] = await prisma.$transaction([
      prisma.application.update({
        where: { id: parseInt(id) },
        data: updateData
      }),
      prisma.statusHistory.create({
        data: {
          application_id: parseInt(id),
          old_status: application.status,
          new_status: status,
          comment,
          changed_by_id: req.user.id
        }
      })
    ]);

    // Countdown ma'lumotini response ga qo'shish
    let countdown = null;
    if (status === 'APPROVED' && updated.approved_at) {
      countdown = getWorkingDaysRemaining(updated.approved_at);
    }

    res.json({ ...updated, countdown_days: countdown });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Statusni yangilashda xato' });
  }
};

// Statistika
exports.getStatistics = async (req, res) => {
  try {
    const [
      total, byStatus, totalArea, totalAmount, totalJobs, fruitStats
    ] = await Promise.all([
      prisma.application.count(),
      prisma.application.groupBy({ by: ['status'], _count: true }),
      prisma.application.aggregate({ _sum: { garden_area: true } }),
      prisma.application.aggregate({ _sum: { project_amount: true } }),
      prisma.application.aggregate({
        _sum: { permanent_jobs: true, seasonal_jobs: true }
      }),
      prisma.application.groupBy({
        by: ['fruit_type'],
        _count: true,
        where: { fruit_type: { not: null } }
      })
    ]);

    const statusMap = {};
    byStatus.forEach(s => { statusMap[s.status] = s._count; });

    res.json({
      total,
      by_status: {
        DRAFT: statusMap.DRAFT || 0,
        SUBMITTED: statusMap.SUBMITTED || 0,
        UNDER_REVIEW: statusMap.UNDER_REVIEW || 0,
        HAS_ISSUES: statusMap.HAS_ISSUES || 0,
        APPROVED: statusMap.APPROVED || 0,
        REJECTED: statusMap.REJECTED || 0
      },
      total_garden_area: totalArea._sum.garden_area || 0,
      total_project_amount: totalAmount._sum.project_amount || 0,
      total_permanent_jobs: totalJobs._sum.permanent_jobs || 0,
      total_seasonal_jobs: totalJobs._sum.seasonal_jobs || 0,
      fruit_stats: fruitStats.map(f => ({ fruit_type: f.fruit_type, count: f._count }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// PDF export
exports.exportApplicationPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id: parseInt(id) },
      include: {
        files: true,
        user: { select: { full_name: true, region: true, district: true, phone: true } }
      }
    });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });

    const pdfBuffer = await generateApplicationPDF(application);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="ariza-${application.app_number}.html"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF yaratishda xato' });
  }
};

// Word export
exports.exportApplicationWord = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.application.findUnique({
      where: { id: parseInt(id) },
      include: {
        files: true,
        user: { select: { full_name: true, region: true, district: true, phone: true } }
      }
    });
    if (!application) return res.status(404).json({ error: 'Ariza topilmadi' });

    const docBuffer = await generateApplicationWord(application);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="ariza-${application.app_number}.docx"`);
    res.send(docBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Word fayl yaratishda xato' });
  }
};

// Barcha arizalarni Excel export
exports.exportAllApplicationsExcel = async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      include: {
        user: { select: { full_name: true, region: true, district: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const data = applications.map((a, i) => ({
      '№': i + 1,
      'Ariza raqami': a.app_number,
      'Subyekt nomi': a.subject_name || '',
      'Rahbar F.I.Sh.': a.leader_full_name || '',
      'STIR': a.stir || '',
      'Viloyat': a.user?.region || '',
      'Tuman': a.user?.district || '',
      'Meva turi': a.fruit_type || '',
      'Bog\' maydoni (ga)': a.garden_area || '',
      'Loyiha summasi': a.project_amount || '',
      'Doimiy ish o\'rni': a.permanent_jobs || '',
      'Mavsumiy ish o\'rni': a.seasonal_jobs || '',
      'Status': translateStatus(a.status),
      'Yuborilgan sana': a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('uz-UZ') : '',
      'Yaratilgan sana': new Date(a.created_at).toLocaleDateString('uz-UZ')
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Arizalar');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="arizalar.xlsx"');
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Excel yaratishda xato' });
  }
};

function translateStatus(status) {
  const map = {
    DRAFT: 'Qoralama', SUBMITTED: 'Yuborilgan',
    UNDER_REVIEW: 'Ko\'rib chiqilmoqda', HAS_ISSUES: 'Kamchilik bor',
    APPROVED: 'Tasdiqlandi', REJECTED: 'Rad etildi'
  };
  return map[status] || status;
}
