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

  // ── Demo arizalar (upsert by app_number) ──
  const demoApps = [
    {
      app_number: 'TSH-2025-001',
      status: 'SUBMITTED',
      submitted_at: new Date('2025-03-10'),
      subject_name: 'Alisher Karimov fermer xo\'jaligi',
      leader_full_name: 'Karimov Alisher Toshmatovich',
      stir: '123456789',
      legal_address: 'Toshkent viloyati, Zangiota tumani',
      total_land_area: 5.0,
      garden_area: 3.5,
      land_specialization: 'Mevazor bog\'',
      fruit_type: 'Olma',
      fruit_variety: 'Golden, Fuji',
      planting_scheme: '4x3',
      seedling_count: 2917,
      planting_period: '2025-yil bahor',
      water_source: 'Kanal suvi',
      project_amount: 850000000,
      permanent_jobs: 12,
      seasonal_jobs: 25,
    },
    {
      app_number: 'TSH-2025-002',
      status: 'UNDER_REVIEW',
      submitted_at: new Date('2025-03-15'),
      subject_name: 'Alisher Karimov fermer xo\'jaligi',
      leader_full_name: 'Karimov Alisher Toshmatovich',
      stir: '123456789',
      legal_address: 'Toshkent viloyati, Zangiota tumani',
      total_land_area: 8.0,
      garden_area: 6.0,
      land_specialization: 'Uzumzor',
      fruit_type: 'Uzum',
      fruit_variety: 'Toyfii, Kishmish',
      planting_scheme: '3x2',
      seedling_count: 10000,
      planting_period: '2025-yil bahor',
      water_source: 'Yer osti suvi',
      project_amount: 1200000000,
      permanent_jobs: 18,
      seasonal_jobs: 40,
    },
    {
      app_number: 'TSH-2025-003',
      status: 'APPROVED',
      submitted_at: new Date('2025-02-20'),
      approved_at: new Date('2025-03-01'),
      subject_name: 'Alisher Karimov fermer xo\'jaligi',
      leader_full_name: 'Karimov Alisher Toshmatovich',
      stir: '123456789',
      legal_address: 'Toshkent viloyati, Zangiota tumani',
      total_land_area: 3.0,
      garden_area: 2.5,
      land_specialization: 'Gilosxona',
      fruit_type: 'Gilos',
      fruit_variety: 'Napoleon',
      planting_scheme: '5x4',
      seedling_count: 1250,
      planting_period: '2025-yil kuz',
      water_source: 'Yomg\'ir suvi',
      project_amount: 450000000,
      permanent_jobs: 8,
      seasonal_jobs: 15,
    },
    {
      app_number: 'TSH-2025-004',
      status: 'SENT_TO_SIGNER',
      submitted_at: new Date('2025-02-10'),
      approved_at: new Date('2025-02-18'),
      sent_to_signer_at: new Date('2025-02-20'),
      subject_name: 'Alisher Karimov fermer xo\'jaligi',
      leader_full_name: 'Karimov Alisher Toshmatovich',
      stir: '123456789',
      legal_address: 'Toshkent viloyati, Zangiota tumani',
      total_land_area: 10.0,
      garden_area: 8.0,
      land_specialization: 'Shaftolizor',
      fruit_type: 'Shaftoli',
      fruit_variety: 'Redhaven',
      planting_scheme: '5x3',
      seedling_count: 5333,
      planting_period: '2024-yil bahor',
      water_source: 'Kanal suvi',
      project_amount: 1800000000,
      permanent_jobs: 22,
      seasonal_jobs: 55,
    },
  ];

  for (const appData of demoApps) {
    const existing = await prisma.application.findUnique({ where: { app_number: appData.app_number } });
    if (!existing) {
      await prisma.application.create({
        data: { ...appData, user_id: user001.id, farmer_id: farmer.id }
      });
      console.log(`  ✓ Ariza yaratildi: ${appData.app_number} [${appData.status}]`);
    }
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
