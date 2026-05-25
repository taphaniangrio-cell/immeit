@echo off
cd /d "%~dp0"
echo.
echo  ============================================
echo      IMMEIT - Tableau de bord
echo  ============================================
echo.
echo  Serveur : http://localhost:3001
echo  Admin   : http://localhost:3001/admin
echo.
if exist "server\.tunnel-url" (
    set /p TUNNEL_URL=<"server\.tunnel-url"
    echo  Tunnel  : %TUNNEL_URL%
    echo.
    echo  Pour ouvrir le site via le tunnel :
    echo  start %TUNNEL_URL%
)
echo.
echo  Commandes PM2 :
echo    pm2 status              - Etat des processus
echo    pm2 logs immeit         - Logs serveur
echo    pm2 logs immeit-tunnel  - Logs tunnel
echo    pm2 restart immeit      - Redemarrer le serveur
echo.
