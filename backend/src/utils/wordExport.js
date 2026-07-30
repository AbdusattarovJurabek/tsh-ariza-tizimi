const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const path = require('path');
const fs = require('fs');

const TEMPLATE_PATH = path.join(__dirname, '../templates/TSH_template.docx');

let QRCode = null;
try { QRCode = require('qrcode'); } catch (_) {}

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

async function generateQRBuffer(text) {
  if (!QRCode) return null;
  try {
    return await QRCode.toBuffer(text, { type: 'png', width: 200, margin: 1, errorCorrectionLevel: 'M' });
  } catch (e) {
    console.error('QR yaratishda xato:', e.message);
    return null;
  }
}

async function injectQRCode(docBuffer, qrPngBuffer) {
  if (!qrPngBuffer) return docBuffer;
  try {
    const zip = new PizZip(docBuffer);
    zip.file('word/media/qrcode.png', qrPngBuffer);
    let ct = zip.file('[Content_Types].xml').asText();
    if (!ct.includes('Extension="png"')) {
      ct = ct.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>');
      zip.file('[Content_Types].xml', ct);
    }
    let rels = zip.file('word/_rels/document.xml.rels').asText();
    const rId = 'rIdQRCode999';
    if (!rels.includes(rId)) {
      rels = rels.replace('</Relationships>',
        '<Relationship Id="' + rId + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/qrcode.png"/></Relationships>');
      zip.file('word/_rels/document.xml.rels', rels);
    }
    const emu = 1800000;
    const drawing = '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + emu + '" cy="' + emu + '"/><wp:docPr id="999" name="QR"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="999" name="QR"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + rId + '" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + emu + '" cy="' + emu + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
    let docXml = zip.file('word/document.xml').asText();
    docXml = docXml.replace('</w:body>', drawing + '</w:body>');
    zip.file('word/document.xml', docXml);
    return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  } catch (e) {
    console.error('QR kiritishda xato:', e.message);
    return docBuffer;
  }
}

const generateApplicationWord = async (application) => {
  const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
  const zip = new PizZip(content);

  let xml = zip.file('word/document.xml').asText();

  const regDist = extractRegionAndDistrict(application);
  const subjectName = application.subject_name || application.leader_full_name || '';
  const gardenArea = application.garden_area ? String(application.garden_area) : (application.total_land_area ? String(application.total_land_area) : '');
  const numArea = Number(gardenArea) || 0;
  const bogLabel = numArea >= 10 ? "sanoatlashgan intensiv bog‘" : "intensiv bog‘";
  const bogTokzorLabel = numArea >= 10 ? "sanoatlashgan intensiv bog‘-tokzor" : "intensiv bog‘-tokzor";

  // Replace text in document.xml with clean docxtemplater tags
  xml = xml.replace(/sanoatlashgan intensiv bog‘-tokzor/g, bogTokzorLabel);
  xml = xml.replace(/sanoatlashgan intensiv bog‘/g, bogLabel);

  xml = xml.replace(
    /Navoiy viloyati Xatirchi tumanida “FAYZULLA BOBO MEVALI BOG‘LARI”/g,
    '{region_name} viloyati {district_name} tumanida “{subject_name}”'
  );
  xml = xml.replace(/10 gektar maydonda/g, '{garden_area} gektar maydonda');
  xml = xml.replace(/“FAYZULLA BOBO MEVALI BOG‘LARI” f\/x/g, '“{subject_name}”');
  xml = xml.replace(/STIR: 307119794/g, 'STIR: {stir}');
  xml = xml.replace(/FAYZULLAEV UMIDJON TOShPULAT O‘G‘LI/g, '{leader_full_name}');
  xml = xml.replace(/Navoiy viloyati, Xatirchi tumani, Qoracha QFY/g, '{legal_address}');
  xml = xml.replace(/https:\/\/maps\.app\.goo\.gl\/f9aazoZdvjS5DFge9/g, '{location_url}');
  xml = xml.replace(/Yer maydoni 10 gektar\./g, 'Yer maydoni {garden_area} gektar.');
  xml = xml.replace(/18\.03\.2020 y\., №Q-506-son/g, '{land_decision}');
  xml = xml.replace(/27\.03\.2020 y\., №420-son/g, '{lease_contract}');
  xml = xml.replace(/10\.06\.2025 y\., R-XATT38151356\./g, '{registry_info}');

  xml = xml.replace(
    /-TUPROQSHUNOSLIK VA AGROKIMYOVIY TADQIQOTLAR INSTITUTINING BUXORO MINTAQAVIY BO‘LINMASIning 2023 yildagi xulosasi\./g,
    '-{soil_info}'
  );
  xml = xml.replace(
    /-Xatirchi tumani “Suv yetkazib berish xizmati” DMning 2026 yil 29 iyuldagi № 499 ma’lumotnomasi\./g,
    '-{water_supply_info}'
  );
  xml = xml.replace(
    /-Navoiy viloyati Gidrometeorologiya xizmati agentligining 2026 yil 16-yanvardagi\s*09\/001-sonli ma’lumotnomasi\./g,
    '-{weather_analysis}'
  );
  xml = xml.replace(
    /-Mavjud emas\./g,
    '-{scientific_recommendation}'
  );

  xml = xml.replace(/Bodom ko‘chati\./g, '{fruit_type} ko‘chati.');
  xml = xml.replace(/“Avijor” navi\./g, '“{fruit_variety}” navi.');
  xml = xml.replace(/6x3 sxemada\./g, '{planting_scheme} sxemada.');
  xml = xml.replace(/1 gektarga 555 tup, jami 10 gektarga 5\s*555 tup\./g, '{seedling_info}');

  xml = xml.replace(/Navoiy viloyati bo‘limi boshlig‘i/g, '{region_name} viloyati bo‘limi boshlig‘i');
  xml = xml.replace(/Navoiy viloyati, Xatirchi tumani bosh mutaxassisi/g, '{region_name} viloyati, {district_name} tumani bosh mutaxassisi');

  zip.file('word/document.xml', xml);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  });

  const trackingUrl = APP_BASE_URL + '/track/' + (application.app_number || '');

  doc.render({
    region_name:               regDist.region,
    district_name:             regDist.district,
    subject_name:              subjectName,
    stir:                      application.stir || '',
    leader_full_name:          application.leader_full_name || '',
    legal_address:             application.legal_address || application.garden_address || '',
    garden_area:               gardenArea,
    location_url:              application.location_url || '',
    land_decision:             formatLandDecision(application),
    lease_contract:            formatLeaseContract(application),
    registry_info:             formatRegistryInfo(application),
    soil_info:                 formatSoilInfo(application),
    water_supply_info:         formatWaterSupplyInfo(application),
    weather_analysis:          formatWeatherAnalysis(application),
    scientific_recommendation: formatScientificRecommendation(application),
    fruit_type:                application.fruit_type || '',
    fruit_variety:             application.fruit_variety || '',
    planting_scheme:           application.planting_scheme || '',
    seedling_info:             formatSeedlingInfo(application),
  });

  let docBuffer = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  const qrBuffer = await generateQRBuffer(trackingUrl);
  if (qrBuffer) {
    docBuffer = await injectQRCode(docBuffer, qrBuffer);
  }
  return docBuffer;
};

function extractRegionAndDistrict(app) {
  const addr = app.legal_address || app.garden_address || '';
  let region = 'Navoiy';
  let district = 'Xatirchi';
  if (addr.includes('viloyati')) {
    const parts = addr.split('viloyati');
    region = parts[0].trim().split(' ').pop();
    if (parts[1] && parts[1].includes('tumani')) {
      district = parts[1].split('tumani')[0].replace(/,/g, '').trim().split(' ').pop();
    }
  }
  return { region, district };
}

function formatLandDecision(app) {
  if (Array.isArray(app.land_decisions) && app.land_decisions.length > 0) {
    return app.land_decisions
      .map(d => `${d.decision_date || ''} y., №${d.decision_number || ''}-son`)
      .join('; ');
  }
  const date = app.land_decision_date   || '';
  const num  = app.land_decision_number || '';
  if (date && num) return date + ' y., №' + num + '-son';
  return date || num || '';
}

function formatLeaseContract(app) {
  if (Array.isArray(app.lease_contracts) && app.lease_contracts.length > 0) {
    return app.lease_contracts
      .map(c => `${c.contract_date || ''} y., №${c.contract_number || ''}-son`)
      .join('; ');
  }
  const date = app.lease_contract_date   || '';
  const num  = app.lease_contract_number || '';
  if (date && num) return date + ' y., №' + num + '-son';
  return date || num || '';
}

function formatRegistryInfo(app) {
  const date = app.registry_date || '';
  const num = app.registry_number || '';
  if (date && num) return date + ' y., R-' + num;
  return date || num || '';
}

function formatSoilInfo(app) {
  const info = app.soil_analysis_info;
  if (info && typeof info === 'object' && info.org) {
    let res = info.org;
    if (info.date) res += `ning ${info.date} yildagi`;
    if (info.number) res += ` №${info.number}`;
    res += ' xulosasi.';
    return res;
  }
  const parts = [];
  if (app.soil_type)        parts.push('Tuproq turi: ' + app.soil_type);
  if (app.soil_composition) parts.push('Tarkibi: ' + app.soil_composition);
  if (app.soil_quality)     parts.push('Sifati: ' + app.soil_quality);
  if (app.soil_fertility)   parts.push('Unumdorligi: ' + app.soil_fertility);
  return parts.length ? parts.join('; ') + '.' : 'Tuproq tahlili ma\'lumoti.';
}

function formatWaterSupplyInfo(app) {
  const info = app.water_conclusion_info;
  if (info && typeof info === 'object' && info.org) {
    let res = info.org;
    if (info.date) res += `ning ${info.date} yildagi`;
    if (info.number) res += ` №${info.number}`;
    res += ' ma’lumotnomasi.';
    return res;
  }
  return app.water_supply_info || 'Suv ta\'minoti ma\'lumotnomasi.';
}

function formatWeatherAnalysis(app) {
  const info = app.weather_data_info;
  if (info && typeof info === 'object' && info.org) {
    let res = info.org;
    if (info.date) res += `ning ${info.date} yildagi`;
    if (info.number) res += ` №${info.number}`;
    res += ' ma’lumotnomasi.';
    return res;
  }
  return app.weather_analysis || 'Ob-havo tahlili ma\'lumotnomasi.';
}

function formatScientificRecommendation(app) {
  const info = app.scientific_conclusion_info;
  if (info && typeof info === 'object' && info.org) {
    let res = info.org;
    if (info.date) res += `ning ${info.date} yildagi`;
    if (info.number) res += ` №${info.number}`;
    res += ' tavsiyasi.';
    return res;
  }
  return app.scientific_recommendation || 'Mavjud emas.';
}

function formatSeedlingInfo(app) {
  const count = Number(app.seedling_count || 0);
  const area  = Number(app.garden_area || 0);
  if (count > 0 && area > 0) {
    const perHa = Math.round(count / area);
    return `1 gektarga ${perHa} tup, jami ${area} gektarga ${count.toLocaleString('uz-UZ')} tup.`;
  }
  if (count > 0) return `${count.toLocaleString('uz-UZ')} tup ko'chat.`;
  return '';
}

module.exports = { generateApplicationWord };

module.exports = { generateApplicationWord };
