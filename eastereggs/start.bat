@echo off
echo Starting Easter Egg API on port 8888...

REM Install dependencies
pip install -r requirements.txt

REM Run the API
python app.py

pause
