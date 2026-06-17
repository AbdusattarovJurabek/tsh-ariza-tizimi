const { PrismaClient } = require('@prisma/client');
const { getWorkingDaysRemaining, getDeadlineDate } = require('../utils/workingDays');
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

/**
 * Ochiq tracking endpoint — login talab qilmaydi.
 * GET /api/public/track/:app_number
 */
exports.trackApplication = async (req, res) => {
  try {
    const { app_number } = req.params;

    const application = await prisma.application.findUnique({
      where: { app_number: app_number.trim().toUpperCase() },
      select: {
        app_number: true,
        status: true,
        subject_name: true,
        leader_full_name: true,
        fruit_type: true,
        garden_area: true,
        approved_at: true,
        submitted_at: true,
        created_at: true,
        admin_comment: true,
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Ariza topilmadi. Ariza raqamini tekshiring.' });
    }

    let countdown = null;
    let deadline_date = null;

    if (application.status === 'APPROVED' && application.approved_at) {
      countdown = getWorkingDaysRemaining(application.approved_at);
      deadline_date = getDeadlineDate(application.approved_at).toISOString();
    }

    res.json({
      app_number: application.app_number,
      status: application.status,
      status_label: STATUS_LABELS[application.status] || application.status,
      subject_name: application.subject_name || '',
      leader_full_name: application.leader_full_name || '',
      fruit_type: application.fruit_type || '',
      garden_area: application.garden_area || null,
      submitted_at: application.submitted_at,
      approved_at: application.approved_at,
      signed_at: application.signed_at,
      created_at: application.created_at,
      admin_comment: application.status === 'HAS_ISSUES' ? application.admin_comment : null,
      countdown_days: countdown,
      deadline_date,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};
