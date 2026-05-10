@echo off
echo Stopping Dr.Plant Backend Services...

echo Closing service terminal windows...
taskkill /FI "WINDOWTITLE eq *Gateway*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq *Users*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq *Farms*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq *Diagnostics*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq *Marketplace*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq *Community*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq *Chat*" /T /F >nul 2>&1

echo Ensuring all associated ports (8001-8012) are freed...
powershell -Command "8001, 8002, 8003, 8004, 8005, 8006, 8007, 8011, 8012 | ForEach-Object { $port = $_; try { $pids = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique; if ($pids) { foreach ($pid in $pids) { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } } } catch {} }"

echo All services successfully stopped!
timeout /t 3 >nul
