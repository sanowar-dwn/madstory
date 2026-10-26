import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroSlide } from '../../types';
import { api } from '../../services/api';

interface BoldHeroSliderProps {
  slides?: HeroSlide[];
}

export const BoldHeroSlider: React.FC<BoldHeroSliderProps> = ({ slides: initialSlides }) => {
  const [slides, setSlides] = useState<HeroSlide[]>(initialSlides || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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
      {/* Banner Container: Pure visual display */}
      <div className="relative w-full h-[260px] sm:h-[380px] md:h-[480px] lg:h-[540px] xl:h-[600px] overflow-hidden">
        {slides.map((slide, idx) => {
          const targetLink = (slide.link || slide.button_link || '').trim();
          const isExternal = targetLink.startsWith('http://') || targetLink.startsWith('https://');
          const isCurrent = idx === currentIndex;
          const altText = slide.title || slide.title_en || `Banner ${idx + 1}`;

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
              {targetLink ? (
                isExternal ? (
                  <a
                    href={targetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full cursor-pointer"
                    title={altText}
                  >
                    {ImageElement}
                  </a>
                ) : (
                  <Link
                    to={targetLink}
                    className="block w-full h-full cursor-pointer"
                    title={altText}
                  >
                    {ImageElement}
                  </Link>
                )
              ) : (
                <div className="w-full h-full">
                  {ImageElement}
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
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-[#800020] text-white transition-all duration-200 backdrop-blur-xs opacity-0 group-hover:opacity-90 hover:opacity-100! border border-white/20 shadow-md"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next Slide"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-[#800020] text-white transition-all duration-200 backdrop-blur-xs opacity-0 group-hover:opacity-90 hover:opacity-100! border border-white/20 shadow-md"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}
      </div>

      {/* Image Previews Pagination Bar: Dangles 50% over the bottom banner edge (Clean, Simple, Perfect Size) */}
      {slides.length > 1 && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 flex items-center gap-2 sm:gap-2.5 md:gap-3 bg-black/60 backdrop-blur-md p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-white/20 shadow-xl max-w-[94vw] sm:max-w-[85vw] md:max-w-none overflow-x-auto no-scrollbar">
          {slides.map((slide, idx) => {
            const isCurrent = idx === currentIndex;
            const altText = slide.title || slide.title_en || `Banner ${idx + 1}`;
            return (
              <button
                key={slide.id}
                onClick={(e) => handleDotClick(idx, e)}
                aria-label={`Go to banner ${idx + 1}: ${altText}`}
                className={`relative rounded-lg sm:rounded-xl overflow-hidden transition-all duration-200 focus:outline-none flex-shrink-0 cursor-pointer ${
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
