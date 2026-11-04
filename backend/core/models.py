from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify
from django.utils import timezone
from django.conf import settings
from ckeditor.fields import RichTextField
import re
import unicodedata
from .transliterate import transliterate_to_english_slug


def normalize_media_url(url):
    """
    Normalizes legacy media URLs (e.g. from previous shared hosting https://api.themadstory.com/media/...)
    to the active MEDIA_URL (such as Cloudflare R2 or local media root).
    """
    if not url:
        return ''
    old_cpanel_prefix = 'https://api.themadstory.com/media/'
    if url.startswith(old_cpanel_prefix):
        rel = url[len(old_cpanel_prefix):]
        media_base = getattr(settings, 'MEDIA_URL', '/media/').rstrip('/') + '/'
        return f"{media_base}{rel}"
    for local_prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
        if url.startswith(local_prefix):
            rel = url[len(local_prefix):]
            if rel.startswith('/media/'):
                rel = rel[len('/media/'):]
                media_base = getattr(settings, 'MEDIA_URL', '/media/').rstrip('/') + '/'
                return f"{media_base}{rel}"
            return rel
    return url


def generate_clean_slug(text, max_words=7, max_chars=75):
    """
    Generates a 100% clean English ASCII slug.
    Transliterates Bengali text to English phonetic characters, ensuring
    URLs never contain non-ASCII characters or percent-encoding (%).
    """
    return transliterate_to_english_slug(text, max_words=max_words, max_chars=max_chars)



def make_unique_slug(model_cls, base_slug, instance_id=None, fallback_prefix='post'):
    if not base_slug:
        base_slug = f"{fallback_prefix}-{int(timezone.now().timestamp())}"
    slug = base_slug
    counter = 1
    qs = model_cls.objects.all()
    if instance_id:
        qs = qs.exclude(id=instance_id)
    while qs.filter(slug=slug).exists():
        counter += 1
        slug = f"{base_slug[:80]}-{counter}"
    return slug



class Category(models.Model):
    name = models.CharField(max_length=150, help_text="Category name in Bengali")
    name_en = models.CharField(max_length=150, blank=True, null=True, help_text="English translation")
    slug = models.SlugField(max_length=200, unique=True, allow_unicode=True)
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories'
    )
    description = models.TextField(blank=True, default='')
    description_en = models.TextField(blank=True, default='')
    thumbnail = models.CharField(max_length=600, blank=True, default='', help_text="Category thumbnail image URL for cards, homepage, and lists")
    thumbnail_image = models.ImageField(upload_to='categories/thumbnails/', blank=True, null=True, help_text="Category thumbnail image file")
    banner = models.CharField(max_length=600, blank=True, default='', help_text="Category wide banner image URL for category detail header page")
    banner_image = models.ImageField(upload_to='categories/banners/', blank=True, null=True, help_text="Category banner image file")
    display_order = models.PositiveIntegerField(default=0)
    is_nav_visible = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Designate as featured category on homepage")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} -> {self.name}"
        return self.name

    @property
    def effective_thumbnail(self):
        url = ''
        if self.thumbnail_image:
            try:
                url = self.thumbnail_image.url
            except Exception:
                url = ''
        elif self.thumbnail:
            url = self.thumbnail
        return normalize_media_url(url)

    @property
    def effective_banner(self):
        url = ''
        if self.banner_image:
            try:
                url = self.banner_image.url
            except Exception:
                url = ''
        elif self.banner:
            url = self.banner
        return normalize_media_url(url)

    def save(self, *args, **kwargs):
        # Guarantee 100% English ASCII slug
        if not self.slug or not all(ord(c) < 128 for c in self.slug):
            source_name = self.name_en.strip() if (self.name_en and self.name_en.strip()) else self.name
            base = generate_clean_slug(source_name, max_words=6, max_chars=60)
            self.slug = make_unique_slug(Category, base, self.id, fallback_prefix='category')
        if self.thumbnail_image:
            try:
                self.thumbnail = self.thumbnail_image.url
            except Exception:
                pass
        if self.thumbnail:
            for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                if self.thumbnail.startswith(prefix):
                    self.thumbnail = self.thumbnail[len(prefix):]
                    break
        if self.banner_image:
            try:
                self.banner = self.banner_image.url
            except Exception:
                pass
        if self.banner:
            for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                if self.banner.startswith(prefix):
                    self.banner = self.banner[len(prefix):]
                    break
        super().save(*args, **kwargs)


class Article(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('published', 'Published'),
        ('rejected', 'Rejected'),
    )

    author = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='articles'
    )
    author_name = models.CharField(max_length=150, default='The Mad Story Desk')
    
    # M2M relationship as requested by user
    categories = models.ManyToManyField(Category, related_name='articles', blank=True)
    
    title = models.CharField(max_length=300)
    title_en = models.CharField(max_length=300, blank=True, default='')
    slug = models.SlugField(max_length=350, unique=True, allow_unicode=True)
    
    excerpt = models.TextField(blank=True, default='')
    excerpt_en = models.TextField(blank=True, default='')
    content = RichTextField(help_text="Full article body content with rich formatting")
    content_en = RichTextField(blank=True, default='', help_text="Full article body content in English")
    
    cover_image = models.ImageField(upload_to='articles/', blank=True, null=True)
    cover_image_url = models.URLField(max_length=600, blank=True, default='', help_text="Fallback or CDN image URL")
    
    reading_time = models.CharField(max_length=50, default='৫ মিনিট পাঠ', blank=True)
    reading_time_en = models.CharField(max_length=50, default='5 min read', blank=True)
    
    # Homepage placement flags
    is_featured_hero = models.BooleanField(default=False, help_text="Featured in Bold Hero Slider")
    is_colti_trending = models.BooleanField(default=False, help_text="Featured in চলতি (Trending Colti Slider)")
    is_nirbachito_choice = models.BooleanField(default=False, help_text="Featured in নির্বাচিত (Editor's Choice 2x2 Grid)")
    
    view_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')
    rejection_reason = models.TextField(blank=True, default='')
    
    published_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status', '-published_at']),
        ]

    def __str__(self):
        return self.title

    @property
    def image(self):
        url = ''
        if self.cover_image:
            try:
                url = self.cover_image.url
            except Exception:
                url = ''
        elif self.cover_image_url:
            url = self.cover_image_url

        if not url:
            return '/assets/images/18-1024x678.jpg'

        return normalize_media_url(url)

    @property
    def hearts_count(self):
        return self.hearts.count()

    @property
    def comments_count(self):
        return self.comments.filter(is_approved=True).count()

    def save(self, *args, **kwargs):
        # Guarantee 100% English ASCII slug
        if not self.slug or not all(ord(c) < 128 for c in self.slug):
            source_title = self.title_en.strip() if (self.title_en and self.title_en.strip()) else self.title
            base = generate_clean_slug(source_title, max_words=7, max_chars=75)
            self.slug = make_unique_slug(Article, base, self.id, fallback_prefix='post')
        if self.cover_image_url:
            for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                if self.cover_image_url.startswith(prefix):
                    self.cover_image_url = self.cover_image_url[len(prefix):]
                    break
        super().save(*args, **kwargs)


class PostHeart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='post_hearts')
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='hearts')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'article')
        indexes = [
            models.Index(fields=['user', 'article']),
        ]

    def __str__(self):
        return f"{self.user.username} hearted {self.article.title}"


class Comment(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies'
    )
    content = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.article.title}"


class HomepageCustomization(models.Model):
    hero_articles = models.ManyToManyField(Article, blank=True, related_name='custom_hero')
    colti_articles = models.ManyToManyField(Article, blank=True, related_name='custom_colti')
    nirbachito_articles = models.ManyToManyField(Article, blank=True, related_name='custom_nirbachito')
    art_culture_articles = models.ManyToManyField(Article, blank=True, related_name='custom_art_culture')
    featured_categories = models.ManyToManyField(Category, blank=True, related_name='custom_categories')
    category_blocks = models.ManyToManyField(Category, blank=True, related_name='custom_category_blocks')

    ticker_text_bn = models.CharField(
        max_length=500,
        default='Spending my Last Day Off on This Beautiful Resort | Driving Convertibles is a Fashion Statement | শব্দেরা খুব চতুর | ইউরোপিয়ান অ্যাক্সেসিবিলিটি অ্যাক্ট ২০২৫'
    )
    ticker_text_en = models.CharField(
        max_length=500,
        default='Spending my Last Day Off on This Beautiful Resort | Driving Convertibles is a Fashion Statement | Words Are Cunning | European Accessibility Act 2025'
    )

    hero_title_bn = models.CharField(max_length=200, default='শীর্ষ সংবাদ ও ফিচার')
    hero_title_en = models.CharField(max_length=200, default='Top Stories & Features')

    colti_title_bn = models.CharField(max_length=100, default='চলতি')
    colti_title_en = models.CharField(max_length=100, default='Trending')

    nirbachito_title_bn = models.CharField(max_length=100, default='নির্বাচিত')
    nirbachito_title_en = models.CharField(max_length=100, default="Editor's Choice")

    art_culture_title_bn = models.CharField(max_length=100, default='শিল্প ও সংস্কৃতি')
    art_culture_title_en = models.CharField(max_length=100, default='Art & Culture')

    featured_categories_title_bn = models.CharField(max_length=150, default='ফিচার্ড ক্যাটাগরি')
    featured_categories_title_en = models.CharField(max_length=150, default='Featured Categories')

    show_hero = models.BooleanField(default=True)
    show_featured_categories = models.BooleanField(default=True)
    show_lead = models.BooleanField(default=True)
    show_art_culture = models.BooleanField(default=True)
    show_category_blocks = models.BooleanField(default=True)
    show_sidebar = models.BooleanField(default=True)
    show_videos = models.BooleanField(default=True)

    videos_title_bn = models.CharField(max_length=150, default='ভিডিও স্টোরি')
    videos_title_en = models.CharField(max_length=150, default='Video Stories')
    videos_subtitle_bn = models.CharField(max_length=250, blank=True, default='বিশেষ সাক্ষাৎকার, ভিজ্যুয়াল স্টোরি ও তথ্যচিত্র')
    videos_subtitle_en = models.CharField(max_length=250, blank=True, default='Interviews, visual stories & cultural documentaries')

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "Homepage Customization Configuration"


class SiteSetting(models.Model):
    site_name = models.CharField(max_length=150, default='The Mad Story')
    tagline_bn = models.CharField(max_length=255, default='শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার ত্রৈমাসিক পত্রিকা')
    tagline_en = models.CharField(max_length=255, default='A Quarterly Magazine on Art, Literature, Culture & Modern Lifestyle')
    logo_en_url = models.CharField(max_length=500, default='/assets/images/Madstory-logo.png')
    logo_bn_url = models.CharField(max_length=500, default='/assets/images/Madstory-logo-bangla.png')
    footer_logo_url = models.CharField(max_length=500, default='/assets/images/Madstory-logo.png', blank=True)
    facebook_url = models.URLField(blank=True, default='https://facebook.com/themadstory')
    twitter_url = models.URLField(blank=True, default='https://twitter.com/themadstory')
    instagram_url = models.URLField(blank=True, default='https://instagram.com/themadstory')
    pinterest_url = models.URLField(blank=True, default='https://pinterest.com/themadstory')
    youtube_url = models.URLField(blank=True, default='https://youtube.com/@themadstory')
    email = models.EmailField(default='editor@themadstory.com')
    phone = models.CharField(max_length=50, default='+880 1711-234567')
    address = models.CharField(max_length=255, default='Dhanmondi, Dhaka 1205, Bangladesh')
    copyright_text_bn = models.CharField(max_length=255, default='© ২০২৬ দ্য ম্যাড স্টোরি। সর্বস্বত্ব সংরক্ষিত।')
    copyright_text_en = models.CharField(max_length=255, default='© 2026 The Mad Story. All Rights Reserved.')

    def __str__(self):
        return self.site_name


class ContactInquiry(models.Model):
    STATUS_CHOICES = (
        ('new', 'New'),
        ('in_review', 'In Review'),
        ('replied', 'Replied'),
        ('archived', 'Archived'),
    )

    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, default='')
    subject = models.CharField(max_length=250, blank=True, default='Website Inquiry')
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Contact Inquiries'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - {self.subject} ({self.email})"


class NewsletterSubscriber(models.Model):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-subscribed_at']

    def __str__(self):
        return self.email


class HeroSlide(models.Model):
    """
    Dedicated hero banner slide module.
    Decoupled from blog articles: provides full control over homepage visual slides.
    """
    title = models.CharField(max_length=250, help_text="Headline in Bengali")
    title_en = models.CharField(max_length=250, blank=True, default='', help_text="Headline in English")
    subtitle = models.CharField(max_length=350, blank=True, default='', help_text="Subtitle/Tagline in Bengali")
    subtitle_en = models.CharField(max_length=350, blank=True, default='', help_text="Subtitle/Tagline in English")
    image = models.CharField(max_length=500, default='/assets/images/18-1024x678.jpg', help_text="Slide image URL or path")
    button_text = models.CharField(max_length=100, blank=True, default='বিস্তারিত দেখুন', help_text="Button text (Bengali)")
    button_text_en = models.CharField(max_length=100, blank=True, default='Explore More', help_text="Button text (English)")
    button_link = models.CharField(max_length=300, blank=True, default='/about', help_text="Target URL or internal path")
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Hero Slide'
        verbose_name_plural = 'Hero Slides'
        ordering = ['display_order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def effective_image(self):
        return normalize_media_url(self.image)


class AuthorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    display_name = models.CharField(max_length=150, blank=True, default='', help_text="Display name / Pen name (Bengali or English)")
    display_name_en = models.CharField(max_length=150, blank=True, default='', help_text="Display name in English")
    designation = models.CharField(max_length=150, blank=True, default='লেখক ও সাংবাদিক', help_text="Role or title in Bengali")
    designation_en = models.CharField(max_length=150, blank=True, default='Author & Contributor', help_text="Role or title in English")
    bio = models.TextField(blank=True, default='', help_text="Biography in Bengali")
    bio_en = models.TextField(blank=True, default='', help_text="Biography in English")
    avatar = models.CharField(max_length=600, blank=True, default='', help_text="Avatar image URL")
    avatar_image = models.ImageField(upload_to='profiles/avatars/', blank=True, null=True, help_text="Avatar image upload")
    cover_image = models.CharField(max_length=600, blank=True, default='', help_text="Banner cover image URL")
    cover_image_file = models.ImageField(upload_to='profiles/covers/', blank=True, null=True, help_text="Banner cover image upload")
    location = models.CharField(max_length=150, blank=True, default='ঢাকা, বাংলাদেশ')
    location_en = models.CharField(max_length=150, blank=True, default='Dhaka, Bangladesh')
    website = models.URLField(blank=True, default='')
    facebook_url = models.URLField(blank=True, default='')
    twitter_url = models.URLField(blank=True, default='')
    instagram_url = models.URLField(blank=True, default='')
    linkedin_url = models.URLField(blank=True, default='')
    github_url = models.URLField(blank=True, default='')
    is_featured = models.BooleanField(default=False, help_text="Featured author status")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Author Profile'
        verbose_name_plural = 'Author Profiles'
        ordering = ['-created_at']

    def __str__(self):
        return f"Profile of {self.user.username}"

    @property
    def effective_avatar(self):
        url = ''
        if self.avatar_image:
            try:
                url = self.avatar_image.url
            except Exception:
                url = ''
        elif self.avatar:
            url = self.avatar
        return normalize_media_url(url)

    @property
    def effective_cover(self):
        url = ''
        if self.cover_image_file:
            try:
                url = self.cover_image_file.url
            except Exception:
                url = ''
        elif self.cover_image:
            url = self.cover_image
        return normalize_media_url(url)

    def save(self, *args, **kwargs):
        if self.avatar_image:
            try:
                self.avatar = self.avatar_image.url
            except Exception:
                pass
        if self.cover_image_file:
            try:
                self.cover_image = self.cover_image_file.url
            except Exception:
                pass
        if self.avatar:
            for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                if self.avatar.startswith(prefix):
                    self.avatar = self.avatar[len(prefix):]
                    break
        if self.cover_image:
            for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                if self.cover_image.startswith(prefix):
                    self.cover_image = self.cover_image[len(prefix):]
                    break
        super().save(*args, **kwargs)


@receiver(post_save, sender=User)
def create_or_update_author_profile(sender, instance, created, **kwargs):
    # During fixture loading (loaddata / raw deserialization), do not trigger signal
    if kwargs.get('raw', False):
        return
    if created:
        AuthorProfile.objects.get_or_create(user=instance)


class Video(models.Model):
    """
    Video model for homepage Video section.
    Supports either YouTube embed (extracting video ID and embed URL automatically)
    or direct video file upload / direct video URL.
    """
    VIDEO_TYPE_CHOICES = (
        ('youtube', 'YouTube Embed'),
        ('direct', 'Direct Video'),
    )

    title = models.CharField(max_length=255, help_text="Video headline in Bengali")
    title_en = models.CharField(max_length=255, blank=True, default='', help_text="Video headline in English")
    category = models.ForeignKey(
        'Category',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='videos',
        help_text="Category for organizing videos into categorized sections"
    )
    description = models.TextField(blank=True, default='', help_text="Short description in Bengali")
    description_en = models.TextField(blank=True, default='', help_text="Short description in English")
    video_type = models.CharField(max_length=20, choices=VIDEO_TYPE_CHOICES, default='youtube')
    youtube_url = models.CharField(max_length=500, blank=True, default='', help_text="YouTube link or watch/embed URL")
    video_file = models.FileField(upload_to='videos/', blank=True, null=True, help_text="Direct video file upload (MP4, WebM, etc.)")
    video_url = models.CharField(max_length=600, blank=True, default='', help_text="Direct video URL or CDN link")
    thumbnail = models.CharField(max_length=600, blank=True, default='', help_text="Thumbnail image URL")
    thumbnail_image = models.ImageField(upload_to='videos/thumbnails/', blank=True, null=True, help_text="Thumbnail image upload file")
    duration = models.CharField(max_length=50, blank=True, default='', help_text="Duration label, e.g. 05:24 or 12:40")
    is_featured = models.BooleanField(default=False, help_text="Mark as spotlight video for main player")
    display_order = models.PositiveIntegerField(default=0, help_text="Ordering index")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Video'
        verbose_name_plural = 'Videos'
        ordering = ['display_order', '-created_at']

    def __str__(self):
        return self.title

    @property
    def youtube_id(self):
        if not self.youtube_url:
            return ''
        url = self.youtube_url.strip()
        match = re.search(r'(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})', url)
        if match:
            return match.group(1)
        if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
            return url
        return ''

    @property
    def embed_url(self):
        if self.video_type == 'youtube':
            yid = self.youtube_id
            if yid:
                return f"https://www.youtube.com/embed/{yid}?rel=0&modestbranding=1"
            return self.youtube_url
        return ''

    @property
    def effective_video_url(self):
        if self.video_type == 'direct':
            if self.video_file:
                try:
                    url = self.video_file.url
                    for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                        if url.startswith(prefix):
                            url = url[len(prefix):]
                            break
                    return url
                except Exception:
                    pass
            return self.video_url
        return ''

    @property
    def effective_thumbnail(self):
        if self.thumbnail_image:
            try:
                url = self.thumbnail_image.url
                for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                    if url.startswith(prefix):
                        url = url[len(prefix):]
                        break
                return url
            except Exception:
                pass
        if self.thumbnail:
            return self.thumbnail
        if self.video_type == 'youtube' and self.youtube_id:
            return f"https://img.youtube.com/vi/{self.youtube_id}/hqdefault.jpg"
        return ''

    def save(self, *args, **kwargs):
        if self.thumbnail_image:
            try:
                self.thumbnail = self.thumbnail_image.url
            except Exception:
                pass
        if self.video_file:
            try:
                self.video_url = self.video_file.url
            except Exception:
                pass
        if self.thumbnail:
            for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                if self.thumbnail.startswith(prefix):
                    self.thumbnail = self.thumbnail[len(prefix):]
                    break
        if self.video_url:
            for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                if self.video_url.startswith(prefix):
                    self.video_url = self.video_url[len(prefix):]
                    break
        super().save(*args, **kwargs)


