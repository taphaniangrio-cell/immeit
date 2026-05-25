@echo off
cd /d "%~dp0"

echo ============================================
echo   Configuration du tunnel Cloudflare stable
echo ============================================
echo.
echo Ce script va creer un tunnel permanent pour
echo exposer ton serveur IMMEIT (port 3001).
echo.
echo Prérequis :
echo   1. Domaine immeit.com chez Cloudflare
echo      (nameservers pointant vers Cloudflare)
echo   2. Compte Cloudflare avec le domaine ajouté
echo.
echo Si ce n'est pas fait :
echo   - Va sur https://dash.cloudflare.com
echo   - Ajoute immeit.com
echo   - Change les nameservers chez Amen World
echo     (ns1.amenworld.com, ns2.amenworld.com)
echo     vers ceux donnés par Cloudflare
echo.
pause
echo.

echo Étape 1 : Connexion à Cloudflare...
echo Une fenêtre navigateur va s'ouvrir.
echo Connecte-toi et autorise l'application.
cloudflared tunnel login
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR : Connexion echouee.
    pause
    exit /b 1
)
echo Connexion reussie !
echo.

echo Étape 2 : Création du tunnel...
cloudflared tunnel create immeit-api
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR : Creation du tunnel echouee.
    pause
    exit /b 1
)
echo Tunnel cree !
echo.

echo Étape 3 : Création du fichier de configuration...
set TUNNEL_ID=
for /f "tokens=*" %%a in ('dir /b "%USERPROFILE%\.cloudflared\*.json" 2^>nul') do set TUNNEL_ID=%%~na

if "%TUNNEL_ID%"=="" (
    echo ERREUR : Tunnel ID introuvable.
    pause
    exit /b 1
)

echo Tunnel ID : %TUNNEL_ID%

(
echo tunnel: %TUNNEL_ID%
echo credentials-file: %USERPROFILE%\.cloudflared\%TUNNEL_ID%.json
echo.
echo ingress:
echo   - hostname: api.immeit.com
echo     service: http://localhost:3001
echo   - service: http_status:404
) > config.yml

echo Fichier config.yml cree.
echo.

echo Étape 4 : Configuration DNS...
echo Ajoute un enregistrement DNS dans Cloudflare :
echo   Type: CNAME
echo   Nom: api
echo   Cible: %TUNNEL_ID%.cfargotunnel.com
echo   Proxy: Active (orange cloud)
echo.
echo Puis modifie server/.env :
echo   Ajoute FRONTEND_URL=https://api.immeit.com
echo.
pause
echo.

echo Étape 5 : Test du tunnel...
echo Lance : cloudflared tunnel run immeit-api
echo.
echo Pour un démarrage automatique avec PM2 :
echo   pm2 start cloudflared -- tunnel run immeit-api
echo.
echo ============================================
echo   Configuration terminee !
echo ============================================
echo.
echo Resume :
echo   Site    : https://www.immeit.com (GitHub Pages)
echo   API     : https://api.immeit.com (Cloudflare Tunnel)
echo   Serveur : http://localhost:3001
echo.
echo Le formulaire enverra vers /api/contact qui
echo ira vers api.immeit.com automatiquement.
echo.
pause
