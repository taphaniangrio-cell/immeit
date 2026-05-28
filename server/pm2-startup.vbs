' IMMEIT Server - Demarrage automatique
' Utilise start-immeit.ps1 qui gere le serveur et le tunnel
Set ws = CreateObject("WScript.Shell")
ws.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & Replace(WScript.ScriptFullName, "pm2-startup.vbs", "start-immeit.ps1") & """", 0, False
