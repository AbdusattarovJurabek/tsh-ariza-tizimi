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

function replaceParagraphText(xmlStr, searchTextPattern, newText) {
  const pRegex = /<w:p[\s\S]*?<\/w:p>/g;
  return xmlStr.replace(pRegex, (pXml) => {
    const text = pXml.replace(/<[^>]+>/g, '').trim();
    if (searchTextPattern.test(text)) {
      const escapedText = String(newText || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      let firstDone = false;
      return pXml.replace(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g, (tXml) => {
        if (!firstDone) {
          firstDone = true;
          const prefix = tXml.slice(0, tXml.indexOf('>') + 1);
          return prefix + escapedText + '</w:t>';
        } else {
          const prefix = tXml.slice(0, tXml.indexOf('>') + 1);
          return prefix + '</w:t>';
        }
      });
    }
    return pXml;
  });
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

  const stir = application.stir || '';
  const leaderName = application.leader_full_name || '';
  const address = application.legal_address || application.garden_address || '';
  const locationUrl = application.location_url || '';
  const spec = application.land_specialization || 'Bog‘dorchilik';
  const landDec = formatLandDecision(application);
  const leaseCon = formatLeaseContract(application);
  const regInfo = formatRegistryInfo(application);
  const soilInfo = formatSoilInfo(application);
  const waterInfo = formatWaterSupplyInfo(application);
  const weatherInfo = formatWeatherAnalysis(application);
  const sciInfo = formatScientificRecommendation(application);
  const fruitType = application.fruit_type || '';
  const fruitVariety = application.fruit_variety || '';
  const scheme = application.planting_scheme || '';
  const seedlingInfo = formatSeedlingInfo(application);

  // 1. Cover Page replacements
  xml = replaceParagraphText(xml, /Navoiy viloyati Xatirchi tumanida/i, `${regDist.region} viloyati ${regDist.district} tumanida “${subjectName}”`);
  xml = replaceParagraphText(xml, /10 gektar maydonda/i, `${gardenArea} gektar maydonda`);
  xml = replaceParagraphText(xml, /sanoatlashgan intensiv bog‘ barpo etish bo‘yicha/i, `${bogLabel} barpo etish bo‘yicha`);

  // Insert Page Break after Toshkent - 2026 paragraph cleanly
  const pageBreakXml = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  xml = xml.replace(/(Toshkent\s*-\s*2026<\/w:t><\/w:r><\/w:p>)/i, '$1' + pageBreakXml);

  // 2. Section I replacements
  xml = replaceParagraphText(xml, /hududlarda sanoatlashgan intensiv bog‘ barpo etish uchun/i, `Ushbu texnik shart (TSH) O‘zbekiston Respublikasi Prezidentining 2024-yil 30-sentabrdagi PF-151-son Farmoni, 2024-yil 30-sentabrdagi PQ-344-son Qarori, 2026-yil 9-iyundagi PF-108-son Farmoni, Vazirlar Mahkamasining 2025-yil 23-apreldagi 255-son Qarori ijrosini ta’minlash maqsadida hududlarda ${bogLabel} barpo etish uchun “${subjectName}” tomonidan taklif etilayotgan faoliyatning samaradorligi va iqtisodiy maqsadga muvofiqligini asoslash, amaldagi qonunchilik, normalar, ko‘rsatmalar va standartlarga muvofiq ishlab chiqilgan.`);

  xml = replaceParagraphText(xml, /FAYZULLA BOBO MEVALI BOG‘LARI.*STIR/i, `“${subjectName}”, STIR: ${stir}.`);
  xml = replaceParagraphText(xml, /FAYZULLAEV UMIDJON TOShPULAT/i, leaderName);
  xml = replaceParagraphText(xml, /Navoiy viloyati,\s*Xatirchi tumani,\s*Qoracha QFY/i, address);
  xml = replaceParagraphText(xml, /Bog‘dorchilik/i, spec);
  xml = replaceParagraphText(xml, /maps\.app\.goo\.gl/i, locationUrl);
  xml = replaceParagraphText(xml, /Yer maydoni 10 gektar\./i, `Yer maydoni ${gardenArea} gektar.`);
  xml = replaceParagraphText(xml, /18\.03\.2020 y\., №Q-506-son/i, landDec);
  xml = replaceParagraphText(xml, /27\.03\.2020 y\., №420-son/i, leaseCon);
  xml = replaceParagraphText(xml, /10\.06\.2025 y\., R-XATT/i, regInfo);

  xml = replaceParagraphText(xml, /TUPROQSHUNOSLIK VA AGROKIMYOVIY/i, `-${soilInfo}`);
  xml = replaceParagraphText(xml, /Suv yetkazib berish xizmati/i, `-${waterInfo}`);
  xml = replaceParagraphText(xml, /Gidrometeorologiya xizmati agentligining/i, `-${weatherInfo}`);
  xml = replaceParagraphText(xml, /-\s*Mavjud emas\./i, `-${sciInfo}`);

  // 3. Section II replacements
  xml = replaceParagraphText(xml, /Bodom ko‘chati\./i, `${fruitType} ko‘chati.`);
  xml = replaceParagraphText(xml, /“Avijor” navi\./i, `“${fruitVariety}” navi.`);
  xml = replaceParagraphText(xml, /6x3 sxemada\./i, `${scheme} sxemada.`);
  xml = replaceParagraphText(xml, /1 gektarga 555 tup/i, seedlingInfo);

  // 4. Section IV & Signatures
  xml = replaceParagraphText(xml, /yangi sanoatlashgan intensiv bog‘-tokzor/i, `yangi ${bogTokzorLabel}`);
  xml = replaceParagraphText(xml, /sanoatlashgan intensiv bog‘-tokzor loyihasini/i, `${bogTokzorLabel} loyihasini`);

  xml = replaceParagraphText(xml, /Navoiy viloyati bo‘limi boshlig‘i/i, `${regDist.region} viloyati bo‘limi boshlig‘i`);
  xml = replaceParagraphText(xml, /Navoiy viloyati, Xatirchi tumani bosh mutaxassisi/i, `${regDist.region} viloyati, ${regDist.district} tumani bosh mutaxassisi`);

  zip.file('word/document.xml', xml);

  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
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
