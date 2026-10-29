from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.text import slugify
from django.utils import timezone
from ckeditor.fields import RichTextField


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

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True) or f"category-{timezone.now().timestamp()}"
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

        for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
            if url.startswith(prefix):
                url = url[len(prefix):]
                break

        return url or '/assets/images/18-1024x678.jpg'

    @property
    def hearts_count(self):
        return self.hearts.count()

    @property
    def comments_count(self):
        return self.comments.filter(is_approved=True).count()

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True) or f"post-{timezone.now().timestamp()}"
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
        if url:
            for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                if url.startswith(prefix):
                    url = url[len(prefix):]
                    break
        return url

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
        if url:
            for prefix in ('http://127.0.0.1:8000', 'http://localhost:8000', 'https://127.0.0.1:8000', 'https://localhost:8000'):
                if url.startswith(prefix):
                    url = url[len(prefix):]
                    break
        return url

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
    if created:
        AuthorProfile.objects.get_or_create(user=instance)

