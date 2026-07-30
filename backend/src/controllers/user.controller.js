const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const prisma = new PrismaClient();
const ALLOWED_ROLES = ['USER', 'TASDIQLOVCHI', 'IMZOLOVCHI', 'SUPERADMIN'];

// Barcha foydalanuvchilar (Admin uchun)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, role, region } = req.query;
    const where = {};

    if (status) where.status = status;
    if (role) where.role = role;
    if (region) where.region = { contains: region, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { full_name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, full_name: true, username: true, role: true,
          region: true, district: true, phone: true, status: true,
          must_change_password: true, created_at: true,
          _count: { select: { applications: true } }
        },
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({ data: users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
};

// Foydalanuvchi yaratish
exports.createUser = async (req, res) => {
  try {
    const { full_name, username, password, role = 'USER', region, district, phone } = req.body;

    if (!full_name || !username || !password) {
      return res.status(400).json({ error: 'Ism, login va parol majburiy' });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Noto‘g‘ri foydalanuvchi roli' });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Bu login allaqachon mavjud' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { full_name, username, password_hash, role, region, district, phone },
      select: { id: true, full_name: true, username: true, role: true, region: true, district: true, status: true }
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Foydalanuvchi yaratishda xato' });
  }
};

// Foydalanuvchini yangilash
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, region, district, phone, status } = req.body;
    if (role && !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Noto‘g‘ri foydalanuvchi roli' });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { full_name, role, region, district, phone, status },
      select: { id: true, full_name: true, username: true, role: true, region: true, district: true, status: true }
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Foydalanuvchini yangilashda xato' });
  }
};

// Parolni reset qilish
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { password_hash, must_change_password: true }
    });

    res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
  } catch (err) {
    res.status(500).json({ error: 'Parolni yangilashda xato' });
  }
};

// Foydalanuvchini o'chirish
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: 'INACTIVE' }
    });
    res.json({ message: 'Foydalanuvchi o\'chirildi' });
  } catch (err) {
    res.status(500).json({ error: 'Xato' });
  }
};

// Excel orqali import
exports.importUsersFromExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Excel fayl yuklanmadi' });

    const workbook = XLSX.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const results = { created: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const { full_name, username, password, region, district, phone } = row;

      if (!full_name || !username || !password) {
        results.errors.push(`Satr ${i + 2}: full_name, username, password majburiy`);
        continue;
      }

      try {
        const existing = await prisma.user.findUnique({ where: { username: String(username) } });
        if (existing) {
          results.errors.push(`Satr ${i + 2}: "${username}" login allaqachon mavjud`);
          continue;
        }

        const password_hash = await bcrypt.hash(String(password), 12);
        await prisma.user.create({
          data: {
            full_name: String(full_name),
            username: String(username),
            password_hash,
            region: region ? String(region) : null,
            district: district ? String(district) : null,
            phone: phone ? String(phone) : null,
            role: 'USER'
          }
        });
        results.created++;
      } catch (e) {
        results.errors.push(`Satr ${i + 2}: ${e.message}`);
      }
    }

    const fs = require('fs');
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Import xatosi' });
  }
};

// Foydalanuvchilarni Excel export
exports.exportUsersExcel = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, full_name: true, username: true, role: true,
        region: true, district: true, phone: true, status: true, created_at: true
      },
      orderBy: { id: 'asc' }
    });

    const data = users.map((u, i) => ({
      '№': i + 1,
      'F.I.Sh.': u.full_name,
      'Login': u.username,
      'Rol': u.role === 'SUPERADMIN' ? 'Super Admin' :
        u.role === 'TASDIQLOVCHI' ? 'Tasdiqlovchi' :
        u.role === 'IMZOLOVCHI' ? 'Imzolovchi' : 'Foydalanuvchi',
      'Viloyat': u.region || '',
      'Tuman': u.district || '',
      'Telefon': u.phone || '',
      'Holat': u.status === 'ACTIVE' ? 'Faol' : 'Faol emas',
      'Yaratilgan': new Date(u.created_at).toLocaleDateString('uz-UZ')
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Foydalanuvchilar');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="foydalanuvchilar.xlsx"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Excel yaratishda xato' });
  }
};
