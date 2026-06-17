# TSH Ariza Tizimi - GitHub ga yuklash skripti

param(
    [string]$GitHubUsername = "",
    [string]$RepoName = "tsh-ariza-tizimi"
)

$projectPath = $PSScriptRoot
Set-Location $projectPath

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  TSH Ariza Tizimi - GitHub Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. GitHub username sorash
if (-not $GitHubUsername) {
    $GitHubUsername = Read-Host "  GitHub username ingizni kiriting (masalan: johndoe)"
}
if (-not $GitHubUsername) {
    Write-Host "  XATO: Username kiritilmadi!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "  Repo: https://github.com/$GitHubUsername/$RepoName" -ForegroundColor Gray
Write-Host ""

# 2. Git installatsiyasini tekshirish
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCheck) {
    Write-Host "  XATO: Git o'rnatilmagan!" -ForegroundColor Red
    Write-Host "  https://git-scm.com/download/win dan yuklab o'rnating" -ForegroundColor Yellow
    pause
    exit 1
}
$gitVersion = git --version
Write-Host "  OK: $gitVersion" -ForegroundColor Green

# 3. Git init
Write-Host ""
Write-Host "[1/5] Git repository yaratilmoqda..." -ForegroundColor Yellow

if (Test-Path ".git") {
    Write-Host "  Git repo allaqachon mavjud." -ForegroundColor Gray
} else {
    git init
    git branch -M main
    Write-Host "  OK: Git repo yaratildi (main branch)" -ForegroundColor Green
}

# 4. Git config
Write-Host ""
Write-Host "[2/5] Git sozlamalari..." -ForegroundColor Yellow
$userName = git config user.name 2>$null
if (-not $userName) {
    git config user.name $GitHubUsername
    Write-Host "  user.name = $GitHubUsername" -ForegroundColor Gray
} else {
    Write-Host "  user.name = $userName (mavjud)" -ForegroundColor Gray
}
$userEmail = git config user.email 2>$null
if (-not $userEmail) {
    $email = Read-Host "  GitHub email manzilingizni kiriting"
    git config user.email $email
} else {
    Write-Host "  user.email = $userEmail (mavjud)" -ForegroundColor Gray
}

# 5. Stage va commit
Write-Host ""
Write-Host "[3/5] Fayllar qo'shilmoqda..." -ForegroundColor Yellow
git add .
$stagedCount = (git diff --cached --name-only).Count
Write-Host "  OK: $stagedCount ta fayl tayyor" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Commit yaratilmoqda..." -ForegroundColor Yellow
$logCount = (git log --oneline 2>$null).Count
if ($logCount -gt 0) {
    $date = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMsg = "Update: $date"
} else {
    $commitMsg = "Initial commit: TSH Ariza Tizimi v1.0"
}
git commit -m $commitMsg
Write-Host "  OK: Commit: $commitMsg" -ForegroundColor Green

# 6. Remote va push
Write-Host ""
Write-Host "[5/5] GitHub ga yuklash..." -ForegroundColor Yellow

$remoteUrl = "https://github.com/$GitHubUsername/$RepoName.git"
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    git remote set-url origin $remoteUrl
    Write-Host "  Remote URL yangilandi: $remoteUrl" -ForegroundColor Gray
} else {
    git remote add origin $remoteUrl
    Write-Host "  Remote qo'shildi: $remoteUrl" -ForegroundColor Green
}

Write-Host ""
Write-Host "  ----------------------------------------" -ForegroundColor Gray
Write-Host "  DIQQAT: Avval GitHub da repo yaratish kerak!" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. https://github.com/new ga o'ting" -ForegroundColor Cyan
Write-Host "  2. Repository name: $RepoName" -ForegroundColor Cyan
Write-Host "  3. Public tanlang" -ForegroundColor Cyan
Write-Host "  4. README QO'SHMANG (allaqachon bor)" -ForegroundColor Cyan
Write-Host "  5. Create repository tugmasini bosing" -ForegroundColor Cyan
Write-Host "  ----------------------------------------" -ForegroundColor Gray
Write-Host ""

$ready = Read-Host "  Repo yaratdingizmi? (ha / yo'q)"
if ($ready -ne "ha" -and $ready -ne "h" -and $ready -ne "yes" -and $ready -ne "y") {
    Write-Host ""
    Write-Host "  Tayyor bo'lganda quyidagi buyruqni ishga tushiring:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor Cyan
    pause
    exit 0
}

Write-Host ""
Write-Host "  Push qilinmoqda..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "  ============================================" -ForegroundColor Green
    Write-Host "  MUVAFFAQIYATLI YUKLANDI!" -ForegroundColor Green
    Write-Host "  https://github.com/$GitHubUsername/$RepoName" -ForegroundColor Cyan
    Write-Host "  ============================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "  XATO: Push amalga oshmadi." -ForegroundColor Red
    Write-Host "  Token kerak bo'lsa:" -ForegroundColor Yellow
    Write-Host "  https://github.com/settings/tokens/new" -ForegroundColor Cyan
    Write-Host "  Scope: repo (hammasi) - Tokenni parol orniga ishlating" -ForegroundColor Cyan
}

Write-Host ""
pause
