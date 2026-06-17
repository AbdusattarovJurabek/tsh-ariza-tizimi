# TSH Ariza Tizimi
## Agrosanoatni Rivojlantirish Agentligi — Bog' Tashkil Etish Arizalari

Bog' tashkil etish bo'yicha texnik shart arizalarini elektron topshirish va boshqarish tizimi.

---

## Tizim imkoniyatlari

- **Foydalanuvchilar:** Login/parol orqali kirish, 6 bosqichli ariza to'ldirish, 12 turdagi hujjat yuklash
- **Admin:** Arizalarni ko'rish, status qo'yish, izoh yozish, PDF/Word export
- **Super Admin:** Foydalanuvchilarni boshqarish, Excel import/export, statistika
- **Xavfsizlik:** JWT, bcrypt, RBAC, fayl validatsiya

---

## Tizim talablari

- Node.js 18+
- PostgreSQL 14+
- npm 9+

---

## 1. Oddiy ishga tushirish (Local)

### Backend

```bash
cd backend
cp ../.env.example .env
# .env faylida DATABASE_URL ni to'g'rilang

npm install
npx prisma migrate dev --name init
node src/utils/seed.js
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Brauzerda: **http://localhost:3000**

---

## 2. Docker orqali ishga tushirish

```bash
# Loyiha papkasida:
docker-compose up --build -d

# Ishga tushganini tekshirish
docker-compose ps
docker-compose logs backend
```

Brauzerda: **http://localhost:3000**

---

## Login ma'lumotlari (test)

| Rol | Login | Parol |
|-----|-------|-------|
| Super Admin | `superadmin` | `Admin@123` |
| Admin | `admin1` | `Admin@123` |
| Foydalanuvchi | `user001` | `User@123` |

---

## Excel import (200 foydalanuvchi)

Excel fayl quyidagi ustunlarga ega bo'lishi kerak:

| full_name | username | password | region | district | phone |
|-----------|----------|----------|--------|----------|-------|
| Alisher Karimov | user002 | Pass@123 | Toshkent viloyati | Yunusobod tumani | +998901234567 |

Admin panelda: **Foydalanuvchilar → Excel import** tugmasini bosing.

---

## API endpointlar

### Auth
- `POST /api/auth/login` — Kirish
- `GET /api/auth/me` — Joriy foydalanuvchi
- `PUT /api/auth/change-password` — Parol o'zgartirish

### Arizalar (Foydalanuvchi)
- `GET /api/applications` — O'z arizalari
- `POST /api/applications` — Yangi ariza
- `GET /api/applications/:id` — Bitta ariza
- `PUT /api/applications/:id` — Tahrirlash
- `POST /api/applications/:id/submit` — Yuborish
- `POST /api/applications/:id/files` — Fayl yuklash
- `DELETE /api/applications/:id/files/:fileId` — Faylni o'chirish

### Admin
- `GET /api/admin/applications` — Barcha arizalar (filter)
- `PATCH /api/admin/applications/:id/status` — Status o'zgartirish
- `GET /api/admin/applications/:id/export/pdf` — PDF export
- `GET /api/admin/applications/:id/export/word` — Word export
- `GET /api/admin/export/applications/excel` — Barcha arizalar Excel
- `GET /api/admin/statistics` — Statistika

### Foydalanuvchilar (Admin)
- `GET /api/users` — Foydalanuvchilar ro'yxati
- `POST /api/users` — Yaratish
- `PUT /api/users/:id` — Yangilash
- `DELETE /api/users/:id` — O'chirish
- `POST /api/users/:id/reset-password` — Parol reset
- `POST /api/users/import/excel` — Excel import
- `GET /api/users/export/excel` — Excel export

---

## Ariza statusi yo'li

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED
                                 → HAS_ISSUES → (foydalanuvchi tuzatadi) → SUBMITTED
                                 → REJECTED
```

---

## Database jadvallar

- `users` — Foydalanuvchilar
- `applications` — Arizalar (27 maydon)
- `application_files` — Yuklangan hujjatlar
- `status_history` — Status o'zgarish tarixi

---

## Loyiha tuzilmasi

```
tsh-ariza-tizimi/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── utils/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## Texnik ma'lumotlar

- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Recharts
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL 15
- **Auth:** JWT (24 soat), bcrypt (12 rounds)
- **Fayl:** Multer, max 10MB, PDF/JPG/PNG/DOC/DOCX
- **Export:** XLSX (xlsx library), Word (docx library)
