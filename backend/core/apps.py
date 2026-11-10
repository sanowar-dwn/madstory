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


def invalidate_home_cache(sender, **kwargs):
    try:
        from django.core.cache import cache
        cache.delete('magazine_home_feed')
    except Exception:
        pass


class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    verbose_name = 'The Mad Story Core'

    def ready(self):
        connection_created.connect(enable_sqlite_optimizations)
        from django.db.models.signals import post_save, post_delete
        from .models import Article, Category, HomepageCustomization, HeroSlide, Video
        for model in (Article, Category, HomepageCustomization, HeroSlide, Video):
            post_save.connect(invalidate_home_cache, sender=model)
            post_delete.connect(invalidate_home_cache, sender=model)
