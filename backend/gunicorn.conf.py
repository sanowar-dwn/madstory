import os
import multiprocessing

# Gunicorn configuration for Render deployment
port = os.environ.get("PORT", "8000")
bind = f"0.0.0.0:{port}"

# Concurrency: default to 2 workers (conservative for Render 512MB memory limit)
workers = int(os.environ.get("WEB_CONCURRENCY", 2))
threads = int(os.environ.get("PYTHON_GET_THREADS", 2))
worker_class = "gthread"

# Timeouts
timeout = int(os.environ.get("GUNICORN_TIMEOUT", 120))
keepalive = 5

# Logging to stdout/stderr
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")
capture_output = True
