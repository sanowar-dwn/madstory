import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, ExternalLink } from 'lucide-react';
import { HeroSlide } from '../../types';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

interface BoldHeroSliderProps {
  slides?: HeroSlide[];
}

export const BoldHeroSlider: React.FC<BoldHeroSliderProps> = ({ slides: initialSlides }) => {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const { lang } = useLanguage();

  useEffect(() => {
    if (initialSlides && initialSlides.length > 0) {
      setSlides(initialSlides);
    } else {
      const fetchSlides = async () => {
        try {
          const res = await api.getHeroSlides();
          if (res && res.length > 0) {
            setSlides(res);
          }
        } catch (err) {
          console.error('Error fetching hero slides:', err);
        }
      };
      fetchSlides();
    }
  }, [initialSlides]);

  // Auto-play cycling (changes every 5 seconds, pauses on hover)
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  if (!slides || slides.length === 0) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <section
      className="relative w-full bg-black overflow-visible shadow-sm group select-none mb-12 sm:mb-16 md:mb-18"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Hero Banner Slider"
    >
      {/* Banner Container */}
      <div className="relative w-full h-[320px] sm:h-[420px] md:h-[500px] lg:h-[560px] xl:h-[620px] overflow-hidden">
        {slides.map((slide, idx) => {
          const targetLink = (slide.link || slide.button_link || '').trim();
          const isExternal = targetLink.startsWith('http://') || targetLink.startsWith('https://');
          const isCurrent = idx === currentIndex;
          const altText = slide.title || slide.title_en || `Banner ${idx + 1}`;
          const currentTitle = lang === 'en' ? (slide.title_en || slide.title) : (slide.title || slide.title_en);
          const currentSubtitle = lang === 'en' ? (slide.subtitle_en || slide.subtitle) : (slide.subtitle || slide.subtitle_en);
          const currentButtonText = (lang === 'en' ? (slide.button_text_en || slide.button_text) : (slide.button_text || slide.button_text_en))
            || (lang === 'en' ? 'Explore More' : 'বিস্তারিত দেখুন');

          // Pure banner image element
          const ImageElement = (
            <img
              src={slide.image}
              alt={altText}
              className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                isCurrent ? 'scale-100 hover:scale-[1.01]' : 'scale-105'
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/images/18-1024x678.jpg';
              }}
            />
          );

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Image / Background link */}
              {targetLink ? (
                isExternal ? (
                  <a
                    href={targetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full cursor-pointer"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {ImageElement}
                  </a>
                ) : (
                  <Link
                    to={targetLink}
                    className="block w-full h-full cursor-pointer"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    {ImageElement}
                  </Link>
                )
              ) : (
                <div className="w-full h-full">
                  {ImageElement}
                </div>
              )}

              {/* Gradient Overlay for Text & Button Contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />

              {/* Banner Content: Title, Subtitle, and Button */}
              {(currentTitle || targetLink) && (
                <div className="madstory-container absolute inset-0 z-20 flex flex-col justify-end items-start pb-16 pointer-events-auto">
                  {currentTitle && (
                    targetLink ? (
                      isExternal ? (
                        <a
                          href={targetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/title inline-block mb-2 sm:mb-3"
                        >
                          <h2 className="font-bengali font-bold text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight drop-shadow-md group-hover/title:text-[#ded7cc] transition-colors">
                            {currentTitle}
                          </h2>
                        </a>
                      ) : (
                        <Link
                          to={targetLink}
                          className="group/title inline-block mb-2 sm:mb-3"
                        >
                          <h2 className="font-bengali font-bold text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight drop-shadow-md group-hover/title:text-[#ded7cc] transition-colors">
                            {currentTitle}
                          </h2>
                        </Link>
                      )
                    ) : (
                      <h2 className="font-bengali font-bold text-white text-xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight drop-shadow-md mb-2 sm:mb-3">
                        {currentTitle}
                      </h2>
                    )
                  )}

                  {currentSubtitle && (
                    <p className="font-bengali text-white/90 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 max-w-2xl line-clamp-2 drop-shadow">
                      {currentSubtitle}
                    </p>
                  )}

                  {targetLink && (
                    <div className="mt-1 sm:mt-2">
                      {isExternal ? (
                        <a
                          href={targetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 bg-[#800020] hover:bg-[#660019] text-white font-bengali font-semibold text-xs sm:text-sm rounded shadow-lg hover:shadow-2xl transition-all duration-200 group/btn"
                        >
                          <span>{currentButtonText}</span>
                          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                        </a>
                      ) : (
                        <Link
                          to={targetLink}
                          className="inline-flex items-center gap-2.5 px-5 py-2.5 sm:px-6 sm:py-3 bg-[#800020] hover:bg-[#660019] text-white font-bengali font-semibold text-xs sm:text-sm rounded shadow-lg hover:shadow-2xl transition-all duration-200 group/btn"
                        >
                          <span>{currentButtonText}</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover/btn:translate-x-1" />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Previous & Next Navigation Arrows (subtle and visible on hover) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous Slide"
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-[#800020] text-white transition-all duration-200 backdrop-blur-xs opacity-0 group-hover:opacity-90 hover:opacity-100! border border-white/20 shadow-md cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next Slide"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-[#800020] text-white transition-all duration-200 backdrop-blur-xs opacity-0 group-hover:opacity-90 hover:opacity-100! border border-white/20 shadow-md cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}
      </div>

      {/* Image Previews Pagination Bar: Dangles 50% over the bottom banner edge (Clean, Simple, Perfect Size) */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 flex items-center gap-2 sm:gap-2.5 md:gap-3 p-1.5 sm:p-2 bg-white max-w-[94vw] sm:max-w-[85vw] md:max-w-none overflow-x-auto no-scrollbar shadow-xl">
          {slides.map((slide, idx) => {
            const isCurrent = idx === currentIndex;
            const altText = slide.title || slide.title_en || `Banner ${idx + 1}`;
            return (
              <button
                key={slide.id}
                onClick={(e) => handleDotClick(idx, e)}
                aria-label={`Go to banner ${idx + 1}: ${altText}`}
                className={`relative overflow-hidden transition-all duration-200 focus:outline-none flex-shrink-0 cursor-pointer ${
                  isCurrent
                    ? 'w-20 h-13 sm:w-26 sm:h-16 md:w-32 md:h-20 border-2 border-[#800020] ring-2 ring-white/90 shadow-lg'
                    : 'w-20 h-13 sm:w-26 sm:h-16 md:w-32 md:h-20 border border-white/30 opacity-60 hover:opacity-100 hover:border-white/80'
                }`}
              >
                <img
                  src={slide.image}
                  alt={altText}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/images/18-1024x678.jpg';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
