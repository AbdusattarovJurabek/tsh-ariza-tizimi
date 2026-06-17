const generateApplicationPDF = async (application) => {
  const statusMap = {
    DRAFT: 'Qoralama', SUBMITTED: 'Yuborilgan',
    UNDER_REVIEW: "Ko'rib chiqilmoqda", HAS_ISSUES: 'Kamchilik bor',
    APPROVED: 'Tasdiqlandi', REJECTED: 'Rad etildi'
  };

  const html = `<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<title>Ariza ${application.app_number}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 30px; color: #222; font-size: 13px; }
  h1 { text-align: center; font-size: 16px; margin-bottom: 4px; }
  h2 { text-align: center; font-size: 14px; color: #1a5c2a; margin-bottom: 4px; }
  .app-num { text-align: center; font-size: 13px; margin-bottom: 20px; color: #555; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { background: #e8f5e9; text-align: left; padding: 7px 10px; font-weight: bold; width: 38%; border: 1px solid #ccc; }
  td { padding: 7px 10px; border: 1px solid #ccc; }
  .section { font-weight: bold; background: #1a5c2a; color: white; padding: 6px 10px; margin-top: 14px; font-size: 12px; }
  .footer { margin-top: 30px; text-align: right; color: #555; font-size: 12px; }
</style>
</head>
<body>
<h1>AGROSANOATNI RIVOJLANTIRISH AGENTLIGI</h1>
<h2>BOG' TASHKIL ETISH BO'YICHA TEXNIK SHART ARIZASI</h2>
<div class="app-num">Ariza raqami: <strong>${application.app_number}</strong></div>

<div class="section">1. SUBYEKT MA'LUMOTLARI</div>
<table>
  <tr><th>Subyekt nomi</th><td>${application.subject_name || '—'}</td></tr>
  <tr><th>Rahbar F.I.Sh.</th><td>${application.leader_full_name || '—'}</td></tr>
  <tr><th>Yuridik manzil</th><td>${application.legal_address || '—'}</td></tr>
  <tr><th>STIR</th><td>${application.stir || '—'}</td></tr>
  <tr><th>MFO</th><td>${application.mfo || '—'}</td></tr>
  <tr><th>Hisob raqam</th><td>${application.bank_account || '—'}</td></tr>
  <tr><th>Bank nomi</th><td>${application.bank_name || '—'}</td></tr>
</table>

<div class="section">2. YER MAYDONI MA'LUMOTLARI</div>
<table>
  <tr><th>Umumiy yer maydoni (ga)</th><td>${application.total_land_area || '—'}</td></tr>
  <tr><th>Ixtisoslik</th><td>${application.land_specialization || '—'}</td></tr>
  <tr><th>Bog' tashkil qilinadigan maydon (ga)</th><td>${application.garden_area || '—'}</td></tr>
  <tr><th>Yer konturi</th><td>${application.land_contour || '—'}</td></tr>
  <tr><th>Bog' manzili</th><td>${application.garden_address || '—'}</td></tr>
  <tr><th>Lokatsiya havolasi</th><td>${application.location_url || '—'}</td></tr>
  <tr><th>Qaror raqami va sanasi</th><td>${application.land_decision_number || '—'} ${application.land_decision_date || ''}</td></tr>
  <tr><th>Ijara shartnomasi raqami va sanasi</th><td>${application.lease_contract_number || '—'} ${application.lease_contract_date || ''}</td></tr>
  <tr><th>Reestr raqami</th><td>${application.registry_number || '—'}</td></tr>
</table>

<div class="section">3. AGROTEXNIK MA'LUMOTLAR</div>
<table>
  <tr><th>Tuproq tipi</th><td>${application.soil_type || '—'}</td></tr>
  <tr><th>Tuproq tarkibi</th><td>${application.soil_composition || '—'}</td></tr>
  <tr><th>Tuproq sifati</th><td>${application.soil_quality || '—'}</td></tr>
  <tr><th>Tuproq unumdorligi</th><td>${application.soil_fertility || '—'}</td></tr>
  <tr><th>Suv ta'minlanganlik xulosasi</th><td>${application.water_supply_info || '—'}</td></tr>
  <tr><th>5 yillik ob-havo tahlili</th><td>${application.weather_analysis || '—'}</td></tr>
  <tr><th>Ilmiy tavsiya</th><td>${application.scientific_recommendation || '—'}</td></tr>
</table>

<div class="section">4. KO'CHAT VA EKISH MA'LUMOTLARI</div>
<table>
  <tr><th>Ekiladigan meva turlari</th><td>${application.fruit_type || '—'}</td></tr>
  <tr><th>Ekiladigan meva navlari</th><td>${application.fruit_variety || '—'}</td></tr>
  <tr><th>Ekish sxemasi</th><td>${application.planting_scheme || '—'}</td></tr>
  <tr><th>Umumiy ko'chat soni (dona)</th><td>${application.seedling_count || '—'}</td></tr>
  <tr><th>Taxminiy ekilish davri</th><td>${application.planting_period || '—'}</td></tr>
  <tr><th>Suv manbasi</th><td>${application.water_source || '—'}</td></tr>
</table>

<div class="section">5. LOYIHA VA ISH O'RINLARI</div>
<table>
  <tr><th>Loyihaning taxminiy summasi (so'm)</th><td>${application.project_amount ? Number(application.project_amount).toLocaleString('uz-UZ') : '—'}</td></tr>
  <tr><th>Doimiy ish o'rinlari soni</th><td>${application.permanent_jobs || '—'}</td></tr>
  <tr><th>Mavsumiy ish o'rinlari soni</th><td>${application.seasonal_jobs || '—'}</td></tr>
  <tr><th>Ta'minotchi korxonalar</th><td>${application.supplier_companies || '—'}</td></tr>
</table>

<div class="section">6. ARIZA HOLATI</div>
<table>
  <tr><th>Holat</th><td><strong>${statusMap[application.status] || application.status}</strong></td></tr>
  <tr><th>Yuborilgan sana</th><td>${application.submitted_at ? new Date(application.submitted_at).toLocaleDateString('uz-UZ') : '—'}</td></tr>
  ${application.admin_comment ? `<tr><th>Admin izohi</th><td style="color:red">${application.admin_comment}</td></tr>` : ''}
</table>

<div class="footer">
  Chiqarilgan sana: ${new Date().toLocaleDateString('uz-UZ')} &nbsp;|&nbsp; Agrosanoatni Rivojlantirish Agentligi
</div>
</body>
</html>`;

  return Buffer.from(html, 'utf-8');
};

module.exports = { generateApplicationPDF };
