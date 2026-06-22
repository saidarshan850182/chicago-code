@echo off
REM ===== Chicago Code - quick deploy to GitHub Pages =====
cd /d "%~dp0"

set "msg=%*"
if "%msg%"=="" set "msg=Update site"

echo.
echo Deploying Chicago Code...
echo Commit message: %msg%
echo.

git add .
git commit -m "%msg%"
git push

echo.
echo Done. Live at https://saidarshan850182.github.io/chicago-code/
echo (changes appear in about a minute)
echo.
pause
