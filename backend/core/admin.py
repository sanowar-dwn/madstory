from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Category, Article, PostHeart, Comment, HomepageCustomization,
    SiteSetting, ContactInquiry, NewsletterSubscriber, HeroSlide
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'name_en', 'slug', 'parent', 'display_order', 'is_nav_visible', 'articles_count')
    list_filter = ('is_nav_visible', 'parent')
    search_fields = ('name', 'name_en', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('display_order', 'name')

    def articles_count(self, obj):
        return obj.articles.count()
    articles_count.short_description = 'Articles'


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'author_name', 'status', 'category_list',
        'is_featured_hero', 'is_colti_trending', 'is_nirbachito_choice',
        'hearts_count', 'comments_count', 'view_count', 'published_at', 'thumbnail_preview'
    )
    list_filter = (
        'status', 'categories', 'is_featured_hero',
        'is_colti_trending', 'is_nirbachito_choice', 'published_at'
    )
    search_fields = ('title', 'title_en', 'slug', 'excerpt', 'content', 'author_name')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'published_at'
    ordering = ('-published_at',)
    list_editable = ('status', 'is_featured_hero', 'is_colti_trending', 'is_nirbachito_choice')
    filter_horizontal = ('categories',)

    def category_list(self, obj):
        return ", ".join([c.name for c in obj.categories.all()[:3]])
    category_list.short_description = 'Categories'

    def thumbnail_preview(self, obj):
        img_url = obj.image
        if img_url:
            return format_html('<img src="{}" style="width: 50px; height: 35px; object-fit: cover; border-radius: 3px;" />', img_url)
        return '-'
    thumbnail_preview.short_description = 'Cover'


@admin.register(PostHeart)
class PostHeartAdmin(admin.ModelAdmin):
    list_display = ('user', 'article', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__username', 'article__title')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('user', 'article', 'parent', 'content_snippet', 'is_approved', 'created_at')
    list_filter = ('is_approved', 'created_at')
    search_fields = ('user__username', 'article__title', 'content')
    list_editable = ('is_approved',)

    def content_snippet(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_snippet.short_description = 'Comment'


@admin.register(HomepageCustomization)
class HomepageCustomizationAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'updated_at', 'show_hero', 'show_lead', 'show_art_culture')
    filter_horizontal = ('hero_articles', 'colti_articles', 'nirbachito_articles', 'art_culture_articles', 'featured_categories')

    def has_add_permission(self, request):
        return not HomepageCustomization.objects.exists()


@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ('site_name', 'email', 'phone')

    def has_add_permission(self, request):
        return not SiteSetting.objects.exists()


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'subject', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('created_at',)
    list_editable = ('status',)


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_active', 'subscribed_at')
    list_filter = ('is_active', 'subscribed_at')
    search_fields = ('email',)


@admin.register(HeroSlide)
class HeroSlideAdmin(admin.ModelAdmin):
    list_display = ('title', 'title_en', 'button_text', 'button_link', 'display_order', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('title', 'title_en', 'subtitle', 'subtitle_en')
    list_editable = ('display_order', 'is_active')
