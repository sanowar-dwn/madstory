import os
import sys

# ------------------------------------------------------------------------------
# cPanel Phusion Passenger WSGI Entrypoint for The Mad Story
# ------------------------------------------------------------------------------

# Add application directory to sys.path
APP_DIR = os.path.dirname(os.path.abspath(__file__))
if APP_DIR not in sys.path:
    sys.path.insert(0, APP_DIR)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Load environment variables if .env exists
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(APP_DIR, '.env'))
except ImportError:
    pass

# Enable PyMySQL fallback for cPanel MySQL / MariaDB
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

# Force UTF-8 environment for Phusion Passenger
os.environ.setdefault('LC_ALL', 'en_US.UTF-8')
os.environ.setdefault('LANG', 'en_US.UTF-8')

# Initialize Django WSGI application
from django.core.wsgi import get_wsgi_application
_django_app = get_wsgi_application()


class WSGIUnicodeFixMiddleware:
    """
    Mitigates WSGI environment encoding mismatches (Latin-1 vs UTF-8)
    for URLs and headers passing through Phusion Passenger / Apache.
    """
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        for key in ('PATH_INFO', 'SCRIPT_NAME', 'REQUEST_URI'):
            val = environ.get(key)
            if val and isinstance(val, str):
                try:
                    # Check if val can be encoded in ISO-8859-1 (as required by PEP 3333).
                    val.encode('iso-8859-1')
                except UnicodeEncodeError:
                    # Passenger already decoded UTF-8 into Python string with non-Latin1 characters.
                    # Re-encode to UTF-8 bytes and decode as ISO-8859-1 so Django's get_bytes_from_wsgi
                    # can properly process it without raising UnicodeEncodeError.
                    try:
                        environ[key] = val.encode('utf-8').decode('iso-8859-1')
                    except Exception:
                        pass
        return self.app(environ, start_response)


application = WSGIUnicodeFixMiddleware(_django_app)
