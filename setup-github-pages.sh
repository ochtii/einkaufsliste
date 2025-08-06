#!/bin/bash

# =============================================================================
# GitHub Pages Setup Script for Einkaufsliste Demo
# =============================================================================

echo "🚀 Setting up GitHub Pages deployment for Einkaufsliste..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the root of the einkaufsliste repository"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 GitHub Pages Setup Checklist${NC}"
echo ""

# 1. Check if GitHub Actions workflow exists
if [ -f ".github/workflows/deploy-pages.yml" ]; then
    echo -e "${GREEN}✅ GitHub Actions workflow found${NC}"
else
    echo -e "${RED}❌ GitHub Actions workflow missing${NC}"
    echo "   Please ensure .github/workflows/deploy-pages.yml exists"
fi

# 2. Check if demo files exist
if [ -f "frontend/public/demo.html" ] && [ -f "frontend/public/demo-config.js" ]; then
    echo -e "${GREEN}✅ Demo files found${NC}"
else
    echo -e "${RED}❌ Demo files missing${NC}"
    echo "   Please ensure demo.html and demo-config.js exist in frontend/public/"
fi

# 3. Check package.json homepage
if grep -q '"homepage": "https://ochtii.github.io/einkaufsliste"' frontend/package.json; then
    echo -e "${GREEN}✅ Homepage configured in package.json${NC}"
else
    echo -e "${YELLOW}⚠️  Homepage not configured${NC}"
    echo "   Adding homepage to package.json..."
    
    # Backup original package.json
    cp frontend/package.json frontend/package.json.backup
    
    # Add homepage field
    sed -i '3i\  "homepage": "https://ochtii.github.io/einkaufsliste",' frontend/package.json
    
    echo -e "${GREEN}✅ Homepage added to package.json${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Manual Setup Steps${NC}"
echo ""

echo "1. 🌐 Enable GitHub Pages:"
echo "   - Go to https://github.com/ochtii/einkaufsliste/settings/pages"
echo "   - Under 'Source', select 'GitHub Actions'"
echo "   - Save the settings"
echo ""

echo "2. 🔑 Configure Repository Permissions:"
echo "   - Go to https://github.com/ochtii/einkaufsliste/settings/actions"
echo "   - Under 'Workflow permissions', select 'Read and write permissions'"
echo "   - Check 'Allow GitHub Actions to create and approve pull requests'"
echo "   - Save the settings"
echo ""

echo "3. 🚀 Trigger Deployment:"
echo "   - Push any changes to the main branch"
echo "   - Or go to Actions tab and manually run 'Deploy to GitHub Pages'"
echo "   - Monitor the workflow progress"
echo ""

echo "4. 🌍 Access Your Demo:"
echo "   - Frontend: https://ochtii.github.io/einkaufsliste"
echo "   - Demo Page: https://ochtii.github.io/einkaufsliste/demo.html"
echo ""

echo -e "${BLUE}📊 Optional: Backend Deployment${NC}"
echo ""

echo "For full functionality, deploy the backend to one of these platforms:"
echo "• Railway.app (Recommended)"
echo "• Heroku"
echo "• Render.com"
echo ""
echo "See DEMO_DEPLOYMENT.md for detailed backend setup instructions."
echo ""

echo -e "${BLUE}🔍 Verification Steps${NC}"
echo ""

echo "After deployment, verify these features work:"
echo "• ✅ Demo landing page loads"
echo "• ✅ React application starts"
echo "• ✅ Demo login (demo/demo123) works"
echo "• ✅ Sample data is loaded"
echo "• ✅ Export functionality works"
echo "• ✅ Responsive design on mobile"
echo ""

echo -e "${GREEN}🎉 GitHub Pages setup complete!${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "• Check the Actions tab for deployment status"
echo "• It may take 5-10 minutes for the first deployment"
echo "• Clear browser cache if you see old content"
echo "• Check browser console for any JavaScript errors"
echo ""

echo -e "${BLUE}📚 Documentation:${NC}"
echo "• README.md - General project information"
echo "• DEMO_DEPLOYMENT.md - Detailed deployment guide"
echo "• CONTRIBUTING.md - Contributing guidelines"
echo ""

echo -e "${GREEN}Happy coding! 🚀${NC}"
