require('dotenv').config();
if (process.env.NODE_ENV === 'production' &&
    (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Production uchun kamida 32 belgili JWT_SECRET majburiy');
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');


const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const adminRoutes = require('./routes/admin');
const tasdiqlovchiRoutes = require('./routes/tasdiqlovchi');
const imzolovchiRoutes = require('./routes/imzolovchi');
const userRoutes = require('./routes/users');
const farmerRoutes = require('./routes/farmers');
const publicRoutes = require('./routes/public');

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Uploads papkasi. Fayllar faqat autentifikatsiyalangan API orqali beriladi.
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Process Word template tags cleanly
const { processTemplateFile } = require('./utils/cleanTemplate');
processTemplateFile();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasdiqlovchi', tasdiqlovchiRoutes);
app.use('/api/imzolovchi', imzolovchiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/public', publicRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fayl hajmi juda katta (max 10MB)' });
  }
  res.status(err.status || 500).json({
    error: err.message || 'Server xatosi yuz berdi'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server ${PORT} portda ishlamoqda`);
  console.log(`   http://localhost:${PORT}/api/health`);
});

module.exports = app;
