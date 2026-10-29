"""
Django settings for The Mad Story backend.
"""

from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file if it exists
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv(BASE_DIR / '.env')

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'madstory-secret-key-production-ready-2026')

DEBUG = os.environ.get('DJANGO_DEBUG', 'True').lower() in ('true', '1', 't')

ALLOWED_HOSTS = [h.strip() for h in os.environ.get(
    'DJANGO_ALLOWED_HOSTS',
    'themadstory.com,www.themadstory.com,api.themadstory.com,localhost,127.0.0.1,0.0.0.0'
).split(',') if h.strip()]

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party apps
    'rest_framework',
    'corsheaders',
    'django_filters',
    'drf_spectacular',
    'ckeditor',
    # Local apps
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database
# Supports SQLite in production by default with WAL concurrency optimizations.
# Can also be overridden with DATABASE_URL (e.g. Postgres / MySQL) if provided.
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.parse(DATABASE_URL)
    }
else:
    SQLITE_PATH = os.environ.get('SQLITE_PATH')
    db_path = Path(SQLITE_PATH) if SQLITE_PATH else (BASE_DIR / 'db.sqlite3')
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': db_path,
            'OPTIONS': {
                'timeout': 20,  # Wait up to 20s for locks to clear before failing
            },
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cloudflare R2 Storage Configuration (S3-compatible object storage)
CLOUDFLARE_R2_ACCESS_KEY_ID = os.environ.get('CLOUDFLARE_R2_ACCESS_KEY_ID')
CLOUDFLARE_R2_SECRET_ACCESS_KEY = os.environ.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY')
CLOUDFLARE_R2_BUCKET_NAME = os.environ.get('CLOUDFLARE_R2_BUCKET_NAME')
CLOUDFLARE_R2_ACCOUNT_ID = os.environ.get('CLOUDFLARE_R2_ACCOUNT_ID')
CLOUDFLARE_R2_CUSTOM_DOMAIN = os.environ.get('CLOUDFLARE_R2_CUSTOM_DOMAIN')
CLOUDFLARE_R2_ENDPOINT_URL = os.environ.get('CLOUDFLARE_R2_ENDPOINT_URL')

USE_CLOUDFLARE_R2 = bool(
    CLOUDFLARE_R2_ACCESS_KEY_ID and
    CLOUDFLARE_R2_SECRET_ACCESS_KEY and
    CLOUDFLARE_R2_BUCKET_NAME and
    (CLOUDFLARE_R2_ACCOUNT_ID or CLOUDFLARE_R2_ENDPOINT_URL)
)

if USE_CLOUDFLARE_R2:
    if 'storages' not in INSTALLED_APPS:
        INSTALLED_APPS.append('storages')

    AWS_ACCESS_KEY_ID = CLOUDFLARE_R2_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY = CLOUDFLARE_R2_SECRET_ACCESS_KEY
    AWS_STORAGE_BUCKET_NAME = CLOUDFLARE_R2_BUCKET_NAME

    if CLOUDFLARE_R2_ACCOUNT_ID:
        AWS_S3_ENDPOINT_URL = f'https://{CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com'
    else:
        AWS_S3_ENDPOINT_URL = CLOUDFLARE_R2_ENDPOINT_URL

    AWS_S3_REGION_NAME = 'auto'
    AWS_S3_SIGNATURE_VERSION = 's3v4'
    AWS_DEFAULT_ACL = None  # Critical: Cloudflare R2 does not support S3 ACLs
    AWS_S3_FILE_OVERWRITE = False
    AWS_QUERYSTRING_AUTH = False

    if CLOUDFLARE_R2_CUSTOM_DOMAIN:
        AWS_S3_CUSTOM_DOMAIN = CLOUDFLARE_R2_CUSTOM_DOMAIN
        MEDIA_URL = f'https://{CLOUDFLARE_R2_CUSTOM_DOMAIN}/'
    else:
        MEDIA_URL = f'{AWS_S3_ENDPOINT_URL}/{AWS_STORAGE_BUCKET_NAME}/'

    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }
else:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ------------------------------------------------------------------------------
# Upload / Request Size Limits
# ------------------------------------------------------------------------------
# Google Docs pastes produce verbose HTML with inline styles; raise the in-memory
# limit so large blog bodies are accepted without a 500 error.
# DATA_UPLOAD_MAX_MEMORY_SIZE controls non-file POST data (default: 2.5 MB).
# FILE_UPLOAD_MAX_MEMORY_SIZE controls file uploads held in memory (default: 2.5 MB).
DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get('DATA_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024))  # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get('FILE_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024))  # 10 MB

from datetime import timedelta

# Django REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 12,
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': os.environ.get('THROTTLE_ANON_RATE', '200/day'),
        'user': os.environ.get('THROTTLE_USER_RATE', '2000/day'),
    },
}

# SimpleJWT configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer', 'JWT'),
}

# CKEditor configuration
CKEDITOR_CONFIGS = {
    'default': {
        'toolbar': 'Custom',
        'toolbar_Custom': [
            ['Bold', 'Italic', 'Underline', 'Strike'],
            ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote'],
            ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
            ['Link', 'Unlink'],
            ['RemoveFormat', 'Source'],
            ['Format', 'Font', 'FontSize'],
            ['TextColor', 'BGColor'],
            ['Image', 'Table', 'HorizontalRule'],
        ],
        'height': 350,
        'width': '100%',
    }
}


# DRF Spectacular OpenAPI documentation settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'The Mad Story API',
    'DESCRIPTION': 'RESTful API endpoints for The Mad Story editorial magazine and studio.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# CORS configuration
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Allow all in dev, strict in prod
CORS_ALLOW_CREDENTIALS = True
custom_cors = os.environ.get('CORS_ALLOWED_ORIGINS', '')
CORS_ALLOWED_ORIGINS = [
    'https://themadstory.com',
    'https://www.themadstory.com',
    'http://themadstory.com',
    'http://www.themadstory.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
] + [origin.strip() for origin in custom_cors.split(',') if origin.strip()]

custom_csrf = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
CSRF_TRUSTED_ORIGINS = [
    'https://themadstory.com',
    'https://www.themadstory.com',
    'https://api.themadstory.com',
    'http://themadstory.com',
    'http://www.themadstory.com',
    'http://api.themadstory.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
] + [origin.strip() for origin in custom_csrf.split(',') if origin.strip()]

# ------------------------------------------------------------------------------
# Production Security Headers
# ------------------------------------------------------------------------------
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'False').lower() in ('true', '1')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = False
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'SAMEORIGIN'
    SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', 31536000))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# ------------------------------------------------------------------------------
# Logging Configuration
# ------------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{asctime}] {levelname} [{name}:{lineno}] {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'core': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

