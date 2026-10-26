import React, { useEffect, useState } from 'react';
import { BoldHeroSlider } from '../components/home/BoldHeroSlider';
import { LeadHeroSection } from '../components/home/LeadHeroSection';
import { CardGridBlock } from '../components/home/CardGridBlock';
import { MagazineCategoryGrid } from '../components/home/MagazineCategoryGrid';
import { Sidebar } from '../components/home/Sidebar';
import { api } from '../services/api';
import { HomeFeedPayload, Category, Article, HomepageCustomization, HeroSlide } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Loader2 } from 'lucide-react';

interface HomePageProps {
  categories: Category[];
}

export const HomePage: React.FC<HomePageProps> = ({ categories }) => {
  const [feed, setFeed] = useState<HomeFeedPayload | null>(null);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [customization, setCustomization] = useState<HomepageCustomization | null>(null);
  const [loading, setLoading] = useState(true);
  const { lang, t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [homeFeed, articlesRes, customData, slidesData] = await Promise.all([
          api.getHomeFeed(),
          api.getArticles(),
          api.getHomepageCustomization().catch(() => null),
          api.getHeroSlides().catch(() => []),
        ]);
        setFeed(homeFeed);
        setAllArticles(articlesRes.results || []);
        setCustomization(customData);
        setHeroSlides(slidesData);
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

  // Articles for sections
  const heroArticles = customization?.hero_article_details && customization.hero_article_details.length > 0
    ? customization.hero_article_details
    : (feed?.hero && feed.hero.length > 0 ? feed.hero : allArticles.slice(0, 5));

  const coltiArticles = customization?.colti_article_details && customization.colti_article_details.length > 0
    ? customization.colti_article_details
    : (feed?.colti && feed.colti.length > 0 ? feed.colti : allArticles.slice(0, 5));

  const nirbachitoArticles = customization?.nirbachito_article_details && customization.nirbachito_article_details.length > 0
    ? customization.nirbachito_article_details
    : (feed?.nirbachito && feed.nirbachito.length > 0 ? feed.nirbachito : allArticles.slice(5, 9));

  // Art & Culture
  const artArticles = customization?.art_culture_article_details && customization.art_culture_article_details.length > 0
    ? customization.art_culture_article_details
    : allArticles.filter(
        (a) => a.categories?.some(c => c.slug === 'art-culture') || a.category_slug === 'art-culture'
      );
  const artDisplay = artArticles.length >= 3 ? artArticles : allArticles.slice(2, 8);

  // 2-Column paired category blocks
  const mediaArticles = allArticles.filter(a => a.categories?.some(c => c.slug.includes('media')) || a.category_slug?.includes('media'));
  const travelArticles = allArticles.filter(a => a.categories?.some(c => c.slug.includes('travel')) || a.category_slug?.includes('travel'));
  const designArticles = allArticles.filter(a => a.categories?.some(c => c.slug.includes('design')) || a.category_slug?.includes('design'));
  const furnitureArticles = allArticles.filter(a => a.categories?.some(c => c.slug.includes('furniture')) || a.category_slug?.includes('furniture'));
  const litArticles = allArticles.filter(a => a.categories?.some(c => c.slug.includes('literature')) || a.category_slug?.includes('literature'));
  const otherArticles = allArticles.filter(a => a.categories?.some(c => c.slug.includes('others')) || a.category_slug?.includes('others'));

  const magazineBlocks = [
    {
      title: lang === 'en' ? 'Media & Entertainment' : 'মিডিয়া এবং এন্টারটেইনমেন্ট',
      slug: 'media-entertainment',
      featuredArticle: mediaArticles[0] || allArticles[3] || allArticles[0],
      subArticles: mediaArticles.slice(1, 4).length > 0 ? mediaArticles.slice(1, 4) : allArticles.slice(4, 7),
    },
    {
      title: lang === 'en' ? 'Travel & Leisure' : 'ভ্রমণ ও পর্যটন',
      slug: 'travel',
      featuredArticle: travelArticles[0] || allArticles[4] || allArticles[1],
      subArticles: travelArticles.slice(1, 4).length > 0 ? travelArticles.slice(1, 4) : allArticles.slice(5, 8),
    },
    {
      title: lang === 'en' ? 'Design & Lifestyle' : 'ডিজাইন এন্ড লাইফস্টাইল',
      slug: 'design-lifestyle',
      featuredArticle: designArticles[0] || allArticles[1] || allArticles[2],
      subArticles: designArticles.slice(1, 4).length > 0 ? designArticles.slice(1, 4) : allArticles.slice(6, 9),
    },
    {
      title: lang === 'en' ? 'Furniture & Craft' : 'আসবাবপত্র ও নকশা',
      slug: 'furniture-craft',
      featuredArticle: furnitureArticles[0] || allArticles[5] || allArticles[3],
      subArticles: furnitureArticles.slice(1, 4).length > 0 ? furnitureArticles.slice(1, 4) : allArticles.slice(2, 5),
    },
    {
      title: lang === 'en' ? 'Literature & Musings' : 'সাহিত্য ও ভাবনা',
      slug: 'literature',
      featuredArticle: litArticles[0] || allArticles[4] || allArticles[0],
      subArticles: litArticles.slice(1, 4).length > 0 ? litArticles.slice(1, 4) : allArticles.slice(1, 4),
    },
    {
      title: lang === 'en' ? 'Contemporary Narratives' : 'অন্যান্য সমকালীন গল্প',
      slug: 'others',
      featuredArticle: otherArticles[0] || allArticles[2] || allArticles[5],
      subArticles: otherArticles.slice(1, 4).length > 0 ? otherArticles.slice(1, 4) : allArticles.slice(0, 3),
    },
  ];

  const lifestyleDisplay = otherArticles.length >= 3 ? otherArticles : allArticles.slice(8, 14);

  // Customization visibility toggles
  const showHero = customization?.show_hero ?? true;
  const showLead = customization?.show_lead ?? true;
  const showArtCulture = customization?.show_art_culture ?? true;
  const showCategoryBlocks = customization?.show_category_blocks ?? true;
  const showSidebar = customization?.show_sidebar ?? true;

  const coltiTitle = lang === 'en' ? (customization?.colti_title_en || 'Trending') : (customization?.colti_title_bn || 'চলতি');
  const nirbachitoTitle = lang === 'en' ? (customization?.nirbachito_title_en || "Editor's Choice") : (customization?.nirbachito_title_bn || 'নির্বাচিত');
  const artCultureTitle = lang === 'en' ? (customization?.art_culture_title_en || 'Art & Culture') : (customization?.art_culture_title_bn || 'শিল্প ও সংস্কৃতি');

  return (
    <div className="space-y-8">
      {/* 1. Dedicated Hero Banner Images Slider Module */}
      {showHero && (
        <BoldHeroSlider slides={heroSlides} />
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
              <MagazineCategoryGrid blocks={magazineBlocks} />
            )}

            {/* 5. Section: সমকালীন গল্প ও ফ্যাশন */}
            <CardGridBlock
              title={lang === 'en' ? 'Stories & Lifestyle' : 'সমকালীন গল্প ও ফ্যাশন'}
              categorySlug="others"
              articles={lifestyleDisplay.length > 0 ? lifestyleDisplay : allArticles.slice(0, 6)}
            />
          </div>

          {/* Right-Hand Sidebar */}
          {showSidebar && (
            <div className="lg:col-span-4 lg:sticky lg:top-20">
              <Sidebar
                sliderArticles={allArticles.slice(0, 3)}
                popularArticles={feed?.popular && feed.popular.length > 0 ? feed.popular : allArticles.slice(0, 5)}
                categories={categories}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
