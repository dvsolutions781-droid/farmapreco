@echo off
title FarmaPrego - Iniciando sistema...
color 0B

echo.
echo  ==================================================
echo    FarmaPreco - Sistema de Cotacao Farmaceutica
echo  ==================================================
echo.

:: Verifica se Node.js esta instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo  [ERRO] Node.js nao encontrado!
    echo  Instale em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo  Node.js detectado: %NODE_VER%
echo.

:: Instala dependencias do backend
echo  [1/4] Instalando dependencias do backend...
cd /d "C:\Users\MB\Desktop\Sistemas\farmapreco\farmapreco\backend"
call npm install --silent
if %errorlevel% neq 0 (
    color 0C
    echo  [ERRO] Falha ao instalar backend.
    pause
    exit /b 1
)
echo  [OK] Backend pronto.
echo.

:: Instala dependencias do frontend
echo  [2/4] Instalando dependencias do frontend...
cd /d "C:\Users\MB\Desktop\Sistemas\farmapreco\farmapreco\frontend"
call npm install --silent --legacy-peer-deps
if %errorlevel% neq 0 (
    color 0C
    echo  [ERRO] Falha ao instalar frontend.
    pause
    exit /b 1
)
echo  [OK] Frontend pronto.
echo.

echo  [3/4] Iniciando servidores...
echo.

:: Abre backend em janela separada
start "FarmaPreco - BACKEND (porta 3001)" cmd /k "color 0A && title FarmaPreco - BACKEND && cd /d "C:\Users\MB\Desktop\Sistemas\farmapreco\farmapreco\backend" && echo. && echo  [BACKEND] http://localhost:3001 && echo. && npm run dev"

timeout /t 2 /nobreak >nul

:: Abre frontend em janela separada
start "FarmaPreco - FRONTEND (porta 3000)" cmd /k "color 0B && title FarmaPreco - FRONTEND && cd /d "C:\Users\MB\Desktop\Sistemas\farmapreco\farmapreco\frontend" && echo. && echo  [FRONTEND] http://localhost:3000 && echo. && npm run dev"

:: Aguarda frontend subir antes do tunnel
timeout /t 5 /nobreak >nul

:: Abre tunnel HTTPS para acesso pelo celular
start "FarmaPreco - TUNNEL CELULAR" cmd /k "color 0E && title FarmaPreco - TUNNEL && echo. && echo  Aguarde... gerando link HTTPS para celular && echo. && npx localtunnel --port 3000"

timeout /t 4 /nobreak >nul

echo  [4/4] Abrindo navegador...
start "" "http://localhost:3000"

echo.
echo  ==================================================
echo    SISTEMA INICIADO
echo  ==================================================
echo.
echo   Computador: http://localhost:3000
echo   Celular:    veja a janela amarela "TUNNEL CELULAR"
echo               (ex: https://xxxxx.loca.lt)
echo.
echo  Na janela do tunnel, copie o link https://
echo  e abra no celular. Aceite o aviso se aparecer.
echo.
echo  ==================================================
echo.
pause
