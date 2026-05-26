Set ws = CreateObject("WScript.Shell")
ws.Run "cmd /c pm2 resurrect 2>nul", 0, False
