const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PLACEHOLDER_VALUE = /^(?:-|—|null|none|n\/a|mavjud emas|yo'q|0)$/i;

const normalizeText = (value) =>
  String(value ?? '').replace(/\s+/g, ' ').trim();

const isUsefulText = (value) =>
  Boolean(value) && !PLACEHOLDER_VALUE.test(value);

function cleanFarmers(rows) {
  const uniqueByStir = new Map();
  const stats = {
    total: rows.length,
    invalid_inn: 0,
    missing_required_data: 0,
    duplicate_rows: 0,
  };

  for (const row of rows) {
    const stir = normalizeText(row.inn).replace(/\D/g, '');
    if (!/^\d{9}$/.test(stir)) {
      stats.invalid_inn += 1;
      continue;
    }

    const candidate = {
      full_name: normalizeText(row.name),
      leader_full_name: normalizeText(row.director_name),
      legal_address: normalizeText(row.address),
      stir,
      region: null,
      district: null,
      land_area: null,
    };

    if (![candidate.full_name, candidate.leader_full_name, candidate.legal_address].every(isUsefulText)) {
      stats.missing_required_data += 1;
      continue;
    }

    const existing = uniqueByStir.get(stir);
    if (existing) {
      stats.duplicate_rows += 1;
      const existingScore =
        existing.full_name.length + existing.leader_full_name.length + existing.legal_address.length;
      const candidateScore =
        candidate.full_name.length + candidate.leader_full_name.length + candidate.legal_address.length;
      if (candidateScore > existingScore) uniqueByStir.set(stir, candidate);
      continue;
    }

    uniqueByStir.set(stir, candidate);
  }

  return {
    farmers: [...uniqueByStir.values()],
    stats,
  };
}

const chunks = (items, size) => {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

async function importFarmers(filePath, ownerUsername = 'superadmin') {
  const owner = await prisma.user.findUnique({
    where: { username: ownerUsername },
    select: { id: true, username: true },
  });
  if (!owner) throw new Error(`Import egasi topilmadi: ${ownerUsername}`);

  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(parsed)) throw new Error("JSON ildizi ro'yxat bo'lishi kerak");

  const { farmers, stats } = cleanFarmers(parsed);
  const existingStirs = new Set();

  for (const stirBatch of chunks(farmers.map((farmer) => farmer.stir), 5000)) {
    const existing = await prisma.farmer.findMany({
      where: { stir: { in: stirBatch } },
      select: { stir: true },
    });
    existing.forEach((farmer) => {
      if (farmer.stir) existingStirs.add(farmer.stir);
    });
  }

  const newFarmers = farmers
    .filter((farmer) => !existingStirs.has(farmer.stir))
    .map((farmer) => ({ ...farmer, user_id: owner.id }));

  let inserted = 0;
  for (const batch of chunks(newFarmers, 1000)) {
    const result = await prisma.farmer.createMany({ data: batch });
    inserted += result.count;
  }

  return {
    ...stats,
    clean_unique_rows: farmers.length,
    skipped_existing: existingStirs.size,
    inserted,
    owner: owner.username,
  };
}

if (require.main === module) {
  const [, , filePath, ownerUsername] = process.argv;
  if (!filePath) {
    console.error('Foydalanish: node src/utils/importFarmersJson.js <farmers.json> [ownerUsername]');
    process.exit(1);
  }

  importFarmers(filePath, ownerUsername)
    .then((result) => console.log(JSON.stringify(result)))
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

module.exports = { cleanFarmers, importFarmers };
