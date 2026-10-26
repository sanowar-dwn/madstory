import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, User, Sparkles } from 'lucide-react';
import { Article } from '../../types';
import { HeartButton } from '../ui/HeartButton';
import { useLanguage } from '../../context/LanguageContext';

interface LeadHeroSectionProps {
  coltiArticles: Article[];
  nirbachitoArticles: Article[];
  coltiTitle?: string;
  nirbachitoTitle?: string;
}

export const LeadHeroSection: React.FC<LeadHeroSectionProps> = ({
  coltiArticles,
  nirbachitoArticles,
  coltiTitle,
  nirbachitoTitle,
}) => {
  const [activeColti, setActiveColti] = useState(0);
  const { lang, t } = useLanguage();

  useEffect(() => {
    if (coltiArticles.length <= 1) return;
    const interval = setInterval(() => {
      setActiveColti(prev => (prev + 1) % coltiArticles.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [coltiArticles.length]);

  const currentColti = coltiArticles[activeColti] || coltiArticles[0];

  const displayColtiTitle = coltiTitle || t('section.trending');
  const displayNirbachitoTitle = nirbachitoTitle || t('section.choice');

  return (
    <section className="">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: চলতি (Trending Autoplaying Colti Slider) (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-white border border-[#e2ddd3] rounded-sm overflow-hidden shadow-madstory">
          {/* Header */}
          <div className="bg-[#f4eee6] border-b border-[#ded7cc] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#800020] animate-pulse" />
              <h3 className="font-bengali font-bold text-base text-[#1e2022] tracking-wide">
                {displayColtiTitle}
              </h3>
            </div>
            {/* Slider controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveColti((prev) => (prev - 1 + coltiArticles.length) % coltiArticles.length)}
                className="p-1 rounded hover:bg-black/5 text-gray-700 transition"
                title="আগের স্লাইড"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-sans text-gray-500 font-medium px-1">
                {activeColti + 1}/{coltiArticles.length}
              </span>
              <button
                onClick={() => setActiveColti((prev) => (prev + 1) % coltiArticles.length)}
                className="p-1 rounded hover:bg-black/5 text-gray-700 transition"
                title="পরের স্লাইড"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Colti Card */}
          {currentColti && (
            <div className="flex flex-col flex-1 p-5">
              <div className="relative h-64 sm:h-72 w-full rounded overflow-hidden img-zoom-wrapper mb-4">
                <Link to={`/post/${currentColti.slug}`}>
                  <img
                    src={currentColti.image}
                    alt={currentColti.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
                {/* Category badge */}
                <span className="absolute top-3 left-3 bg-[#800020] text-white text-[11px] font-bengali font-semibold px-2.5 py-0.5 rounded shadow">
                  {currentColti.category_name || 'সাহিত্য'}
                </span>

                {/* Heart Button */}
                <div className="absolute top-3 right-3">
                  <HeartButton
                    slug={currentColti.slug}
                    initialHearted={currentColti.is_hearted}
                    initialCount={currentColti.hearts_count}
                    size="sm"
                  />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bengali font-bold text-[#1e2022] hover:text-[#800020] transition leading-snug mb-2">
                <Link to={`/post/${currentColti.slug}`}>
                  {(lang === 'en' && currentColti.title_en) ? currentColti.title_en : currentColti.title}
                </Link>
              </h2>

              {/* Author & reading time */}
              <div className="flex items-center gap-2 text-xs text-gray-500 font-bengali mb-3">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>{currentColti.author_name}</span>
                <span>•</span>
                <span>{currentColti.reading_time || '৬ মিনিট পাঠ'}</span>
              </div>

              {/* Excerpt */}
              <p className="text-xs sm:text-sm text-gray-600 font-bengali line-clamp-3 leading-relaxed flex-1">
                {(lang === 'en' && currentColti.excerpt_en) ? currentColti.excerpt_en : currentColti.excerpt}
              </p>

              {/* Dotted line & Read More */}
              <div className="dotted-divider mt-4 mb-3" />
              <div className="flex items-center justify-between">
                <Link
                  to={`/post/${currentColti.slug}`}
                  className="text-xs font-bengali font-bold text-[#800020] hover:underline"
                >
                  {t('section.readMore')}
                </Link>
                {/* Dots indicator */}
                <div className="flex items-center gap-1.5">
                  {coltiArticles.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveColti(i)}
                      className={`h-2 rounded-full transition-all ${
                        i === activeColti ? 'w-5 bg-[#800020]' : 'w-2 bg-gray-300'
                      }`}
                      aria-label={`স্লাইড ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: নির্বাচিত (Editor's Choice 2x2 Grid) (5 cols) */}
        <div className="lg:col-span-5 flex flex-col bg-white border border-[#e2ddd3] rounded-sm overflow-hidden shadow-madstory">
          {/* Header */}
          <div className="bg-[#f4eee6] border-b border-[#ded7cc] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#800020]" />
              <h3 className="font-bengali font-bold text-base text-[#1e2022] tracking-wide">
                {displayNirbachitoTitle}
              </h3>
            </div>
            <Link
              to="/category/literature"
              className="badge-sob"
            >
              {t('nav.all')} →
            </Link>
          </div>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 flex-1">
            {nirbachitoArticles.slice(0, 4).map((art) => {
              const displayTitle = (lang === 'en' && art.title_en) ? art.title_en : art.title;

              return (
                <div
                  key={art.id}
                  className="flex flex-col group border border-[#f0ebe1] rounded p-2.5 hover:border-[#800020]/30 hover:shadow-xs transition"
                >
                  <div className="relative h-28 w-full rounded overflow-hidden img-zoom-wrapper mb-2">
                    <Link to={`/post/${art.slug}`}>
                      <img
                        src={art.image}
                        alt={displayTitle}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="absolute top-1 right-1">
                      <HeartButton
                        slug={art.slug}
                        initialHearted={art.is_hearted}
                        initialCount={art.hearts_count}
                        size="sm"
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-bengali font-bold text-[#800020] block mb-1">
                    {art.category_name || 'শিল্প ও সংস্কৃতি'}
                  </span>
                  <h4 className="text-xs font-bengali font-bold text-gray-800 group-hover:text-[#800020] transition line-clamp-2 leading-snug flex-1">
                    <Link to={`/post/${art.slug}`}>
                      {displayTitle}
                    </Link>
                  </h4>
                  <div className="text-[10px] text-gray-400 font-sans mt-2 pt-1 border-t border-gray-100 flex items-center justify-between">
                    <span>{art.author_name}</span>
                    <span className="font-bengali">{art.reading_time || '৪ মিনিট'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
