/**
 * Tasdiqlanganidan keyin qolgan ish kunlarini hisoblaydi.
 * Shanba (6) va Yakshanba (0) ish kuni hisoblanmaydi.
 * @param {Date} approvedAt - Tasdiqlangan sana
 * @param {number} totalDays - Jami ish kunlari (default: 15)
 * @returns {number} Qolgan ish kunlari (0 dan kam bo'lmaydi)
 */
function getWorkingDaysRemaining(approvedAt, totalDays = 15) {
  const now = new Date();
  const approved = new Date(approvedAt);

  if (now < approved) return totalDays;

  let workingDaysPassed = 0;
  let current = new Date(approved);
  current.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  while (current <= today) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) workingDaysPassed++;
    current.setDate(current.getDate() + 1);
  }

  return Math.max(0, totalDays - workingDaysPassed);
}

/**
 * Tasdiqlangan sanadan boshlab o'tgan ish kunlari
 */
function getWorkingDaysPassed(approvedAt) {
  const now = new Date();
  const approved = new Date(approvedAt);

  if (now < approved) return 0;

  let workingDaysPassed = 0;
  let current = new Date(approved);
  current.setHours(0, 0, 0, 0);

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  while (current <= today) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) workingDaysPassed++;
    current.setDate(current.getDate() + 1);
  }

  return workingDaysPassed;
}

/**
 * 15 ish kun muddati tugash sanasini hisoblaydi
 */
function getDeadlineDate(approvedAt, totalDays = 15) {
  const approved = new Date(approvedAt);
  let count = 0;
  let current = new Date(approved);

  while (count < totalDays) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
  }

  return current;
}

module.exports = { getWorkingDaysRemaining, getWorkingDaysPassed, getDeadlineDate };
