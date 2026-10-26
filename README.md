# The Mad Story (themadstory.com) — Full Production Website Reconstruction

A complete, production-ready reconstruction of **The Mad Story** (`https://themadstory.com/`), built with a decoupled architecture using **React + TypeScript + Vite** for the frontend and **Django REST Framework** with JWT authentication for the backend.

---

## 1. Key Production Features

### 1.1 User Authentication & Roles
- **Signup & Login:** Complete registration and token-based authentication using `djangorestframework-simplejwt`.
- **Role-Based Access Control:**
  - **Writers / Regular Users:** Can sign up, compose blogs, assign multiple categories (M2M), save drafts, and submit articles for editorial review (`pending_approval`).
  - **Super Admins / Editors:** Full access to the React Dashboard to review submitted articles, approve & publish with one click, or reject with custom feedback reasons.

### 1.2 Full React Dashboard (`/dashboard`)
- **Overview:** Personal and site-wide metrics (Total articles, Published, Pending, Views, Hearts).
- **Write Blog Post:** Comprehensive editor with Bengali & English title/excerpt/content, M2M category multi-selection, cover image, and reading time.
- **My Articles:** List and filter personal blogs with real-time status badges (`published`, `pending_approval`, `draft`, `rejected` with rejection notes).
- **Approval Queue (Admin Only):** Real-time queue for inspecting user-submitted articles, approving them to live status, or returning them with revision feedback.
- **Homepage Customization (Admin Only):** Directly control homepage layout from the React Dashboard:
  - Edit Breaking News / Ticker text (Bengali & English).
  - Toggle visibility of homepage sections (Bold Hero Slider, Lead Section, Art & Culture Grid, Category Cards, Sidebar).
  - Customize section headings in Bengali and English.

### 1.3 Bilingual Language Switcher
- Global Language Switcher (`বাংলা | EN`) in the top bar and navbar.
- Persistent language state in `localStorage`.
- Comprehensive translation dictionary for UI labels, buttons, navigation items, and forms.
- Dynamic fallback to English fields (`title_en`, `excerpt_en`, `content_en`, `name_en`) when English is active.

### 1.4 Many-to-Many Categories on Posts
- In the `Article` model, categories are now a `ManyToManyField(Category, related_name='articles')`.
- Posts can belong to multiple categories simultaneously (e.g., both *Design* and *Furniture*).
- Filtering supports comma-separated or slug-based category queries across any assigned category.

### 1.5 Authenticated Heart Reactions
- Logged-in users can heart react to any article across cards, sliders, and detail pages.
- Real-time animated toggle (`POST /api/v1/articles/{slug}/heart/`).
- Shows live heart counts and active state for the current user.
- Unauthenticated users are gracefully prompted to log in or register.

### 1.6 Nested Tree Comments
- Full hierarchical / threaded comment system (`GET` and `POST /api/v1/articles/{slug}/comments/`).
- Top-level root comments with unlimited recursive nested replies.
- Inline reply form under any comment in the tree.
- Delete permissions for comment authors and administrators.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Language:** TypeScript
- **Routing:** React Router v6
- **State & Context:** React Context API (`AuthContext`, `LanguageContext`)
- **Styling:** Tailwind CSS with custom editorial design tokens (`globals.css`)
- **Icons:** Lucide React
- **API Client:** Axios with JWT auto-attachment and token refresh interceptor
- **Typography:** Google Fonts (*Hind Siliguri*, *IBM Plex Sans*, *Lora*, *Merriweather*)

### Backend
- **Framework:** Django 5.2 + Django REST Framework 3.16
- **Authentication:** `djangorestframework-simplejwt`
- **Database:** SQLite (default for instant zero-dependency onboarding) or PostgreSQL (`DATABASE_URL`)
- **API Documentation:** OpenAPI Schema + Swagger UI via `drf-spectacular`
- **CORS:** `django-cors-headers`
- **Static & Media:** WhiteNoise, Django static file handling

---

## 3. Quick Start Guide

### 3.1 Backend Setup

```bash
# Navigate to backend directory
cd backend

# Run migrations
python manage.py migrate

# Seed database with genuine reference content, M2M categories, tree comments, and customization
python manage.py seed_data

# Run backend development server
python manage.py runserver 8000
```

- **Backend API Root:** `http://127.0.0.1:8000/api/v1/`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/api/docs/`
- **Django Admin:** `http://127.0.0.1:8000/admin/`

#### Default Credentials:
- **Super Admin:** `admin` / `adminpassword123`
- **Demo Writer:** `sarah_writer` / `writer123`

### 3.2 Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Run Vite development server
npm run dev
```

- **Frontend Application:** `http://localhost:5173/`

---

## 4. API Endpoints Reference

### Authentication
- `POST /api/v1/auth/register/` — Register user & receive JWT tokens
- `POST /api/v1/auth/login/` — SimpleJWT login
- `POST /api/v1/auth/token/refresh/` — Refresh access token
- `GET /api/v1/auth/me/` — Current user profile

### Articles & Interactions
- `GET /api/v1/articles/` — List published articles with category, search, and ordering filters
- `POST /api/v1/articles/` — Create new blog article (authenticated)
- `GET /api/v1/articles/{slug}/` — Article detail with view counter increment
- `PATCH /api/v1/articles/{slug}/` — Update article (author or admin)
- `DELETE /api/v1/articles/{slug}/` — Delete article (author or admin)
- `POST /api/v1/articles/{slug}/heart/` — Toggle heart reaction (authenticated)
- `GET /api/v1/articles/{slug}/comments/` — Retrieve hierarchical tree comments
- `POST /api/v1/articles/{slug}/comments/` — Post top-level comment or reply to `parent_id`
- `DELETE /api/v1/comments/{id}/` — Delete a comment (author or admin)

### Editorial & Dashboard
- `GET /api/v1/dashboard/stats/` — Real-time metrics for writers and admins
- `GET /api/v1/articles/my_posts/` — Articles authored by the current user
- `GET /api/v1/articles/pending/` — Approval queue (admin only)
- `POST /api/v1/articles/{slug}/approve/` — Approve & publish an article (admin only)
- `POST /api/v1/articles/{slug}/reject/` — Reject an article with feedback reason (admin only)
- `GET /api/v1/homepage-customization/` — Homepage section and content configuration
- `PATCH /api/v1/homepage-customization/` — Update homepage customization (admin only)

---

## 5. Automated Verification

Run Django automated tests:

```bash
cd backend
python manage.py test core
```
*(All 7 comprehensive production tests pass with 0 errors)*

Run frontend build verification:

```bash
cd frontend
npm run build
```
*(Vite production build compiles with 0 errors)*
