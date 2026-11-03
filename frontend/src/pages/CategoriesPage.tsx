import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, FolderTree, Sparkles, Layers } from 'lucide-react';
import { Category } from '../types';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { flattenCategoryTree, buildCategoryTree, FlattenedCategoryItem } from '../utils/categoryTree';

interface CategoriesPageProps {
  categories?: Category[];
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ categories: initialCategories }) => {
  const { lang, t } = useLanguage();
  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'primary' | 'subcategories' | 'featured'>('all');
  const [loading, setLoading] = useState(!initialCategories || initialCategories.length === 0);

  useEffect(() => {
    document.title = lang === 'en'
      ? 'All Categories — The Mad Story'
      : 'সকল ক্যাটাগরি — দ্য ম্যাড স্টোরি';
  }, [lang]);

  useEffect(() => {
    const fetchFullCategories = async () => {
      try {
        // Fetch flat list of all categories to guarantee complete infinite hierarchy
        const data = await api.getAllCategoriesFlat();
        if (data && data.length > 0) {
          setCategoriesList(buildCategoryTree(data));
        } else {
          const topData = await api.getCategories();
          if (topData && topData.length > 0) {
            setCategoriesList(topData);
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFullCategories();
  }, []);

  const fallbackImages = [
    '/assets/images/18-1024x678.jpg',
    '/assets/images/13-1024x683.jpg',
    '/assets/images/23-1024x681.jpg',
    '/assets/images/beach_resort_with_sunbeds_in_asia-1-of-1-2-1024x683.jpg',
    '/assets/images/Woman-Shoot-Movie-1024x574.jpeg',
    '/assets/images/Modern_living_room_interior-1024x572.jpg',
    '/assets/images/Modern_living_room-1024x572.jpg',
    '/assets/images/30-1024x683.jpg',
  ];

  // Flatten all categories across infinite levels with depth and path lineage
  const allCategoriesFlat = useMemo(() => {
    return flattenCategoryTree(categoriesList);
  }, [categoriesList]);

  // Filtered categories based on search and selected filter
  const displayedCategories = useMemo(() => {
    let sourceList: FlattenedCategoryItem[] = allCategoriesFlat;

    if (filterType === 'primary') {
      sourceList = allCategoriesFlat.filter((c) => c.depth === 0);
    } else if (filterType === 'subcategories') {
      sourceList = allCategoriesFlat.filter((c) => c.depth > 0);
    } else if (filterType === 'featured') {
      sourceList = allCategoriesFlat.filter((c) => c.is_featured);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return sourceList;

    return sourceList.filter(
      (cat) =>
        cat.name.toLowerCase().includes(query) ||
        (cat.name_en && cat.name_en.toLowerCase().includes(query)) ||
        cat.slug.toLowerCase().includes(query) ||
        (cat.description && cat.description.toLowerCase().includes(query)) ||
        cat.pathNames.some((p) => p.toLowerCase().includes(query))
    );
  }, [allCategoriesFlat, filterType, searchQuery]);

  return (
    <div className="py-8 sm:py-12">
      <div className="madstory-container space-y-8 sm:space-y-10">
        {/* Breadcrumb */}
        <nav
          className={`flex items-center gap-2 text-xs text-gray-400 ${
            lang === 'bn' ? 'font-bengali' : 'font-sans'
          }`}
          aria-label="Breadcrumb"
        >
          <Link to="/" className="hover:text-[#800020] transition">
            {t('nav.home')}
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-semibold">{t('categoriesPage.all')}</span>
        </nav>

        {/* Hero Header */}
        <div className="border-b border-[#ded7cc] pb-6 sm:pb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#800020] flex items-center gap-1 font-sans">
                  <FolderTree className="w-3.5 h-3.5" />
                  {lang === 'en' ? 'Editorial Taxonomy' : 'বিষয়ভিত্তিক সূচিপত্র'}
                </span>
              </div>
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl font-bold text-[#1e2022] tracking-tight mb-3 ${
                  lang === 'bn' ? 'font-bengali' : 'font-sans'
                }`}
              >
                {t('categoriesPage.title')}
              </h1>
              <p
                className={`text-sm sm:text-base text-gray-600 leading-relaxed font-light ${
                  lang === 'bn' ? 'font-bengali' : 'font-sans'
                }`}
              >
                {t('categoriesPage.subtitle')}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 shrink-0 font-sans text-xs">
              <div className="px-4 py-2.5 bg-[#faf7f2] border border-[#ded7cc] rounded-sm text-center">
                <div className="text-xl font-bold text-[#800020]">
                  {allCategoriesFlat.length}
                </div>
                <div className="text-[11px] text-gray-500 font-medium">
                  {lang === 'en' ? 'Total Categories' : 'মোট ক্যাটাগরি'}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('categoriesPage.searchPlaceholder')}
                className={`w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] transition shadow-2xs ${
                  lang === 'bn' ? 'font-bengali' : 'font-sans'
                }`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-sans">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-sm font-semibold transition cursor-pointer border ${
                  filterType === 'all'
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-white text-gray-600 border-[#ded7cc] hover:bg-gray-50'
                }`}
              >
                {lang === 'en' ? 'All' : 'সব'} ({allCategoriesFlat.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('primary')}
                className={`px-3 py-1.5 rounded-sm font-semibold transition cursor-pointer border ${
                  filterType === 'primary'
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-white text-gray-600 border-[#ded7cc] hover:bg-gray-50'
                }`}
              >
                {lang === 'en' ? 'Primary' : 'মূল বিভাগ'} ({categoriesList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('subcategories')}
                className={`px-3 py-1.5 rounded-sm font-semibold transition cursor-pointer flex items-center gap-1 border ${
                  filterType === 'subcategories'
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-white text-gray-600 border-[#ded7cc] hover:bg-gray-50'
                }`}
              >
                <Layers className="w-3 h-3 text-indigo-500" />
                <span>{lang === 'en' ? 'Subcategories' : 'উপ-বিভাগ'}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('featured')}
                className={`px-3 py-1.5 rounded-sm font-semibold transition cursor-pointer flex items-center gap-1 border ${
                  filterType === 'featured'
                    ? 'bg-[#800020] text-white border-[#800020]'
                    : 'bg-white text-gray-600 border-[#ded7cc] hover:bg-gray-50'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>{lang === 'en' ? 'Featured' : 'ফিচার্ড'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Categories Grid (Card design exactly matching Homepage Featured Categories) */}
        {displayedCategories.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#ded7cc] rounded-sm p-8">
            <FolderTree className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3
              className={`text-lg font-bold text-gray-700 mb-1 ${
                lang === 'bn' ? 'font-bengali' : 'font-sans'
              }`}
            >
              {t('categoriesPage.noResults')}
            </h3>
            <p className="text-xs text-gray-500 font-sans">
              {lang === 'en'
                ? 'Try a different search keyword or clear your filter.'
                : 'অন্য কোনো শব্দ দিয়ে খুঁজুন বা ফিল্টার পরিবর্তন করুন।'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-1.5 bg-[#800020] text-white text-xs rounded hover:bg-[#9b1b30] transition font-sans"
              >
                {lang === 'en' ? 'Clear Search' : 'সার্চ মুছুন'}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {displayedCategories.map((category, index) => {
              const catName =
                lang === 'en' && category.name_en ? category.name_en : category.name;
              const thumbnailImage =
                category.thumbnail || category.banner || fallbackImages[index % fallbackImages.length];

              return (
                <Link
                  key={category.id || category.slug}
                  to={`/category/${category.slug}`}
                  className="group relative block overflow-hidden rounded-md shadow-xs hover:shadow-xl transition-all duration-500 bg-neutral-900 h-48 sm:h-56 md:h-64 lg:h-52 border border-[#ded7cc]/70 hover:border-[#800020]"
                >
                  {/* Background Thumbnail Image */}
                  <img
                    src={thumbnailImage}
                    alt={catName}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 filter group-hover:brightness-95"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const fallback = fallbackImages[index % fallbackImages.length];
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />

                  {/* Foreground Title: Centered Vertically & Horizontally Matching Homepage */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-6 z-20 text-white">
                    <div className="flex flex-col items-center justify-center gap-1.5 max-w-[90%]">
                      {category.depth > 0 && category.pathNames.length > 1 && (
                        <span className="text-[10px] uppercase font-sans tracking-wider bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-rose-200 border border-white/20 line-clamp-1">
                          {category.pathNames.slice(0, -1).join(' › ')}
                        </span>
                      )}
                      <h6
                        className={`pointer-events-none rounded-md bg-white/80 px-3 py-1 text-sm font-bold leading-snug tracking-wide text-black outline outline-[0.5px] outline-offset-4 outline-white transition-all duration-300 ${
                          lang === 'bn' ? 'font-bengali' : 'font-sans'
                        }`}
                      >
                        {catName}
                      </h6>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
