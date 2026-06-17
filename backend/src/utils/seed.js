const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seed boshlandi...');

  const hash = (p) => bcrypt.hash(p, 12);

  // Super Admin
  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: { role: 'SUPERADMIN' },
    create: { full_name: 'Super Administrator', username: 'superadmin', password_hash: await hash('Admin@123'), role: 'SUPERADMIN', status: 'ACTIVE', must_change_password: false }
  });

  // Tasdiqlovchi
  await prisma.user.upsert({
    where: { username: 'tasdiqlovchi1' },
    update: { role: 'TASDIQLOVCHI' },
    create: { full_name: 'Toshkent Tasdiqlovchi', username: 'tasdiqlovchi1', password_hash: await hash('Admin@123'), role: 'TASDIQLOVCHI', region: 'Toshkent viloyati', status: 'ACTIVE', must_change_password: false }
  });

  // Imzolovchi
  await prisma.user.upsert({
    where: { username: 'imzolovchi1' },
    update: { role: 'IMZOLOVCHI' },
    create: { full_name: 'Direktor Imzolovchi', username: 'imzolovchi1', password_hash: await hash('Admin@123'), role: 'IMZOLOVCHI', status: 'ACTIVE', must_change_password: false }
  });

  // Eski admin (TASDIQLOVCHI ga o'tkazish)
  await prisma.user.upsert({
    where: { username: 'admin1' },
    update: { role: 'TASDIQLOVCHI' },
    create: { full_name: 'Admin Tasdiqlovchi', username: 'admin1', password_hash: await hash('Admin@123'), role: 'TASDIQLOVCHI', region: 'Toshkent viloyati', status: 'ACTIVE', must_change_password: false }
  });

  // Test foydalanuvchi
  await prisma.user.upsert({
    where: { username: 'user001' },
    update: {},
    create: { full_name: 'Alisher Karimov', username: 'user001', password_hash: await hash('User@123'), role: 'USER', region: 'Toshkent viloyati', district: 'Yunusobod tumani', phone: '+998901234567', status: 'ACTIVE', must_change_password: false }
  });

  console.log('Seed tayyor!');
  console.log('  superadmin   / Admin@123  (SUPERADMIN)');
  console.log('  tasdiqlovchi1/ Admin@123  (TASDIQLOVCHI)');
  console.log('  imzolovchi1  / Admin@123  (IMZOLOVCHI)');
  console.log('  user001      / User@123   (USER)');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
