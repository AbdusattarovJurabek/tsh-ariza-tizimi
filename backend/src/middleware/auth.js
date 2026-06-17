const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Avtorizatsiya talab etiladi' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, full_name: true, username: true, role: true, status: true, must_change_password: true }
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ error: 'Foydalanuvchi topilmadi yoki bloklangan' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Noto\'g\'ri token' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token muddati tugagan. Qayta kiring.' });
    }
    next(err);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Ruxsat yo\'q' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
