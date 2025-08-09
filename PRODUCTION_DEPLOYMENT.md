# Einkaufsliste Production Deployment Guide

## Prerequisites

- Node.js 18+
- Python 3.8+
- PM2 process manager
- Git

## Quick Start

1. **Clone and Setup**

   ```bash
   git clone https://github.com/ochtii/einkaufsliste.git
   cd einkaufsliste
   chmod +x *.sh
   ./install.sh
   ```

2. **Start Services**

   ```bash
   ./start-all-services.sh
   ```

3. **Deploy Updates**
   ```bash
   ./deploy.sh
   ```

## Service Management

- **Start**: `./manage.sh start`
- **Stop**: `./manage.sh stop`
- **Restart**: `./manage.sh restart`
- **Status**: `./manage.sh status`
- **Logs**: `./manage.sh logs`
- **Monitor**: `./manage.sh monitor`
- **Health Check**: `./manage.sh health`
- **Backup DB**: `./manage.sh backup`
- **Update**: `./manage.sh update`

## Application URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Admin Panel**: http://localhost:8000/admin

## Default Credentials

- **Admin**: admin / [Environment Variable ADMIN_PASSWORD]
- **Test User**: test / test123

## Environment Variables

Create `.env` files in each directory:

### Backend (.env)

```
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
PORT=4000
```

### API (.env)

```
ADMIN_PASSWORD=your-admin-password-here
PORT=8000
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin API
    location /admin/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database Backup

Automatic backups are created during deployment. Manual backup:

```bash
./manage.sh backup
```

## Troubleshooting

### Services not starting

```bash
pm2 kill
pm2 start ecosystem.config.js
```

### Database issues

Check logs:

```bash
pm2 logs einkaufsliste-backend
```

### Port conflicts

Change ports in `ecosystem.config.js`

## Security Considerations

1. Change default passwords
2. Set strong JWT secret
3. Use HTTPS in production
4. Configure firewall
5. Regular security updates
