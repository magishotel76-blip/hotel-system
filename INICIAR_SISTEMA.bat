@echo off
TITLE Hotel Joya Amazonica - Sistema Activado
echo ======================================================
echo    JOYA AMAZONICA - INICIANDO SISTEMA HOTELERO
echo ======================================================
echo.
echo Iniciando Backend y Frontend...
echo.

:: Start concurrently (if installed) or manually
cd /d "%~dp0"
npm run dev

pause
