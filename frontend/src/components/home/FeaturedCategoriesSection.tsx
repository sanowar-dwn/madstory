import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, FolderOpen } from 'lucide-react';
import { Category } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface FeaturedCategoriesSectionProps {
  categories: Category[];
  title?: string;
  subtitle?: string;
}

export const FeaturedCategoriesSection: React.FC<FeaturedCategoriesSectionProps> = ({
  categories,
  title,
  subtitle,
}) => {
  const { lang, t } = useLanguage();

  if (!categories || categories.length === 0) {
    return null;
  }

  const defaultTitle = lang === 'en' ? 'Featured Categories' : 'ফিচার্ড ক্যাটাগরি';
  const defaultSubtitle = t('section.featuredCategoriesDesc');
  const sectionTitle = title || defaultTitle;
  const sectionSubtitle = subtitle !== undefined ? subtitle : defaultSubtitle;

  const fallbackImages = [
    '/assets/images/18-1024x678.jpg',
    '/assets/images/13-1024x683.jpg',
    '/assets/images/23-1024x681.jpg',
    '/assets/images/beach_resort_with_sunbeds_in_asia-1-of-1-2-1024x683.jpg',
    '/assets/images/Woman-Shoot-Movie-1024x574.jpeg',
    '/assets/images/Modern_living_room_interior-1024x572.jpg',
  ];

  // Responsive grid columns based on number of featured categories
  const getGridColsClass = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-xl mx-auto';
    if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
    if (count === 4) return 'grid-cols-2 md:grid-cols-4';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
  };

  return (
    <section
      className="madstory-container my-10 sm:my-14 md:my-16"
      aria-label="Featured Categories Section"
    >
      {/* Section Header */}
<div className="flex flex-row items-end justify-between gap-3 mb-6 sm:mb-8 pb-3 border-b border-[#ded7cc]">
  <div className="min-w-0">
    <div className="flex items-center gap-2 mb-1.5">
      <span className="w-2 h-2 rounded-full bg-[#800020] animate-pulse" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#800020] flex items-center gap-1 font-sans">
        <Sparkles className="w-3 h-3 text-[#800020]" />
        {lang === 'en' ? 'Curated Collections' : 'নির্বাচিত সংকলন'}
      </span>
    </div>
    <h2
      className={`text-2xl sm:text-3xl font-bold text-[#1e2022] tracking-tight ${
        lang === 'bn' ? 'font-bengali' : 'font-sans'
      }`}
    >
      {sectionTitle}
    </h2>
  </div>

  {/* "See All" Link Button to All Categories Page */}
  <div className="flex items-center gap-2 shrink-0 mb-2">
    <Link
      to="/categories"
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-[#f4eee6] hover:bg-[#800020] text-[#1e2022] hover:text-white border border-[#ded7cc] hover:border-[#800020] text-xs font-semibold transition-all duration-300 group shadow-2xs font-sans whitespace-nowrap"
      title={lang === 'en' ? 'View all magazine categories' : 'সকল ক্যাটাগরি এক নজরে দেখুন'}
    >
      <span>{lang === 'en' ? 'See All' : 'সব দেখুন'}</span>
      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
    </Link>
  </div>
</div>

      {/* Featured Categories Grid */}
      <div className={`grid ${getGridColsClass(categories.length)} gap-4 sm:gap-6`}>
        {categories.map((category, index) => {
          const catName =
            lang === 'en' && category.name_en ? category.name_en : category.name;
          const catDesc =
            lang === 'en' && category.description_en
              ? category.description_en
              : category.description;
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
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 filter group-hover:brightness-95"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  const fallback = fallbackImages[index % fallbackImages.length];
                  if (target.src !== fallback) {
                    target.src = fallback;
                  }
                }}
              />

              {/* Foreground Title: Centered Vertically & Horizontally */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 sm:p-8 z-20 text-white">
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-2 text-center text-white sm:p-8">
                  <h6
                    className={`pointer-events-none max-w-[85%] rounded-md bg-white/70 px-3 py-1 text-sm font-bold leading-snug tracking-wide text-black outline outline-[0.5px] outline-offset-4 outline-white transition-all duration-300 ${lang === 'bn' ? 'font-bengali' : 'font-sans'
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
    </section>
  );
};
