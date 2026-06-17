const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const path = require('path');
const fs = require('fs');

const TEMPLATE_PATH = path.join(__dirname, '../templates/TSH_template.docx');

// QR kod generatsiya qilish (qrcode paketi mavjud bo'lsa)
let QRCode = null;
try { QRCode = require('qrcode'); } catch (_) {}

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

/**
 * QR kod PNG buffer yaratadi
 */
async function generateQRBuffer(text) {
  if (!QRCode) return null;
  try {
    return await QRCode.toBuffer(text, {
      type: 'png',
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M',
    });
  } catch (e) {
    console.error('QR yaratishda xato:', e.message);
    return null;
  }
}

/**
 * docx bufferiga QR kod PNG tasvir sifatida kiritadi.
 * PizZip orqali word/media/ papkaga PNG qo'shadi va document.xml ga drawing XML kiritadi.
 */
async function injectQRCode(docBuffer, qrPngBuffer) {
  if (!qrPngBuffer) return docBuffer;

  try {
    const zip = new PizZip(docBuffer);

    // 1. PNG faylni media papkaga qo'shish
    zip.file('word/media/qrcode.png', qrPngBuffer);

    // 2. Content types ga PNG qo'shish (agar yo'q bo'lsa)
    let contentTypesXml = zip.file('[Content_Types].xml').asText();
    if (!contentTypesXml.includes('Extension="png"')) {
      contentTypesXml = contentTypesXml.replace(
        '</Types>',
        '<Default Extension="png" ContentType="image/png"/></Types>'
      );
      zip.file('[Content_Types].xml', contentTypesXml);
    }

    // 3. Relationship qo'shish
    let relsXml = zip.file('word/_rels/document.xml.rels').asText();
    const rId = 'rIdQRCode999';
    if (!relsXml.includes(rId)) {
      relsXml = relsXml.replace(
        '</Relationships>',
        `<Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/qrcode.png"/></Relationships>`
      );
      zip.file('word/_rels/document.xml.rels', relsXml);
    }

    // 4. document.xml ga QR tasvirini kiritish
    // 1 dyuym = 914400 EMU; 2 sm = ~756000 EMU
    const imgSizeEMU = 1800000; // ~2 dyuym
    const drawingXml = `<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${imgSizeEMU}" cy="${imgSizeEMU}"/><wp:docPr id="999" name="QR Kod"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="999" name="QR Kod"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rId}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${imgSizeEMU}" cy="${imgSizeEMU}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;

    let docXml = zip.file('word/document.xml').asText();

    // Hujjat oxiriga (</w:body> dan oldin) QR rasmni kiritish
    docXml = docXml.replace('</w:body>', drawingXml + '</w:body>');
    zip.file('word/document.xml', docXml);

    return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  } catch (e) {
    console.error('QR kiritishda xato:', e.message);
    return docBuffer; // Xato bo'lsa original buffer qaytariladi
  }
}

/**
 * Ariza ma'lumotlarini shablon Word fayliga to'ldiradi.
 * Shablon: TSH_template.docx (placeholder tokenlar: {subject_name} va boshqalar)
 */
const generateApplicationWord = async (application) => {
  const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  });

  // Tracking URL - QR kod va matn sifatida
  const trackingUrl = `${APP_BASE_URL}/track/${application.app_number}`;

  doc.render({
    subject_name:              application.subject_name              || '',
    stir:                      application.stir                      || '',
    leader_full_name:          application.leader_full_name          || '',
    garden_address:            application.garden_address            || '',
    garden_area:               application.garden_area               ? String(application.garden_area) : '',
    location_url:              application.location_url              || '',
    qr_code:                   trackingUrl,
    land_specialization:       application.land_specialization       || '',
    land_decision:             formatLandDecision(application),
    lease_contract:            formatLeaseContract(application),
    registry_number:           application.registry_number           || '',
    soil_info:                 formatSoilInfo(application),
    water_supply_info:         application.water_supply_info         || '',
    weather_analysis:          application.weather_analysis          || '',
    scientific_recommendation: application.scientific_recommendation || "Mavjud emas.",
    fruit_type:                application.fruit_type                || '',
    fruit_variety:             application.fruit_variety             || '',
    planting_scheme:           application.planting_scheme           || '',
    seedling_count:            formatSeedlingCount(application),
  });

  let docBuffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

  // QR kod tasvirini hujjatga kiritish
  const qrBuffer = await generateQRBuffer(trackingUrl);
  if (qrBuffer) {
    docBuffer = await injectQRCode(docBuffer, qrBuffer);
  }

  return docBuffer;
};

function formatLandDecision(app) {
  const date = app.land_decision_date   || '';
  const num  = app.land_decision_number || '';
  if (date && num) return `${date}, ${num}-son.`;
  return date || num || '';
}

function formatLeaseContract(app) {
  const date = app.lease_contract_date   || '';
  const num  = app.lease_contract_number || '';
  if (date && num) return `${date}, ${num}-son.`;
  return date || num || '';
}

function formatSoilInfo(app) {
  const parts = [];
  if (app.soil_type)        parts.push(`Tuproq turi: ${app.soil_type}`);
  if (app.soil_composition) parts.push(`Tarkibi: ${app.soil_composition}`);
  if (app.soil_quality)     parts.push(`Sifati: ${app.soil_quality}`);
  if (app.soil_fertility)   parts.push(`Unumdorligi: ${app.soil_fertility}`);
  return parts.length ? parts.join('; ') + '.' : '';
}

function formatSeedlingCount(app) {
  const count = app.seedling_count || '';
  const area  = app.garden_area    || '';
  if (count && area) return `${area} gektarga ${count} tup ko'chat.`;
  if (count)         return `${count} tup ko'chat.`;
  return '';
}

module.exports = { generateApplicationWord };
