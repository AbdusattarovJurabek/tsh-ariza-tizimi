/**
 * wordGenerator.js
 * Browser dagi DocumentPreview ga mos keladigan .docx faylni
 * `docx` library yordamida generatsiya qiladi.
 * Shunday qilib browser ko'rinishi = yuklab olinadigan Word fayl.
 */

const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, WidthType, BorderStyle, AlignmentType, HeadingLevel,
  ShadingType, ImageRun, Header, Footer,
} = require('docx');

let QRCode = null;
try { QRCode = require('qrcode'); } catch (_) {}

const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';

/** QR kod PNG buffer */
async function getQRBuffer(text) {
  if (!QRCode) return null;
  try {
    return await QRCode.toBuffer(text, { type: 'png', width: 120, margin: 1 });
  } catch { return null; }
}

/** Bo'sh chegara (border yo'q) */
const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
};

/** Oddiy chegara */
const solidBorder = {
  top:    { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  left:   { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  right:  { style: BorderStyle.SINGLE, size: 6, color: '000000' },
};

/** Ma'lumotlar jadvali qatori */
function dataRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        borders: solidBorder,
        shading: { type: ShadingType.SOLID, color: 'F3F4F6' },
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 22, font: 'Times New Roman' })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 60, type: WidthType.PERCENTAGE },
        borders: solidBorder,
        children: [
          new Paragraph({
            children: [new TextRun({ text: String(value || ''), size: 22, font: 'Times New Roman' })],
          }),
        ],
      }),
    ],
  });
}

/** Bo'lim sarlavhasi */
function sectionTitle(text) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    shading: { type: ShadingType.SOLID, color: 'DCFCE7' },
    border: { left: { style: BorderStyle.SINGLE, size: 16, color: '16A34A' } },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 20,
        font: 'Times New Roman',
        color: '166534',
      }),
    ],
  });
}

/** Jadval yaratish */
function dataTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

/** Asosiy funksiya */
async function generateWordDocument(application) {
  const d = application;
  const trackUrl = `${APP_BASE_URL}/document/${d.app_number || ''}`;
  const qrBuffer = await getQRBuffer(trackUrl);

  // Yer qaror
  const landDecision = (() => {
    const date = d.land_decision_date || '';
    const num  = d.land_decision_number || '';
    if (date && num) return `${date}, ${num}-son`;
    return date || num || '';
  })();

  // Ijara shartnoma
  const leaseContract = (() => {
    const date = d.lease_contract_date || '';
    const num  = d.lease_contract_number || '';
    if (date && num) return `${date}, ${num}-son`;
    return date || num || '';
  })();

  const children = [
    // ── Sarlavha ──
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: "O'ZBEKISTON RESPUBLIKASI", bold: true, size: 24, font: 'Times New Roman', allCaps: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: 'AGROSANOAT RIVOJLANTIRISH AGENTLIGI', bold: true, size: 24, font: 'Times New Roman', allCaps: true })],
    }),

    ...(d.app_number ? [new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ text: '№ ', size: 22, font: 'Times New Roman' }),
        new TextRun({ text: d.app_number, bold: true, size: 22, font: 'Times New Roman' }),
      ],
    })] : []),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [new TextRun({ text: 'TEXNIK SHART', bold: true, size: 28, font: 'Times New Roman', underline: {}, allCaps: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: "Bog' tashkil etish bo'yicha", size: 24, font: 'Times New Roman' })],
    }),

    // ── Tashkilot ──
    sectionTitle("Tashkilot ma'lumotlari"),
    dataTable([
      dataRow("Subyekt nomi",   d.subject_name),
      dataRow("INN / STIR",     d.stir),
      dataRow("Rahbar F.I.Sh.", d.leader_full_name),
      dataRow("Yuridik manzil", d.legal_address),
      dataRow("MFO",            d.mfo),
      dataRow("Hisob raqami",   d.bank_account),
      dataRow("Bank nomi",      d.bank_name),
    ]),

    // ── Yer maydoni ──
    sectionTitle("Yer maydoni haqida ma'lumot"),
    dataTable([
      dataRow("Jami yer maydoni (ga)",  d.total_land_area),
      dataRow("Bog' maydoni (ga)",       d.garden_area),
      dataRow("Ixtisoslashtirish",        d.land_specialization),
      dataRow("Bog' manzili",             d.garden_address),
      dataRow("Yer qaror sanasi",         d.land_decision_date),
      dataRow("Yer qaror raqami",         d.land_decision_number),
      dataRow("Ijara shartnomasi",        leaseContract),
      dataRow("Kadastr raqami",           d.registry_number),
    ]),

    // ── Tuproq ──
    sectionTitle("Tuproq tahlili"),
    dataTable([
      dataRow("Tuproq turi",     d.soil_type),
      dataRow("Tuproq sifati",   d.soil_quality),
      dataRow("Suv ta'minoti",   d.water_supply_info),
      dataRow("Ob-havo tahlili", d.weather_analysis),
    ]),

    // ── Agrotexnik ──
    sectionTitle("Agrotexnik tadbirlar"),
    dataTable([
      dataRow("Meva turi",      d.fruit_type),
      dataRow("Nav",            d.fruit_variety),
      dataRow("Ekish sxemasi",  d.planting_scheme),
      dataRow("Ko'chat soni",   d.seedling_count),
      dataRow("Ekish muddati",  d.planting_period),
      dataRow("Suv manbai",     d.water_source),
    ]),

    // ── Moliyaviy ──
    sectionTitle("Moliyaviy ko'rsatkichlar"),
    dataTable([
      dataRow("Loyiha summasi (so'm)", d.project_amount ? Number(d.project_amount).toLocaleString('uz-UZ') : ''),
      dataRow("Doimiy ish o'rni",       d.permanent_jobs),
      dataRow("Mavsumiy ish o'rni",     d.seasonal_jobs),
      dataRow("Yetkazib beruvchilar",    d.supplier_companies),
    ]),

    // ── Ilmiy tavsiya ──
    sectionTitle("Ilmiy tavsiyalar"),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: solidBorder,
              children: [
                new Paragraph({
                  spacing: { before: 80, after: 80 },
                  children: [new TextRun({ text: d.scientific_recommendation || '', size: 22, font: 'Times New Roman' })],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    // ── Imzo bloki ──
    new Paragraph({ spacing: { before: 400 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'Agentlik direktori', size: 22, font: 'Times New Roman' })],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
      children: [new TextRun({ text: 'Imzo / M.O.', size: 20, font: 'Times New Roman', color: '666666' })],
    }),
  ];

  // Imzolangan bo'lsa — QR kod va sana
  if (d.signed_at && qrBuffer) {
    children.push(
      new Paragraph({ spacing: { before: 200 }, children: [] }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: noBorder,
                children: [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: qrBuffer,
                        transformation: { width: 90, height: 90 },
                        type: 'png',
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun({ text: trackUrl, size: 16, font: 'Times New Roman', color: '444444' })],
                  }),
                ],
              }),
              new TableCell({
                borders: noBorder,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: `Imzolangan: ${new Date(d.signed_at).toLocaleDateString('uz-UZ')}`,
                        size: 20,
                        font: 'Times New Roman',
                        bold: true,
                        color: '166534',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );
  }

  // ── Footer ──
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'DDDDDD' } },
      children: [
        new TextRun({
          text: `Hujjat raqami: ${d.app_number || ''} · ${new Date().toLocaleDateString('uz-UZ')}`,
          size: 18,
          font: 'Times New Roman',
          color: '888888',
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, bottom: 1134, left: 1418, right: 1134 }, // ~20mm top/bottom, 25mm left
        },
      },
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateWordDocument };
