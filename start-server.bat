@echo off
cd /d "%~dp0server"
echo Installation des dependances...
call npm install
echo.
echo Demarrage du serveur IMMEIT
echo   Site : http://localhost:3001
echo   API  : http://localhost:3001/api/contact
echo Appuyez sur Ctrl+C pour arreter.
node server.js
pause
