# TSH Ariza Tizimini Ishga Tushirish

## Talab: Node.js o'rnatilgan bo'lishi kerak
- https://nodejs.org → LTS versiyani yuklab o'rnating
- O'rnatgandan so'ng kompyuterni qayta ishga tushiring

---

## Boshqa kompyuterda birinchi marta ishlatish

### 1. Loyihani yuklab oling
```
git clone https://github.com/AbdusattarovJurabek/tsh-ariza-tizimi.git
```
Yoki GitHub dan ZIP yuklab, papkani oching.

### 2. TSH.bat ni ikki marta bosing

Menyu ochiladi:
```
1. Birinchi marta o'rnatish   <- BU NI TANLANG (bir marta!)
2. Ishga tushirish
3. To'xtatish
4. Bazani yangilash
```
1 ni tanlang → Enter → 3-5 daqiqa kuting.

### 3. Ishga tushirish

TSH.bat → 2 → Enter

Brauzer avtomatik ochiladi: http://localhost:3000

---

## Har kuni ishlatish

- Ishga tushirish: TSH.bat → 2
- To'xtatish: TSH.bat → 3

---

## Login ma'lumotlari (development)

Production parollari `.env` faylida beriladi. Loyiha ildizidagi
`.env.example` faylidan namuna sifatida foydalaning.

| Rol | Login | Parol |
|-----|-------|-------|
| Super Admin | superadmin | Admin@123 |
| Tasdiqlovchi | tasdiqlovchi1 | Admin@123 |
| Imzolovchi | imzolovchi1 | Admin@123 |
| Foydalanuvchi | user001 | User@123 |

---

## Muammo bolsa

| Xato | Yechim |
|------|--------|
| node topilmadi | Node.js ornating: https://nodejs.org |
| Port band | TSH.bat → 3, keyin → 2 |
| Database xatosi | TSH.bat → 1 (qayta ornatish) |
| Schema ozgardi | TSH.bat → 4 |
