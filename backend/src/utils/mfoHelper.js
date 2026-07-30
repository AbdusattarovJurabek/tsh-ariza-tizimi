const UZBEKISTAN_MFO_MAP = {
  '00014': "O'zbekiston Respublikasi Markaziy Banki",
  '00901': '"Agrobank" ATB',
  '00440': '"O\'zsanoatqurilishbank" ATB (SQB)',
  '00871': '"O\'zbekiston Milliy banki" ATB (NBU)',
  '00411': '"Xalq banki" ATB',
  '00394': '"Asakabank" ATB',
  '00425': '"Ipoteka-bank" ATB',
  '00407': '"Biznesni rivojlantirish banki" ATB',
  '00873': '"Hamkorbank" ATB',
  '00490': '"Aloqabank" ATB',
  '00383': '"Ipak Yo\'li" AIB',
  '00837': '"Turonbank" ATB',
  '00430': '"Orient Finans" XATB',
  '00438': '"Kapitalbank" ATB',
  '00963': '"Davr Bank" XATB',
  '00969': '"Anor Bank" AJ',
  '00974': '"TBC Bank" ATB',
  '00980': '"Octobank" AJ',
  '00995': '"Poytaxt Bank" AJ',
  '00997': '"Asia Alliance Bank" ATB',
  '00985': '"Apex Bank" AJ',
  '00988': '"Hayot Bank" AJ',
  '00999': '"Smart Bank" AJ',
};

/**
 * MFO kodi bo'yicha bank nomini aniqlaydi.
 * @param {string} mfo - 5 xonali MFO kodi
 * @returns {string|null} - Bank nomi yoki topilmasa null
 */
function getBankNameByMFO(mfo) {
  if (!mfo) return null;
  const cleanMFO = String(mfo).trim();
  return UZBEKISTAN_MFO_MAP[cleanMFO] || null;
}

module.exports = {
  UZBEKISTAN_MFO_MAP,
  getBankNameByMFO,
};
