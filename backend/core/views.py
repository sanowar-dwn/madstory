from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import F, Count
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.files.storage import default_storage
from rest_framework_simplejwt.tokens import RefreshToken
import os
import uuid
from datetime import datetime

from .models import (
    Category, Article, PostHeart, Comment, HomepageCustomization,
    SiteSetting, ContactInquiry, NewsletterSubscriber, HeroSlide
)
from .serializers import (
    CategorySerializer, ArticleListSerializer, ArticleDetailSerializer,
    ArticleWriteSerializer, CommentSerializer, CommentCreateSerializer,
    HomepageCustomizationSerializer, SiteSettingSerializer,
    ContactInquirySerializer, NewsletterSubscriberSerializer,
    UserSerializer, RegisterSerializer, AdminUserCreateUpdateSerializer,
    AdminCommentSerializer, HeroSlideSerializer
)


class IsAuthorOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user or request.user.is_staff


class CategoryViewSet(viewsets.ModelViewSet):
    """API endpoint for magazine categories and navigation trees."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_nav_visible', 'parent']
    search_fields = ['name', 'name_en', 'description', 'description_en']
    ordering_fields = ['display_order', 'name', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        qs = super().get_queryset()
        top_only = self.request.query_params.get('top_level', None)
        if top_only is not None and top_only.lower() in ('true', '1'):
            qs = qs.filter(parent=None)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def toggle_nav(self, request, slug=None):
        category = self.get_object()
        category.is_nav_visible = not category.is_nav_visible
        category.save()
        return Response({'is_nav_visible': category.is_nav_visible})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def set_order(self, request, slug=None):
        category = self.get_object()
        new_order = request.data.get('display_order')
        if new_order is not None:
            category.display_order = int(new_order)
            category.save()
            return Response({'display_order': category.display_order})
        return Response({'error': 'Missing display_order'}, status=status.HTTP_400_BAD_REQUEST)


class ArticleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for magazine articles.
    Authenticated users can write articles. Staff can approve and manage them.
    """
    queryset = Article.objects.all()
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categories__slug', 'is_featured_hero', 'is_colti_trending', 'is_nirbachito_choice', 'status']
    search_fields = ['title', 'title_en', 'excerpt', 'excerpt_en', 'content', 'author_name']
    ordering_fields = ['published_at', 'view_count', 'created_at']

    def get_permissions(self):
        if self.action in ['create', 'my_posts', 'heart']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsAuthorOrStaff()]
        if self.action in ['pending', 'approve', 'reject']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        user = self.request.user
        # Regular public calls only see published
        if self.action in ['list', 'retrieve', 'featured_hero', 'colti_trending', 'nirbachito', 'popular', 'magazine_home']:
            category_slug = self.request.query_params.get('category__slug') or self.request.query_params.get('categories__slug') or self.request.query_params.get('category')
            qs = Article.objects.filter(status='published')
            if category_slug:
                qs = qs.filter(categories__slug=category_slug)
            return qs.distinct()
        elif self.action == 'my_posts':
            return Article.objects.filter(author=user)
        elif self.action in ['pending']:
            return Article.objects.filter(status='pending_approval')
        elif user.is_staff:
            return Article.objects.all()
        return Article.objects.filter(status='published')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ArticleWriteSerializer
        if self.action == 'retrieve':
            return ArticleDetailSerializer
        return ArticleListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Article.objects.filter(pk=instance.pk).update(view_count=F('view_count') + 1)
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    # -------------------------------------------------------------
    # User Heart Reaction Toggle Feature
    # -------------------------------------------------------------
    @action(detail=True, methods=['post'])
    def heart(self, request, slug=None):
        """Toggle heart reaction for an article."""
        article = self.get_object()
        heart_obj = PostHeart.objects.filter(user=request.user, article=article)
        if heart_obj.exists():
            heart_obj.delete()
            is_hearted = False
        else:
            PostHeart.objects.create(user=request.user, article=article)
            is_hearted = True

        return Response({
            'status': 'success',
            'is_hearted': is_hearted,
            'hearts_count': article.hearts_count
        })

    # -------------------------------------------------------------
    # Tree Comments Feature
    # -------------------------------------------------------------
    @action(detail=True, methods=['get', 'post'])
    def comments(self, request, slug=None):
        """Get tree comments or post a new comment / reply."""
        article = self.get_object()

        if request.method == 'GET':
            # Get root comments with nested replies
            root_comments = Comment.objects.filter(
                article=article, parent=None, is_approved=True
            ).order_by('created_at')
            serializer = CommentSerializer(root_comments, many=True, context={'request': request})
            return Response(serializer.data)

        elif request.method == 'POST':
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required to comment.'}, status=status.HTTP_401_UNAUTHORIZED)
            
            serializer = CommentCreateSerializer(
                data=request.data, context={'request': request, 'article': article}
            )
            serializer.is_valid(raise_exception=True)
            comment = serializer.save()
            return Response(
                CommentSerializer(comment, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

    # -------------------------------------------------------------
    # Writer & Admin Workflow Actions
    # -------------------------------------------------------------
    @action(detail=False, methods=['get'])
    def my_posts(self, request):
        """Retrieve articles authored by current user."""
        posts = Article.objects.filter(author=request.user).order_by('-created_at')
        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = ArticleListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = ArticleListSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Admin endpoint to view articles awaiting approval."""
        posts = Article.objects.filter(status='pending_approval').order_by('-created_at')
        serializer = ArticleListSerializer(posts, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, slug=None):
        """Admin approves an article to be published."""
        article = self.get_object()
        article.status = 'published'
        article.rejection_reason = ''
        article.save()
        return Response({
            'status': 'success',
            'message': f"Article '{article.title}' has been approved and published.",
            'data': ArticleListSerializer(article, context={'request': request}).data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, slug=None):
        """Admin rejects an article with feedback reason."""
        article = self.get_object()
        reason = request.data.get('reason', 'Does not meet editorial guidelines.')
        article.status = 'rejected'
        article.rejection_reason = reason
        article.save()
        return Response({
            'status': 'success',
            'message': f"Article '{article.title}' was rejected.",
            'data': ArticleListSerializer(article, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def set_status(self, request, slug=None):
        """Admin directly changes the status of an article."""
        article = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['draft', 'pending_approval', 'published', 'rejected']:
            article.status = new_status
            if new_status == 'published' and not article.published_at:
                article.published_at = timezone.now()
            article.save()
            return Response({
                'status': 'success',
                'article_status': article.status,
                'data': ArticleListSerializer(article, context={'request': request}).data
            })
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def toggle_flag(self, request, slug=None):
        """Admin toggles editorial flags (featured_hero, colti_trending, nirbachito_choice)."""
        article = self.get_object()
        flag = request.data.get('flag')
        if flag in ['is_featured_hero', 'is_colti_trending', 'is_nirbachito_choice']:
            current_val = getattr(article, flag)
            setattr(article, flag, not current_val)
            article.save()
            return Response({
                'status': 'success',
                'flag': flag,
                'value': getattr(article, flag)
            })
        return Response({'error': 'Invalid flag'}, status=status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------
    # Homepage Curation Endpoints
    # -------------------------------------------------------------
    @action(detail=False, methods=['get'])
    def featured_hero(self, request):
        custom = HomepageCustomization.objects.first()
        if custom and custom.hero_articles.exists():
            articles = custom.hero_articles.filter(status='published')[:5]
        else:
            articles = self.get_queryset().filter(is_featured_hero=True)[:5]
        if not articles.exists():
            articles = self.get_queryset()[:5]
        return Response(ArticleListSerializer(articles, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def colti_trending(self, request):
        custom = HomepageCustomization.objects.first()
        if custom and custom.colti_articles.exists():
            articles = custom.colti_articles.filter(status='published')[:6]
        else:
            articles = self.get_queryset().filter(is_colti_trending=True)[:6]
        if not articles.exists():
            articles = self.get_queryset()[:6]
        return Response(ArticleListSerializer(articles, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def nirbachito(self, request):
        custom = HomepageCustomization.objects.first()
        if custom and custom.nirbachito_articles.exists():
            articles = custom.nirbachito_articles.filter(status='published')[:4]
        else:
            articles = self.get_queryset().filter(is_nirbachito_choice=True)[:4]
        if not articles.exists():
            articles = self.get_queryset()[:4]
        return Response(ArticleListSerializer(articles, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        articles = self.get_queryset().order_by('-view_count', '-published_at')[:6]
        return Response(ArticleListSerializer(articles, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def magazine_home(self, request):
        custom = HomepageCustomization.objects.first()
        
        hero = (custom.hero_articles.filter(status='published')[:5] if custom and custom.hero_articles.exists() 
                else self.get_queryset().filter(is_featured_hero=True)[:5])
        colti = (custom.colti_articles.filter(status='published')[:6] if custom and custom.colti_articles.exists() 
                 else self.get_queryset().filter(is_colti_trending=True)[:6])
        nirbachito = (custom.nirbachito_articles.filter(status='published')[:4] if custom and custom.nirbachito_articles.exists() 
                      else self.get_queryset().filter(is_nirbachito_choice=True)[:4])
        popular = self.get_queryset().order_by('-view_count', '-published_at')[:6]
        recent = self.get_queryset()[:12]

        return Response({
            'hero': ArticleListSerializer(hero, many=True, context={'request': request}).data,
            'colti': ArticleListSerializer(colti, many=True, context={'request': request}).data,
            'nirbachito': ArticleListSerializer(nirbachito, many=True, context={'request': request}).data,
            'popular': ArticleListSerializer(popular, many=True, context={'request': request}).data,
            'recent': ArticleListSerializer(recent, many=True, context={'request': request}).data,
        })


class CommentDeleteView(APIView):
    """Delete a comment (Comment author or Staff only)."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        try:
            comment = Comment.objects.get(pk=pk)
            if comment.user != request.user and not request.user.is_staff:
                return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
            comment.delete()
            return Response({'status': 'success', 'message': 'Comment deleted.'}, status=status.HTTP_200_OK)
        except Comment.DoesNotExist:
            return Response({'error': 'Comment not found.'}, status=status.HTTP_404_NOT_FOUND)


class HomepageCustomizationView(generics.RetrieveUpdateAPIView):
    """Retrieve or update homepage curation blocks from custom dashboard."""
    serializer_class = HomepageCustomizationSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_object(self):
        obj, created = HomepageCustomization.objects.get_or_create(id=1)
        return obj


class SiteSettingView(generics.RetrieveUpdateAPIView):
    """Retrieve or update site settings."""
    serializer_class = SiteSettingSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_object(self):
        obj, created = SiteSetting.objects.get_or_create(id=1)
        return obj


class RegisterView(generics.CreateAPIView):
    """User Registration with auto JWT token return."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        return Response({
            'status': 'success',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    """Get or update current authenticated user profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminDashboardStatsView(APIView):
    """Stats for admin and writer dashboards."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_staff:
            total_articles = Article.objects.count()
            published_articles = Article.objects.filter(status='published').count()
            pending_articles = Article.objects.filter(status='pending_approval').count()
            draft_articles = Article.objects.filter(status='draft').count()
            rejected_articles = Article.objects.filter(status='rejected').count()
            total_users = User.objects.count()
            total_comments = Comment.objects.count()
            pending_comments = Comment.objects.filter(is_approved=False).count()
            total_categories = Category.objects.count()
            total_inquiries = ContactInquiry.objects.count()
            new_inquiries = ContactInquiry.objects.filter(status='new').count()
            total_subscribers = NewsletterSubscriber.objects.filter(is_active=True).count()
            total_hero_slides = HeroSlide.objects.count()
            total_views = sum(Article.objects.values_list('view_count', flat=True))
            total_hearts = PostHeart.objects.count()
            return Response({
                'is_staff': True,
                'total_articles': total_articles,
                'published_articles': published_articles,
                'pending_articles': pending_articles,
                'draft_articles': draft_articles,
                'rejected_articles': rejected_articles,
                'total_users': total_users,
                'total_comments': total_comments,
                'pending_comments': pending_comments,
                'total_categories': total_categories,
                'total_inquiries': total_inquiries,
                'new_inquiries': new_inquiries,
                'total_subscribers': total_subscribers,
                'total_hero_slides': total_hero_slides,
                'total_views': total_views,
                'total_hearts': total_hearts,
            })
        else:
            my_posts = Article.objects.filter(author=user)
            my_views = sum(my_posts.values_list('view_count', flat=True))
            my_hearts = PostHeart.objects.filter(article__author=user).count()
            return Response({
                'is_staff': False,
                'total_articles': my_posts.count(),
                'published_articles': my_posts.filter(status='published').count(),
                'pending_articles': my_posts.filter(status='pending_approval').count(),
                'total_views': my_views,
                'total_hearts': my_hearts,
            })


class ContactInquiryCreateView(generics.CreateAPIView):
    serializer_class = ContactInquirySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(
            {
                'status': 'success',
                'message': 'ধন্যবাদ! আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে। আমরা শীঘ্রই যোগাযোগ করব।',
                'data': serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class NewsletterSubscriberCreateView(generics.CreateAPIView):
    serializer_class = NewsletterSubscriberSerializer

    def create(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        subscriber, created = NewsletterSubscriber.objects.get_or_create(email=email)
        if not created and not subscriber.is_active:
            subscriber.is_active = True
            subscriber.save()

        return Response(
            {
                'status': 'success',
                'message': 'ধন্যবাদ! আপনি সফলভাবে দ্য ম্যাড স্টোরির নিউজলেটারে যুক্ত হয়েছেন।'
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


# =============================================================================
# SUPERADMIN CONTROL VIEWSETS (Full Django Admin Parity in Custom Dashboard)
# =============================================================================

class AdminUserViewSet(viewsets.ModelViewSet):
    """Full user management for superadmins: list, create, update, toggle role, delete."""
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all().order_by('-date_joined')
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_staff', 'is_superuser', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['date_joined', 'username']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AdminUserCreateUpdateSerializer
        return UserSerializer

    @action(detail=True, methods=['post'])
    def toggle_role(self, request, pk=None):
        user = self.get_object()
        user.is_staff = not user.is_staff
        user.save()
        return Response({'is_staff': user.is_staff})

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({'is_active': user.is_active})

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response({'error': 'You cannot delete your own admin account.'}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)


class AdminCommentViewSet(viewsets.ModelViewSet):
    """Full comment management for superadmins: list all comments, approve, delete."""
    permission_classes = [permissions.IsAdminUser]
    queryset = Comment.objects.all().select_related('user', 'article').order_by('-created_at')
    serializer_class = AdminCommentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_approved']
    search_fields = ['content', 'user__username', 'article__title']
    ordering_fields = ['created_at']

    @action(detail=True, methods=['post'])
    def toggle_approval(self, request, pk=None):
        comment = self.get_object()
        comment.is_approved = not comment.is_approved
        comment.save()
        return Response({'is_approved': comment.is_approved})


class AdminContactInquiryViewSet(viewsets.ModelViewSet):
    """Full contact message management for superadmins: view messages, change status, delete."""
    permission_classes = [permissions.IsAdminUser]
    queryset = ContactInquiry.objects.all().order_by('-created_at')
    serializer_class = ContactInquirySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'email', 'phone', 'subject', 'message']
    ordering_fields = ['created_at']

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        inquiry = self.get_object()
        new_status = request.data.get('status')
        if new_status in ['new', 'in_review', 'replied', 'archived']:
            inquiry.status = new_status
            inquiry.save()
            return Response({'status': inquiry.status})
        return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)


class AdminNewsletterSubscriberViewSet(viewsets.ModelViewSet):
    """Full newsletter subscriber management: view, toggle active, delete."""
    permission_classes = [permissions.IsAdminUser]
    queryset = NewsletterSubscriber.objects.all().order_by('-subscribed_at')
    serializer_class = NewsletterSubscriberSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['email']
    ordering_fields = ['subscribed_at']

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        subscriber = self.get_object()
        subscriber.is_active = not subscriber.is_active
        subscriber.save()
        return Response({'is_active': subscriber.is_active})


class HeroSlideViewSet(viewsets.ModelViewSet):
    """
    Dedicated endpoint for the homepage hero image slider.
    Public requests see active slides ordered by display_order.
    Staff/Admin users can create, update, reorder, toggle, and delete slides.
    """
    queryset = HeroSlide.objects.all().order_by('display_order', '-created_at')
    serializer_class = HeroSlideSerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['title', 'title_en', 'subtitle', 'subtitle_en']
    ordering_fields = ['display_order', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get_queryset(self):
        if self.request.user.is_staff:
            return HeroSlide.objects.all().order_by('display_order', '-created_at')
        return HeroSlide.objects.filter(is_active=True).order_by('display_order', '-created_at')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def toggle_active(self, request, pk=None):
        slide = self.get_object()
        slide.is_active = not slide.is_active
        slide.save()
        return Response({'is_active': slide.is_active})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def set_order(self, request, pk=None):
        slide = self.get_object()
        new_order = request.data.get('display_order')
        if new_order is not None:
            slide.display_order = int(new_order)
            slide.save()
            return Response({'display_order': slide.display_order})
        return Response({'error': 'Missing display_order'}, status=status.HTTP_400_BAD_REQUEST)


class HealthCheckView(APIView):
    """
    Health check endpoint for Docker, Kubernetes, and load balancers.
    Checks database connectivity and server responsiveness.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        from django.db import connection
        db_ok = True
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
        except Exception:
            db_ok = False

        status_code = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response({
            'status': 'healthy' if db_ok else 'degraded',
            'database': 'connected' if db_ok else 'disconnected',
            'timestamp': timezone.now().isoformat(),
            'version': '1.0.0',
            'service': 'themadstory-api'
        }, status=status_code)


class MediaUploadView(APIView):
    """
    Dedicated endpoint for uploading images to Cloudflare R2 / media storage.
    Accessible to authenticated users (authors, editors, admins).
    Validates file formats (jpg, jpeg, png, webp, gif, svg, avif) and 15MB limit.
    Returns: { "url": "...", "filename": "...", "size": ... }
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file') or request.FILES.get('image')
        if not file_obj:
            return Response({'error': 'No image file was provided in request.'}, status=status.HTTP_400_BAD_REQUEST)

        # 15 MB limit
        if file_obj.size > 15 * 1024 * 1024:
            return Response({'error': 'File size exceeds maximum allowable limit (15MB).'}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file_obj.name)[1].lower()
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']
        if ext not in allowed_extensions:
            return Response({
                'error': f'Unsupported file format "{ext}". Allowed formats: {", ".join(allowed_extensions)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        if ext != '.svg':
            try:
                from PIL import Image
                img = Image.open(file_obj)
                img.verify()
                file_obj.seek(0)
            except Exception:
                return Response({'error': 'Uploaded file is not a valid or readable image.'}, status=status.HTTP_400_BAD_REQUEST)

        now = datetime.now()
        clean_name = os.path.splitext(file_obj.name)[0].replace(' ', '_')[:35]
        clean_name = "".join(c for c in clean_name if c.isalnum() or c in ('_', '-'))
        unique_filename = f"uploads/{now.strftime('%Y/%m')}/{uuid.uuid4().hex[:10]}_{clean_name}{ext}"

        saved_path = default_storage.save(unique_filename, file_obj)
        file_url = default_storage.url(saved_path)

        if not file_url.startswith(('http://', 'https://')):
            file_url = request.build_absolute_uri(file_url)

        return Response({
            'url': file_url,
            'filename': os.path.basename(saved_path),
            'size': file_obj.size,
            'content_type': getattr(file_obj, 'content_type', 'image/jpeg')
        }, status=status.HTTP_201_CREATED)
