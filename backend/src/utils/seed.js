const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  const shouldSeed = true;

  const adminPassword = String(process.env.SEED_ADMIN_PASSWORD || '').trim() || 'Admin@123';
  const userPassword = String(process.env.SEED_USER_PASSWORD || '').trim() || 'User@123';
  if (!adminPassword || !userPassword) {
    throw new Error('Production seed uchun SEED_ADMIN_PASSWORD va SEED_USER_PASSWORD majburiy');
  }

  const existingCount = await prisma.user.count();
  if (existingCount > 0 && process.env.FORCE_SEED !== 'true') {
    console.log('Ma\'lumotlar bazasida foydalanuvchilar mavjud. Avtomatik qayta tiklash o\'tkazib yuborildi.');
    return;
  }

  console.log('Seed boshlandi...');

  const adminHash = bcrypt.hashSync(adminPassword, 10);
  const userHash = bcrypt.hashSync(userPassword, 10);

  // ── Foydalanuvchilar ──
  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: { role: 'SUPERADMIN', status: 'ACTIVE' },
    create: {
      full_name: 'Super Administrator', username: 'superadmin',
      password_hash: adminHash, role: 'SUPERADMIN',
      status: 'ACTIVE', must_change_password: false
    }
  });

  await prisma.user.upsert({
    where: { username: 'tasdiqlovchi1' },
    update: { role: 'TASDIQLOVCHI', status: 'ACTIVE' },
    create: {
      full_name: 'Toshkent Tasdiqlovchi', username: 'tasdiqlovchi1',
      password_hash: adminHash, role: 'TASDIQLOVCHI',
      region: 'Toshkent viloyati', status: 'ACTIVE', must_change_password: false
    }
  });

  await prisma.user.upsert({
    where: { username: 'admin1' },
    update: { role: 'TASDIQLOVCHI', status: 'ACTIVE' },
    create: {
      full_name: 'Admin Tasdiqlovchi', username: 'admin1',
      password_hash: adminHash, role: 'TASDIQLOVCHI',
      region: 'Toshkent viloyati', status: 'ACTIVE', must_change_password: false
    }
  });

  const user001 = await prisma.user.upsert({
    where: { username: 'user001' },
    update: { status: 'ACTIVE' },
    create: {
      full_name: 'Alisher Karimov', username: 'user001',
      password_hash: userHash, role: 'USER',
      status: 'ACTIVE', must_change_password: false
    }
  });

  // ── Demo farmer ──
  let farmer = await prisma.farmer.findFirst({ where: { user_id: user001.id } });
  if (!farmer) {
    farmer = await prisma.farmer.create({
      data: {
        user_id: user001.id,
        full_name: 'Alisher Karimov fermer xo\'jaligi',
        leader_full_name: 'Karimov Alisher Toshmatovich',
        legal_address: 'Toshkent viloyati, Zangiota tumani, Yangiyo\'l ko\'chasi 12',
        stir: '123456789',
        region: 'Toshkent viloyati',
        district: 'Zangiota tumani',
        land_area: 5.0,
      }
    });
  }

  console.log('✅ Seed tugadi!');
}

main()
  .catch((e) => {
    console.error('Seed xatosi:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
