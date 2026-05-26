@echo off
cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║      IMMEIT - Mode Production           ║
echo  ╠══════════════════════════════════════════╣
echo  ║  Deploiement en cours...                ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Installation des dependances
cd server
call npm install 2>nul
cd ..

:: Démarrage du serveur Node.js avec PM2
cd server
call pm2 start ecosystem.config.cjs --update-env 2>nul
call pm2 save
cd ..

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║      IMMEIT - Production OK              ║
echo  ╠══════════════════════════════════════════╣
echo  ║  Serveur: http://localhost:3001          ║
echo  ║  Admin  : http://localhost:3001/admin    ║
echo  ╠══════════════════════════════════════════╣
if exist "server\.tunnel-url" (
    set /p TUNNEL_URL=<"server\.tunnel-url"
    echo  ║  Tunnel : %TUNNEL_URL%
    echo  ╠══════════════════════════════════════════╣
)
echo  ║  Commandes :                             ║
echo  ║  pm2 status       - Etat PM2             ║
echo  ║  pm2 logs immeit  - Logs Node.js         ║
echo  ║  pm2 stop immeit  - Arreter Node.js      ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
