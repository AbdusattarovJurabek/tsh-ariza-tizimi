const test = require('node:test');
const assert = require('node:assert/strict');
const {
  REQUIRED_FILE_TYPES,
  canTransition,
  canUserDeleteApplication,
  validateNonNegativeValues,
  validateApplicationForSubmit,
} = require('../src/utils/applicationRules');

const validApplication = {
  subject_name: 'Fermer xo‘jaligi',
  leader_full_name: 'Ali Valiyev',
  legal_address: 'Toshkent',
  stir: '123456789',
  garden_area: 5,
  garden_address: 'Zangiota',
  fruit_type: 'Olma',
  seedling_count: 100,
  files: REQUIRED_FILE_TYPES.map(file_type => ({ file_type })),
};

test('faqat belgilangan status o‘tishlariga ruxsat beradi', () => {
  assert.equal(canTransition('SUBMITTED', 'UNDER_REVIEW'), true);
  assert.equal(canTransition('UNDER_REVIEW', 'APPROVED'), true);
  assert.equal(canTransition('APPROVED', 'SENT_TO_SIGNER'), true);
  assert.equal(canTransition('SIGNED', 'UNDER_REVIEW'), false);
  assert.equal(canTransition('DRAFT', 'APPROVED'), false);
});

test("qoralama va qaytarilgan arizalarni o'chirishga ruxsat beradi", () => {
  assert.equal(canUserDeleteApplication('DRAFT'), true);
  assert.equal(canUserDeleteApplication('HAS_ISSUES'), true);
  assert.equal(canUserDeleteApplication('REJECTED'), true);
  assert.equal(canUserDeleteApplication('SUBMITTED'), false);
  assert.equal(canUserDeleteApplication('SENT_TO_SIGNER'), false);
  assert.equal(canUserDeleteApplication('SIGNED'), false);
});

test('to‘liq arizani yuborishga ruxsat beradi', () => {
  assert.deepEqual(validateApplicationForSubmit(validApplication), {
    valid: true,
    errors: [],
    missingFileTypes: [],
  });
});

test('maydon va hujjatlari yetishmagan arizani rad etadi', () => {
  const result = validateApplicationForSubmit({
    ...validApplication,
    stir: '123',
    garden_area: 0,
    files: [],
  });

  assert.equal(result.valid, false);
  assert.equal(result.missingFileTypes.length, REQUIRED_FILE_TYPES.length);
  assert.ok(result.errors.some(error => error.includes('STIR')));
  assert.ok(result.errors.some(error => error.includes("Bog' maydoni")));
});

test('manfiy miqdorlarni rad etadi', () => {
  const result = validateNonNegativeValues({
    total_land_area: -1,
    garden_area: -0.5,
    seedling_count: -10,
    project_amount: -1000,
    permanent_jobs: -2,
    seasonal_jobs: -3,
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 6);
  assert.ok(result.errors.every(error => error.includes('manfiy')));
});
