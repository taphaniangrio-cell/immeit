@echo off
cd /d "%~dp0"

set CADDY_PATH=%USERPROFILE%\AppData\Local\Microsoft\WinGet\Packages\CaddyServer.Caddy_Microsoft.Winget.Source_8wekyb3d8bbwe\caddy.exe

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

:: Démarrage de Caddy (reverse proxy HTTPS)
start "Caddy IMMEIT" "%CADDY_PATH%" run --config "%~dp0Caddyfile"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║      IMMEIT - Production OK              ║
echo  ╠══════════════════════════════════════════╣
echo  ║  Local  : http://localhost:3001          ║
echo  ║  Site   : https://immeit.com             ║
echo  ║  Admin  : http://localhost:3001/admin    ║
echo  ╠══════════════════════════════════════════╣
echo  ║  Commandes :                             ║
echo  ║  pm2 status       - Etat Node.js         ║
echo  ║  pm2 logs immeit  - Logs Node.js         ║
echo  ║  pm2 stop immeit  - Arreter Node.js      ║
echo  ╚══════════════════════════════════════════╝
echo.
pause
