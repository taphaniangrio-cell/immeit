@echo off
cd /d "%~dp0server"
echo Installation des dependances...
call npm install 2>nul
echo Demarrage du serveur IMMEIT avec PM2...
pm2 start ecosystem.config.cjs --update-env
pm2 save
echo.
echo  ==============================================
echo  ^|         IMMEIT - Serveur PM2             ^|
echo  ==============================================
echo  ^|  Site : http://localhost:3001            ^|
echo  ^|  Admin: http://localhost:3001/admin      ^|
echo  ==============================================
echo  ^|  Commandes :                             ^|
echo  ^|  pm2 status        - Etat du serveur     ^|
echo  ^|  pm2 logs immeit   - Voir les logs       ^|
echo  ^|  pm2 restart immeit- Redemarrer          ^|
echo  ^|  pm2 stop immeit   - Arreter             ^|
echo  ==============================================
echo.
start http://localhost:3001
pause
