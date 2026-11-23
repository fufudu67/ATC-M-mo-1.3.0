@echo off
rem Builds dist\ATC-Memo.exe (portable, one file). End users then need NOTHING else installed.
rem Needs Node.js (https://nodejs.org) and Python 3 on THIS PC, once, to build. Internet required.
cd /d "%~dp0"
set CSC_IDENTITY_AUTO_DISCOVERY=false
if not exist vendor mkdir vendor
echo [1/3] SimConnect helper (simhelper.exe + SimConnect.dll)...
python -m pip install --upgrade pyinstaller SimConnect
if errorlevel 1 goto nohelper
python -m PyInstaller --onefile --distpath vendor --workpath build\tmp --specpath build\tmp simhelper.py
python -c "import SimConnect,os,shutil; shutil.copy(os.path.join(os.path.dirname(SimConnect.__file__),'SimConnect.dll'),'vendor')"
goto build
:nohelper
echo Python not available: building WITHOUT the bundled SimConnect helper (users will need Python + pip install SimConnect).
:build
echo [2/3] npm install...
call npm install
if errorlevel 1 goto fail
echo [3/3] building the app...
call npm run dist
if errorlevel 1 goto fail
echo.
echo Done: dist\ATC-Memo.exe
pause
exit /b 0
:fail
echo.
echo ERROR - the build failed. Copy the last lines above.
pause
