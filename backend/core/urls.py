from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    CategoryViewSet, ArticleViewSet, SiteSettingView,
    ContactInquiryCreateView, NewsletterSubscriberCreateView,
    RegisterView, CurrentUserView, AdminDashboardStatsView,
    HomepageCustomizationView, CommentDeleteView,
    AdminUserViewSet, AdminCommentViewSet, AdminContactInquiryViewSet,
    AdminNewsletterSubscriberViewSet, HeroSlideViewSet, MediaUploadView,
    HealthCheckView
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'articles', ArticleViewSet, basename='article')
router.register(r'posts', ArticleViewSet, basename='post')
router.register(r'hero-slides', HeroSlideViewSet, basename='hero-slide')
router.register(r'admin/users', AdminUserViewSet, basename='admin-user')
router.register(r'admin/comments', AdminCommentViewSet, basename='admin-comment')
router.register(r'admin/inquiries', AdminContactInquiryViewSet, basename='admin-inquiry')
router.register(r'admin/subscribers', AdminNewsletterSubscriberViewSet, basename='admin-subscriber')

urlpatterns = [
    # Core API Routers
    path('', include(router.urls)),

    # Authentication
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='auth-login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-current-user'),

    # Dashboard & Customization
    path('dashboard/stats/', AdminDashboardStatsView.as_view(), name='dashboard-stats'),
    path('homepage-customization/', HomepageCustomizationView.as_view(), name='homepage-customization'),
    path('comments/<int:pk>/', CommentDeleteView.as_view(), name='comment-delete'),

    # Site configuration, Contact & Newsletter
    path('settings/', SiteSettingView.as_view(), name='site-settings'),
    path('contact/', ContactInquiryCreateView.as_view(), name='contact-inquiry'),
    path('newsletter/', NewsletterSubscriberCreateView.as_view(), name='newsletter-subscribe'),

    # Media Storage & Upload (Cloudflare R2)
    path('upload/', MediaUploadView.as_view(), name='media-upload'),

    # Health Check Endpoint
    path('health/', HealthCheckView.as_view(), name='health-check'),
]
