-- Ilgari ishlatilgan rol nomlarini yagona amaldagi formatga o'tkazish.
UPDATE "User" SET "role" = 'SUPERADMIN' WHERE "role" = 'SUPER_ADMIN';
UPDATE "User" SET "role" = 'TASDIQLOVCHI' WHERE "role" = 'ADMIN';
