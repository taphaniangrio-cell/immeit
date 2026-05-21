@echo off
cd /d "%~dp0server"
echo Installation des dependances...
call npm install 2>nul
cls
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         IMMEIT - Serveur                 ║
echo  ╠══════════════════════════════════════════╣
echo  ║  Site : http://localhost:3001            ║
echo  ║  Admin: http://localhost:3001/admin      ║
echo  ╠══════════════════════════════════════════╣
echo  ║  Appuyez sur Ctrl+C pour arreter.        ║
echo  ╚══════════════════════════════════════════╝
echo.
start http://localhost:3001
node server.js
pause
