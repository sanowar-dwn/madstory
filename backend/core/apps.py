import logging
from django.apps import AppConfig
from django.db.backends.signals import connection_created

logger = logging.getLogger('django')


def enable_sqlite_optimizations(sender, connection, **kwargs):
    """
    Optimizes SQLite for production workloads:
    - WAL Mode (Write-Ahead Logging): Readers do not block writers, and writers do not block readers.
    - Synchronous NORMAL: Faster I/O while maintaining crash-recovery guarantees in WAL mode.
    - Busy Timeout 20,000ms: Prevents 'database is locked' errors during concurrent traffic.
    - Foreign Keys ON: Enforces referential integrity at the engine level.
    - Cache Size -20000: Allocates ~20MB RAM for SQLite page cache for high-speed queries.
    """
    if connection.vendor == 'sqlite':
        try:
            with connection.cursor() as cursor:
                cursor.execute('PRAGMA journal_mode = WAL;')
                cursor.execute('PRAGMA synchronous = NORMAL;')
                cursor.execute('PRAGMA busy_timeout = 20000;')
                cursor.execute('PRAGMA foreign_keys = ON;')
                cursor.execute('PRAGMA cache_size = -20000;')
        except Exception as e:
            logger.warning(f"Could not apply SQLite WAL optimizations: {e}")


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    verbose_name = 'The Mad Story Core'

    def ready(self):
        connection_created.connect(enable_sqlite_optimizations)
