# TSH Backend - node_modules qayta o'rnatish skripti
$backendPath = Join-Path $PSScriptRoot "backend"
Set-Location $backendPath
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  TSH Backend - Tuzatish skripti" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Papka: $backendPath" -ForegroundColor Gray
Write-Host ""

# node_modules o'chirish (uzun yo'llar uchun robocopy usuli)
Write-Host "[1/4] node_modules o'chirilmoqda..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $tmp = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "empty_" + [System.Guid]::NewGuid())
    New-Item -ItemType Directory -Path $tmp -Force | Out-Null
    & robocopy $tmp "node_modules" /MIR /NFL /NDL /NJH /NJS /NC /NS | Out-Null
    Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   node_modules o'chirildi!" -ForegroundColor Green
} else {
    Write-Host "   node_modules yo'q edi" -ForegroundColor Gray
}

if (Test-Path "package-lock.json") {
    Remove-Item "package-lock.json" -Force
    Write-Host "   package-lock.json o'chirildi" -ForegroundColor Gray
}

# npm install
Write-Host ""
Write-Host "[2/4] npm install ishga tushirilmoqda..." -ForegroundColor Yellow
Write-Host "   (bu 1-2 daqiqa davom etishi mumkin)" -ForegroundColor Gray
Write-Host ""
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "XATO: npm install muvaffaqiyatsiz tugadi!" -ForegroundColor Red
    Read-Host "Enter bosing..."
    exit 1
}
Write-Host ""
Write-Host "   Paketlar muvaffaqiyatli o'rnatildi!" -ForegroundColor Green

# Prisma DB yangilash (approved_at maydoni uchun)
Write-Host ""
Write-Host "[3/4] Baza sxemasi yangilanmoqda (approved_at)..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "   OGOHLANTIRISH: Prisma yangilash muvaffaqiyatsiz" -ForegroundColor Yellow
} else {
    Write-Host "   Baza yangilandi!" -ForegroundColor Green
}

# Server ishga tushirish
Write-Host ""
Write-Host "[4/4] Backend server ishga tushirilmoqda..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  ----------------------------------------" -ForegroundColor Cyan
Write-Host "   Login: admin1 / Admin@123" -ForegroundColor Cyan
Write-Host "   http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Tracking: http://localhost:3000/track" -ForegroundColor Cyan
Write-Host "  ----------------------------------------" -ForegroundColor Cyan
Write-Host ""
node src/app.js
