import React from 'react';
import { Link } from 'react-router-dom';
import { Article } from '../../types';
import { HeartButton } from '../ui/HeartButton';
import { useLanguage } from '../../context/LanguageContext';

interface CardGridBlockProps {
  title: string;
  categorySlug: string;
  articles: Article[];
}

export const CardGridBlock: React.FC<CardGridBlockProps> = ({
  title,
  categorySlug,
  articles,
}) => {
  const { lang, t } = useLanguage();
  if (!articles || articles.length === 0) return null;

  return (
    <section className="my-10">
      {/* Header Bar with Burgundy Accent Underline & 'সব' Button */}
      <div className="flex items-center justify-between border-b-2 border-[#800020] pb-2 mb-6">
        <div className="relative">
          <h2 className="font-bengali font-bold text-lg sm:text-xl text-[#1e2022] tracking-wide inline-block">
            {title}
          </h2>
        </div>
        <Link
          to={`/category/${categorySlug}`}
          className="badge-sob"
        >
          {t('nav.all')} →
        </Link>
      </div>

      {/* 3-Column x 2-Row Grid (6 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {articles.slice(0, 6).map((art) => {
          const displayTitle = (lang === 'en' && art.title_en) ? art.title_en : art.title;
          const displayExcerpt = (lang === 'en' && art.excerpt_en) ? art.excerpt_en : art.excerpt;

          return (
            <div
              key={art.id}
              className="magazine-card group flex flex-col"
            >
              {/* Flush Image */}
              <div className="relative h-44 w-full overflow-hidden img-zoom-wrapper border-b border-[#e2ddd3]">
                <Link to={`/post/${art.slug}`}>
                  <img
                    src={art.image}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                  />
                </Link>
                {/* Category pill */}
                <span className="absolute top-2.5 left-2.5 bg-[#800020]/90 text-white text-[10px] font-bengali font-semibold px-2 py-0.5 rounded shadow">
                  {art.category_name || title}
                </span>

                {/* Heart overlay button */}
                <div className="absolute top-2.5 right-2.5">
                  <HeartButton
                    slug={art.slug}
                    initialHearted={art.is_hearted}
                    initialCount={art.hearts_count}
                    size="sm"
                  />
                </div>
              </div>

              {/* Content Body */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bengali font-bold text-sm sm:text-base text-[#1e2022] group-hover:text-[#800020] transition line-clamp-2 leading-snug mb-2 flex-1">
                  <Link to={`/post/${art.slug}`}>
                    {displayTitle}
                  </Link>
                </h3>

                {displayExcerpt && (
                  <p className="text-xs text-gray-500 font-bengali line-clamp-2 leading-relaxed mb-3">
                    {displayExcerpt}
                  </p>
                )}

                {/* Dotted divider */}
                <div className="dotted-divider mt-auto" />

                {/* Footer Meta */}
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-sans pt-1">
                  <span className="truncate max-w-[120px]">{art.author_name}</span>
                  <span className="font-bengali">{art.reading_time || '৪ মিনিট'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
