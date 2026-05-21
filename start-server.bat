@echo off
cd /d "%~dp0server"
echo Installation des dependances...
call npm install
echo.
echo Demarrage du serveur IMMEIT sur http://localhost:3001
echo Appuyez sur Ctrl+C pour arreter.
node server.js
pause
