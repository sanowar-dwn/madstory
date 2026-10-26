import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Article, Category } from '../types';
import { Loader2, ArrowLeft, BookOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CategoryPageProps {
  categories: Category[];
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ categories }) => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Find matching category object
  const currentCategory = categories.find((c) => c.slug === slug) ||
    categories.flatMap(c => c.subcategories || []).find(s => s.slug === slug);

  useEffect(() => {
    if (currentCategory) {
      const catName = lang === 'en' && currentCategory.name_en ? currentCategory.name_en : currentCategory.name;
      document.title = `${catName} — The Mad Story`;
    }
    return () => {
      document.title = 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা';
    };
  }, [currentCategory, lang]);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await api.getArticles({ category__slug: slug });
        setArticles(res.results || []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('Error fetching category articles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [slug]);

  const rawName = lang === 'en' && currentCategory?.name_en ? currentCategory.name_en : currentCategory?.name;
  const categoryTitle = rawName || (slug ? slug.replace(/-/g, ' ') : t('section.categories'));
  const categoryDesc = (lang === 'en' && currentCategory?.description_en) ? currentCategory.description_en : (currentCategory?.description || t('category.defaultDesc'));

  return (
    <div className="py-8">
      <div className="madstory-container">
        {/* Breadcrumb */}
        <nav className={`flex items-center gap-2 text-xs text-gray-400 mb-6 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
          <Link to="/" className="hover:text-[#800020] transition">{t('nav.home')}</Link>
          <span>/</span>
          <span className="text-gray-600 font-semibold">{categoryTitle}</span>
        </nav>

        {/* Category Header Banner */}
        <div className="bg-[#f4eee6] border border-[#ded7cc] p-6 sm:p-8 rounded-sm mb-8 text-center">
          <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-[#800020] block mb-1">
            {t('category.archive')}
          </span>
          <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold text-[#1e2022] mb-3 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
            {categoryTitle}
          </h1>
          <p className={`max-w-2xl mx-auto text-xs sm:text-sm text-gray-600 leading-relaxed ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
            {categoryDesc}
          </p>

          {/* Subcategories Tabs if available */}
          {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5 pt-4 border-t border-[#ded7cc]/60">
              <span className={`text-xs font-semibold text-gray-500 mr-2 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                {t('category.subcategories')}
              </span>
              {currentCategory.subcategories.map((sub) => {
                const subName = lang === 'en' && sub.name_en ? sub.name_en : sub.name;
                return (
                  <Link
                    key={sub.slug}
                    to={`/category/${sub.slug}`}
                    className={`px-3 py-1 bg-white hover:bg-[#800020] text-gray-700 hover:text-white rounded text-xs transition border border-[#ded7cc] ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}
                  >
                    {subName}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Articles Grid */}
        {loading ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#800020] animate-spin mb-3" />
            <span className={`text-sm text-gray-500 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {t('category.loading')}
            </span>
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art) => {
              const artTitle = lang === 'en' && art.title_en ? art.title_en : art.title;
              const artExcerpt = lang === 'en' && art.excerpt_en ? art.excerpt_en : art.excerpt;
              const artCategory = lang === 'en' && art.category_name_en ? art.category_name_en : (art.category_name || categoryTitle);
              const readTime = lang === 'en' && art.reading_time_en ? art.reading_time_en : (art.reading_time || '৫ মিনিট');

              return (
                <div key={art.id} className="magazine-card group flex flex-col">
                  <div className="relative h-48 w-full overflow-hidden img-zoom-wrapper border-b border-[#e2ddd3]">
                    <Link to={`/post/${art.slug}`}>
                      <img src={art.image} alt={artTitle} className="w-full h-full object-cover" />
                    </Link>
                    <span className="absolute top-2.5 left-2.5 bg-[#800020]/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow">
                      {artCategory}
                    </span>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className={`font-bold text-base text-[#1e2022] group-hover:text-[#800020] transition line-clamp-2 leading-snug mb-2 flex-1 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                      <Link to={`/post/${art.slug}`}>{artTitle}</Link>
                    </h3>
                    <p className={`text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                      {artExcerpt}
                    </p>
                    <div className="dotted-divider mt-auto" />
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-sans pt-1">
                      <span>{art.author_name}</span>
                      <span>{readTime}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center bg-white border border-[#e2ddd3] rounded-sm p-8">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h3 className={`text-lg font-bold text-gray-700 mb-2 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {t('category.empty')}
            </h3>
            <p className={`text-xs text-gray-500 mb-4 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {t('category.emptyDesc')}
            </p>
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#800020] hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('category.backHome')}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
