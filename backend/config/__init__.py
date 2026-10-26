"""Django config package."""

# Enable pure-Python MySQL support for cPanel shared hosting
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

