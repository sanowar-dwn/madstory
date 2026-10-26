import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../../types';
import { HeartButton } from '../ui/HeartButton';
import { useLanguage } from '../../context/LanguageContext';

interface CategoryBlockData {
  title: string;
  slug: string;
  featuredArticle: Article;
  subArticles: Article[];
}

interface MagazineCategoryGridProps {
  blocks: CategoryBlockData[];
}

export const MagazineCategoryGrid: React.FC<MagazineCategoryGridProps> = ({ blocks }) => {
  const { lang, t } = useLanguage();
  if (!blocks || blocks.length === 0) return null;

  return (
    <section className="my-10">
      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {blocks.map((block) => (
          <div
            key={block.slug}
            className="magazine-card flex flex-col"
          >
            {/* Header Bar: Beige/tan with maroon 'সব' action button */}
            <div className="magazine-card-header">
              <h3 className="font-bengali font-bold text-base text-[#1e2022] tracking-wide">
                {block.title}
              </h3>
              <Link
                to={`/category/${block.slug}`}
                className="badge-sob"
              >
                {t('nav.all')} →
              </Link>
            </div>

            {/* Featured Post Flush Image */}
            {block.featuredArticle && (
              <div className="flex flex-col">
                <div className="relative h-48 sm:h-52 w-full overflow-hidden img-zoom-wrapper border-b border-[#e2ddd3]">
                  <Link to={`/post/${block.featuredArticle.slug}`}>
                    <img
                      src={block.featuredArticle.image}
                      alt={block.featuredArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="absolute top-2.5 right-2.5">
                    <HeartButton
                      slug={block.featuredArticle.slug}
                      initialHearted={block.featuredArticle.is_hearted}
                      initialCount={block.featuredArticle.hearts_count}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Primary Featured Article Info */}
                <div className="p-4 pb-2">
                  <h4 className="font-bengali font-bold text-base sm:text-lg text-[#1e2022] hover:text-[#800020] transition leading-snug mb-1.5">
                    <Link to={`/post/${block.featuredArticle.slug}`}>
                      {(lang === 'en' && block.featuredArticle.title_en) ? block.featuredArticle.title_en : block.featuredArticle.title}
                    </Link>
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
                    <span>{block.featuredArticle.author_name}</span>
                    <span>•</span>
                    <span className="font-bengali">{block.featuredArticle.reading_time || '৫ মিনিট'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Dotted Divider */}
            <div className="px-4">
              <div className="dotted-divider my-2" />
            </div>

            {/* Compact Sub-posts List with Square Thumbnails */}
            <div className="p-4 pt-1 space-y-3 flex-1 flex flex-col justify-start">
              {block.subArticles.slice(0, 3).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 group/sub py-1 border-b border-[#f5efe6] last:border-b-0"
                >
                  <Link
                    to={`/post/${sub.slug}`}
                    className="w-14 h-14 rounded-xs overflow-hidden flex-shrink-0 border border-[#e8e4dc]"
                  >
                    <img
                      src={sub.image}
                      alt={sub.title}
                      className="w-full h-full object-cover group-hover/sub:scale-105 transition-transform duration-300"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bengali font-semibold text-xs sm:text-sm text-gray-800 group-hover/sub:text-[#800020] transition line-clamp-2 leading-snug">
                      <Link to={`/post/${sub.slug}`}>
                        {(lang === 'en' && sub.title_en) ? sub.title_en : sub.title}
                      </Link>
                    </h5>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-sans mt-1">
                      <span>{sub.author_name} • <span className="font-bengali">{sub.reading_time || '৩ মিনিট'}</span></span>
                      <HeartButton slug={sub.slug} initialHearted={sub.is_hearted} initialCount={sub.hearts_count} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
