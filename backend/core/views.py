from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import F, Count, Q
from django.contrib.auth.models import User
from django.utils import timezone
from django.http import Http404
from django.core.files.storage import default_storage
from rest_framework_simplejwt.tokens import RefreshToken
import os
import uuid
import urllib.parse
from datetime import datetime

from .models import (
    Category, Article, PostHeart, Comment, HomepageCustomization,
    SiteSetting, ContactInquiry, NewsletterSubscriber, HeroSlide,
    AuthorProfile
)
from .serializers import (
    CategorySerializer, ArticleListSerializer, ArticleDetailSerializer,
    ArticleWriteSerializer, CommentSerializer, CommentCreateSerializer,
    HomepageCustomizationSerializer, SiteSettingSerializer,
    ContactInquirySerializer, NewsletterSubscriberSerializer,
    UserSerializer, RegisterSerializer, AdminUserCreateUpdateSerializer,
    AdminCommentSerializer, HeroSlideSerializer, AuthorProfileSerializer,
    AuthorDetailSerializer, AuthorSummarySerializer
)


def resolve_slug_candidates(raw_val):
    """
    Robustly resolves a URL-provided slug into potential match candidates.
    Handles:
      - Raw Unicode Bengali / non-ASCII characters
      - Percent-encoded URLs (%E0%A6...)
      - Double-encoded URLs
      - ISO-8859-1 (Latin-1) mojibake from WSGI/Passenger PEP 3333 environments
    """
    if not raw_val:
        return []
    raw_str = str(raw_val).strip()
    candidates = [raw_str]

    # 1. URL unquoted
    try:
        unquoted = urllib.parse.unquote(raw_str)
        if unquoted and unquoted not in candidates:
            candidates.append(unquoted)
    except Exception:
        pass

    # 2. Latin-1 mojibake reversed to UTF-8
    for s in list(candidates):
        try:
            fixed = s.encode('latin-1').decode('utf-8')
            if fixed and fixed not in candidates:
                candidates.append(fixed)
        except Exception:
            pass

    # 3. Double unquoted
    for s in list(candidates):
        try:
            d_unquoted = urllib.parse.unquote(s)
            if d_unquoted and d_unquoted not in candidates:
                candidates.append(d_unquoted)
        except Exception:
            pass

    return candidates


class IsAuthorOrStaff(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user or request.user.is_staff


class CategoryViewSet(viewsets.ModelViewSet):
    """API endpoint for magazine categories and navigation trees."""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['slug', 'id', 'is_nav_visible', 'is_featured', 'parent']
    search_fields = ['name', 'name_en', 'description', 'description_en']
    ordering_fields = ['display_order', 'name', 'created_at']

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        raw_val = self.kwargs.get(lookup_url_kwarg)
        if not raw_val:
            return super().get_object()

        candidates = resolve_slug_candidates(raw_val)
        q_filter = Q(slug__in=candidates)
        if str(raw_val).isdigit():
            q_filter |= Q(id=int(raw_val))

        obj = queryset.filter(q_filter).first()
        if not obj:
            raise Http404("No Category matches the given query.")

        self.check_object_permissions(self.request, obj)
        return obj

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'featured']:
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
    def toggle_featured(self, request, slug=None):
        category = self.get_object()
        category.is_featured = not category.is_featured
        category.save(update_fields=['is_featured'])
        custom = HomepageCustomization.objects.first()
        if custom:
            if category.is_featured:
                custom.featured_categories.add(category)
            else:
                custom.featured_categories.remove(category)
        return Response({'is_featured': category.is_featured})

    @action(detail=False, methods=['get'])
    def featured(self, request):
        custom = HomepageCustomization.objects.first()
        custom_ids = list(custom.featured_categories.values_list('id', flat=True)) if custom else []
        from django.db.models import Q
        categories = Category.objects.filter(Q(is_featured=True) | Q(id__in=custom_ids)).distinct().order_by('display_order', 'name')
        return Response(CategorySerializer(categories, many=True, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def set_order(self, request, slug=None):
        category = self.get_object()
        new_order = request.data.get('display_order')
        if new_order is not None:
            category.display_order = int(new_order)
            category.save()
            return Response({'display_order': category.display_order})
        return Response({'error': 'Missing display_order'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def reorder(self, request):
        """
        Bulk update categories display_order.
        Accepts:
          - order_ids: list of category IDs in the desired order, e.g. [3, 1, 4]
          or
          - orders: list of objects: [{'id': 3, 'display_order': 1}, {'slug': 'art', 'display_order': 2}]
        """
        order_ids = request.data.get('order_ids')
        if not order_ids and hasattr(request.data, 'getlist'):
            order_ids = request.data.getlist('order_ids') or request.data.getlist('order_ids[]')

        orders = request.data.get('orders')

        if order_ids and isinstance(order_ids, (list, tuple)):
            orders = [{'id': item_id, 'display_order': index + 1} for index, item_id in enumerate(order_ids)]

        if not orders or not isinstance(orders, (list, tuple)):
            return Response({'error': 'Please provide "orders" list or "order_ids" list'}, status=status.HTTP_400_BAD_REQUEST)

        id_to_order = {}
        slug_to_order = {}
        for item in orders:
            if not isinstance(item, dict):
                continue
            order_val = item.get('display_order')
            if order_val is None:
                continue
            try:
                order_int = max(0, int(order_val))
            except (ValueError, TypeError):
                continue

            if 'id' in item and item['id'] is not None:
                id_to_order[item['id']] = order_int
            elif 'slug' in item and item['slug']:
                slug_to_order[item['slug']] = order_int

        if not id_to_order and not slug_to_order:
            return Response({'error': 'No valid category order entries provided'}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = 0
        from django.db import transaction
        with transaction.atomic():
            if id_to_order:
                categories = Category.objects.filter(id__in=id_to_order.keys())
                for cat in categories:
                    new_val = id_to_order[cat.id]
                    if cat.display_order != new_val:
                        cat.display_order = new_val
                        cat.save(update_fields=['display_order'])
                        updated_count += 1
            if slug_to_order:
                categories = Category.objects.filter(slug__in=slug_to_order.keys())
                for cat in categories:
                    new_val = slug_to_order[cat.slug]
                    if cat.display_order != new_val:
                        cat.display_order = new_val
                        cat.save(update_fields=['display_order'])
                        updated_count += 1

        return Response({'status': 'ok', 'updated_count': updated_count})


class ArticleViewSet(viewsets.ModelViewSet):
    """
    API endpoint for magazine articles.
    Authenticated users can write articles. Staff can approve and manage them.
    """
    queryset = Article.objects.all()
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['slug', 'id', 'categories__slug', 'is_featured_hero', 'is_colti_trending', 'is_nirbachito_choice', 'status', 'author__username']
    search_fields = ['title', 'title_en', 'excerpt', 'excerpt_en', 'content', 'author_name']
    ordering_fields = ['published_at', 'view_count', 'created_at']

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        raw_val = self.kwargs.get(lookup_url_kwarg)
        if not raw_val:
            return super().get_object()

        candidates = resolve_slug_candidates(raw_val)
        q_filter = Q(slug__in=candidates)
        if str(raw_val).isdigit():
            q_filter |= Q(id=int(raw_val))

        obj = queryset.filter(q_filter).first()
        if not obj:
            raise Http404("No Article matches the given query.")

        self.check_object_permissions(self.request, obj)
        return obj

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
        # Regular public feeds only see published articles
        if self.action in ['featured_hero', 'colti_trending', 'nirbachito', 'popular', 'magazine_home']:
            category_slug = self.request.query_params.get('category__slug') or self.request.query_params.get('categories__slug') or self.request.query_params.get('category')
            author_param = self.request.query_params.get('author') or self.request.query_params.get('author__username')
            qs = Article.objects.filter(status='published')
            if category_slug:
                qs = qs.filter(categories__slug=category_slug)
            if author_param:
                if str(author_param).isdigit():
                    qs = qs.filter(Q(author__id=int(author_param)) | Q(author__username=author_param))
                else:
                    qs = qs.filter(author__username=author_param)
            return qs.distinct()
        elif self.action == 'list':
            category_slug = self.request.query_params.get('category__slug') or self.request.query_params.get('categories__slug') or self.request.query_params.get('category')
            author_param = self.request.query_params.get('author') or self.request.query_params.get('author__username')
            status_param = self.request.query_params.get('status')

            if user.is_authenticated and user.is_staff and status_param:
                if status_param == 'all':
                    qs = Article.objects.all()
                else:
                    qs = Article.objects.filter(status=status_param)
            else:
                qs = Article.objects.filter(status='published')

            if category_slug:
                qs = qs.filter(categories__slug=category_slug)
            if author_param:
                if str(author_param).isdigit():
                    qs = qs.filter(Q(author__id=int(author_param)) | Q(author__username=author_param))
                else:
                    qs = qs.filter(author__username=author_param)
            return qs.distinct()
        elif self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            if user.is_authenticated:
                if user.is_staff:
                    return Article.objects.all()
                return Article.objects.filter(Q(status='published') | Q(author=user))
            return Article.objects.filter(status='published')
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
        if instance.status == 'published':
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
            new_val = not current_val
            setattr(article, flag, new_val)
            article.save()

            # Keep HomepageCustomization in sync if present
            custom = HomepageCustomization.objects.first()
            if custom:
                if flag == 'is_colti_trending':
                    if new_val:
                        custom.colti_articles.add(article)
                    else:
                        custom.colti_articles.remove(article)
                elif flag == 'is_nirbachito_choice':
                    if new_val:
                        custom.nirbachito_articles.add(article)
                    else:
                        custom.nirbachito_articles.remove(article)
                elif flag == 'is_featured_hero':
                    if new_val:
                        custom.hero_articles.add(article)
                    else:
                        custom.hero_articles.remove(article)

            return Response({
                'status': 'success',
                'flag': flag,
                'value': new_val
            })
        return Response({'error': 'Invalid flag'}, status=status.HTTP_400_BAD_REQUEST)

    # -------------------------------------------------------------
    # Homepage Curation Endpoints
    # -------------------------------------------------------------
    @action(detail=False, methods=['get'])
    def featured_hero(self, request):
        # Only articles explicitly flagged as special featured (বিশেষ ফিচার)
        articles = self.get_queryset().filter(is_featured_hero=True)[:6]
        return Response(ArticleListSerializer(articles, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def colti_trending(self, request):
        # Only articles explicitly flagged as trending
        articles = self.get_queryset().filter(is_colti_trending=True)[:6]
        return Response(ArticleListSerializer(articles, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def nirbachito(self, request):
        # Only articles explicitly flagged as editor's choice
        articles = self.get_queryset().filter(is_nirbachito_choice=True)[:4]
        return Response(ArticleListSerializer(articles, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        articles = self.get_queryset().order_by('-view_count', '-published_at')[:6]
        return Response(ArticleListSerializer(articles, many=True, context={'request': request}).data)

    @action(detail=False, methods=['get'])
    def magazine_home(self, request):
        # Only articles explicitly flagged with these three editorial flags
        hero = self.get_queryset().filter(is_featured_hero=True)[:6]
        colti = self.get_queryset().filter(is_colti_trending=True)[:6]
        nirbachito = self.get_queryset().filter(is_nirbachito_choice=True)[:4]
        popular = self.get_queryset().order_by('-view_count', '-published_at')[:6]
        recent = self.get_queryset()[:12]

        custom = HomepageCustomization.objects.first()
        custom_ids = list(custom.featured_categories.values_list('id', flat=True)) if custom else []
        from django.db.models import Q
        featured_cats = Category.objects.filter(Q(is_featured=True) | Q(id__in=custom_ids)).distinct().order_by('display_order', 'name')

        return Response({
            'hero': ArticleListSerializer(hero, many=True, context={'request': request}).data,
            'colti': ArticleListSerializer(colti, many=True, context={'request': request}).data,
            'nirbachito': ArticleListSerializer(nirbachito, many=True, context={'request': request}).data,
            'popular': ArticleListSerializer(popular, many=True, context={'request': request}).data,
            'recent': ArticleListSerializer(recent, many=True, context={'request': request}).data,
            'featured_categories': CategorySerializer(featured_cats, many=True, context={'request': request}).data,
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
        user = request.user
        # Ensure profile exists
        AuthorProfile.objects.get_or_create(user=user)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        profile, _ = AuthorProfile.objects.get_or_create(user=user)

        # Update core user fields if present
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        user_serializer.is_valid(raise_exception=True)
        user_serializer.save()

        # Update profile fields if present in nested 'profile' object or top-level payload
        profile_data = request.data.get('profile')
        if not isinstance(profile_data, dict):
            profile_data = request.data

        profile_fields = [
            'display_name', 'display_name_en', 'designation', 'designation_en',
            'bio', 'bio_en', 'avatar', 'cover_image', 'location', 'location_en',
            'website', 'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url', 'github_url'
        ]
        has_profile_updates = False
        for f in profile_fields:
            if f in profile_data:
                setattr(profile, f, profile_data[f])
                has_profile_updates = True
        if has_profile_updates:
            profile.save()

        user.refresh_from_db()
        return Response(UserSerializer(user).data)


class AuthorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for authors & contributors:
      - /api/authors/ (list authors with articles/profiles)
      - /api/authors/<username>/ (author profile details & stats)
      - /api/authors/<username>/articles/ (paginated articles by author)
      - /api/authors/me/ (current user profile read & customization)
    """
    queryset = User.objects.filter(is_active=True).select_related('profile').order_by('-date_joined')
    serializer_class = AuthorDetailSerializer
    lookup_field = 'username'
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'profile__display_name', 'profile__display_name_en', 'profile__designation']
    ordering_fields = ['date_joined', 'username']

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        raw_val = self.kwargs.get(lookup_url_kwarg)
        if not raw_val:
            return super().get_object()

        candidates = resolve_slug_candidates(raw_val)
        q_filter = Q(username__in=candidates) | Q(username__iexact=raw_val)
        if str(raw_val).isdigit():
            q_filter |= Q(id=int(raw_val))

        obj = queryset.filter(q_filter).first()
        if not obj:
            # Fallback: check all active users
            obj = User.objects.filter(is_active=True).filter(q_filter).first()
        if not obj:
            raise Http404("Author not found.")
        self.check_object_permissions(self.request, obj)
        return obj

    def get_permissions(self):
        if self.action in ['me']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    @action(detail=False, methods=['get', 'patch', 'put'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        user = request.user
        profile, _ = AuthorProfile.objects.get_or_create(user=user)

        if request.method in ['PATCH', 'PUT']:
            user_fields = ['first_name', 'last_name', 'email']
            for field in user_fields:
                if field in request.data:
                    setattr(user, field, request.data[field])
            user.save()

            profile_data = request.data.get('profile')
            if not isinstance(profile_data, dict):
                profile_data = request.data

            profile_serializer = AuthorProfileSerializer(profile, data=profile_data, partial=True)
            profile_serializer.is_valid(raise_exception=True)
            profile_serializer.save()

            user.refresh_from_db()

        serializer = AuthorDetailSerializer(user, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def articles(self, request, username=None):
        author = self.get_object()
        ordering = request.query_params.get('ordering', '-published_at')
        allowed_orderings = ['-published_at', 'published_at', '-view_count', 'view_count']

        articles = Article.objects.filter(author=author, status='published')
        search_query = request.query_params.get('search', '').strip()
        if search_query:
            articles = articles.filter(
                Q(title__icontains=search_query) |
                Q(title_en__icontains=search_query) |
                Q(excerpt__icontains=search_query)
            )

        if ordering in allowed_orderings:
            articles = articles.order_by(ordering)
        elif ordering == '-hearts':
            articles = articles.annotate(hearts_total=Count('hearts')).order_by('-hearts_total')
        else:
            articles = articles.order_by('-published_at')

        page = self.paginate_queryset(articles)
        if page is not None:
            serializer = ArticleListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = ArticleListSerializer(articles, many=True, context={'request': request})
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
            host = request.get_host().lower()
            if any(h in host for h in ('127.0.0.1', 'localhost')):
                # In local development, retain relative URL so local host is not baked into DB
                pass
            else:
                file_url = request.build_absolute_uri(file_url)

        return Response({
            'url': file_url,
            'filename': os.path.basename(saved_path),
            'size': file_obj.size,
            'content_type': getattr(file_obj, 'content_type', 'image/jpeg')
        }, status=status.HTTP_201_CREATED)
