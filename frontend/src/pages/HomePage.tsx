import React, { useEffect, useState } from 'react';
import { BoldHeroSlider } from '../components/home/BoldHeroSlider';
import { FeaturedCategoriesSection } from '../components/home/FeaturedCategoriesSection';
import { LeadHeroSection } from '../components/home/LeadHeroSection';
import { CardGridBlock } from '../components/home/CardGridBlock';
import { MagazineCategoryGrid } from '../components/home/MagazineCategoryGrid';
import { Sidebar } from '../components/home/Sidebar';
import { VideoSection } from '../components/home/VideoSection';
import { api } from '../services/api';
import { HomeFeedPayload, Category, Article, HomepageCustomization, HeroSlide, Video } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { findCategoryInTree } from '../utils/categoryTree';
import { Loader2 } from 'lucide-react';

interface HomePageProps {
  categories: Category[];
}

export const HomePage: React.FC<HomePageProps> = ({ categories }) => {
  const [feed, setFeed] = useState<HomeFeedPayload | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [customization, setCustomization] = useState<HomepageCustomization | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homeFeed, articlesRes, customData, slidesData, videosData] = await Promise.all([
          api.getHomeFeed(),
          api.getArticles({ page_size: 100 }),
          api.getHomepageCustomization().catch(() => null),
          api.getHeroSlides().catch(() => []),
          api.getVideos().catch(() => []),
        ]);
        setFeed(homeFeed);
        setAllArticles(articlesRes.results || []);
        setCustomization(customData);
        setHeroSlides(slidesData);
        setVideos(videosData);
      } catch (err) {
        console.error('Error fetching home feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#800020] animate-spin mb-3" />
        <span className="font-bengali text-sm text-gray-500">ম্যাগাজিন লোড হচ্ছে...</span>
      </div>
    );
  }

  // 1. Trending (চলতি): ONLY articles with is_colti_trending flag should show up
  const coltiArticles = (feed?.colti && feed.colti.length > 0)
    ? feed.colti.filter((a) => a.is_colti_trending)
    : allArticles.filter((a) => a.is_colti_trending);

  // 2. Editor's Choice (নির্বাচিত): ONLY articles with is_nirbachito_choice flag should show up
  const nirbachitoArticles = (feed?.nirbachito && feed.nirbachito.length > 0)
    ? feed.nirbachito.filter((a) => a.is_nirbachito_choice)
    : allArticles.filter((a) => a.is_nirbachito_choice);

  // 3. Special Featured (বিশেষ ফিচার): ONLY articles with is_featured_hero flag should show up
  const specialFeaturedArticles = (feed?.hero && feed.hero.length > 0)
    ? feed.hero.filter((a) => a.is_featured_hero)
    : allArticles.filter((a) => a.is_featured_hero);

  // Helper to collect all matching slugs for a category including its subcategories
  const getCategoryDescendantSlugs = (slug: string): string[] => {
    const matchedSlugs = new Set<string>([slug]);
    const root = findCategoryInTree(categories, (c) => c.slug === slug);
    if (root && root.subcategories) {
      const collect = (cats: Category[]) => {
        cats.forEach((c) => {
          matchedSlugs.add(c.slug);
          if (c.subcategories) collect(c.subcategories);
        });
      };
      collect(root.subcategories);
    }
    return Array.from(matchedSlugs);
  };

  const getArticlesForCategory = (slug: string): Article[] => {
    const validSlugs = getCategoryDescendantSlugs(slug);
    return allArticles.filter((art) => {
      if (art.category_slug && validSlugs.includes(art.category_slug)) return true;
      if (art.categories && art.categories.some((c) => validSlugs.includes(c.slug))) return true;
      return false;
    });
  };

  // Art & Culture
  const artArticles = customization?.art_culture_article_details && customization.art_culture_article_details.length > 0
    ? customization.art_culture_article_details
    : getArticlesForCategory('art-culture');
  const artDisplay = artArticles.length >= 3 ? artArticles : (artArticles.length > 0 ? artArticles : allArticles.slice(0, 6));

  const getCategoryTitle = (slug: string, fallbackEn: string, fallbackBn: string) => {
    const cat = findCategoryInTree(categories, (c) => c.slug === slug);
    if (!cat) return lang === 'en' ? fallbackEn : fallbackBn;
    return (lang === 'en' && cat.name_en) ? cat.name_en : cat.name;
  };

  // 2-Column paired category blocks (Supports any selected main or child categories)
  const selectedGridCategories: { slug: string; title: string }[] = (() => {
    if (customization?.category_block_details && customization.category_block_details.length > 0) {
      return customization.category_block_details.map((cat) => ({
        slug: cat.slug,
        title: (lang === 'en' && cat.name_en) ? cat.name_en : cat.name,
      }));
    }
    // Default blocks if not explicitly chosen
    return [
      {
        slug: 'media-entertainment',
        title: getCategoryTitle('media-entertainment', 'Media & Entertainment', 'মিডিয়া এবং এন্টারটেইনমেন্ট'),
      },
      {
        slug: 'travel',
        title: getCategoryTitle('travel', 'Travel & Leisure', 'ভ্রমণ ও পর্যটন'),
      },
      {
        slug: 'design-lifestyle',
        title: getCategoryTitle('design-lifestyle', 'Design & Lifestyle', 'ডিজাইন এন্ড লাইফস্টাইল'),
      },
      {
        slug: 'furniture-craft',
        title: getCategoryTitle('furniture-craft', 'Furniture & Craft', 'আসবাবপত্র ও নকশা'),
      },
      {
        slug: 'literature',
        title: getCategoryTitle('literature', 'Literature & Musings', 'সাহিত্য ও ভাবনা'),
      },
      {
        slug: 'others',
        title: getCategoryTitle('others', 'Contemporary Narratives', 'অন্যান্য সমকালীন গল্প'),
      },
    ];
  })();

  const magazineBlocks = selectedGridCategories.map((item) => {
    const articles = getArticlesForCategory(item.slug);
    return {
      title: item.title,
      slug: item.slug,
      featuredArticle: articles[0],
      subArticles: articles.slice(1, 4),
    };
  });

  const otherArticles = getArticlesForCategory('others');
  const lifestyleDisplay = otherArticles.length >= 3 ? otherArticles : (otherArticles.length > 0 ? otherArticles : allArticles.slice(0, 6));

  // Featured Categories: ONLY categories marked as featured will show up
  const featuredCategories: Category[] = (() => {
    const list: Category[] = [];
    const seen = new Set<number | string>();

    // 1. From Home Feed (populated by backend magazine_home with featured flag)
    if (feed?.featured_categories && feed.featured_categories.length > 0) {
      for (const cat of feed.featured_categories) {
        const key = cat.id || cat.slug;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(cat);
        }
      }
    }

    // 2. From Homepage Customization curated categories
    if (customization?.featured_category_details && customization.featured_category_details.length > 0) {
      for (const cat of customization.featured_category_details) {
        const key = cat.id || cat.slug;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(cat);
        }
      }
    }

    // 3. From global categories with is_featured flag
    for (const cat of categories) {
      const key = cat.id || cat.slug;
      if (cat.is_featured && !seen.has(key)) {
        seen.add(key);
        list.push(cat);
      }
      if (cat.subcategories) {
        for (const sub of cat.subcategories) {
          const subKey = sub.id || sub.slug;
          if (sub.is_featured && !seen.has(subKey)) {
            seen.add(subKey);
            list.push(sub);
          }
        }
      }
    }

    return list;
  })();

  // Customization visibility toggles
  const showHero = customization?.show_hero ?? true;
  const showFeaturedCategories = customization?.show_featured_categories ?? true;
  const showLead = customization?.show_lead ?? true;
  const showArtCulture = customization?.show_art_culture ?? true;
  const showCategoryBlocks = customization?.show_category_blocks ?? true;
  const showSidebar = customization?.show_sidebar ?? true;
  const showVideos = customization?.show_videos ?? true;

  const featuredCategoriesTitle = lang === 'en'
    ? (customization?.featured_categories_title_en || 'Featured Categories')
    : (customization?.featured_categories_title_bn || 'ফিচার্ড ক্যাটাগরি');
  const coltiTitle = lang === 'en' ? (customization?.colti_title_en || 'Trending') : (customization?.colti_title_bn || 'চলতি');
  const nirbachitoTitle = lang === 'en' ? (customization?.nirbachito_title_en || "Editor's Choice") : (customization?.nirbachito_title_bn || 'নির্বাচিত');
  const artCultureTitle = lang === 'en' ? (customization?.art_culture_title_en || 'Art & Culture') : (customization?.art_culture_title_bn || 'শিল্প ও সংস্কৃতি');
  const videosTitle = lang === 'en' ? (customization?.videos_title_en || 'Video Stories') : (customization?.videos_title_bn || 'ভিডিও স্টোরি');
  const videosSubtitle = lang === 'en' ? (customization?.videos_subtitle_en || 'Interviews, visual essays & cultural documentaries') : (customization?.videos_subtitle_bn || 'বিশেষ সাক্ষাৎকার, ভিজ্যুয়াল স্টোরি ও তথ্যচিত্র');

  return (
    <div className="space-y-8">
      {/* 1. Dedicated Hero Banner Images Slider Module */}
      {showHero && (
        <BoldHeroSlider slides={heroSlides} />
      )}

      {/* 2. Featured Categories Section (ONLY featured categories show up) */}
      {showFeaturedCategories && featuredCategories.length > 0 && (
        <FeaturedCategoriesSection
          categories={featuredCategories}
          title={featuredCategoriesTitle}
        />
      )}

      {/* Main Container Layout */}
      <div className="madstory-container">
        <div className={`grid grid-cols-1 ${showSidebar ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-8 items-start`}>
          {/* Main Feed Column */}
          <div className={`${showSidebar ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-10`}>
            {/* 2. Lead Hero Section: চলতি + নির্বাচিত */}
            {showLead && (
              <LeadHeroSection
                coltiArticles={coltiArticles}
                nirbachitoArticles={nirbachitoArticles}
                coltiTitle={coltiTitle}
                nirbachitoTitle={nirbachitoTitle}
              />
            )}

            {/* 3. Section: শিল্প ও সংস্কৃতি */}
            {showArtCulture && (
              <CardGridBlock
                title={artCultureTitle}
                categorySlug="art-culture"
                articles={artDisplay}
              />
            )}

            {/* 4. Section: Magazine Category Blocks */}
            {showCategoryBlocks && (
              <MagazineCategoryGrid blocks={magazineBlocks} categories={categories} />
            )}

            {/* 5. Section: সমকালীন গল্প ও ফ্যাশন */}
            <CardGridBlock
              title={lang === 'en' ? 'Stories & Lifestyle' : 'সমকালীন গল্প ও ফ্যাশন'}
              categorySlug="others"
              articles={lifestyleDisplay}
            />
          </div>

          {/* Right-Hand Sidebar */}
          {showSidebar && (
            <div className="lg:col-span-4 lg:sticky lg:top-20">
              <Sidebar
                sliderArticles={specialFeaturedArticles}
                popularArticles={feed?.popular && feed.popular.length > 0 ? feed.popular : allArticles.slice(0, 5)}
                categories={categories}
              />
            </div>
          )}
        </div>

        {/* 6. Section: ভিডিও স্টোরি (Video Stories - YouTube Embed & Direct Video Player) */}
        {showVideos && videos.length > 0 && (
          <VideoSection
            videos={videos}
            title={videosTitle}
            subtitle={videosSubtitle}
          />
        )}
      </div>
    </div>
  );
};
