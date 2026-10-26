# 🚀 The Mad Story — cPanel Deployment Guide for themadstory.com

This guide provides the exact configuration for hosting:
- **Frontend SPA**: `https://themadstory.com` (and `https://www.themadstory.com`)
- **Backend REST API**: `https://api.themadstory.com`
- **Database**: SQLite in production (`db.sqlite3` with WAL concurrency)
- **Media**: Cloudflare R2 (or local fallback)

---

## 🏗️ Architecture & Folder Structure on cPanel

```
/home/username/
├── public_html/                     <-- Frontend files from frontend/dist/ (themadstory.com)
│   ├── .htaccess
│   ├── index.html
│   └── assets/
│
└── madstory_backend/                <-- Backend files (api.themadstory.com)
    ├── .env
    ├── db.sqlite3                   <-- SQLite Database (WAL mode enabled)
    ├── passenger_wsgi.py
    ├── manage.py
    ├── config/
    ├── core/
    └── staticfiles/
```

---

## Step 1: Create Subdomain for the API

1. In cPanel, navigate to **Domains** -> **Domains** (or **Subdomains**).
2. Click **Create A New Domain**:
   - **Domain**: `api.themadstory.com`
   - **Document Root**: `/home/username/madstory_backend` *(or keep it linked to your Python app directory)*
3. Enable **SSL / HTTPS** for both `themadstory.com` and `api.themadstory.com` via **cPanel SSL/TLS Status** (AutoSSL / Let's Encrypt).

---

## Step 2: Set Up Python Application in cPanel

1. In cPanel, open **Setup Python App**.
2. Click **Create Application**:
   - **Python Version**: Select **3.11** or **3.12**.
   - **Application root**: `madstory_backend`
   - **Application URL**: `api.themadstory.com`
   - **Application startup file**: `passenger_wsgi.py`
   - **Application Entry point**: `application`
3. Click **Create**.
4. Note the virtual environment activation command at the top of the page. It will look like:
   ```bash
   source /home/username/virtualenv/madstory_backend/3.11/bin/activate && cd /home/username/madstory_backend
   ```

---

## Step 3: Upload Backend Files & SQLite Database

1. In cPanel **File Manager**, navigate to `/home/username/madstory_backend/`.
2. Upload the contents of your local `backend/` folder into `madstory_backend/`:
   - `passenger_wsgi.py`
   - `manage.py`
   - `config/`
   - `core/`
   - **`db.sqlite3`** *(Uploading your local file ensures all your current categories, hero slides, seeded articles, and admin credentials are ready instantly!)*
3. **Permissions for SQLite WAL mode**:
   - Directory `/home/username/madstory_backend/`: set to **755** (or **775**)
   - File `/home/username/madstory_backend/db.sqlite3`: set to **644** (or **664**)
4. Create the file `/home/username/madstory_backend/.env`:
   ```ini
   DJANGO_SECRET_KEY=generate_a_random_50_character_secret_key_here
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=themadstory.com,www.themadstory.com,api.themadstory.com,localhost

   # CORS & CSRF Origins
   CORS_ALLOWED_ORIGINS=https://themadstory.com,https://www.themadstory.com
   CSRF_TRUSTED_ORIGINS=https://themadstory.com,https://www.themadstory.com,https://api.themadstory.com

   # Cloudflare R2 Media Storage (Optional)
   CLOUDFLARE_R2_ACCOUNT_ID=
   CLOUDFLARE_R2_ACCESS_KEY_ID=
   CLOUDFLARE_R2_SECRET_ACCESS_KEY=
   CLOUDFLARE_R2_BUCKET_NAME=madstory-media
   CLOUDFLARE_R2_CUSTOM_DOMAIN=media.themadstory.com
   ```

---

## Step 4: Install Dependencies & Collect Static Files

1. In cPanel, open **Terminal** (under Advanced).
2. Run your virtualenv activate command:
   ```bash
   source /home/username/virtualenv/madstory_backend/3.11/bin/activate
   cd /home/username/madstory_backend
   ```
3. Install packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Verify database migrations:
   ```bash
   python manage.py migrate
   ```
5. Collect static assets (for Django Admin & Swagger):
   ```bash
   python manage.py collectstatic --noinput
   ```
6. (If needed) Create superuser:
   ```bash
   python manage.py createsuperuser
   ```

---

## Step 5: Upload Frontend to `public_html/`

The frontend has already been compiled with `VITE_API_BASE_URL=https://api.themadstory.com/api/v1`.

1. On your local machine, the production files are ready inside [frontend/dist/](file:///d:/Projects/madstory/frontend/dist/).
2. In cPanel **File Manager**, navigate to `/home/username/public_html/`.
3. Upload all contents of `frontend/dist/` into `public_html/`:
   - `.htaccess` *(Contains HTTPS redirect & SPA routing rules)*
   - `index.html`
   - `assets/` folder

---

## Step 6: Restart Python App & Verify

1. In cPanel **Setup Python App**, click **Restart**.
2. Visit the live URLs:
   - **Frontend**: [https://themadstory.com/](https://themadstory.com/)
   - **Backend Health Check**: [https://api.themadstory.com/api/v1/health/](https://api.themadstory.com/api/v1/health/)
   - **Django Admin Panel**: [https://api.themadstory.com/admin/](https://api.themadstory.com/admin/)
   - **Swagger API Documentation**: [https://api.themadstory.com/api/docs/](https://api.themadstory.com/api/docs/)
