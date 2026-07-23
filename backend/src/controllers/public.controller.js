const { PrismaClient } = require('@prisma/client');
const { getWorkingDaysRemaining, getDeadlineDate } = require('../utils/workingDays');
const { generateApplicationWord } = require('../utils/wordExport');
const prisma = new PrismaClient();

const STATUS_LABELS = {
  DRAFT: 'Qoralama',
  SUBMITTED: 'Yuborilgan',
  UNDER_REVIEW: "Ko'rib chiqilmoqda",
  HAS_ISSUES: 'Kamchilik mavjud',
  APPROVED: 'Tasdiqlandi',
  SENT_TO_SIGNER: 'Imzolovchiga yuborildi',
  SIGNED: 'Imzolandi',
  REJECTED: "Rad etildi",
};

const DOCUMENT_FIELDS = [
  'subject_name', 'stir', 'leader_full_name', 'legal_address', 'mfo',
  'bank_account', 'bank_name', 'total_land_area', 'garden_area',
  'land_specialization', 'garden_address', 'land_decision_date',
  'land_decision_number', 'lease_contract_date', 'lease_contract_number',
  'registry_number', 'soil_type', 'soil_quality', 'water_supply_info',
  'weather_analysis', 'fruit_type', 'fruit_variety', 'planting_scheme',
  'seedling_count', 'planting_period', 'water_source', 'project_amount',
  'permanent_jobs', 'seasonal_jobs', 'supplier_companies',
  'scientific_recommendation',
];

function publicStatus(application) {
  let countdown = null;
  let deadlineDate = null;
  if (application.status === 'APPROVED' && application.approved_at) {
    countdown = getWorkingDaysRemaining(application.approved_at);
    deadlineDate = getDeadlineDate(application.approved_at).toISOString();
  }

  return {
    app_number: application.app_number,
    status: application.status,
    status_label: STATUS_LABELS[application.status] || application.status,
    submitted_at: application.submitted_at,
    approved_at: application.approved_at,
    signed_at: application.signed_at,
    countdown_days: countdown,
    deadline_date: deadlineDate,
  };
}

exports.trackApplication = async (req, res) => {
  try {
    const appNumber = String(req.params.app_number || '').trim().toUpperCase();
    const application = await prisma.application.findUnique({
      where: { app_number: appNumber },
    });

    if (!application) {
      return res.status(404).json({ error: 'Ariza topilmadi. Ariza raqamini tekshiring.' });
    }

    const result = publicStatus(application);

    // To'liq hujjat faqat yakuniy imzodan keyin ommaga ochiladi.
    if (application.status === 'SIGNED') {
      for (const field of DOCUMENT_FIELDS) result[field] = application[field] ?? '';
      if (application.word_content) {
        try {
          result.word_content = JSON.parse(application.word_content);
        } catch {
          result.word_content = null;
        }
      } else {
        result.word_content = null;
      }
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

exports.downloadSignedDocument = async (req, res) => {
  try {
    const appNumber = String(req.params.app_number || '').trim().toUpperCase();
    const application = await prisma.application.findUnique({
      where: { app_number: appNumber },
      include: {
        user: { select: { full_name: true, region: true, district: true, phone: true } }
      }
    });

    if (!application || application.status !== 'SIGNED') {
      return res.status(404).json({ error: 'Imzolangan hujjat topilmadi' });
    }

    let docBuffer;
    if (application.word_html_content) {
      const HTMLtoDOCX = require('html-to-docx');
      docBuffer = await HTMLtoDOCX(application.word_html_content, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: false,
      });
    } else {
      let data = { ...application };
      if (application.word_content) {
        try {
          data = { ...application, ...JSON.parse(application.word_content) };
        } catch {}
      }
      docBuffer = await generateApplicationWord(data);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="TSH-${application.app_number}.docx"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(docBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Word hujjatni yaratishda xato' });
  }
};
