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

# Initialize Django WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
