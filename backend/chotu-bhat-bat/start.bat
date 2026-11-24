@echo off
title Chotu AI Bot - FastAPI Service (Port 8083)
echo ===================================================
echo Starting Chotu AI Assistant (FastAPI + Gemini)
echo ===================================================

cd /d "%~dp0"

echo Installing/checking Python dependencies...
python -m pip install -r requirements.txt

echo.
echo Starting FastAPI Uvicorn Server on port 8083...
python -m uvicorn main:app --host 0.0.0.0 --port 8083 --reload
pause
