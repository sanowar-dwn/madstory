"""
URL configuration for The Mad Story backend.
"""

from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from core.views import HealthCheckView, BlogPostMetaView

urlpatterns = [
    path('healthz', HealthCheckView.as_view(), name='root-health'),
    path('admin/', admin.site.urls),
    path('api/v1/', include('core.urls')),
    # Dynamic OpenGraph & Twitter Card tags for social media link sharing
    re_path(r'^post/(?P<slug>[^/]+)/?$', BlogPostMetaView.as_view(), name='blog-post-share'),
    # OpenAPI Schema & Interactive Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
