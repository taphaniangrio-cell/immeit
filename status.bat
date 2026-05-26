@echo off
cd /d "%~dp0"
echo.
echo  ============================================
echo      IMMEIT - Tableau de bord
echo  ============================================
echo.
echo  Site    : https://www.immeit.com
echo  Serveur : http://localhost:3001
echo  Admin   : http://localhost:3001/admin
echo.
sc query cloudflared | findstr "RUNNING" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo  Tunnel  : ACTIF (Cloudflare)
) else (
    echo  Tunnel  : INACTIF
)
echo.
echo  Commandes PM2 :
echo    pm2 status              - Etat des processus
echo    pm2 logs immeit         - Logs serveur
echo    pm2 restart immeit      - Redemarrer le serveur
echo.
echo  Service Cloudflare :
echo    sc query cloudflared    - Statut du tunnel
echo.
