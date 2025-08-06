@echo off
REM =============================================================================
REM GitHub Pages Setup Script for Einkaufsliste Demo (Windows)
REM =============================================================================

echo 🚀 Setting up GitHub Pages deployment for Einkaufsliste...
echo.

REM Check if we're in the right directory
if not exist "frontend\package.json" (
    echo ❌ Error: Please run this script from the root of the einkaufsliste repository
    pause
    exit /b 1
)

echo 📋 GitHub Pages Setup Checklist
echo.

REM 1. Check if GitHub Actions workflow exists
if exist ".github\workflows\deploy-pages.yml" (
    echo ✅ GitHub Actions workflow found
) else (
    echo ❌ GitHub Actions workflow missing
    echo    Please ensure .github/workflows/deploy-pages.yml exists
)

REM 2. Check if demo files exist
if exist "frontend\public\demo.html" if exist "frontend\public\demo-config.js" (
    echo ✅ Demo files found
) else (
    echo ❌ Demo files missing
    echo    Please ensure demo.html and demo-config.js exist in frontend/public/
)

REM 3. Check package.json homepage
findstr /c:"homepage" frontend\package.json >nul
if %errorlevel%==0 (
    echo ✅ Homepage configured in package.json
) else (
    echo ⚠️  Homepage not configured in package.json
    echo    Please manually add: "homepage": "https://ochtii.github.io/einkaufsliste"
)

echo.
echo 🔧 Manual Setup Steps
echo.

echo 1. 🌐 Enable GitHub Pages:
echo    - Go to https://github.com/ochtii/einkaufsliste/settings/pages
echo    - Under 'Source', select 'GitHub Actions'
echo    - Save the settings
echo.

echo 2. 🔑 Configure Repository Permissions:
echo    - Go to https://github.com/ochtii/einkaufsliste/settings/actions
echo    - Under 'Workflow permissions', select 'Read and write permissions'
echo    - Check 'Allow GitHub Actions to create and approve pull requests'
echo    - Save the settings
echo.

echo 3. 🚀 Trigger Deployment:
echo    - Push any changes to the main branch
echo    - Or go to Actions tab and manually run 'Deploy to GitHub Pages'
echo    - Monitor the workflow progress
echo.

echo 4. 🌍 Überprüfe dein Deployment:
echo    Nach 5-10 Minuten sollten diese URLs funktionieren:
echo    • Landing Page: https://ochtii.github.io/einkaufsliste (Hauptseite)
echo    • React App: https://ochtii.github.io/einkaufsliste/app.html
echo    • Demo Info: https://ochtii.github.io/einkaufsliste/demo.html
echo.

echo 📊 Optional: Backend Deployment
echo.

echo For full functionality, deploy the backend to one of these platforms:
echo • Railway.app (Recommended)
echo • Heroku  
echo • Render.com
echo.
echo See DEMO_DEPLOYMENT.md for detailed backend setup instructions.
echo.

echo 🔍 Verification Steps
echo.

echo After deployment, verify these features work:
echo • ✅ Demo landing page loads
echo • ✅ React application starts
echo • ✅ Demo login (demo/demo123) works
echo • ✅ Sample data is loaded
echo • ✅ Export functionality works
echo • ✅ Responsive design on mobile
echo.

echo 🎉 GitHub Pages setup complete!
echo.
echo 💡 Tips:
echo • Check the Actions tab for deployment status
echo • It may take 5-10 minutes for the first deployment
echo • Clear browser cache if you see old content
echo • Check browser console for any JavaScript errors
echo.

echo 📚 Documentation:
echo • README.md - General project information
echo • DEMO_DEPLOYMENT.md - Detailed deployment guide
echo • CONTRIBUTING.md - Contributing guidelines
echo.

echo Happy coding! 🚀
echo.
pause
