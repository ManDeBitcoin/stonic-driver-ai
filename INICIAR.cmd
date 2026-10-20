@echo off
setlocal
cd /d "%~dp0"
title Uber Driver AI
where node >nul 2>&1
if errorlevel 1 goto missing
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>22||(a===22&&b>=18)?0:1)"
if errorlevel 1 goto missing
if exist "node_modules\.bin\vite.cmd" goto run
echo Preparando Uber Driver AI por primera vez. Se necesita internet...
call npm.cmd ci
if errorlevel 1 goto failed
:run
echo.
echo Uber Driver AI se abrira en tu navegador.
echo Conserva esta ventana abierta mientras lo utilizas.
echo Para detenerlo, presiona Ctrl+C y confirma si Windows lo solicita.
echo.
call npm.cmd run dev -- --open
if errorlevel 1 goto failed
exit /b 0
:missing
echo Instala Node.js LTS desde https://nodejs.org/en/download y vuelve a intentarlo.
echo Se requiere Node 22.18 o una version posterior.
pause
exit /b 1
:failed
echo.
echo No se pudo iniciar. Copia el mensaje de error.
echo Si el puerto 5173 esta ocupado, revisa si Uber Driver AI ya esta abierto.
echo Usa siempre http://127.0.0.1:5173 para conservar el mismo almacen de datos.
pause
exit /b 1
