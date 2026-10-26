from rest_framework import serializers
from django.contrib.auth.models import User
from drf_spectacular.utils import extend_schema_field
from .models import (
    Category, Article, PostHeart, Comment, HomepageCustomization,
    SiteSetting, ContactInquiry, NewsletterSubscriber, HeroSlide
)


class UserSerializer(serializers.ModelSerializer):
    articles_count = serializers.IntegerField(source='articles.count', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'is_active', 'date_joined', 'articles_count']
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
        fields = ['id', 'name', 'name_en', 'slug', 'description', 'description_en', 'display_order', 'articles_count']


class CategorySerializer(serializers.ModelSerializer):
    subcategories = SubCategorySerializer(many=True, read_only=True)
    articles_count = serializers.IntegerField(source='articles.count', read_only=True)

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'name_en', 'slug', 'description', 'description_en',
            'parent', 'subcategories', 'display_order', 'is_nav_visible', 'articles_count'
        ]
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True}
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

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'title_en', 'slug', 'categories', 'category_name', 'category_name_en', 'category_slug',
            'excerpt', 'excerpt_en', 'image', 'author_name', 'reading_time', 'reading_time_en',
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

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'title_en', 'slug', 'categories', 'excerpt', 'excerpt_en',
            'content', 'content_en', 'image', 'author_name', 'reading_time', 'reading_time_en',
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


class ArticleWriteSerializer(serializers.ModelSerializer):
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), many=True, write_only=True, required=False
    )

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'title_en', 'slug', 'category_ids', 'excerpt', 'excerpt_en',
            'content', 'content_en', 'cover_image', 'cover_image_url',
            'reading_time', 'reading_time_en', 'status'
        ]
        read_only_fields = ['id', 'slug']

    def create(self, validated_data):
        category_ids = validated_data.pop('category_ids', [])
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        # Writers submit as 'pending_approval' or 'draft', Admins can set 'published' directly
        status = validated_data.pop('status', 'pending_approval')
        if user and not user.is_staff and status == 'published':
            status = 'pending_approval'

        author_name = user.get_full_name() or user.username if user else 'The Mad Story Desk'

        article = Article.objects.create(
            author=user,
            author_name=author_name,
            status=status,
            **validated_data
        )
        if category_ids:
            article.categories.set(category_ids)
        return article

    def update(self, instance, validated_data):
        category_ids = validated_data.pop('category_ids', None)
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        if user and not user.is_staff and validated_data.get('status') == 'published':
            validated_data['status'] = 'pending_approval'

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if category_ids is not None:
            instance.categories.set(category_ids)
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
            'show_hero', 'show_lead', 'show_art_culture', 'show_category_blocks',
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
