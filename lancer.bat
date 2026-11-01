@echo off
rem Regenere les donnees a partir des CSV puis ouvre l'application
cd /d "%~dp0"
python scripts\preparer_donnees.py || pause
start "" "app\index.html"
