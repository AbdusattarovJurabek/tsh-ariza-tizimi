const REQUIRED_APPLICATION_FIELDS = [
  'subject_name',
  'leader_full_name',
  'legal_address',
  'stir',
  'garden_area',
  'garden_address',
  'fruit_type',
  'seedling_count',
];

const REQUIRED_FILE_TYPES = [
  'COVER_LETTER',
  'LAND_DECISION',
  'LEASE_CONTRACT',
  'REGISTRY_EXTRACT',
  'LAND_MAP',
  'SOIL_ANALYSIS',
  'WATER_CONCLUSION',
  'WEATHER_DATA',
  'SCIENTIFIC_CONCLUSION',
  'SEEDLING_CERT',
  'SEEDLING_CONTRACT',
  'IRRIGATION_CONTRACT',
];

const STATUS_TRANSITIONS = {
  DRAFT: ['SUBMITTED'],
  HAS_ISSUES: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['HAS_ISSUES', 'APPROVED', 'REJECTED'],
  APPROVED: ['SENT_TO_SIGNER'],
  SENT_TO_SIGNER: ['SIGNED'],
  SIGNED: [],
  REJECTED: [],
};

const USER_DELETABLE_STATUSES = ['DRAFT', 'HAS_ISSUES', 'REJECTED'];

const FIELD_LABELS = {
  subject_name: 'Subyekt nomi',
  leader_full_name: 'Rahbar F.I.Sh.',
  legal_address: 'Yuridik manzil',
  stir: 'STIR',
  garden_area: "Bog' maydoni",
  garden_address: "Bog' manzili",
  fruit_type: 'Meva turi',
  seedling_count: "Ko'chat soni",
};

function canTransition(currentStatus, nextStatus) {
  return (STATUS_TRANSITIONS[currentStatus] || []).includes(nextStatus);
}

function canUserDeleteApplication(status) {
  return USER_DELETABLE_STATUSES.includes(status);
}

function validateNonNegativeValues(application) {
  const errors = [];
  const fields = [
    ['total_land_area', 'Umumiy yer maydoni'],
    ['garden_area', "Bog' maydoni"],
    ['seedling_count', "Ko'chat soni"],
    ['project_amount', 'Loyiha summasi'],
    ['permanent_jobs', "Doimiy ish o'rni"],
    ['seasonal_jobs', "Mavsumiy ish o'rni"],
  ];

  for (const [field, label] of fields) {
    const value = application[field];
    if (value === null || value === undefined || value === '') continue;
    if (!Number.isFinite(Number(value)) || Number(value) < 0) {
      errors.push(`${label} manfiy bo'lishi mumkin emas`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateApplicationForSubmit(application) {
  const errors = [];

  for (const field of REQUIRED_APPLICATION_FIELDS) {
    const value = application[field];
    if (value === null || value === undefined || String(value).trim() === '') {
      errors.push(`${FIELD_LABELS[field] || field} kiritilmagan`);
    }
  }

  if (application.stir && !/^\d{9}$/.test(String(application.stir).trim())) {
    errors.push("STIR aynan 9 ta raqamdan iborat bo'lishi kerak");
  }
  if (application.garden_area !== null && application.garden_area !== undefined &&
      Number(application.garden_area) <= 0) {
    errors.push("Bog' maydoni 0 dan katta bo'lishi kerak");
  }
  if (application.seedling_count !== null && application.seedling_count !== undefined &&
      Number(application.seedling_count) <= 0) {
    errors.push("Ko'chat soni 0 dan katta bo'lishi kerak");
  }

  const uploadedTypes = new Set((application.files || []).map(file => file.file_type));
  const missingFileTypes = REQUIRED_FILE_TYPES.filter(type => !uploadedTypes.has(type));
  if (missingFileTypes.length) {
    errors.push(`${missingFileTypes.length} ta majburiy hujjat yuklanmagan`);
  }

  return { valid: errors.length === 0, errors, missingFileTypes };
}

module.exports = {
  REQUIRED_APPLICATION_FIELDS,
  REQUIRED_FILE_TYPES,
  STATUS_TRANSITIONS,
  USER_DELETABLE_STATUSES,
  canTransition,
  canUserDeleteApplication,
  validateNonNegativeValues,
  validateApplicationForSubmit,
};
