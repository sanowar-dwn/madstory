import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Article, Category } from '../types';
import { HeartButton } from '../components/ui/HeartButton';
import { CommentTree } from '../components/ui/CommentTree';
import { SocialShareBar } from '../components/ui/SocialShareBar';
import { Sidebar } from '../components/home/Sidebar';
import { useLanguage } from '../context/LanguageContext';
import { toast } from '../context/ToastContext';
import { Loader2, Clock, Eye, ArrowLeft } from 'lucide-react';

interface PostDetailPageProps {
  categories?: Category[];
}

export const PostDetailPage: React.FC<PostDetailPageProps> = ({ categories: propCategories }) => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  // Sidebar widgets data
  const [specialFeaturedArticles, setSpecialFeaturedArticles] = useState<Article[]>([]);
  const [popularArticles, setPopularArticles] = useState<Article[]>([]);
  const [sidebarCategories, setSidebarCategories] = useState<Category[]>(propCategories || []);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await api.getArticleBySlug(slug);
        setArticle(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  // Fetch right-hand sidebar feed & categories
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        const [homeFeed, allCats] = await Promise.all([
          api.getHomeFeed().catch(() => null),
          propCategories && propCategories.length > 0 ? Promise.resolve(propCategories) : api.getCategories().catch(() => []),
        ]);
        if (homeFeed) {
          if (homeFeed.hero) {
            setSpecialFeaturedArticles(homeFeed.hero.filter(a => a.slug !== slug));
          }
          if (homeFeed.popular) {
            setPopularArticles(homeFeed.popular.filter(a => a.slug !== slug));
          }
        }
        if (allCats && allCats.length > 0) {
          setSidebarCategories(allCats);
        }
      } catch (err) {
        console.error('Error fetching sidebar data for post detail:', err);
      }
    };
    fetchSidebarData();
  }, [slug, propCategories]);

  // Helper for setting dynamic meta tags for social sharing
  const setMetaTag = (property: string, content: string, isName = false) => {
    const attr = isName ? 'name' : 'property';
    let element = document.querySelector(`meta[${attr}="${property}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, property);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Dynamic SEO, Title & Open Graph tags for rich social sharing
  useEffect(() => {
    if (article) {
      const pageTitle = lang === 'en' && article.title_en ? article.title_en : article.title;
      const pageExcerpt = (lang === 'en' && article.excerpt_en ? article.excerpt_en : article.excerpt) || pageTitle;
      const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

      // Resolve absolute thumbnail URL for OpenGraph / Twitter Cards
      let rawImage = article.image || '/assets/images/18-1024x678.jpg';
      let imageUrl = rawImage;
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://themadstory.com';
        imageUrl = `${origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }

      document.title = `${pageTitle} — The Mad Story`;

      // Open Graph / Facebook / WhatsApp / LinkedIn
      setMetaTag('og:site_name', 'The Mad Story');
      setMetaTag('og:type', 'article');
      setMetaTag('og:title', pageTitle);
      setMetaTag('og:description', pageExcerpt);
      setMetaTag('og:image', imageUrl);
      setMetaTag('og:image:secure_url', imageUrl);
      setMetaTag('og:image:alt', pageTitle);
      setMetaTag('og:image:width', '1200');
      setMetaTag('og:image:height', '630');
      setMetaTag('og:url', currentUrl);
      if (article.published_at) {
        setMetaTag('article:published_time', article.published_at);
      }
      if (article.author_name) {
        setMetaTag('article:author', article.author_name);
      }

      // Twitter Cards
      setMetaTag('twitter:card', 'summary_large_image', true);
      setMetaTag('twitter:site', '@themadstory', true);
      setMetaTag('twitter:title', pageTitle, true);
      setMetaTag('twitter:description', pageExcerpt, true);
      setMetaTag('twitter:image', imageUrl, true);
      setMetaTag('twitter:image:alt', pageTitle, true);
    }

    return () => {
      document.title = 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা';
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://themadstory.com';
      const fallbackLogo = `${origin}/assets/images/Madstory-logo.png`;
      setMetaTag('og:type', 'website');
      setMetaTag('og:title', 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা');
      setMetaTag('og:description', 'The Mad Story is a premier cultural and lifestyle magazine exploring design, architecture, literature, cinema, and contemporary editorial narratives.');
      setMetaTag('og:image', fallbackLogo);
      setMetaTag('twitter:title', 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা', true);
      setMetaTag('twitter:description', 'The Mad Story is a premier cultural and lifestyle magazine exploring design, architecture, literature, cinema, and contemporary editorial narratives.', true);
      setMetaTag('twitter:image', fallbackLogo, true);
    };
  }, [article, lang]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#800020] animate-spin mb-3" />
        <span className="font-bengali text-sm text-gray-500">লেখা লোড হচ্ছে...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="madstory-container py-20 text-center">
        <h2 className="text-2xl font-bengali font-bold text-gray-800 mb-4">লেখাটি খুঁজে পাওয়া যায়নি</h2>
        <Link to="/" className="inline-flex items-center gap-2 text-[#800020] font-bengali font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>প্রচ্ছদে ফিরে যান</span>
        </Link>
      </div>
    );
  }

  // Bilingual fields
  const displayTitle = (lang === 'en' && article.title_en) ? article.title_en : article.title;
  const displayExcerpt = (lang === 'en' && article.excerpt_en) ? article.excerpt_en : article.excerpt;
  const displayContent = (lang === 'en' && article.content_en) ? article.content_en : article.content;
  const displayReadingTime = (lang === 'en' && article.reading_time_en) ? article.reading_time_en : article.reading_time;

  return (
    <article className="py-8">
      <div className="madstory-container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Article Content Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-gray-400 font-bengali">
              <Link to="/" className="hover:text-[#800020] transition">{t('nav.home')}</Link>
              <span>/</span>
              {article.categories && article.categories.length > 0 && (
                <>
                  <Link to={`/category/${article.categories[0].slug}`} className="hover:text-[#800020] transition">
                    {lang === 'en' && article.categories[0].name_en ? article.categories[0].name_en : article.categories[0].name}
                  </Link>
                  <span>/</span>
                </>
              )}
              <span className="text-gray-600 truncate max-w-xs">{displayTitle}</span>
            </nav>

            {/* M2M Category Badges */}
            <div className="flex flex-wrap gap-2">
              {article.categories?.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className="inline-block bg-[#800020] hover:bg-[#9b1b30] text-white text-xs font-bengali font-semibold px-3 py-1 rounded transition"
                >
                  {lang === 'en' && cat.name_en ? cat.name_en : cat.name}
                </Link>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bengali font-bold text-[#1e2022] leading-tight">
              {displayTitle}
            </h1>

            {/* Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[#e2ddd3] text-xs text-gray-500 font-sans">
              <div className="flex items-center gap-3">
                {article.author?.username ? (
                  <Link to={`/author/${article.author.username}`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-xs font-bengali overflow-hidden border border-[#800020]">
                      {article.author.avatar ? (
                        <img src={article.author.avatar} alt={article.author.name} className="w-full h-full object-cover" />
                      ) : (
                        (article.author.name || article.author_name || 'M').charAt(0)
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 group-hover:text-[#800020] transition block">
                        {article.author.name || article.author_name || 'The Mad Story Desk'}
                      </span>
                      <span className="text-gray-400 text-[11px] font-bengali">
                        {article.author.designation || 'The Mad Story Editorial Desk'}
                      </span>
                    </div>
                  </Link>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-xs font-bengali">
                      {(article.author_name || 'M').charAt(0)}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800 block">{article.author_name || 'The Mad Story Desk'}</span>
                      <span className="text-gray-400 text-[11px]">The Mad Story Editorial Desk</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 sm:gap-4 text-[11px]">
                {/* Heart Reaction Button */}
                <HeartButton
                  slug={article.slug}
                  initialHearted={article.is_hearted}
                  initialCount={article.hearts_count}
                  size="md"
                />

                <span className="flex items-center gap-1 font-bengali">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{displayReadingTime || '৫ মিনিট পাঠ'}</span>
                </span>

                <span className="hidden sm:flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{article.view_count || 1} views</span>
                </span>

                {/* Top Quick Share */}
                <SocialShareBar
                  variant="top"
                  title={displayTitle}
                  excerpt={displayExcerpt}
                  articleId={article.id}
                />
              </div>
            </div>

            {/* Cover Image */}
            <div className="relative rounded overflow-hidden shadow-md">
              <img
                src={article.image}
                alt={displayTitle}
                className="w-full max-h-[500px] object-cover"
              />
            </div>

            {/* Excerpt Lead */}
            {displayExcerpt && (
              <div className="bg-[#f7f2eb] border-l-4 border-[#800020] p-4 rounded-r">
                <p className="font-bengali text-base sm:text-lg text-gray-700 italic leading-relaxed">
                  {displayExcerpt}
                </p>
              </div>
            )}

            {/* Article Body Content */}
            <div
              className="font-bengali text-gray-800 text-base leading-loose space-y-5 prose prose-lg max-w-none prose-headings:font-bengali prose-headings:text-[#1e2022] prose-blockquote:border-l-[#800020] prose-blockquote:bg-[#faf7f2] prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:font-serif"
              dangerouslySetInnerHTML={{ __html: displayContent || `<p>${displayExcerpt}</p>` }}
            />

            {/* Bottom Reactions & Social Share Bar */}
            <div className="border-t border-[#ded7cc] pt-6 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <HeartButton
                    slug={article.slug}
                    initialHearted={article.is_hearted}
                    initialCount={article.hearts_count}
                    size="lg"
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-800 font-bengali block">
                      {lang === 'en' ? 'Liked this article?' : 'লেখাটি ভালো লেগেছে?'}
                    </span>
                    <span className="text-[11px] text-gray-400 font-bengali">
                      {lang === 'en' ? 'Leave a heart to appreciate the author' : 'লেখকের উৎসাহে একটি লাইক দিন'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comprehensive Social Sharing Module */}
              <SocialShareBar
                variant="bottom"
                title={displayTitle}
                excerpt={displayExcerpt}
                articleId={article.id}
              />
            </div>

            {/* Author Bio Box */}
            {article.author?.username && (
              <div className="p-6 bg-[#fcfbfa] border border-[#e2ddd3] rounded-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <Link to={`/author/${article.author.username}`} className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-2xl font-bengali overflow-hidden border-2 border-white shadow-sm">
                    {article.author.avatar ? (
                      <img src={article.author.avatar} alt={article.author.name} className="w-full h-full object-cover" />
                    ) : (
                      (article.author.name || 'M').charAt(0)
                    )}
                  </div>
                </Link>
                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h4 className="font-bengali font-bold text-lg text-gray-900">
                        <Link to={`/author/${article.author.username}`} className="hover:text-[#800020] transition">
                          {article.author.name || article.author_name}
                        </Link>
                      </h4>
                      <p className="text-xs font-bengali text-[#800020] font-semibold">
                        {article.author.designation || 'The Mad Story নিয়মিত লেখক'}
                      </p>
                    </div>
                    <Link
                      to={`/author/${article.author.username}`}
                      className="inline-flex items-center justify-center gap-1 text-xs font-bengali text-[#800020] hover:underline pt-1 sm:pt-0"
                    >
                      <span>লেখকের সব লেখা</span>
                      &rarr;
                    </Link>
                  </div>
                  {article.author.bio && (
                    <p className="text-xs text-gray-600 font-bengali leading-relaxed pt-1">
                      {article.author.bio}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tree Comments Section */}
            <CommentTree articleSlug={article.slug} />

            {/* Related Articles */}
            {article.related_articles && article.related_articles.length > 0 && (
              <div className="border-t-2 border-[#800020] pt-6">
                <h3 className="font-bengali font-bold text-xl text-[#1e2022] mb-6">
                  {t('section.related')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {article.related_articles.map((rel) => (
                    <div key={rel.id} className="magazine-card group flex flex-col">
                      <div className="aspect-[4/3] w-full overflow-hidden img-zoom-wrapper border-b border-[#e2ddd3]">
                        <Link to={`/post/${rel.slug}`}>
                          <img src={rel.image} alt={rel.title} className="w-full h-full object-cover" />
                        </Link>
                      </div>
                      <div className="p-3 flex flex-col flex-1">
                        <h5 className="font-bengali font-bold text-xs text-gray-800 group-hover:text-[#800020] transition line-clamp-2 leading-snug flex-1">
                          <Link to={`/post/${rel.slug}`}>{rel.title}</Link>
                        </h5>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 font-sans mt-2">
                          <span>{rel.reading_time || '৪ মিনিট'}</span>
                          <HeartButton slug={rel.slug} initialHearted={rel.is_hearted} initialCount={rel.hearts_count} size="sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right-Hand Sidebar (Sticky identical to Homepage) */}
          <div className="lg:col-span-4 lg:sticky lg:top-20">
            <Sidebar
              sliderArticles={specialFeaturedArticles}
              popularArticles={popularArticles}
              categories={sidebarCategories}
            />
          </div>
        </div>
      </div>
    </article>
  );
};
