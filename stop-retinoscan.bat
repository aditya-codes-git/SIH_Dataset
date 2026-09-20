@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo           RETINOSCAN AI — STOPPING SERVICES (SIH 2026)
echo ==============================================================================
echo.

echo [STOP] Terminating active processes on ports 5000 (Backend) and 5173 (Frontend)...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ports = @(5000, 5173); $killed = 0; foreach ($p in $ports) { $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; foreach ($c in $conns) { $pidToKill = $c.OwningProcess; if ($pidToKill -and $pidToKill -ne 0) { Write-Host ('  [KILL] Stopping process on port ' + $p + ' (PID: ' + $pidToKill + ')...'); Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue; $killed++ } } }; if ($killed -eq 0) { Write-Host '  [INFO] No active processes found on ports 5000 or 5173.' } else { Write-Host '  [DONE] All RetinoScan AI services cleanly terminated.' }"

echo.
echo ==============================================================================
echo All RetinoScan AI servers have been stopped.
echo ==============================================================================
echo.
pause
