const fs = require('fs');
const PizZip = require('pizzip');
const path = require('path');

function processTemplateFile() {
  try {
    const templatePath = path.join(__dirname, '../templates/TSH_template.docx');
    if (!fs.existsSync(templatePath)) return;

    const content = fs.readFileSync(templatePath);
    const zip = new PizZip(content);
    let xml = zip.file('word/document.xml').asText();

    function replaceParagraphText(xmlStr, searchTextPattern, replacementTag) {
      const pRegex = /<w:p[\s\S]*?<\/w:p>/g;
      return xmlStr.replace(pRegex, (pXml) => {
        const text = pXml.replace(/<[^>]+>/g, '').trim();
        if (searchTextPattern.test(text)) {
          let firstDone = false;
          return pXml.replace(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/g, (tXml) => {
            if (!firstDone) {
              firstDone = true;
              const prefix = tXml.slice(0, tXml.indexOf('>') + 1);
              return prefix + replacementTag + '</w:t>';
            } else {
              const prefix = tXml.slice(0, tXml.indexOf('>') + 1);
              return prefix + '</w:t>';
            }
          });
        }
        return pXml;
      });
    }

    xml = replaceParagraphText(xml, /Navoiy viloyati Xatirchi tumanida/i, '{region_name} viloyati {district_name} tumanida “{subject_name}”');
    xml = replaceParagraphText(xml, /10 gektar maydonda/i, '{garden_area} gektar maydonda');
    xml = replaceParagraphText(xml, /sanoatlashgan intensiv bog‘ barpo etish bo‘yicha/i, '{bog_type_label} barpo etish bo‘yicha');

    xml = replaceParagraphText(xml, /Toshkent\s*-\s*2026/i, 'Toshkent - 2026</w:t></w:r></w:p><w:p><w:r><w:br w:type="page"/>');

    xml = replaceParagraphText(xml, /hududlarda sanoatlashgan intensiv bog‘ barpo etish uchun/i, 'Ushbu texnik shart (TSH) O‘zbekiston Respublikasi Prezidentining 2024-yil 30-sentabrdagi PF-151-son Farmoni, 2024-yil 30-sentabrdagi PQ-344-son Qarori, 2026-yil 9-iyundagi PF-108-son Farmoni, Vazirlar Mahkamasining 2025-yil 23-apreldagi 255-son Qarori ijrosini ta’minlash maqsadida hududlarda {bog_type_label} barpo etish uchun “{subject_name}” tomonidan taklif etilayotgan faoliyatning samaradorligi va iqtisodiy maqsadga muvofiqligini asoslash, amaldagi qonunchilik, normalar, ko‘rsatmalar va standartlarga muvofiq ishlab chiqilgan.');

    xml = replaceParagraphText(xml, /FAYZULLA BOBO MEVALI BOG‘LARI.*STIR/i, '“{subject_name}”, STIR: {stir}.');
    xml = replaceParagraphText(xml, /FAYZULLAEV UMIDJON TOShPULAT/i, '{leader_full_name}');
    xml = replaceParagraphText(xml, /Navoiy viloyati,\s*Xatirchi tumani,\s*Qoracha QFY/i, '{legal_address}');
    xml = replaceParagraphText(xml, /Bog‘dorchilik/i, '{land_specialization}');
    xml = replaceParagraphText(xml, /maps\.app\.goo\.gl/i, '{location_url}');
    xml = replaceParagraphText(xml, /Yer maydoni 10 gektar\./i, 'Yer maydoni {garden_area} gektar.');
    xml = replaceParagraphText(xml, /18\.03\.2020 y\., №Q-506-son/i, '{land_decision}');
    xml = replaceParagraphText(xml, /27\.03\.2020 y\., №420-son/i, '{lease_contract}');
    xml = replaceParagraphText(xml, /10\.06\.2025 y\., R-XATT/i, '{registry_info}');

    xml = replaceParagraphText(xml, /TUPROQSHUNOSLIK VA AGROKIMYOVIY/i, '-{soil_info}');
    xml = replaceParagraphText(xml, /Suv yetkazib berish xizmati/i, '-{water_supply_info}');
    xml = replaceParagraphText(xml, /Gidrometeorologiya xizmati agentligining/i, '-{weather_analysis}');
    xml = replaceParagraphText(xml, /-\s*Mavjud emas\./i, '-{scientific_recommendation}');

    xml = replaceParagraphText(xml, /Bodom ko‘chati\./i, '{fruit_type} ko‘chati.');
    xml = replaceParagraphText(xml, /“Avijor” navi\./i, '“{fruit_variety}” navi.');
    xml = replaceParagraphText(xml, /6x3 sxemada\./i, '{planting_scheme} sxemada.');
    xml = replaceParagraphText(xml, /1 gektarga 555 tup/i, '{seedling_info}');

    xml = replaceParagraphText(xml, /Navoiy viloyati bo‘limi boshlig‘i/i, '{region_name} viloyati bo‘limi boshlig‘i');
    xml = replaceParagraphText(xml, /Navoiy viloyati, Xatirchi tumani bosh mutaxassisi/i, '{region_name} viloyati, {district_name} tumani bosh mutaxassisi');

    zip.file('word/document.xml', xml);
    const outBuffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
    fs.writeFileSync(templatePath, outBuffer);
    console.log('✅ Word shablon XML-lari muvaffaqiyatli tozalandi va tayyorlandi');
  } catch (err) {
    console.error('Word shablonini tozalashda xato:', err.message);
  }
}

module.exports = { processTemplateFile };
