export const STATUS_LABELS = {
  DRAFT: 'Qoralama',
  SUBMITTED: 'Yuborilgan',
  UNDER_REVIEW: "Ko'rib chiqilmoqda",
  HAS_ISSUES: 'Kamchilik bor',
  APPROVED: 'Tasdiqlandi',
  SENT_TO_SIGNER: 'Imzolovchiga yuborildi',
  SIGNED: 'Imzolandi',
  REJECTED: 'Rad etildi'
};

export const STATUS_COLORS = {
  DRAFT: 'badge-draft',
  SUBMITTED: 'badge-submitted',
  UNDER_REVIEW: 'badge-under-review',
  HAS_ISSUES: 'badge-has-issues',
  APPROVED: 'badge-approved',
  SENT_TO_SIGNER: 'badge-approved',
  SIGNED: 'badge-approved',
  REJECTED: 'badge-rejected'
};

export const ROLE_LABELS = {
  SUPERADMIN: 'Super Admin',
  TASDIQLOVCHI: 'Tasdiqlovchi',
  IMZOLOVCHI: 'Imzolovchi',
  USER: 'Foydalanuvchi'
};

export const STATUS_TRANSITIONS = {
  DRAFT: ['SUBMITTED'],
  HAS_ISSUES: ['SUBMITTED'],
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['HAS_ISSUES', 'APPROVED', 'REJECTED'],
  APPROVED: ['SENT_TO_SIGNER'],
  SENT_TO_SIGNER: ['SIGNED'],
  SIGNED: [],
  REJECTED: [],
};

export const FILE_TYPE_LABELS = {
  COVER_LETTER: '1. Aloqa xati',
  LAND_DECISION: '2. Yer ajratish qarori',
  LEASE_CONTRACT: '3. Ijara shartnomasi',
  REGISTRY_EXTRACT: "4. Reestrdan ko'chirma",
  LAND_MAP: '5. Yer uchastkasi xaritasi',
  SOIL_ANALYSIS: '6. Tuproq tahlili xulosasi',
  WATER_CONCLUSION: '7. Suv xulosasi',
  WEATHER_DATA: '8. Ob-havo tahlili',
  SCIENTIFIC_CONCLUSION: '9. Ilmiy xulosa',
  SEEDLING_CERT: "10. Ko'chat sertifikati",
  SEEDLING_CONTRACT: "11. Ko'chat yetkazish shartnomasi",
  IRRIGATION_CONTRACT: '12. Tomchilatib sug\'orish shartnomasi',
};

export const UZBEKISTAN_REGIONS = [
  'Toshkent shahri', 'Toshkent viloyati', 'Andijon viloyati',
  "Farg'ona viloyati", 'Namangan viloyati', 'Samarqand viloyati',
  'Buxoro viloyati', 'Navoiy viloyati', 'Qashqadaryo viloyati',
  'Surxondaryo viloyati', 'Jizzax viloyati', 'Sirdaryo viloyati',
  'Xorazm viloyati', "Qoraqalpog'iston Respublikasi"
];

export const UZBEKISTAN_DISTRICTS = {
  'Toshkent shahri': [
    'Bektemir tumani', 'Chilonzor tumani', 'Yakkasaroy tumani', 'Yashnobod tumani',
    'Mirobod tumani', 'Mirzo Ulug\'bek tumani', 'Olmazor tumani', 'Sergeli tumani',
    'Shayxontohur tumani', 'Uchtepa tumani', 'Yunusobod tumani'
  ],
  'Toshkent viloyati': [
    'Angren shahri', 'Bekobod shahri', 'Chirchiq shahri', 'Olmaliq shahri',
    'Toshkent tumani', 'Bekobod tumani', 'Boka tumani', 'Bo\'stonliq tumani',
    'Chinoz tumani', 'Qibray tumani', 'Ohangaron tumani', 'Parkent tumani',
    'Piskent tumani', 'Oqqo\'rg\'on tumani', 'Quyi Chirchiq tumani',
    'O\'rta Chirchiq tumani', 'Yuqori Chirchiq tumani', 'Zangiota tumani'
  ],
  'Andijon viloyati': [
    'Andijon shahri', 'Andijon tumani', 'Asaka tumani', 'Baliqchi tumani',
    'Bo\'z tumani', 'Buloqboshi tumani', 'Hojaobod tumani', 'Izboskan tumani',
    'Jalolquduq tumani', 'Keltachi tumani', 'Marhamat tumani', 'Oltinko\'l tumani',
    'Paxtaobod tumani', 'Qo\'rg\'ontepa tumani', 'Shahrixon tumani',
    'Ulug\'nor tumani', 'Xo\'jaobod tumani'
  ],
  "Farg'ona viloyati": [
    "Farg'ona shahri", "Marg'ilon shahri", 'Qo\'qon shahri',
    'Beshariq tumani', 'Bog\'dod tumani', "Buvayda tumani", "Dang'ara tumani",
    "Farg'ona tumani", 'Furqat tumani', 'Hamza tumani', 'Oltiariq tumani',
    "O'zbekiston tumani", "Qo'shtepa tumani", 'Rishton tumani', 'So\'x tumani',
    'Toshloq tumani', 'Uchko\'prik tumani', 'Yozyovon tumani'
  ],
  'Namangan viloyati': [
    'Namangan shahri', 'Chortoq tumani', 'Chust tumani', 'Kosonsoy tumani',
    'Mingbuloq tumani', 'Namangan tumani', 'Norin tumani', 'Pop tumani',
    "To'raqo'rg'on tumani", 'Uychi tumani', 'Yangidaryo tumani',
    'Yangiqo\'rg\'on tumani'
  ],
  'Samarqand viloyati': [
    'Samarqand shahri', 'Bulung\'ur tumani', 'Ishtixon tumani',
    'Jomboy tumani', 'Kattaqo\'rg\'on shahri', 'Kattaqo\'rg\'on tumani',
    'Narpay tumani', 'Nurobod tumani', 'Oqdaryo tumani', 'Paxtachi tumani',
    'Pastdarg\'om tumani', 'Payariq tumani', 'Qo\'shrabot tumani',
    'Samarqand tumani', 'Toyloq tumani', 'Urgut tumani'
  ],
  'Buxoro viloyati': [
    'Buxoro shahri', 'Buxoro tumani', 'G\'ijduvon tumani', 'Jondor tumani',
    'Kogon shahri', 'Kogon tumani', 'Olot tumani', 'Peshku tumani',
    'Qorako\'l tumani', 'Qorovulbozor tumani', 'Romitan tumani',
    'Shofirkon tumani', 'Vobkent tumani'
  ],
  'Navoiy viloyati': [
    'Navoiy shahri', 'Karmana tumani', 'Konimex tumani', 'Navbahor tumani',
    'Nurota tumani', 'Qiziltepa tumani', 'Tomdi tumani', 'Uchquduq tumani',
    'Xatirchi tumani', 'Zarafshon shahri'
  ],
  'Qashqadaryo viloyati': [
    'Qarshi shahri', 'Chiroqchi tumani', 'Dehqonobod tumani', 'G\'uzor tumani',
    'Kasbi tumani', 'Kitob tumani', 'Koson tumani', 'Mirishkor tumani',
    'Muborak tumani', 'Nishon tumani', 'Qamashi tumani', 'Qarshi tumani',
    'Shahrisabz tumani', 'Shahrisabz shahri', 'Yakkabog\'tumani'
  ],
  'Surxondaryo viloyati': [
    'Termiz shahri', 'Angor tumani', 'Bandixon tumani', 'Boysun tumani',
    'Denov tumani', 'Jarqo\'rg\'on tumani', 'Muzrabot tumani', 'Oltinsoy tumani',
    'Qiziriq tumani', 'Qumqo\'rg\'on tumani', 'Sariosiyo tumani',
    'Sherobod tumani', 'Sho\'rchi tumani', 'Termiz tumani', 'Uzun tumani'
  ],
  'Jizzax viloyati': [
    'Jizzax shahri', 'Arnasoy tumani', 'Baxmal tumani', 'Do\'stlik tumani',
    'Forish tumani', 'G\'allaorol tumani', 'Jizzax tumani', 'Mirzacho\'l tumani',
    'Paxtakor tumani', 'Yangiobod tumani', 'Zafarobod tumani', 'Zomin tumani',
    "Zarbdor tumani"
  ],
  'Sirdaryo viloyati': [
    'Guliston shahri', 'Boyovut tumani', 'Guliston tumani', 'Xovos tumani',
    'Mirzaobod tumani', 'Oqoltin tumani', 'Sardoba tumani', 'Sayxunobod tumani',
    'Sirdaryo tumani'
  ],
  'Xorazm viloyati': [
    'Urganch shahri', 'Bog\'ot tumani', 'Gurlan tumani', 'Xiva shahri',
    'Xiva tumani', 'Xonqa tumani', 'Qo\'shko\'pir tumani', 'Shovot tumani',
    'Tuproqqal\'a tumani', 'Urganch tumani', 'Yangiariq tumani', 'Yangibozor tumani'
  ],
  "Qoraqalpog'iston Respublikasi": [
    'Nukus shahri', 'Amudaryo tumani', 'Beruniy tumani', 'Chimboy tumani',
    'Ellikqal\'a tumani', 'Kegeyli tumani', 'Mo\'ynoq tumani', 'Nukus tumani',
    "Qanliko'l tumani", "Qo'ng'irot tumani", 'Qorao\'zak tumani',
    'Shumanay tumani', 'Taxtako\'pir tumani', 'To\'rtko\'l tumani', 'Xo\'jayli tumani'
  ],
};

export const FRUIT_TYPES = [
  'Olma', 'Nok', 'Shaftoli', 'O\'rik', 'Gilos', 'Olcha', 'Anor',
  'Anjir', 'Behi', 'Uzum', 'Lavlagi', 'Limon', 'Mandarin',
  'Bodom', 'Yong\'oq', 'Pistа', 'Qovun', 'Tarvuz', 'Boshqa'
];

export const LAND_SPECIALIZATIONS = [
  'Bog\'dorchilik',
  'Uzumchilik',
  'Intensiv bog\'dorchilik',
  'Ko\'chatchilik',
  'Sabzavotchilik',
  'Polizchilik',
  'G\'allachilik',
  'Paxtachilik',
  'Chorvachilik',
  'Issiqxona xo\'jaligi',
  'Boshqa'
];

export const SOIL_ANALYSIS_ORGS = [
  'Tuproqshunoslik va agrokimyoviy tadqiqotlar instituti',
  '"Tuproq sifati va tahlili" DUK',
  'Viloyat Agrokimyo stansiyasi',
  'Boshqa'
];

export const WATER_SUPPLY_ORGS = [
  'Suv xo\'jaligi vazirligi tuman bo\'limi',
  '"Suvchi" DUK',
  'Irrigatsiya tizimi havza boshqarmasi',
  'Boshqa'
];

export const WEATHER_DATA_ORGS = [
  'Gidrometeorologiya xizmati agentligi (O\'zgidromet)',
  'Viloyat Gidrometeorologiya boshqarmasi',
  'Boshqa'
];

export const SCIENTIFIC_ORGS = [
  'Akademik M.Mirzayev nomidagi Bog\'dorchilik, uzumchilik va vinochilik ITI',
  'O\'zbekiston Qishloq xo\'jaligi ilmiy-ishlab chiqarish markazi',
  'Toshkent davlat agrar universiteti',
  'Boshqa'
];

export const PLANTING_SCHEMES = [
  '3x2m',
  '4x2m',
  '4x3m',
  '5x3m',
  '5x4m',
  '6x4m',
  '6x5m',
  '7x5m',
  '8x6m',
  'Boshqa'
];

export const WATER_SOURCES = [
  'Kanal',
  'Quduq (Artezian)',
  'Daryo / Soy',
  'Suv ombori',
  'Nasos stansiyasi',
  'Boshqa'
];
