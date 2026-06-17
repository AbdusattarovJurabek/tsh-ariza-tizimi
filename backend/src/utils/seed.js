const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seed boshlandi...');

  // Super Admin yaratish
  const superAdminPass = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      full_name: 'Super Administrator',
      username: 'superadmin',
      password_hash: superAdminPass,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      must_change_password: false
    }
  });

  // Admin yaratish
  const adminPass = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { username: 'admin1' },
    update: {},
    create: {
      full_name: 'Toshkent Admin',
      username: 'admin1',
      password_hash: adminPass,
      role: 'ADMIN',
      region: 'Toshkent viloyati',
      status: 'ACTIVE',
      must_change_password: false
    }
  });

  // Test foydalanuvchi
  const userPass = await bcrypt.hash('User@123', 12);
  await prisma.user.upsert({
    where: { username: 'user001' },
    update: {},
    create: {
      full_name: 'Alisher Karimov',
      username: 'user001',
      password_hash: userPass,
      role: 'USER',
      region: 'Toshkent viloyati',
      district: 'Yunusobod tumani',
      phone: '+998901234567',
      status: 'ACTIVE',
      must_change_password: false
    }
  });

  console.log('✅ Seed muvaffaqiyatli yakunlandi!');
  console.log('Loginlar:');
  console.log('  Super Admin: superadmin / Admin@123');
  console.log('  Admin:       admin1 / Admin@123');
  console.log('  User:        user001 / User@123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
