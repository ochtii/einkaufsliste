# Einkaufsliste Demo Deployment

## Quick Demo Setup

For demo purposes or development environment.

### Prerequisites
- Node.js 18+
- Python 3.8+

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/ochtii/einkaufsliste.git
   cd einkaufsliste
   ```

2. **Install Dependencies**
   ```bash
   # Backend
   cd backend && npm install && cd ..
   
   # Frontend  
   cd frontend && npm install && cd ..
   
   # API
   cd api && pip install -r requirements.txt && cd ..
   ```

3. **Start Services Manually**
   
   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm start
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm start
   ```
   
   **Terminal 3 - API:**
   ```bash
   cd api
   python admin_server.py
   ```

### Demo URLs

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **Admin Panel**: http://localhost:8000/admin

### Demo Credentials

- **Admin**: admin / admin123
- **Demo User**: demo / demo123

### Demo Features

- ✅ User registration and login
- ✅ Shopping list management
- ✅ Article categories
- ✅ Favorite items
- ✅ Admin dashboard
- ✅ Real-time updates
- ✅ Responsive design

### Demo Data

The application includes pre-populated demo data:
- Sample users
- Example shopping lists
- Standard product categories
- Common grocery items

### Notes

- Demo mode uses local SQLite database
- No data persistence between restarts in demo mode
- Perfect for testing and demonstration purposes
- Not suitable for production use

### Converting to Production

To convert demo to production:
1. Follow `PRODUCTION_DEPLOYMENT.md`
2. Configure environment variables
3. Set up proper database backup
4. Configure reverse proxy (nginx)
5. Enable HTTPS
