# Deployment Checklist for pos1.ens.eg

## ✅ Fixed Issues

1. **API URL Configuration**: Fixed frontend API URL to use correct port (3001)
2. **CORS Configuration**: Removed duplicate CORS entry
3. **Port Configuration**: Standardized backend port to 3001
4. **Database Configuration**: Verified SQL Server connection settings

## 🚀 Deployment Steps

### 1. Build Frontend

```bash
npm run build:prod
```

### 2. Configure Backend

```bash
cd backend
cp config.prod.env .env
npm install
```

### 3. Start Backend

```bash
NODE_ENV=production node server.js
```

### 4. Serve Frontend

Serve the `dist/` folder using Nginx or Apache

## 🔧 Nginx Configuration Required

```nginx
server {
    listen 80;
    server_name pos1.ens.eg;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name pos1.ens.eg;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Serve frontend files
    location / {
        root /path/to/your/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:4007;
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

## ✅ Verification Steps

1. **Health Check**: `https://pos1.ens.eg/api/health`
2. **Frontend**: `https://pos1.ens.eg`
3. **Database Connection**: Check backend logs
4. **CORS**: Test API calls from frontend

## 🔑 Default Credentials

- Admin: `admin` / `admin123`
- Employee: `employee` / `password123`
- Manager: `manager` / `password123`

## ⚠️ Important Notes

- Ensure SSL certificate is properly configured
- Database server (172.96.141.4) must be accessible
- Backend must run on port 3001
- Frontend must be served from the `dist/` directory
