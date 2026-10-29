from rest_framework import serializers
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from .models import (
    Category, Article, PostHeart, Comment, HomepageCustomization,
    SiteSetting, ContactInquiry, NewsletterSubscriber, HeroSlide,
    AuthorProfile
)


class AuthorProfileSerializer(serializers.ModelSerializer):
    effective_avatar = serializers.CharField(read_only=True)
    effective_cover = serializers.CharField(read_only=True)

    class Meta:
        model = AuthorProfile
        fields = [
            'id', 'display_name', 'display_name_en', 'designation', 'designation_en',
            'bio', 'bio_en', 'avatar', 'avatar_image', 'cover_image', 'cover_image_file',
            'effective_avatar', 'effective_cover',
            'location', 'location_en', 'website',
            'facebook_url', 'twitter_url', 'instagram_url', 'linkedin_url', 'github_url',
            'is_featured', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'effective_avatar', 'effective_cover']
        extra_kwargs = {
            'avatar_image': {'required': False, 'allow_null': True},
            'cover_image_file': {'required': False, 'allow_null': True},
            'avatar': {'required': False, 'allow_blank': True},
            'cover_image': {'required': False, 'allow_blank': True},
            'website': {'required': False, 'allow_blank': True},
            'facebook_url': {'required': False, 'allow_blank': True},
            'twitter_url': {'required': False, 'allow_blank': True},
            'instagram_url': {'required': False, 'allow_blank': True},
            'linkedin_url': {'required': False, 'allow_blank': True},
            'github_url': {'required': False, 'allow_blank': True},
        }


class AuthorSummarySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    designation_en = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()
    bio_en = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'avatar', 'cover_image', 'designation', 'designation_en', 'bio', 'bio_en']

    def get_name(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.display_name:
            return profile.display_name
        full = obj.get_full_name()
        return full if full else obj.username

    def get_avatar(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.effective_avatar if profile else ''

    def get_cover_image(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.effective_cover if profile else ''

    def get_designation(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.designation if (profile and profile.designation) else 'লেখক'

    def get_designation_en(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.designation_en if (profile and profile.designation_en) else 'Author'

    def get_bio(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.bio if profile else ''

    def get_bio_en(self, obj):
        profile = getattr(obj, 'profile', None)
        return profile.bio_en if profile else ''


class UserSerializer(serializers.ModelSerializer):
    articles_count = serializers.IntegerField(source='articles.count', read_only=True)
    profile = AuthorProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'is_staff', 'is_superuser', 'is_active', 'date_joined',
            'articles_count', 'profile'
        ]
        read_only_fields = ['id', 'date_joined', 'articles_count']


class AdminUserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active']

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class SubCategorySerializer(serializers.ModelSerializer):
    articles_count = serializers.IntegerField(source='articles.count', read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'name_en', 'slug', 'description', 'description_en',
            'thumbnail', 'banner', 'display_order', 'is_nav_visible', 'is_featured', 'articles_count'
        ]


class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)
    articles_count = serializers.IntegerField(source='articles.count', read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'name_en', 'slug', 'description', 'description_en',
            'thumbnail', 'thumbnail_image', 'banner', 'banner_image',
            'parent', 'subcategories', 'display_order',
            'is_nav_visible', 'is_featured', 'articles_count'
        ]
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
            'thumbnail': {'required': False, 'allow_blank': True},
            'thumbnail_image': {'required': False, 'allow_null': True},
            'banner': {'required': False, 'allow_blank': True},
            'banner_image': {'required': False, 'allow_null': True}
        }


class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    replies = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'id', 'article', 'user', 'user_name', 'parent', 'content',
            'created_at', 'replies', 'is_owner'
        ]
        read_only_fields = ['id', 'article', 'user', 'user_name', 'created_at']

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(
                obj.replies.filter(is_approved=True).order_by('created_at'),
                many=True,
                context=self.context
            ).data
        return []

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.user == request.user or request.user.is_staff
        return False


class CommentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'parent', 'content']

    def create(self, validated_data):
        request = self.context.get('request')
        article = self.context.get('article')
        comment = Comment.objects.create(
            user=request.user,
            article=article,
            **validated_data
        )
        return comment


class ArticleListSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    category_name = serializers.SerializerMethodField()
    category_name_en = serializers.SerializerMethodField()
    category_slug = serializers.SerializerMethodField()
    image = serializers.CharField(read_only=True)
    hearts_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    is_hearted = serializers.SerializerMethodField()
    author = AuthorSummarySerializer(read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'title_en', 'slug', 'categories', 'category_name', 'category_name_en', 'category_slug',
            'excerpt', 'excerpt_en', 'image', 'author', 'author_name', 'reading_time', 'reading_time_en',
            'is_featured_hero', 'is_colti_trending', 'is_nirbachito_choice',
            'view_count', 'status', 'published_at', 'hearts_count', 'comments_count', 'is_hearted'
        ]

    @extend_schema_field(serializers.CharField())
    def get_category_name(self, obj):
        first = obj.categories.first()
        return first.name if first else 'লাইফস্টাইল'

    @extend_schema_field(serializers.CharField())
    def get_category_name_en(self, obj):
        first = obj.categories.first()
        if first:
            return first.name_en or first.name
        return 'Lifestyle'

    @extend_schema_field(serializers.CharField())
    def get_category_slug(self, obj):
        first = obj.categories.first()
        return first.slug if first else 'lifestyle'

    @extend_schema_field(serializers.BooleanField())
    def get_is_hearted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.hearts.filter(user=request.user).exists()
        return False


class ArticleDetailSerializer(serializers.ModelSerializer):
    categories = CategorySerializer(many=True, read_only=True)
    image = serializers.CharField(read_only=True)
    hearts_count = serializers.IntegerField(read_only=True)
    comments_count = serializers.IntegerField(read_only=True)
    is_hearted = serializers.SerializerMethodField()
    related_articles = serializers.SerializerMethodField()
    author = AuthorSummarySerializer(read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'title_en', 'slug', 'categories', 'excerpt', 'excerpt_en',
            'content', 'content_en', 'image', 'author', 'author_name', 'reading_time', 'reading_time_en',
            'is_featured_hero', 'is_colti_trending', 'is_nirbachito_choice',
            'view_count', 'status', 'published_at', 'hearts_count', 'comments_count',
            'is_hearted', 'related_articles'
        ]

    @extend_schema_field(serializers.BooleanField())
    def get_is_hearted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.hearts.filter(user=request.user).exists()
        return False

    @extend_schema_field(ArticleListSerializer(many=True))
    def get_related_articles(self, obj):
        first_cat = obj.categories.first()
        if first_cat:
            related = Article.objects.filter(
                categories=first_cat, status='published'
            ).exclude(id=obj.id).distinct()[:4]
        else:
            related = Article.objects.filter(status='published').exclude(id=obj.id)[:4]
        return ArticleListSerializer(related, many=True, context=self.context).data


class AuthorDetailSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    profile = AuthorProfileSerializer(read_only=True)
    articles_count = serializers.SerializerMethodField()
    total_views = serializers.SerializerMethodField()
    total_hearts = serializers.SerializerMethodField()
    recent_articles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'name', 'first_name', 'last_name',
            'date_joined', 'is_staff', 'profile',
            'articles_count', 'total_views', 'total_hearts', 'recent_articles'
        ]

    def get_name(self, obj):
        profile = getattr(obj, 'profile', None)
        if profile and profile.display_name:
            return profile.display_name
        full = obj.get_full_name()
        return full if full else obj.username

    def get_articles_count(self, obj):
        return obj.articles.filter(status='published').count()

    def get_total_views(self, obj):
        return sum(obj.articles.filter(status='published').values_list('view_count', flat=True))

    def get_total_hearts(self, obj):
        return PostHeart.objects.filter(article__author=obj, article__status='published').count()

    def get_recent_articles(self, obj):
        articles = obj.articles.filter(status='published').order_by('-published_at')[:12]
        return ArticleListSerializer(articles, many=True, context=self.context).data


class ArticleWriteSerializer(serializers.ModelSerializer):
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), many=True, write_only=True, required=False
    )

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'title_en', 'slug', 'category_ids', 'excerpt', 'excerpt_en',
            'content', 'content_en', 'cover_image', 'cover_image_url',
            'reading_time', 'reading_time_en', 'status',
            'is_featured_hero', 'is_colti_trending', 'is_nirbachito_choice'
        ]
        read_only_fields = ['id', 'slug']

    def create(self, validated_data):
        category_ids = validated_data.pop('category_ids', [])
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Writers submit as 'pending_approval' or 'draft', Admins can set 'published' directly
        status = validated_data.pop('status', 'pending_approval')
        if user and not user.is_staff:
            status = 'pending_approval'
            validated_data.pop('is_featured_hero', None)
            validated_data.pop('is_colti_trending', None)
            validated_data.pop('is_nirbachito_choice', None)

        author_name = 'The Mad Story Desk'
        if user:
            profile = getattr(user, 'profile', None)
            if profile and profile.display_name:
                author_name = profile.display_name
            else:
                author_name = user.get_full_name() or user.username

        article = Article.objects.create(
            author=user,
            author_name=author_name,
            status=status,
            **validated_data
        )
        if category_ids:
            article.categories.set(category_ids)

        custom = HomepageCustomization.objects.first()
        if custom:
            if article.is_featured_hero:
                custom.hero_articles.add(article)
            if article.is_colti_trending:
                custom.colti_articles.add(article)
            if article.is_nirbachito_choice:
                custom.nirbachito_articles.add(article)

        return article

    def update(self, instance, validated_data):
        category_ids = validated_data.pop('category_ids', None)
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        if user and not user.is_staff:
            if validated_data.get('status') == 'published':
                validated_data['status'] = 'pending_approval'
            validated_data.pop('is_featured_hero', None)
            validated_data.pop('is_colti_trending', None)
            validated_data.pop('is_nirbachito_choice', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if category_ids is not None:
            instance.categories.set(category_ids)

        # Sync with HomepageCustomization if editorial flags changed
        custom = HomepageCustomization.objects.first()
        if custom:
            if 'is_featured_hero' in validated_data:
                if instance.is_featured_hero:
                    custom.hero_articles.add(instance)
                else:
                    custom.hero_articles.remove(instance)
            if 'is_colti_trending' in validated_data:
                if instance.is_colti_trending:
                    custom.colti_articles.add(instance)
                else:
                    custom.colti_articles.remove(instance)
            if 'is_nirbachito_choice' in validated_data:
                if instance.is_nirbachito_choice:
                    custom.nirbachito_articles.add(instance)
                else:
                    custom.nirbachito_articles.remove(instance)

        return instance


class HomepageCustomizationSerializer(serializers.ModelSerializer):
    hero_article_details = ArticleListSerializer(source='hero_articles', many=True, read_only=True)
    colti_article_details = ArticleListSerializer(source='colti_articles', many=True, read_only=True)
    nirbachito_article_details = ArticleListSerializer(source='nirbachito_articles', many=True, read_only=True)
    art_culture_article_details = ArticleListSerializer(source='art_culture_articles', many=True, read_only=True)
    featured_category_details = CategorySerializer(source='featured_categories', many=True, read_only=True)

    class Meta:
        model = HomepageCustomization
        fields = [
            'id', 'hero_articles', 'colti_articles', 'nirbachito_articles',
            'art_culture_articles', 'featured_categories',
            'hero_article_details', 'colti_article_details', 'nirbachito_article_details',
            'art_culture_article_details', 'featured_category_details',
            'ticker_text_bn', 'ticker_text_en', 'hero_title_bn', 'hero_title_en',
            'colti_title_bn', 'colti_title_en', 'nirbachito_title_bn', 'nirbachito_title_en',
            'art_culture_title_bn', 'art_culture_title_en',
            'featured_categories_title_bn', 'featured_categories_title_en',
            'show_hero', 'show_featured_categories', 'show_lead', 'show_art_culture', 'show_category_blocks',
            'show_sidebar', 'updated_at'
        ]


class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSetting
        fields = '__all__'


class AdminCommentSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    article_title = serializers.CharField(source='article.title', read_only=True)
    article_slug = serializers.CharField(source='article.slug', read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id', 'article', 'article_title', 'article_slug', 'user', 'user_name',
            'parent', 'content', 'is_approved', 'created_at'
        ]
        read_only_fields = ['id', 'article_title', 'article_slug', 'user_name', 'created_at']


class ContactInquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactInquiry
        fields = ['id', 'name', 'email', 'phone', 'subject', 'message', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ['id', 'email', 'is_active', 'subscribed_at']
        read_only_fields = ['id', 'subscribed_at']


class HeroSlideSerializer(serializers.ModelSerializer):
    link = serializers.CharField(source='button_link', required=False, allow_blank=True)

    class Meta:
        model = HeroSlide
        fields = [
            'id', 'title', 'title_en', 'subtitle', 'subtitle_en', 'image',
            'button_text', 'button_text_en', 'button_link', 'link', 'display_order',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
