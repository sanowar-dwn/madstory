# 🚀 The Mad Story — Render Deployment Guide

This guide provides end-to-end instructions for deploying **The Mad Story** on [Render](https://render.com):
- **Frontend SPA**: Render Static Site (React 18 + Vite + Tailwind, Free tier with Global CDN & Auto-SSL)
- **Backend API**: Render Web Service (Django 5 + DRF + Gunicorn + WhiteNoise)
- **Database**: Managed PostgreSQL (Render Postgres, Neon, or Supabase) or SQLite with Persistent Disk
- **Media Storage**: Cloudflare R2 (or AWS S3) for permanent uploaded blog images

---

## 🏗️ Architecture on Render

```
                                      ┌────────────────────────────────────────────────────────┐
                                      │                      END USERS                         │
                                      └──────────────────────────┬─────────────────────────────┘
                                                                 │
                                       ┌─────────────────────────┴────────────────────────┐
                                       │                                                  │
                       https://themadstory.com                            https://api.themadstory.com
                                       ▼                                                  ▼
                    ┌─────────────────────────────────────┐            ┌─────────────────────────────────────┐
                    │        Render Static Site           │            │          Render Web Service         │
                    │         (madstory-frontend)         │            │          (madstory-backend)         │
                    ├─────────────────────────────────────┤            ├─────────────────────────────────────┤
                    │ • Root: frontend/                   │            │ • Root: backend/                    │
                    │ • Build: npm install && npm run ... │            │ • Build: ./build.sh                 │
                    │ • Publish: dist                     │            │ • Start: gunicorn config.wsgi:...   │
                    │ • Route: /* -> /index.html          │            │ • Static: WhiteNoise                │
                    │ • Auto HTTPS / CDN                  │            │ • Port: Dynamic ($PORT)             │
                    └──────────────────┬──────────────────┘            └──────────────────┬──────────────────┘
                                       │                                                  │
                                       │ REST API calls (CORS enabled)                    │
                                       └──────────────────────────────────────────────────┤
                                                                                          │
                                                                   ┌──────────────────────┴──────────────────────┐
                                                                   ▼                                             ▼
                                                ┌─────────────────────────────────────┐       ┌─────────────────────────────────────┐
                                                │      Render PostgreSQL Database     │       │       Cloudflare R2 Storage         │
                                                │            (madstory-db)            │       │        (madstory-media)             │
                                                ├─────────────────────────────────────┤       ├─────────────────────────────────────┤
                                                │ • Auto-linked DATABASE_URL          │       │ • Permanent blog images / media     │
                                                │ • Restored via datadump.json        │       │ • Free 10GB S3-compatible storage   │
                                                └─────────────────────────────────────┘       └─────────────────────────────────────┘
```

---

## ⚡ Method 1: One-Click Deploy with Render Blueprint (`render.yaml`)

A pre-configured [`render.yaml`](file:///d:/Projects/madstory/render.yaml) is included in the root of the project. Render uses this to provision the database, backend web service, and frontend static site automatically.

### Steps:
1. Push your latest code (including `render.yaml`, `backend/build.sh`, `backend/gunicorn.conf.py`, and `backend/datadump.json`) to your GitHub/GitLab repository:
   ```bash
   git add .
   git commit -m "feat: add Render deployment configurations and database dump"
   git push origin main
   ```
2. Log in to [dashboard.render.com](https://dashboard.render.com/).
3. Click **New +** in the top navigation and select **Blueprint**.
4. Connect your GitHub/GitLab repository.
5. Render will scan `render.yaml` and display the resources to create:
   - `madstory-db` (PostgreSQL Database)
   - `madstory-backend` (Web Service)
   - `madstory-frontend` (Static Site)
6. Click **Apply**.
7. In the environment variables for `madstory-backend`, set `AUTO_LOAD_FIXTURE` to `true` for the first deployment so your existing 36 articles, categories, and site settings are populated automatically.

---

## 🛠️ Method 2: Manual Dashboard Setup (Step-by-Step)

If you prefer setting up each service manually via the Render dashboard, follow these steps:

### Step 1: Create PostgreSQL Database

> **Note**: Render Web Services have ephemeral filesystems. Any local SQLite file will reset on redeployment. Using a managed PostgreSQL database is the recommended approach. (You can use Render PostgreSQL, or a free lifetime tier like [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com)).

1. In Render Dashboard, click **New +** -> **PostgreSQL**.
2. Fill in the details:
   - **Name**: `madstory-db`
   - **Database**: `madstory`
   - **User**: `madstory_user`
   - **Region**: Choose the region closest to your audience (e.g., Frankfurt, Singapore, or Oregon).
3. Click **Create Database**.
4. Once provisioned, copy the **Internal Database URL** (e.g., `postgresql://madstory_user:...@dpg-...-a/madstory`).

---

### Step 2: Deploy Backend Web Service

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Name**: `madstory-backend`
   - **Region**: Same region as your database.
   - **Branch**: `main` (or your active branch).
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `./build.sh`
   - **Start Command**: `gunicorn config.wsgi:application`
   - **Instance Type**: Free or Starter.
4. Under **Advanced** -> **Health Check Path**, enter: `/healthz`
5. Add the following **Environment Variables**:

| Variable | Value | Description |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.12.0` | Target Python runtime |
| `DJANGO_DEBUG` | `False` | Disables debug mode in production |
| `DJANGO_SECRET_KEY` | *(Click "Generate")* | Cryptographic signing key |
| `DATABASE_URL` | *(Paste Internal Database URL from Step 1)* | Database connection string |
| `AUTO_LOAD_FIXTURE` | `true` *(on first run, then set to false)* | Loads existing articles/categories from `datadump.json` |
| `FRONTEND_URL` | `https://themadstory.com` *(or your Render frontend URL)* | Allows CORS/CSRF & dynamic previews |
| `DJANGO_ALLOWED_HOSTS` | `.onrender.com,themadstory.com,www.themadstory.com,api.themadstory.com` | Hostname whitelist |
| `CORS_ALLOWED_ORIGINS` | `https://themadstory.com,https://www.themadstory.com` | Allowed browser origins |
| `CSRF_TRUSTED_ORIGINS` | `https://themadstory.com,https://www.themadstory.com,https://api.themadstory.com` | CSRF verification origins |

6. Click **Create Web Service**.
7. Render will run `backend/build.sh` (which installs dependencies, runs `collectstatic`, applies migrations, and imports `datadump.json`).
8. Once finished, your backend URL will be live at:
   `https://madstory-backend.onrender.com`

---

### Step 3: Deploy Frontend Static Site

1. In Render Dashboard, click **New +** -> **Static Site**.
2. Connect the same Git repository.
3. Configure the static site:
   - **Name**: `madstory-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Redirects/Rewrites**, add a rewrite rule for React Single Page Application routing:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Under **Environment Variables**, add:

| Variable | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://madstory-backend.onrender.com/api/v1` *(or `https://api.themadstory.com/api/v1`)* |

6. Click **Create Static Site**.
7. Once the build finishes, your frontend will be live at:
   `https://madstory-frontend.onrender.com`

---

## 🗄️ Database Management & Data Seeding

### How Data Migration Works:
We have generated [`backend/datadump.json`](file:///d:/Projects/madstory/backend/datadump.json) (138 records total) containing all:
- Blog Articles
- Categories
- Authors & User Accounts
- Site Settings & Hero Slides
- Comments & Newsletter Subscribers

### Option 1: Automatic Seeding during deployment
When you set `AUTO_LOAD_FIXTURE=true` in Render's environment variables, `backend/build.sh` automatically executes:
```bash
python manage.py loaddata datadump.json
```
Once deployed, change `AUTO_LOAD_FIXTURE` back to `false` in Render so subsequent builds don't re-run the fixture.

### Option 2: Manual Seeding via Render Shell
1. In Render Dashboard, open your `madstory-backend` service.
2. Click **Shell** in the left sidebar.
3. Run:
   ```bash
   python manage.py loaddata datadump.json
   ```
4. To create a new superuser or reset credentials:
   ```bash
   python manage.py createsuperuser
   ```

---

## ☁️ Permanent Media Storage (Cloudflare R2 / AWS S3)

Because Render web services have ephemeral storage, files uploaded through Django Admin or the Dashboard (like article featured images or author avatars) should be stored in S3-compatible cloud storage.

The backend is already configured for **Cloudflare R2** (which offers a **10 GB free tier with $0 egress fees**):

1. Create a bucket in Cloudflare R2 (e.g., `madstory-media`).
2. Add these environment variables to `madstory-backend` in Render:

| Variable | Value |
| :--- | :--- |
| `CLOUDFLARE_R2_ACCOUNT_ID` | Your Cloudflare Account ID |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | Your R2 Access Key ID |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | Your R2 Secret Access Key |
| `CLOUDFLARE_R2_BUCKET_NAME` | `madstory-media` |
| `CLOUDFLARE_R2_CUSTOM_DOMAIN` | `media.themadstory.com` *(optional)* |

When these variables are present, Django automatically routes all file uploads to Cloudflare R2!

---

## 🌐 Custom Domains & DNS Setup

To use `themadstory.com` and `api.themadstory.com`:

### 1. Frontend Domain:
1. In Render Dashboard, open `madstory-frontend` -> **Settings** -> **Custom Domains**.
2. Add `themadstory.com` and `www.themadstory.com`.
3. In your DNS manager (e.g. Cloudflare / Namecheap / GoDaddy), configure:
   - **Type**: `CNAME` | **Name**: `@` or `themadstory.com` | **Value**: `<your-static-site>.onrender.com`
   - **Type**: `CNAME` | **Name**: `www` | **Value**: `<your-static-site>.onrender.com`

### 2. Backend Domain:
1. In Render Dashboard, open `madstory-backend` -> **Settings** -> **Custom Domains**.
2. Add `api.themadstory.com`.
3. In your DNS manager, configure:
   - **Type**: `CNAME` | **Name**: `api` | **Value**: `<your-web-service>.onrender.com`

Render automatically provisions free, auto-renewing Let's Encrypt SSL certificates for all custom domains.

---

## 🔍 Verification & Troubleshooting Checklist

- [ ] **Healthcheck**: Visit `https://<backend-app>.onrender.com/healthz` — should return `{"status": "healthy"}` with database connection status.
- [ ] **Admin Panel**: Visit `https://<backend-app>.onrender.com/admin/` — styles should load cleanly through WhiteNoise without mixed-content errors.
- [ ] **API Documentation**: Visit `https://<backend-app>.onrender.com/api/docs/` for interactive Swagger documentation.
- [ ] **CORS Verification**: Test logging in or fetching articles from the frontend. The backend automatically allows all `*.onrender.com` subdomains dynamically.
- [ ] **SPA Direct Route Reload**: In frontend, navigate to `/about` or `/categories` and press browser refresh. The Render rewrite rule `/* -> /index.html` prevents 404 errors.
