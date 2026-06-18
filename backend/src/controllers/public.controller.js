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

exports.trackApplication = async (req, res) => {
  try {
    const { app_number } = req.params;

    const application = await prisma.application.findUnique({
      where: { app_number: app_number.trim().toUpperCase() },
      select: {
        app_number: true, status: true, word_content: true,
        subject_name: true, stir: true, leader_full_name: true,
        legal_address: true, mfo: true, bank_account: true, bank_name: true,
        total_land_area: true, garden_area: true, land_specialization: true,
        garden_address: true, land_decision_date: true, land_decision_number: true,
        lease_contract_date: true, lease_contract_number: true, registry_number: true,
        soil_type: true, soil_quality: true, water_supply_info: true, weather_analysis: true,
        fruit_type: true, fruit_variety: true, planting_scheme: true,
        seedling_count: true, planting_period: true, water_source: true,
        project_amount: true, permanent_jobs: true, seasonal_jobs: true,
        supplier_companies: true, scientific_recommendation: true,
        submitted_at: true, approved_at: true, signed_at: true,
        created_at: true, admin_comment: true,
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

    let word_content = null;
    if (application.word_content) {
      try { word_content = JSON.parse(application.word_content); } catch {}
    }

    res.json({
      app_number: application.app_number,
      status: application.status,
      status_label: STATUS_LABELS[application.status] || application.status,
      subject_name: application.subject_name || '',
      stir: application.stir || '',
      leader_full_name: application.leader_full_name || '',
      legal_address: application.legal_address || '',
      mfo: application.mfo || '',
      bank_account: application.bank_account || '',
      bank_name: application.bank_name || '',
      total_land_area: application.total_land_area || null,
      garden_area: application.garden_area || null,
      land_specialization: application.land_specialization || '',
      garden_address: application.garden_address || '',
      land_decision_date: application.land_decision_date || '',
      land_decision_number: application.land_decision_number || '',
      lease_contract_date: application.lease_contract_date || '',
      lease_contract_number: application.lease_contract_number || '',
      registry_number: application.registry_number || '',
      soil_type: application.soil_type || '',
      soil_quality: application.soil_quality || '',
      water_supply_info: application.water_supply_info || '',
      weather_analysis: application.weather_analysis || '',
      fruit_type: application.fruit_type || '',
      fruit_variety: application.fruit_variety || '',
      planting_scheme: application.planting_scheme || '',
      seedling_count: application.seedling_count || null,
      planting_period: application.planting_period || '',
      water_source: application.water_source || '',
      project_amount: application.project_amount || null,
      permanent_jobs: application.permanent_jobs || null,
      seasonal_jobs: application.seasonal_jobs || null,
      supplier_companies: application.supplier_companies || '',
      scientific_recommendation: application.scientific_recommendation || '',
      word_content,
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
