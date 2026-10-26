"""
Seed command to pre-populate The Mad Story with genuine reference data.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from core.models import (
    Category, Article, PostHeart, Comment, HomepageCustomization,
    SiteSetting, ContactInquiry, NewsletterSubscriber
)


class Command(BaseCommand):
    help = 'Seeds database with real categories, articles, tree comments, and customization from themadstory.com'

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding for The Mad Story...")

        # 0. Admin & Sample Writer Users
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@themadstory.com',
                'is_staff': True,
                'is_superuser': True,
                'first_name': 'Chief',
                'last_name': 'Editor'
            }
        )
        admin_user.set_password('adminpassword123')
        admin_user.save()

        writer_user, _ = User.objects.get_or_create(
            username='sarah_writer',
            defaults={
                'email': 'sarah@themadstory.com',
                'is_staff': False,
                'first_name': 'Sarah',
                'last_name': 'Jenkins'
            }
        )
        writer_user.set_password('writer123')
        writer_user.save()

        # 1. Site Settings
        setting, _ = SiteSetting.objects.get_or_create(
            id=1,
            defaults={
                'site_name': 'The Mad Story',
                'tagline_bn': 'শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার ত্রৈমাসিক পত্রিকা',
                'tagline_en': 'A Quarterly Magazine on Art, Literature, Culture & Modern Lifestyle',
                'logo_en_url': '/assets/images/Madstory-logo.png',
                'logo_bn_url': '/assets/images/Madstory-logo-bangla.png',
                'facebook_url': 'https://facebook.com/themadstory',
                'twitter_url': 'https://twitter.com/themadstory',
                'instagram_url': 'https://instagram.com/themadstory',
                'pinterest_url': 'https://pinterest.com/themadstory',
                'youtube_url': 'https://youtube.com/@themadstory',
                'email': 'editor@themadstory.com',
                'phone': '+880 1711-234567',
                'address': 'Dhanmondi, Dhaka 1205, Bangladesh',
                'copyright_text_bn': '© ২০২৬ দ্য ম্যাড স্টোরি। সর্বস্বত্ব সংরক্ষিত।',
                'copyright_text_en': '© 2026 The Mad Story. All Rights Reserved.',
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Site settings seeded"))

        # 2. Categories tree
        categories_data = [
            {
                'name': 'ডিজাইন এন্ড লাইফস্টাইল',
                'slug': 'design-lifestyle',
                'name_en': 'Design & Lifestyle',
                'description': 'স্থাপত্য, ইন্টেরিয়র, আসবাবপত্র, গ্রাফিক ডিজাইন ও আধুনিক নান্দনিক জীবনশৈলী।',
                'description_en': 'Architecture, interior, furniture, graphic design, and modern lifestyle aesthetics.',
                'display_order': 1,
                'subcategories': [
                    {'name': 'আসবাবপত্র ও নকশা', 'slug': 'furniture-craft', 'name_en': 'Furniture & Craft'},
                    {'name': 'ইউআই-ইউএক্স', 'slug': 'ui-ux', 'name_en': 'UI / UX Design'},
                    {'name': 'গ্রাফিক ও মোশন', 'slug': 'graphic-motion', 'name_en': 'Graphic & Motion'},
                    {'name': 'ডিজাইন ট্রেন্ডস', 'slug': 'design-trends', 'name_en': 'Design Trends'},
                    {'name': 'প্যাকেজিং ডিজাইন', 'slug': 'packaging-design', 'name_en': 'Packaging Design'},
                    {'name': 'স্থাপত্য ও ইন্টেরিয়র', 'slug': 'architecture-interior', 'name_en': 'Architecture & Interior'},
                ]
            },
            {
                'name': 'শিল্প ও সংস্কৃতি',
                'slug': 'art-culture',
                'name_en': 'Art & Culture',
                'description': 'চারুকলা, চিত্রকলা, থিয়েটার, প্রদর্শনী, সংগীত, চলচ্চিত্র ও সমকালীন শিল্প আন্দোলন।',
                'description_en': 'Fine arts, cinema, theatre, exhibitions, music, and contemporary culture.',
                'display_order': 2,
                'subcategories': [
                    {'name': 'চারুকলা', 'slug': 'fine-arts', 'name_en': 'Fine Arts'},
                    {'name': 'আলোকচিত্র', 'slug': 'photography', 'name_en': 'Photography'},
                    {'name': 'চলচ্চিত্র', 'slug': 'cinema', 'name_en': 'Cinema'},
                    {'name': 'থিয়েটার', 'slug': 'theatre', 'name_en': 'Theatre'},
                    {'name': 'সংগীত', 'slug': 'music', 'name_en': 'Music'},
                    {'name': 'প্রদর্শনী', 'slug': 'exhibition', 'name_en': 'Exhibitions'},
                ]
            },
            {
                'name': 'সাহিত্য',
                'slug': 'literature',
                'name_en': 'Literature',
                'description': 'কবিতা, ছোট গল্প, উপন্যাস, মননশীল প্রবন্ধ ও বিশ্বসাহিত্যের মুক্ত প্রাঙ্গণ।',
                'description_en': 'Poetry, short stories, novels, thought essays, and world literature.',
                'display_order': 3,
                'subcategories': [
                    {'name': 'কবিতা', 'slug': 'poetry', 'name_en': 'Poetry'},
                    {'name': 'ছোট গল্প', 'slug': 'short-story', 'name_en': 'Short Stories'},
                    {'name': 'উপন্যাস', 'slug': 'novel', 'name_en': 'Novels'},
                    {'name': 'প্রবন্ধ', 'slug': 'essays', 'name_en': 'Essays'},
                    {'name': 'লেখক ব্যক্তিত্ব', 'slug': 'author-profiles', 'name_en': 'Author Profiles'},
                ]
            },
            {
                'name': 'মিডিয়া এবং এন্টারটেইনমেন্ট',
                'slug': 'media-entertainment',
                'name_en': 'Media & Entertainment',
                'description': 'বিনোদন, ভ্রমণ, সাম্প্রতিক ঘটনাবলি ও ডিজিটাল মিডিয়ার পরিবর্তনশীল স্রোত।',
                'description_en': 'Entertainment, travel, contemporary news, and digital media.',
                'display_order': 4,
                'subcategories': [
                    {'name': 'সাম্প্রতিকী', 'slug': 'current-affairs', 'name_en': 'Current Affairs'},
                    {'name': 'নিত্য খবর', 'slug': 'daily-news', 'name_en': 'Daily News'},
                    {'name': 'সুর ও কথা', 'slug': 'melody-words', 'name_en': 'Melody & Words'},
                    {'name': 'ভ্রমণ', 'slug': 'travel', 'name_en': 'Travel'},
                ]
            },
            {
                'name': 'স্পটলাইট',
                'slug': 'spotlight',
                'name_en': 'Spotlight',
                'description': 'সাক্ষাৎকার, নেপথ্যের গল্প, নতুন প্রতিভা ও বিশেষ অনুসন্ধান।',
                'description_en': 'Interviews, behind-the-scenes stories, and emerging talents.',
                'display_order': 5,
                'subcategories': [
                    {'name': 'সাক্ষাৎকার', 'slug': 'interviews', 'name_en': 'Interviews'},
                    {'name': 'পেছনের গল্প', 'slug': 'behind-the-scenes', 'name_en': 'Behind The Scenes'},
                    {'name': 'নতুন প্রতিভা', 'slug': 'new-talents', 'name_en': 'New Talents'},
                ]
            },
            {
                'name': 'ইনসাইটস',
                'slug': 'insights',
                'name_en': 'Insights',
                'description': 'শিল্প ভাবনা, টুলস ও সৃজনশীল পেশাজীবীদের নির্দেশিকা।',
                'description_en': 'Creative guides, tools, and professional studio perspectives.',
                'display_order': 6,
                'subcategories': [
                    {'name': 'টুলস ও গাইড', 'slug': 'tools-guides', 'name_en': 'Tools & Guides'},
                    {'name': 'শিল্প ভাবনা', 'slug': 'art-thoughts', 'name_en': 'Art Thoughts'},
                ]
            },
            {
                'name': 'অন্যান্য',
                'slug': 'others',
                'name_en': 'Others',
                'description': 'বিবিধ সমকালীন রচনা, ফ্যাশন ও জীবনধারার খণ্ডচিত্র।',
                'description_en': 'Miscellaneous contemporary lifestyle and couture essays.',
                'display_order': 7,
                'subcategories': []
            }
        ]

        cat_map = {}
        for cat_info in categories_data:
            subs = cat_info.pop('subcategories', [])
            parent_cat, _ = Category.objects.update_or_create(
                slug=cat_info['slug'],
                defaults=cat_info
            )
            cat_map[parent_cat.name] = parent_cat
            cat_map[parent_cat.slug] = parent_cat
            for sub_info in subs:
                sub_info['parent'] = parent_cat
                sub_cat, _ = Category.objects.update_or_create(
                    slug=sub_info['slug'],
                    defaults=sub_info
                )
                cat_map[sub_cat.name] = sub_cat
                cat_map[sub_cat.slug] = sub_cat

        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(cat_map)} categories and subcategories"))

        # 3. Articles (with M2M categories)
        articles_data = [
            {
                'title': 'Jeans Shorts Are in Vogue: Summer Street Style',
                'title_en': 'Jeans Shorts Are in Vogue: Summer Street Style',
                'slug': 'on-windy-mornings-2',
                'cat_slugs': ['others', 'design-lifestyle'],
                'cover_image_url': '/assets/images/18-1024x678.jpg',
                'excerpt': 'A deep look into the seasonal transition of high-street denim culture, vintage tailoring, and sustainable fabric aesthetics.',
                'excerpt_en': 'A deep look into the seasonal transition of high-street denim culture, vintage tailoring, and sustainable fabric aesthetics.',
                'content': '''<p>A deep look into the seasonal transition of high-street denim culture, vintage tailoring, and sustainable fabric aesthetics.</p>
<p>Fashion is constantly reinventing itself through cyclical revivalism. The return of relaxed denim silhouettes highlights a consumer shift toward comfort without relinquishing personal style.</p>
<h3>The Shift Toward Vintage Heritage</h3>
<p>From Parisian sidewalk bistros to Tokyo's Harajuku alleys, designers are embracing distressed finishes, raw selvage trims, and modular utilitarian hardware.</p>
<blockquote>"Style is a way to say who you are without having to speak." — Rachel Zoe</blockquote>
<p>In this curated editorial, we explore how timeless textures continue to dominate contemporary urban wardrobes.</p>''',
                'author_name': 'Sarah Jenkins',
                'reading_time': '৪ মিনিট পাঠ',
                'reading_time_en': '4 min read',
                'is_featured_hero': True,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 1420,
            },
            {
                'title': 'A Living Room That is Fit For The Millenials',
                'title_en': 'A Living Room That is Fit For The Millenials',
                'slug': 'eyes-still-sleepy',
                'cat_slugs': ['design-lifestyle', 'architecture-interior'],
                'cover_image_url': '/assets/images/shutterstock_458700517-scaled-1-768x1120.jpg',
                'excerpt': 'Harmonizing warm wood textures, biophilic lighting, and understated minimalist ergonomics for mindful living.',
                'excerpt_en': 'Harmonizing warm wood textures, biophilic lighting, and understated minimalist ergonomics for mindful living.',
                'content': '''<p>Millennial interior spaces emphasize mindfulness, warm daylight transitions, and multifunctional micro-architecture.</p>
<p>Gone are the days of rigid formal parlors. Today's living spaces must transition effortlessly between creative home offices, tranquil reading lounges, and vibrant social hubs.</p>
<h3>Material Authenticity</h3>
<p>Natural Scandinavian birch, oiled walnut, textured linen upholstery, and ambient warm-tone illumination combine to create sanctuaries in urban apartments.</p>''',
                'author_name': 'Tanvir Ahmed',
                'reading_time': '৫ মিনিট পাঠ',
                'reading_time_en': '5 min read',
                'is_featured_hero': True,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 1890,
            },
            {
                'title': 'A Guide to Latest in Fashion & Editorial Silhouettes',
                'title_en': 'A Guide to Latest in Fashion & Editorial Silhouettes',
                'slug': 'eyes-still-sleepy-2',
                'cat_slugs': ['others', 'design-lifestyle'],
                'cover_image_url': '/assets/images/13-1024x683.jpg',
                'excerpt': 'Monochromatic layering, tactile textures, and subtle avant-garde cuts redefining modern ready-to-wear.',
                'excerpt_en': 'Monochromatic layering, tactile textures, and subtle avant-garde cuts redefining modern ready-to-wear.',
                'content': '''<p>Monochromatic layering, tactile textures, and subtle avant-garde cuts redefining modern ready-to-wear collections.</p>
<p>Designers this year are turning their attention to architectural drapes and subdued organic earthy palettes.</p>''',
                'author_name': 'Meghla Roy',
                'reading_time': '৩ মিনিট পাঠ',
                'reading_time_en': '3 min read',
                'is_featured_hero': True,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 940,
            },
            {
                'title': 'Spending my Last Day Off on This Beautiful Resort',
                'title_en': 'Spending my Last Day Off on This Beautiful Resort',
                'slug': 'got-new-shoes-from-asos',
                'cat_slugs': ['travel', 'media-entertainment'],
                'cover_image_url': '/assets/images/beach_resort_with_sunbeds_in_asia-1-of-1-2-1024x683.jpg',
                'excerpt': 'A quiet getaway amidst pristine coastal waters, azure horizons, and the slow rhythm of tropical architecture.',
                'excerpt_en': 'A quiet getaway amidst pristine coastal waters, azure horizons, and the slow rhythm of tropical architecture.',
                'content': '''<p>Finding stillness between deadlines: travelogue exploring secluded boutique coastal sanctuaries across Southeast Asia.</p>
<p>The gentle sea breeze and uninterrupted horizons offer the perfect backdrop for reading, introspection, and visual rejuvenation.</p>''',
                'author_name': 'Raihan Kabir',
                'reading_time': '৬ মিনিট পাঠ',
                'reading_time_en': '6 min read',
                'is_featured_hero': True,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 2310,
            },
            {
                'title': 'Colors to Wear This Fall: The Warm Palette Evolution',
                'title_en': 'Colors to Wear This Fall: The Warm Palette Evolution',
                'slug': 'colors-to-wear-this-fall',
                'cat_slugs': ['others'],
                'cover_image_url': '/assets/images/23-1024x681.jpg',
                'excerpt': 'Burgundy reds, terracotta warmth, and forest greens setting the mood for crisp autumn afternoons.',
                'excerpt_en': 'Burgundy reds, terracotta warmth, and forest greens setting the mood for crisp autumn afternoons.',
                'content': '''<p>Every autumn brings a deliberate shift in chromatic presence. We analyze the chromatic transitions on international runways.</p>''',
                'author_name': 'Sarah Jenkins',
                'reading_time': '৪ মিনিট পাঠ',
                'reading_time_en': '4 min read',
                'is_featured_hero': True,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 1120,
            },

            # LEAD HERO ARTICLES - COLTI (TRENDING)
            {
                'title': 'শব্দেরা খুব চতুর: সাহিত্যের গভীরতর পাঠ ও রূপক ব্যঞ্জনা',
                'title_en': 'Words Are Cunning: Deeper Readings of Literary Metaphors',
                'slug': 'words-are-cunning',
                'cat_slugs': ['literature', 'art-culture'],
                'cover_image_url': '/assets/images/Client-Relation-1024x576.jpg',
                'excerpt': 'শব্দ কেবল ভাবের বাহন নয়, তার নিজস্ব শরীর, গন্ধ ও প্রতারণাপূর্ণ সৌন্দর্য রয়েছে। এক অনুপম সাহিত্য বিশ্লেষণ।',
                'excerpt_en': 'Words are not merely vessels of thoughts; they carry their own physical presence, fragrance, and cunning beauty.',
                'content': '''<p>শব্দ যখন ভাষার খাঁচায় বন্দি হয় না, তখন তার ভেতর তৈরি হয় এক অদ্ভুত রহস্যময় স্বাধীনতা। লেখকেরা শব্দের পিঠে সওয়ার হন, কিন্তু শব্দ কি লেখকের বাধ্য থাকে?</p>
<p>শব্দেরা খুব চতুর। তারা কখনো অর্থের মোড়কে নিজেদের গোপন রাখে, কখনো আবার নীরবতার চেয়েও বেশি ধ্বনি তৈরি করে। সমকালীন কথাসাহিত্যে রূপকের এই খেলা এক গভীর নন্দনিক মাত্রা যোগ করেছে।</p>
<blockquote>"কবিতা সেই মুহূর্তের উচ্চারণ, যখন শব্দের সীমানা পেরিয়ে ভাবনায় আলো জ্বলে ওঠে।"</blockquote>
<p>এই প্রবন্ধে আমরা আলোচনা করেছি বাংলা সাহিত্যের ঐতিহ্যবাহী বাকরীতি ও উত্তর-আধুনিক ভাষার টানাপোড়েন নিয়ে।</p>''',
                'author_name': 'কাজী আনিসুর রহমান',
                'reading_time': '৭ মিনিট পাঠ',
                'reading_time_en': '7 min read',
                'is_featured_hero': False,
                'is_colti_trending': True,
                'is_nirbachito_choice': False,
                'view_count': 3240,
            },
            {
                'title': 'উডেন ফার্নিচার পরিষ্কার ও পলিশ করার ঘরোয়া উপায়',
                'title_en': 'Home Methods for Cleaning and Polishing Wooden Furniture',
                'slug': 'wooden-furniture-care-guide',
                'cat_slugs': ['furniture-craft', 'design-lifestyle'],
                'cover_image_url': '/assets/images/Modern_living_room-1024x572.jpg',
                'excerpt': 'কাঠের আসবাবের দীর্ঘস্থায়িত্ব ও প্রাকৃতিক দীপ্তি বজায় রাখতে বিশেষজ্ঞ পরামর্শ ও পরীক্ষিত ঘরোয়া পদ্ধতি।',
                'excerpt_en': 'Expert tips and proven home methods to maintain the longevity and natural luster of wooden furniture.',
                'content': '''<p>কাঠের আসবাবপত্র শুধু ব্যবহারের বস্তু নয়, তা বাড়ির আভিজাত্যের পরিচয়বাহী। তবে যথাযথ পরিচর্যার অভাবে কাঠের স্বাভাবিক জেল্লা দ্রুত ফিকে হয়ে যেতে পারে।</p>
<h3>নিয়মিত ধুলোবালি অপসারণ</h3>
<p>মাইক্রোফাইবার কাপড় দিয়ে প্রতিদিন শুকনোভাবে মোছা কাঠের পৃষ্ঠের আঁচড় প্রতিরোধ করে। কড়া রাসায়নিক ক্লিনার কাঠের সুরক্ষাকারী বার্নিশ নষ্ট করতে পারে।</p>
<h3>প্রাকৃতিক তেলের ব্যবহার</h3>
<p>অলিভ অয়েল এবং লেবুর রসের মিশ্রণ দিয়ে কাঠের পৃষ্ঠের প্রাকৃতিক মসৃণতা ও উজ্জ্বলতা বছরের পর বছর বজায় রাখা সম্ভব।</p>''',
                'author_name': 'সুবর্ণা চৌধুরী',
                'reading_time': '৪ মিনিট পাঠ',
                'reading_time_en': '4 min read',
                'is_featured_hero': False,
                'is_colti_trending': True,
                'is_nirbachito_choice': True,
                'view_count': 2850,
            },
            {
                'title': 'উড না স্টিল: কোন ধরনের ফার্নিচার আপনার জন্য ভালো?',
                'title_en': 'Wood vs Steel: Which Furniture Type Fits Your Space Best?',
                'slug': 'wood-vs-steel-furniture-comparison',
                'cat_slugs': ['furniture-craft', 'design-lifestyle'],
                'cover_image_url': '/assets/images/Modern_living_room_interior-1024x572.jpg',
                'excerpt': 'স্থায়িত্ব, পরিবেশবান্ধবতা এবং নান্দনিক মূল্যায়নে কাঠ ও স্টিলের আসবাবের পূর্ণাঙ্গ তুলনামূলক প্রতিবেদন।',
                'excerpt_en': 'A comprehensive comparative analysis of wood and steel furniture in durability, eco-friendliness, and aesthetic balance.',
                'content': '''<p>ঘর সাজানোর সময় আসবাবের উপাদান নির্বাচন একটি গুরুত্বপূর্ণ সিদ্ধান্ত। কাঠ নাকি স্টিল—কোনটি আধুনিক জীবনযাপনের জন্য অধিক কার্যকর?</p>
<p>কাঠ তৈরি করে উষ্ণতা ও আভিজাত্য, অন্যদিকে ইন্ডাস্ট্রিয়াল স্টিল দেয় স্লিম মিনিমালিজম ও দীর্ঘমেয়াদি সহনশীলতা। উভয় উপাদানের সঠিক সংমিশ্রণে তৈরি হয় নিখুঁত ইন্টেরিয়র ব্যালেন্স।</p>''',
                'author_name': 'ফারহান সাদিক',
                'reading_time': '৫ মিনিট পাঠ',
                'reading_time_en': '5 min read',
                'is_featured_hero': False,
                'is_colti_trending': True,
                'is_nirbachito_choice': True,
                'view_count': 1980,
            },
            {
                'title': 'কীভাবে ক্লায়েন্টের সঙ্গে সম্পর্ক হবে দারুণ, টেকসই আর একটু মজারও',
                'title_en': 'How to Build Enduring, Rewarding Client Relationships in Design',
                'slug': 'client-relationships',
                'cat_slugs': ['insights', 'design-lifestyle'],
                'cover_image_url': '/assets/images/Bishal-in-a-Cafe-With-laptop-1024x576.jpg',
                'excerpt': 'সৃজনশীল পেশাজীবীদের জন্য ক্লায়েন্ট কমিউনিকেশন, প্রত্যাশা ব্যবস্থাপনা ও বন্ধুত্ব গড়ে তোলার কার্যকরী কৌশল।',
                'excerpt_en': 'Effective strategies for creative professionals to manage expectations, communicate openly, and nurture lasting partnerships.',
                'content': '''<p>ক্লায়েন্ট রিলেশনশিপ মানে কেবল কাজের চুক্তি সম্পন্ন করা নয়, বরং বিশ্বাস ও সহযোগিতার এক ধারাবাহিক সেতুবন্ধন রচনা করা।</p>
<p>সঠিক যোগাযোগ, সময়নিষ্ঠতা এবং পারস্পরিক সম্মান সৃজনশীল কাজের মান বহুগুণ বাড়িয়ে দেয়।</p>''',
                'author_name': 'বিশাল রহমান',
                'reading_time': '৬ মিনিট পাঠ',
                'reading_time_en': '6 min read',
                'is_featured_hero': False,
                'is_colti_trending': True,
                'is_nirbachito_choice': True,
                'view_count': 3120,
            },
            {
                'title': 'Lights, Camera, Action: ছোট ব্যবসার ভিডিও প্রোডাকশনে সফল হওয়ার কাহিনী',
                'title_en': 'Lights, Camera, Action: Mastering Video Storytelling for Small Businesses',
                'slug': 'lights-camera-action-video-production',
                'cat_slugs': ['media-entertainment', 'insights'],
                'cover_image_url': '/assets/images/Woman-Shoot-Movie-1024x574.jpeg',
                'excerpt': 'সীমিত বাজেটে প্রভাবশালী ভিজ্যুয়াল স্টোরিটেলিং ও সিনেমাটোগ্রাফিক কন্টেন্ট তৈরির গোপন রহস্য।',
                'excerpt_en': 'The trade secrets of producing cinematic visual narratives and compelling brand stories on an accessible budget.',
                'content': '''<p>ভিডিও বর্তমান ডিজিটাল যুগের সবচেয়ে শক্তিশালী যোগাযোগের মাধ্যম। কিন্তু ছোট উদ্যোক্তারা কীভাবে বড় বাজেটের প্রোডাকশনের সাথে প্রতিযোগিতা করবে?</p>
<p>উত্তর হলো: গল্প বলার সততা ও ভিজ্যুয়াল ক্রাফটিং। নিখুঁত স্ক্রিপ্ট ও সঠিক আলো ব্যবহারে সাধারণ ক্যামেরাও ম্যাজিক তৈরি করতে পারে।</p>''',
                'author_name': 'মাহমুদা ইয়াসমিন',
                'reading_time': '৫ মিনিট পাঠ',
                'reading_time_en': '5 min read',
                'is_featured_hero': False,
                'is_colti_trending': True,
                'is_nirbachito_choice': True,
                'view_count': 2640,
            },
            {
                'title': '৯টি লক্ষণ আপনার ক্লায়েন্ট প্রজেক্ট একদম ধ্বংসের পথে (এবং কীভাবে বাঁচাবেন নিজের মানসিক শান্তি)',
                'title_en': '9 Red Flags Your Client Project is Slipping into Chaos (And How to Protect Your Sanity)',
                'slug': 'nine-red-flags-client-projects',
                'cat_slugs': ['insights'],
                'cover_image_url': '/assets/images/Designer-450x450.png',
                'excerpt': 'স্কোপ ক্রিপ, অস্পষ্ট ফিডব্যাক ও বিলম্বিত অনুমোদনের ফাঁদ চিনে আগেভাগেই প্রজেক্ট সফল করার নির্দেশিকা।',
                'excerpt_en': 'Spotting scope creep, fuzzy feedback, and approval bottlenecks early to safeguard your deadlines and mental wellness.',
                'content': '''<p>ফ্রিল্যান্সার ও ডিজাইনারদের সবচেয়ে বড় দুঃস্বপ্ন হলো নিয়ন্ত্রণহীন ক্লায়েন্ট প্রজেক্ট। সময়মতো সতর্ক না হলে কাজ ও মানসিক স্বাস্থ্য দুটোই ক্ষতিগ্রস্ত হয়।</p>
<p>এখানে আলোচিত ৯টি লক্ষণ আপনাকে আগে থেকেই প্রজেক্ট ট্র্যাক করতে সাহায্য করবে।</p>''',
                'author_name': 'সাইফুল ইসলাম',
                'reading_time': '৮ মিনিট পাঠ',
                'reading_time_en': '8 min read',
                'is_featured_hero': False,
                'is_colti_trending': True,
                'is_nirbachito_choice': False,
                'view_count': 4150,
            },

            # ART & CULTURE 3-COLUMN CARDS
            {
                'title': 'ইউরোপিয়ান অ্যাক্সেসিবিলিটি অ্যাক্ট ২০২৫: ডিজাইনে অন্তর্ভুক্তিমূলক বৈপ্লবিক পরিবর্তন',
                'title_en': 'European Accessibility Act 2025: The Inclusive Revolution in Digital Design',
                'slug': 'european-accessibility-act-2025',
                'cat_slugs': ['ui-ux', 'design-lifestyle'],
                'cover_image_url': '/assets/images/797841617_28204149132559507_8583266339297600560_n-1024x1024.jpg',
                'excerpt': 'ডিজিটাল প্রোডাক্ট ও ওয়েব ডিজাইনে সর্বজনীন প্রবেশগম্যতা নিশ্চিত করার আন্তর্জাতিক নতুন নীতিমালা।',
                'excerpt_en': 'New international benchmarks demanding universal digital accessibility across modern web and product design.',
                'content': '''<p>২০২৫ সালে কার্যকর হওয়া ইউরোপিয়ান অ্যাক্সেসিবিলিটি অ্যাক্ট সমগ্র বিশ্বের ডিজিটাল ডিজাইনের মানে নতুন মোড় নিচ্ছে। প্রতিটি ব্যবহারকারীর কাছে সমানভাবে তথ্য পৌঁছানো এখন নৈতিকতার পাশাপাশি আইনি বাধ্যবাধকতা।</p>''',
                'author_name': 'আরিফ মাহমুদ',
                'reading_time': '৬ মিনিট পাঠ',
                'reading_time_en': '6 min read',
                'is_featured_hero': False,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 1870,
            },
            {
                'title': 'ফার্নিচার ডিজাইন করতে কি কি বিষয় খেয়াল রাখা উচিত!',
                'title_en': 'Crucial Fundamentals to Master in Ergonomic Furniture Design',
                'slug': 'furniture-design-essential-considerations',
                'cat_slugs': ['furniture-craft', 'design-lifestyle'],
                'cover_image_url': '/assets/images/Modern_living_room_interior-1024x572.jpg',
                'excerpt': 'অর্গোনোমিক্স, লোড-বেয়ারিং স্ট্যাবিলিটি ও নান্দনিক পরিমিতিবোধের সুসংগত সমন্বয়।',
                'excerpt_en': 'Seamless balance between ergonomics, structural load-bearing capacity, and minimalist restraint.',
                'content': '''<p>আসবাব কেবল দৃষ্টিনন্দন হলেই চলে না, তার ব্যবহারিক উপযোগিতা ও শারীরিক আরাম অত্যন্ত গুরুত্বপূর্ণ বিষয়।</p>''',
                'author_name': 'নাবিল আহসান',
                'reading_time': '৫ মিনিট পাঠ',
                'reading_time_en': '5 min read',
                'is_featured_hero': False,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 2190,
            },
            {
                'title': 'ইন্টেরিয়র ডিজাইনের গোপন সূত্র: কম আলোতে ঘরের রূপ বদলানোর কৌশল',
                'title_en': 'Interior Lighting Secrets: Dramatic Ambience in Low-Light Spaces',
                'slug': 'interior-design-secrets-lighting',
                'cat_slugs': ['architecture-interior', 'design-lifestyle'],
                'cover_image_url': '/assets/images/30-1024x683.jpg',
                'excerpt': 'পরোক্ষ আলো, আয়নার কৌশলগত অবস্থান ও ওয়াল টোনের চমৎকার বোঝাপড়ায় বদলে যায় ঘরের আবহ।',
                'excerpt_en': 'How indirect luminance, reflective surfaces, and warm wall undertones dramatically enrich home atmosphere.',
                'content': '''<p>আলো কেবল দেখার জন্য নয়, এটি অনুভূতির সৃষ্টি করে। নরম কোজি আলোর খেলা কীভাবে একটি সাধারণ ঘরকেও ড্রামাটিক লাক্সারিতে পরিণত করে, তা বিস্তারিত জেনে নিন।</p>''',
                'author_name': 'ফারিয়া তাসনিম',
                'reading_time': '৪ মিনিট পাঠ',
                'reading_time_en': '4 min read',
                'is_featured_hero': False,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 2780,
            },
            {
                'title': 'ইনফ্লুয়েন্সার মার্কেটিং: ব্র্যান্ড ভাবমূর্তি গড়ার নতুন দিগন্ত',
                'title_en': 'Influencer Marketing: Cultivating Genuine Brand Equity in Digital Era',
                'slug': 'influencer-marketing-brand-strategy',
                'cat_slugs': ['media-entertainment'],
                'cover_image_url': '/assets/images/Inflencer-450x300.png',
                'excerpt': 'অডিয়েন্সের সঙ্গে অকৃত্রিম বিশ্বাসযোগ্যতার বন্ধন তৈরি করে টেকসই ব্র্যান্ড প্রতিষ্ঠা।',
                'excerpt_en': 'Building lasting brand equity by fostering genuine credibility and storytelling with engaged audiences.',
                'content': '''<p>বিজ্ঞাপনের গতানুগতিক ছক ভেঙে এখন এগিয়ে সত্যিকারে গল্পের প্রভাব। ক্রেতারা পণ্য নয়, সেই ব্যক্তির অভিজ্ঞতাকে মূল্যায়ন করেন।</p>''',
                'author_name': 'রায়হান আহমেদ',
                'reading_time': '৫ মিনিট পাঠ',
                'reading_time_en': '5 min read',
                'is_featured_hero': False,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 1750,
            },
            {
                'title': 'Driving Convertibles is a Fashion Statement: The Open-Air Elegance',
                'title_en': 'Driving Convertibles is a Fashion Statement: The Open-Air Elegance',
                'slug': 'driving-convertibles-fashion-statement',
                'cat_slugs': ['others'],
                'cover_image_url': '/assets/images/29-683x1024.jpg',
                'excerpt': 'Automotive industrial elegance intertwined with bespoke lifestyle luxury.',
                'excerpt_en': 'Automotive industrial elegance intertwined with bespoke lifestyle luxury.',
                'content': '''<p>The open road and timeless convertibles have inspired couture houses and filmmakers for over a century.</p>''',
                'author_name': 'Editorial Bureau',
                'reading_time': '৪ মিনিট পাঠ',
                'reading_time_en': '4 min read',
                'is_featured_hero': False,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 3820,
            },
            {
                'title': 'Christmas Came Early This Year: Festive Winter Gatherings',
                'title_en': 'Christmas Came Early This Year: Festive Winter Gatherings',
                'slug': 'christmas-came-early-this-year',
                'cat_slugs': ['media-entertainment'],
                'cover_image_url': '/assets/images/shutterstock_398822470-1024x683.jpg',
                'excerpt': 'Warm fires, festive tablescapes, and handcrafted winter joy.',
                'excerpt_en': 'Warm fires, festive tablescapes, and handcrafted winter joy.',
                'content': '''<p>A curated retrospective of celebratory gathering spaces, warm spices, and seasonal cheer.</p>''',
                'author_name': 'The Mad Story Desk',
                'reading_time': '৩ মিনিট পাঠ',
                'reading_time_en': '3 min read',
                'is_featured_hero': False,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 1320,
            },
            # Sample pending approval blog from user
            {
                'title': 'ডিজিটাল যুগে হস্তশিল্প ও কাঠ খোদাইয়ের পুনর্জাগরণ',
                'title_en': 'The Revival of Handcrafted Wood Carving in the Digital Era',
                'slug': 'revival-of-handcrafted-wood-carving',
                'cat_slugs': ['furniture-craft', 'art-culture'],
                'cover_image_url': '/assets/images/Modern_living_room-1024x572.jpg',
                'excerpt': 'মেশিনের যান্ত্রিক নিখুঁততার বিপরীতে হাতের স্পর্শে তৈরি কাঠের কারুকাজে ফিরছে আভিজাত্য।',
                'excerpt_en': 'Why handmade craftsmanship and tactile authenticity are experiencing a renaissance against machine conformity.',
                'content': '''<p>মেশিন হয়তো মিলিমিটারের ভগ্নাংশে নিখুঁত কাট তৈরি করতে পারে, কিন্তু হস্তশিল্পীর হাতের প্রতিটি আঁচড়ে থাকে এক একটি জীবন্ত গল্প।</p><p>আজকের দ্রুতগতির বিশ্বে মানুষ আবার ফিরছে প্রাকৃতিক অনুভূতি ও অনন্যতায় ভরা আসবাবের দিকে।</p>''',
                'author_name': 'Sarah Jenkins',
                'reading_time': '৫ মিনিট পাঠ',
                'reading_time_en': '5 min read',
                'is_featured_hero': False,
                'is_colti_trending': False,
                'is_nirbachito_choice': False,
                'view_count': 45,
                'status': 'pending_approval'
            }
        ]

        created_articles = []
        for art_data in articles_data:
            cat_slugs = art_data.pop('cat_slugs', [])
            art_status = art_data.pop('status', 'published')
            article, _ = Article.objects.update_or_create(
                slug=art_data['slug'],
                defaults={
                    'author': writer_user if art_data['author_name'] == 'Sarah Jenkins' else admin_user,
                    'status': art_status,
                    **art_data
                }
            )
            # Set ManyToMany categories
            matched_cats = [cat_map[s] for s in cat_slugs if s in cat_map]
            if not matched_cats:
                matched_cats = [Category.objects.first()]
            article.categories.set(matched_cats)
            created_articles.append(article)

        self.stdout.write(self.style.SUCCESS(f"[OK] Seeded {len(created_articles)} articles with M2M categories"))

        # 4. Seed Homepage Customization Configuration
        custom_config, _ = HomepageCustomization.objects.get_or_create(id=1)
        hero_articles = Article.objects.filter(is_featured_hero=True)[:5]
        colti_articles = Article.objects.filter(is_colti_trending=True)[:6]
        nirbachito_articles = Article.objects.filter(is_nirbachito_choice=True)[:4]
        art_culture_articles = Article.objects.filter(categories__slug='art-culture', status='published')[:6]

        custom_config.hero_articles.set(hero_articles)
        custom_config.colti_articles.set(colti_articles)
        custom_config.nirbachito_articles.set(nirbachito_articles)
        custom_config.art_culture_articles.set(art_culture_articles)
        self.stdout.write(self.style.SUCCESS("[OK] Homepage customization configuration initialized"))

        # 5. Tree Comments Seeding
        first_art = created_articles[0]
        # Root comment
        root_comment, _ = Comment.objects.get_or_create(
            article=first_art,
            user=admin_user,
            content="দারুণ একটি বিশ্লেষণধর্মী লেখা! ফ্যাশনে ভিন্টেজ ডেনিমের রূপান্তর নিয়ে এমন গভীর আলোচনা সত্যিই বিরল।"
        )
        # Nested reply (Tree comment)
        reply_comment, _ = Comment.objects.get_or_create(
            article=first_art,
            user=writer_user,
            parent=root_comment,
            content="ধন্যবাদ চিফ এডিটর! সামনের পর্বে ইউরোপীয় ডেনিম মিলগুলোর সাসটেইনেবিলিটি নিয়ে আরও তথ্য যুক্ত করা হবে।"
        )
        # Nested sub-reply
        Comment.objects.get_or_create(
            article=first_art,
            user=admin_user,
            parent=reply_comment,
            content="চমৎকার! পাঠকরা আগ্রহ নিয়ে অপেক্ষা করবে।"
        )

        second_art = created_articles[5] # Words Are Cunning
        c2, _ = Comment.objects.get_or_create(
            article=second_art,
            user=writer_user,
            content="শব্দেরা খুব চতুর—শিরোনামটাই দারুণ এক সম্মোহন তৈরি করে। লেখকের সাহিত্যবোধ প্রশংসনীয়।"
        )
        Comment.objects.get_or_create(
            article=second_art,
            user=admin_user,
            parent=c2,
            content="একেবারেই একমত! রূপকের ব্যবহার ছিল দেখার মতো।"
        )
        self.stdout.write(self.style.SUCCESS("[OK] Tree comments seeded"))

        # 6. Heart Reactions Seeding
        for art in created_articles[:8]:
            PostHeart.objects.get_or_create(user=admin_user, article=art)
            PostHeart.objects.get_or_create(user=writer_user, article=art)
        self.stdout.write(self.style.SUCCESS("[OK] Post heart reactions seeded"))

        # 7. Sample newsletter and inquiry
        NewsletterSubscriber.objects.get_or_create(email='reader@themadstory.com')
        ContactInquiry.objects.get_or_create(
            email='collaborator@agency.com',
            defaults={
                'name': 'Adnan Sami',
                'phone': '+880 1819-998877',
                'subject': 'Editorial Collaboration Proposal',
                'message': 'Hello The Mad Story team, we would love to collaborate on a cultural art exhibition coverage.'
            }
        )
        self.stdout.write(self.style.SUCCESS("[OK] Seeded sample newsletter subscriber & contact inquiry"))
        self.stdout.write(self.style.SUCCESS("===> ALL ADVANCED SEED DATA SUCCESSFULLY APPLIED!"))
