@echo off
echo Stopping Stride Docker services...
cd /d "%~dp0"
docker compose down
echo Done.
pause
