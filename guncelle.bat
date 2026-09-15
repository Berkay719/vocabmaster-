@echo off
chcp 65001 > nul
echo ==========================================
echo   VocabMaster Pro - GitHub Guncelleme
echo ==========================================
echo.
echo 1. Degisiklikler ekleniyor...
git add .
echo.
echo 2. Kayit (commit) olusturuluyor...
set /p commit_msg="Guncelleme mesaji girin (veya Enter'a basin): "
if "%commit_msg%"=="" set commit_msg=Guncelleme: %date% %time%
git commit -m "%commit_msg%"
echo.
echo 3. GitHub'a yukleniyor...
git push origin main
echo.
echo ==========================================
echo   Guncelleme basariyla yayina alindi!
echo   1-2 dakika icinde sitede gorunecektir.
echo ==========================================
echo.
pause
