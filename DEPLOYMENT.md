# velora Deployment Guide

## Prerequisites
- VPS server (Linode, DigitalOcean, or Hetzner)
- Domain: velorahub.chat
- SSH access to server

---

## Step 1: Sign Up for VPS

**Recommended: Linode**
1. Go to **linode.com**
2. Create account
3. Create a Linode:
   - **Distribution:** Ubuntu 22.04 LTS
   - **Region:** Choose closest to you
   - **Plan:** Nanode 1GB (~$5/month)
   - **SSH Key:** Add your public key (optional)

---

## Step 2: Connect to Server

```bash
ssh root@YOUR_SERVER_IP
```

Update system:
```bash
apt update && apt upgrade -y
```

---

## Step 3: Install Required Software

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
npm install -g pm2

# Install nginx
apt install -y nginx
```

---

## Step 4: Set Up PostgreSQL

```bash
# Start PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In postgres console:
CREATE USER velora WITH PASSWORD 'your_secure_password';
CREATE DATABASE velora_db OWNER velora;
\q
```

---

## Step 5: Deploy the App

```bash
# Create app directory
mkdir -p /var/www/velora
cd /var/www/velora

# Clone your code (you'll need to push to GitHub first)
git clone https://github.com/YOUR_USERNAME/velora.git .

# Install dependencies
npm install

# Build the app
npm run build

# Set environment variables
cp .env.example .env
# Edit .env with your actual values
```

---

## Step 6: Configure Environment Variables

Edit `/var/www/velora/.env`:

```env
DATABASE_URL="postgresql://velora:YOUR_PASSWORD@localhost:5432/velora_db"
NEXTAUTH_URL="https://velorahub.chat"
NEXTAUTH_SECRET="generate_a_secure_random_string"
FACEBOOK_APP_ID="1296094275774076"
FACEBOOK_APP_SECRET="YOUR_FB_SECRET"
FACEBOOK_WEBHOOK_VERIFY_TOKEN="messagehub_verify_token_2026"
ENCRYPTION_KEY="32_char_random_string_here"
```

---

## Step 7: Start with PM2

```bash
cd /var/www/velora
pm2 start npm --name "velora" -- run start
pm2 save
pm2 startup
```

---

## Step 8: Configure Nginx

Create `/etc/nginx/sites-available/velora`:

```nginx
server {
    listen 80;
    server_name velorahub.chat www.velorahub.chat;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
ln -s /etc/nginx/sites-available/velora /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

---

## Step 9: Set Up SSL (Let's Encrypt)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d velorahub.chat -d www.velorahub.chat
```

Follow the prompts. SSL will auto-renew!

---

## Step 10: Point Domain

In Namecheap DNS:
- Add A Record: `@` → YOUR_SERVER_IP
- Add A Record:`www` → YOUR_SERVER_IP

---

## Step 11: Test

Visit **https://velorahub.chat**

---

## Maintenance Commands

```bash
# View logs
pm2 logs velora

# Restart app
pm2 restart velora

# Update code
cd /var/www/velora
git pull
npm run build
pm2 restart velora
```

---

## Troubleshooting

### Database connection failed
- Check PostgreSQL is running: `systemctl status postgresql`
- Verify credentials in `.env`

### App not loading
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs velora`

### SSL issues
- Run: `certbot renew --dry-run`

---

## Cost Summary

| Item | Monthly Cost |
|------|-------------|
| VPS (Linode Nanode) | ~$5 |
| Domain (velorahub.chat) | ~$10 |
| **Total** | **~$15/month**