const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Login va parol kiritilishi shart' });
    }

    const user = await prisma.user.findUnique({ where: { username: username.toLowerCase().trim() } });

    if (!user) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ error: 'Hisobingiz bloklangan. Admin bilan bog\'laning.' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Hisobingiz faol emas.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Login yoki parol noto\'g\'ri' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        username: user.username,
        role: user.role,
        region: user.region,
        district: user.district,
        must_change_password: user.must_change_password
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ error: 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (old_password) {
      const isValid = await bcrypt.compare(old_password, user.password_hash);
      if (!isValid) {
        return res.status(400).json({ error: 'Eski parol noto\'g\'ri' });
      }
    }

    const password_hash = await bcrypt.hash(new_password, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password_hash, must_change_password: false }
    });

    res.json({ message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server xatosi' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, full_name: true, username: true, role: true,
        region: true, district: true, phone: true, status: true,
        must_change_password: true, created_at: true
      }
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server xatosi' });
  }
};
