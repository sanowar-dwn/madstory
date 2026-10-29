from django.test import TestCase
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from core.models import (
    Category, Article, PostHeart, Comment, HomepageCustomization,
    SiteSetting, ContactInquiry, NewsletterSubscriber, HeroSlide
)


class MadStoryProductionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.admin = User.objects.create_superuser('admin_user', 'admin@test.com', 'adminpass123')
        self.writer = User.objects.create_user('writer_user', 'writer@test.com', 'writerpass123')
        self.reader = User.objects.create_user('reader_user', 'reader@test.com', 'readerpass123')

        # Categories
        self.cat1 = Category.objects.create(name='শিল্প ও সংস্কৃতি', slug='art-culture', name_en='Art & Culture')
        self.cat2 = Category.objects.create(name='ডিজাইন', slug='design', name_en='Design')

        # Article with M2M Categories
        self.article = Article.objects.create(
            title='টেস্ট আর্টিকেল এক',
            title_en='Test Article One',
            slug='test-article-one',
            author=self.writer,
            excerpt='টেস্ট সারাংশ',
            content='পূর্ণাঙ্গ টেস্ট কন্টেন্ট',
            status='published'
        )
        self.article.categories.set([self.cat1, self.cat2])

        # Pending article
        self.pending_article = Article.objects.create(
            title='পেন্ডিং ব্লগ',
            slug='pending-blog',
            author=self.writer,
            excerpt='পেন্ডিং সারাংশ',
            content='পেন্ডিং কন্টেন্ট',
            status='pending_approval'
        )

        # Site Settings & Homepage Customization
        self.settings = SiteSetting.objects.create(site_name='The Mad Story')
        self.customization = HomepageCustomization.objects.create(id=1)

    def test_m2m_categories_in_article(self):
        self.assertEqual(self.article.categories.count(), 2)
        response = self.client.get(f'/api/v1/articles/{self.article.slug}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['categories']), 2)

    def test_user_registration_and_login(self):
        # Register
        reg_payload = {
            'username': 'newuser',
            'email': 'newuser@test.com',
            'password': 'strongpassword123',
            'first_name': 'New',
            'last_name': 'User'
        }
        res = self.client.post('/api/v1/auth/register/', reg_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', res.data)
        access_token = res.data['tokens']['access']

        # Access /auth/me/ with token
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        me_res = self.client.get('/api/v1/auth/me/')
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data['username'], 'newuser')

    def test_writer_create_blog_and_pending_approval(self):
        self.client.force_authenticate(user=self.writer)
        payload = {
            'title': 'লেখকের নতুন ব্লগ পোস্ট',
            'title_en': 'New Blog Post by Writer',
            'category_ids': [self.cat1.id],
            'excerpt': 'নতুন ব্লগের সারাংশ',
            'content': 'নতুন ব্লগের পূর্ণাঙ্গ বিবরণ ও বিশ্লেষণ।',
            'status': 'published' # Regular writer trying to set published
        }
        res = self.client.post('/api/v1/articles/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        # Should be forced to pending_approval for regular users
        created_slug = res.data['slug']
        created_art = Article.objects.get(slug=created_slug)
        self.assertEqual(created_art.status, 'pending_approval')
        self.assertEqual(created_art.author, self.writer)
        self.assertEqual(created_art.categories.count(), 1)

    def test_admin_approve_and_reject_blog(self):
        # 1. Writer cannot approve
        self.client.force_authenticate(user=self.writer)
        res_fail = self.client.post(f'/api/v1/articles/{self.pending_article.slug}/approve/')
        self.assertEqual(res_fail.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Admin can approve
        self.client.force_authenticate(user=self.admin)
        res_approve = self.client.post(f'/api/v1/articles/{self.pending_article.slug}/approve/')
        self.assertEqual(res_approve.status_code, status.HTTP_200_OK)
        self.pending_article.refresh_from_db()
        self.assertEqual(self.pending_article.status, 'published')

        # 3. Admin can reject
        res_reject = self.client.post(
            f'/api/v1/articles/{self.pending_article.slug}/reject/',
            {'reason': 'কপিরাইট সমস্যা রয়েছে।'},
            format='json'
        )
        self.assertEqual(res_reject.status_code, status.HTTP_200_OK)
        self.pending_article.refresh_from_db()
        self.assertEqual(self.pending_article.status, 'rejected')
        self.assertEqual(self.pending_article.rejection_reason, 'কপিরাইট সমস্যা রয়েছে।')

    def test_authenticated_user_heart_reaction(self):
        # Unauthenticated cannot heart
        res_anon = self.client.post(f'/api/v1/articles/{self.article.slug}/heart/')
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated heart toggle ON
        self.client.force_authenticate(user=self.reader)
        res_on = self.client.post(f'/api/v1/articles/{self.article.slug}/heart/')
        self.assertEqual(res_on.status_code, status.HTTP_200_OK)
        self.assertTrue(res_on.data['is_hearted'])
        self.assertEqual(res_on.data['hearts_count'], 1)

        # Authenticated heart toggle OFF
        res_off = self.client.post(f'/api/v1/articles/{self.article.slug}/heart/')
        self.assertEqual(res_off.status_code, status.HTTP_200_OK)
        self.assertFalse(res_off.data['is_hearted'])
        self.assertEqual(res_off.data['hearts_count'], 0)

    def test_tree_comments_feature(self):
        # 1. Post root comment
        self.client.force_authenticate(user=self.reader)
        root_res = self.client.post(
            f'/api/v1/articles/{self.article.slug}/comments/',
            {'content': 'প্রথম মন্তব্য (রুট)'},
            format='json'
        )
        self.assertEqual(root_res.status_code, status.HTTP_201_CREATED)
        root_id = root_res.data['id']

        # 2. Post reply to root comment
        self.client.force_authenticate(user=self.writer)
        reply_res = self.client.post(
            f'/api/v1/articles/{self.article.slug}/comments/',
            {'parent': root_id, 'content': 'প্রথম মন্তব্যের উত্তর (রিপ্লাই)'},
            format='json'
        )
        self.assertEqual(reply_res.status_code, status.HTTP_201_CREATED)

        # 3. Retrieve tree comments
        get_res = self.client.get(f'/api/v1/articles/{self.article.slug}/comments/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data), 1) # 1 root comment
        self.assertEqual(len(get_res.data[0]['replies']), 1) # 1 nested reply inside root!
        self.assertEqual(get_res.data[0]['replies'][0]['content'], 'প্রথম মন্তব্যের উত্তর (রিপ্লাই)')

    def test_homepage_customization_management(self):
        # Public can view
        res = self.client.get('/api/v1/homepage-customization/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # Regular user cannot update
        self.client.force_authenticate(user=self.writer)
        res_fail = self.client.patch('/api/v1/homepage-customization/', {'hero_title_bn': 'নতুন হিরো শিরোনাম'})
        self.assertEqual(res_fail.status_code, status.HTTP_403_FORBIDDEN)

        # Admin can update
        self.client.force_authenticate(user=self.admin)
        res_ok = self.client.patch('/api/v1/homepage-customization/', {'hero_title_bn': 'নতুন হিরো শিরোনাম'})
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.customization.refresh_from_db()
        self.assertEqual(self.customization.hero_title_bn, 'নতুন হিরো শিরোনাম')

    def test_dedicated_hero_slide_module(self):
        # 1. Create slides (1 active, 1 inactive)
        active_slide = HeroSlide.objects.create(
            title='অ্যাক্টিভ ব্যানার স্লাইড',
            title_en='Active Banner Slide',
            image='/assets/images/18-1024x678.jpg',
            button_text='বিস্তারিত পড়ুন',
            button_link='/category/architecture-interiors',
            display_order=1,
            is_active=True
        )
        inactive_slide = HeroSlide.objects.create(
            title='ড্রাফট ব্যানার স্লাইড',
            title_en='Draft Banner Slide',
            image='/assets/images/shutterstock_398822470-1024x683.jpg',
            display_order=2,
            is_active=False
        )

        # 2. Public can only see active slides
        res_public = self.client.get('/api/v1/hero-slides/')
        self.assertEqual(res_public.status_code, status.HTTP_200_OK)
        # Should only contain active slide
        public_ids = [s['id'] for s in res_public.data]
        self.assertIn(active_slide.id, public_ids)
        self.assertNotIn(inactive_slide.id, public_ids)

        # 3. Staff can view all slides and toggle active
        self.client.force_authenticate(user=self.admin)
        res_admin = self.client.get('/api/v1/hero-slides/')
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        admin_ids = [s['id'] for s in res_admin.data]
        self.assertIn(active_slide.id, admin_ids)
        self.assertIn(inactive_slide.id, admin_ids)

        # 4. Toggle active state
        res_toggle = self.client.post(f'/api/v1/hero-slides/{inactive_slide.id}/toggle_active/')
        self.assertEqual(res_toggle.status_code, status.HTTP_200_OK)
        inactive_slide.refresh_from_db()
        self.assertTrue(inactive_slide.is_active)

        # 5. Reorder slide
        res_order = self.client.post(f'/api/v1/hero-slides/{inactive_slide.id}/set_order/', {'display_order': 0})
        self.assertEqual(res_order.status_code, status.HTTP_200_OK)
        inactive_slide.refresh_from_db()
        self.assertEqual(inactive_slide.display_order, 0)

    def test_media_upload_endpoint(self):
        import io
        from PIL import Image

        buf = io.BytesIO()
        img = Image.new('RGB', (10, 10), color='blue')
        img.save(buf, 'PNG')
        png_bytes = buf.getvalue()

        # 1. Unauthenticated request rejected
        upload_file_anon = SimpleUploadedFile("anon_sample.png", png_bytes, content_type="image/png")
        res_anon = self.client.post('/api/v1/upload/', {'image': upload_file_anon}, format='multipart')
        self.assertEqual(res_anon.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Authenticated user upload valid image
        self.client.force_authenticate(user=self.writer)
        upload_file_auth = SimpleUploadedFile("auth_sample.png", png_bytes, content_type="image/png")
        res_ok = self.client.post('/api/v1/upload/', {'image': upload_file_auth}, format='multipart')
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)
        self.assertIn('url', res_ok.data)
        self.assertIn('filename', res_ok.data)
        self.assertTrue(res_ok.data['url'].startswith('http'))

        # 3. Disallowed extension rejected
        bad_file = SimpleUploadedFile("danger.exe", b"binarycontent", content_type="application/octet-stream")
        res_bad = self.client.post('/api/v1/upload/', {'image': bad_file}, format='multipart')
        self.assertEqual(res_bad.status_code, status.HTTP_400_BAD_REQUEST)

    def test_category_bulk_reorder_endpoint(self):
        # 1. Unauthenticated / non-admin cannot reorder
        self.client.force_authenticate(user=self.writer)
        res_forbidden = self.client.post('/api/v1/categories/reorder/', {'order_ids': [self.cat2.id, self.cat1.id]}, format='json')
        self.assertEqual(res_forbidden.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Admin can bulk reorder with order_ids
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/api/v1/categories/reorder/', {'order_ids': [self.cat2.id, self.cat1.id]}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.cat1.refresh_from_db()
        self.cat2.refresh_from_db()
        self.assertEqual(self.cat2.display_order, 1)
        self.assertEqual(self.cat1.display_order, 2)

        # 3. Admin can bulk reorder with orders array
        res_orders = self.client.post('/api/v1/categories/reorder/', {
            'orders': [
                {'id': self.cat1.id, 'display_order': 10},
                {'id': self.cat2.id, 'display_order': 20}
            ]
        }, format='json')
        self.assertEqual(res_orders.status_code, status.HTTP_200_OK)
        self.cat1.refresh_from_db()
        self.cat2.refresh_from_db()
        self.assertEqual(self.cat1.display_order, 10)
        self.assertEqual(self.cat2.display_order, 20)

    def test_featured_categories_flow(self):
        # 1. Admin toggles featured status of category
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(f'/api/v1/categories/{self.cat1.slug}/toggle_featured/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_featured'])
        self.cat1.refresh_from_db()
        self.assertTrue(self.cat1.is_featured)

        # 2. Category list / featured endpoint returns featured category
        res_featured = self.client.get('/api/v1/categories/featured/')
        self.assertEqual(res_featured.status_code, status.HTTP_200_OK)
        slugs = [c['slug'] for c in res_featured.data]
        self.assertIn(self.cat1.slug, slugs)

        # 3. Magazine home feed contains featured_categories
        res_feed = self.client.get('/api/v1/articles/magazine_home/')
        self.assertEqual(res_feed.status_code, status.HTTP_200_OK)
        self.assertIn('featured_categories', res_feed.data)
        feed_slugs = [c['slug'] for c in res_feed.data['featured_categories']]
        self.assertIn(self.cat1.slug, feed_slugs)

    def test_author_profile_and_detail_flow(self):
        # 1. Author profile auto-created
        self.assertTrue(hasattr(self.writer, 'profile'))

        # 2. Public author detail retrieve by username
        res_author = self.client.get(f'/api/v1/authors/{self.writer.username}/')
        self.assertEqual(res_author.status_code, status.HTTP_200_OK)
        self.assertEqual(res_author.data['username'], self.writer.username)
        self.assertEqual(res_author.data['articles_count'], 1)
        self.assertIn('profile', res_author.data)

        # 3. Author can customize own profile via /api/v1/authors/me/
        self.client.force_authenticate(user=self.writer)
        update_payload = {
            'first_name': 'আহমেদ',
            'last_name': 'রশীদ',
            'profile': {
                'display_name': 'আহমেদ রশীদ',
                'designation': 'প্রধান সাহিত্য সম্পাদক',
                'bio': 'শিল্প ও সাহিত্য বিষয়ক অনুসন্ধানী লেখক।',
                'location': 'ঢাকা, বাংলাদেশ',
                'twitter_url': 'https://twitter.com/ahmedrashid',
                'website': 'https://madstory.com'
            }
        }
        res_update = self.client.patch('/api/v1/authors/me/', update_payload, format='json')
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        self.assertEqual(res_update.data['profile']['display_name'], 'আহমেদ রশীদ')
        self.assertEqual(res_update.data['profile']['designation'], 'প্রধান সাহিত্য সম্পাদক')

        # 4. Filter articles by author
        res_arts = self.client.get(f'/api/v1/articles/?author={self.writer.username}')
        self.assertEqual(res_arts.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res_arts.data.get('results', [])), 1)

        # 5. Author articles sub-endpoint
        res_sub_arts = self.client.get(f'/api/v1/authors/{self.writer.username}/articles/')
        self.assertEqual(res_sub_arts.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res_sub_arts.data.get('results', [])), 1)

