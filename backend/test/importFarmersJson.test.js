const test = require('node:test');
const assert = require('node:assert/strict');
const { cleanFarmers } = require('../src/utils/importFarmersJson');

test("fermer JSON qatorlarini tozalaydi va INN bo'yicha takrorlarni olib tashlaydi", () => {
  const result = cleanFarmers([
    {
      name: " Namuna fermer xo'jaligi ",
      director_name: ' Ali Valiyev ',
      address: ' Toshkent ',
      inn: '123-456-789',
    },
    {
      name: "Namuna fermer xo'jaligi",
      director_name: 'Ali Valiyev',
      address: 'Toshkent shahri, Chilonzor tumani',
      inn: '123456789',
    },
    {
      name: "Noto'g'ri INN",
      director_name: 'Vali Aliyev',
      address: 'Samarqand',
      inn: '12345',
    },
    {
      name: 'Manzilsiz fermer',
      director_name: 'Vali Aliyev',
      address: '0',
      inn: '987654321',
    },
  ]);

  assert.equal(result.farmers.length, 1);
  assert.equal(result.farmers[0].stir, '123456789');
  assert.equal(result.farmers[0].legal_address, 'Toshkent shahri, Chilonzor tumani');
  assert.deepEqual(result.stats, {
    total: 4,
    invalid_inn: 1,
    missing_required_data: 1,
    duplicate_rows: 1,
  });
});
