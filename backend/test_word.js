process.chdir('/sessions/gallant-blissful-maxwell/mnt/Texnik shart/tsh-ariza-tizimi/backend');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');

const content = fs.readFileSync('./src/templates/TSH_template.docx', 'binary');
const zip = new PizZip(content);
const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  delimiters: { start: '{', end: '}' },
});

doc.render({
  subject_name: "Bahor Fermer Xo'jaligi",
  stir: "123456789",
  leader_full_name: "Karimov Jasur Abdullayevich",
  garden_address: "Yakkabog' tumani, 5-maydon",
  garden_area: "7.5",
  location_url: "https://maps.google.com",
  qr_code: "QR-2026-001",
  land_specialization: "Mevali bog'",
  land_decision: "15.03.2020 y., X-1234/06-son.",
  lease_contract: "20.05.2020 y., 45-son.",
  registry_number: "R-YAKT00700999",
  soil_info: "Tuproq turi: qo'ng'ir; Gumus: 1.8%",
  water_supply_info: "Kanal suvi orqali",
  weather_analysis: "Quruq iqlim, yillik yog'in 250mm",
  scientific_recommendation: "Mavjud emas.",
  fruit_type: "Gilos",
  fruit_variety: "Napoleon navi",
  planting_scheme: "5x3 m sxemada",
  seedling_count: "7.5 gektarga 500 tup ko'chat.",
});

const buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
fs.writeFileSync('/sessions/gallant-blissful-maxwell/mnt/outputs/test_output.docx', buf);
console.log('OK! Size:', buf.length, 'bytes');
