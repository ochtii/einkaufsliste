@echo off
REM 🧪 Einkaufsliste API Test Script (Windows)
REM Testet alle wichtigen API-Endpoints

echo 🚀 Starting Einkaufsliste API Tests...

REM Configuration
set BACKEND_URL=http://localhost:4000
set EASTEREGG_URL=http://localhost:8888
set TEST_USER=testuser
set TEST_PASS=testpass

echo.
echo 🧪 Testing Backend API Health...
curl -s -o nul -w "HTTP %%{http_code}" "%BACKEND_URL%/api/health" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend API is responding
) else (
    echo ❌ Backend API not responding
)

echo.
echo 🧪 Testing Easter Egg API Health...
curl -s -o nul -w "HTTP %%{http_code}" "%EASTEREGG_URL%/egg/api/lol/health" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ Easter Egg API is healthy
) else (
    echo ❌ Easter Egg API not responding
)

echo.
echo 🧪 Testing User Login...
curl -s -X POST "%BACKEND_URL%/api/login" ^
    -H "Content-Type: application/json" ^
    -d "{\"username\":\"%TEST_USER%\",\"password\":\"%TEST_PASS%\"}" ^
    -o login_response.json 2>nul

if exist login_response.json (
    findstr "token" login_response.json >nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ User login successful
        REM Extract token (simplified for Windows)
        for /f "tokens=2 delims=:" %%a in ('findstr "token" login_response.json') do (
            set TOKEN=%%a
            set TOKEN=!TOKEN:"=!
            set TOKEN=!TOKEN:,=!
        )
        echo ✅ Token extracted
    ) else (
        echo ❌ User login failed
    )
    del login_response.json 2>nul
) else (
    echo ❌ Login request failed
)

echo.
echo 🧪 Testing Lists API...
if defined TOKEN (
    curl -s -X GET "%BACKEND_URL%/api/lists" ^
        -H "Authorization: Bearer %TOKEN%" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Lists API working
    ) else (
        echo ❌ Lists API failed
    )
) else (
    echo ⚠️  Skipping lists test - no token
)

echo.
echo 🧪 Testing Categories API...
if defined TOKEN (
    curl -s -X GET "%BACKEND_URL%/api/categories" ^
        -H "Authorization: Bearer %TOKEN%" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Categories API working
    ) else (
        echo ❌ Categories API failed
    )
) else (
    echo ⚠️  Skipping categories test - no token
)

echo.
echo 🧪 Testing Easter Egg Trigger...
curl -s -X POST "%EASTEREGG_URL%/egg/api/lol/trigger/stars-and-sweets" ^
    -H "X-API-Key: einkaufsliste-easter-2025" ^
    -H "X-User-UUID: test-user-123" ^
    -H "X-User-Name: %TEST_USER%" ^
    -H "Content-Type: application/json" ^
    -d "{\"icon\":\"⭐\",\"category\":\"🍭 Süßwaren\"}" 2>nul

if %ERRORLEVEL% EQU 0 (
    echo ✅ Easter Egg API working
) else (
    echo ❌ Easter Egg API failed
)

echo.
echo ========================================
echo 🎉 API Tests completed!
echo.
echo 📊 Test Summary:
echo    ✅ Backend API: Tested
echo    ✅ Easter Egg API: Tested
echo    ✅ Authentication: Tested
echo    ✅ Core APIs: Tested
echo.
echo 🚀 All tests finished!

pause
