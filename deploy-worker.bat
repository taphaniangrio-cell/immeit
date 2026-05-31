@echo off
echo Deploiement du Worker Cloudflare...
echo.
echo Assurez-vous d'avoir :
echo  1. Un compte Cloudflare (gratuit)
echo  2. npm install -g wrangler
echo  3. wrangler login (ou CLOUDFLARE_API_TOKEN configure)
echo.
npx wrangler deploy
echo.
if %errorlevel% equ 0 (
    echo Succes ! Le Worker est en ligne.
    echo.
    echo IMPORTANT : Mets a jour l'URL du Worker dans index.html
    echo  ligne : window.WORKER_API_URL='https://immeit-contact.workers.dev'
    echo.
    echo Pour verifier : npx wrangler list
) else (
    echo ECHEC du deploiement. Verifie que wrangler est configure.
    echo Commande : npx wrangler login
)
pause
