@echo off
rem Runs ATC Memo without building an .exe. Needs Node.js (https://nodejs.org) and internet, the first time only.
cd /d "%~dp0"
if not exist node_modules call npm install
call npm start
