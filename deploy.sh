#!/bin/bash
# ==============================================================================
# TSH Ariza Tizimi — Real Serverga Avtomatik Yuklash va Ishga Tushirish Skripti
# ==============================================================================

set -e

echo "🚀 TSH Ariza Tizimini Serverga Yuklash Boshlandi..."

# 1. Docker va Docker Compose mavjudligini tekshirish
if ! command -v docker &> /dev/null; then
    echo "❌ Docker topilmadi! Iltimos, serverga Docker o'rnating:"
    echo "curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# 2. Git orqali eng so'nggi kodni tortib olish
echo "📥 Git-dan yangi kodlar yuklab olinmoqda..."
git pull origin main

# 3. .env fayli mavjudligini tekshirish
if [ ! -f .env ]; then
    echo "⚠️ .env fayli topilmadi. .env.example asosida .env yaratilmoqda..."
    cat <<EOT > .env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$(openssl rand -hex 12)
POSTGRES_DB=tsh_ariza_db
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
CORS_ORIGIN=*
APP_BASE_URL=http://localhost
MAX_FILE_SIZE=10485760

SEED_DEFAULT_USERS=true
SEED_ADMIN_PASSWORD=Admin@123
SEED_USER_PASSWORD=User@123
EOT
    echo "✅ .env fayli muvaffaqiyatli yaratildi!"
fi

# 4. Konteynerlarni qayta qurish va ishga tushirish
echo "🏗️ Docker konteynerlari qurilmoqda va ishga tushirilmoqda..."
docker compose up --build -d

# 5. DB Migration va birinchi marta Seed qilish (agar baza bo'sh bo'lsa)
echo "🗄️ Ma'lumotlar bazasi tayyorlanmoqda..."
docker exec tsh_ariza_backend npx prisma db push
docker exec tsh_ariza_backend node src/utils/seed.js || true

echo "=============================================================================="
echo "🎉 TIZIM MUVAFFAQIYATLI ISHGA TUSHIRILDI!"
echo "📍 Veb tizim manzili: http://$(hostname -I | awk '{print $1}') (yoki domeniz)"
echo "=============================================================================="
