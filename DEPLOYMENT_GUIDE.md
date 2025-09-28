# Barber POS System - Deployment Guide for Pos1.ens.eg

## Overview

This guide will help you deploy the Barber POS system to the production domain `https://Pos1.ens.eg`.

## Prerequisites

- Node.js (v18 or higher)
- SQL Server database access
- Domain configured to point to your server
- SSL certificate for HTTPS

## Configuration Changes Made

### 1. Frontend Configuration

- Updated API base URL to use production domain
- Added environment-based configuration
- Optimized build settings for production

### 2. Backend Configuration

- Added CORS support for production domain
- Created production environment file
- Updated server configuration

## Deployment Steps

### 1. Build the Frontend

```bash
# Install dependencies
npm install

# Build for production
npm run build:prod
```

### 2. Configure Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy production environment file
cp config.prod.env .env
```

### 3. Database Configuration

Ensure your SQL Server is accessible and the database `BarberPos` exists with the following configuration:

- Server: 172.96.141.4
- Database: BarberPos
- User: sa
- Password: M@m12301230
- Port: 1433

### 4. Start the Backend Server

```bash
# Start in production mode
npm run start:prod
```

### 5. Serve the Frontend

The built frontend files will be in the `dist/` directory. Serve these files using:

- Nginx
- Apache
- Or any static file server

## Environment Variables

### Frontend (.env)

```env
NODE_ENV=production
VITE_API_URL=https://pos1.ens.eg/api
```

### Backend (config.prod.env)

```env
NODE_ENV=production
PORT=3001
DB_SERVER=172.96.141.4
DB_DATABASE=BarberPos
DB_USER=sa
DB_PASSWORD=M@m12301230
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
FRONTEND_URL=https://Pos1.ens.eg
API_URL=https://pos1.ens.eg/api
```

## Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name Pos1.ens.eg;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name Pos1.ens.eg;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Serve frontend files
    location / {
        root /path/to/your/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Considerations

1. **SSL Certificate**: Ensure you have a valid SSL certificate for HTTPS
2. **Database Security**: Consider using environment variables for sensitive data
3. **CORS**: The backend is configured to allow requests from your domain
4. **Firewall**: Ensure only necessary ports are open

## Monitoring

### Health Check

- Backend health: `https://pos1.ens.eg/api/health`
- Frontend: `https://Pos1.ens.eg`

### Logs

- Backend logs: Check console output or configure logging
- Frontend logs: Browser developer tools

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the domain is added to CORS origins
2. **Database Connection**: Verify SQL Server is accessible
3. **SSL Issues**: Check certificate configuration
4. **Build Issues**: Ensure all dependencies are installed

### Testing

1. Test the health endpoint: `curl https://pos1.ens.eg/api/health`
2. Test the frontend: Open `https://Pos1.ens.eg` in browser
3. Test API connectivity from frontend

## Default Credentials

- Admin: username: `admin`, password: `admin123`
- Employee: username: `employee`, password: `password123`
- Manager: username: `manager`, password: `password123`

## Support

For issues or questions, check the logs and ensure all services are running properly.
