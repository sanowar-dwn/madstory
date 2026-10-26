import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { Article, Category } from '../../types';
import { NewsletterBox } from '../ui/NewsletterBox';

interface SidebarProps {
  sliderArticles?: Article[];
  popularArticles?: Article[];
  categories?: Category[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  sliderArticles = [],
  popularArticles = [],
  categories = [],
}) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const currentSliderArt = sliderArticles[activeSlide] || sliderArticles[0];

  return (
    <aside className="space-y-8">
      {/* 1. Mini Post Slider Widget */}
      {currentSliderArt && (
        <div className="bg-white border border-[#e2ddd3] rounded-sm overflow-hidden shadow-madstory">
          <div className="bg-[#f4eee6] border-b border-[#ded7cc] px-4 py-2 flex items-center justify-between">
            <h4 className="font-bengali font-bold text-sm text-[#1e2022]">বিশেষ ফিচার</h4>
            {sliderArticles.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSlide((prev) => (prev - 1 + sliderArticles.length) % sliderArticles.length)}
                  className="p-1 hover:bg-black/5 rounded text-gray-600 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveSlide((prev) => (prev + 1) % sliderArticles.length)}
                  className="p-1 hover:bg-black/5 rounded text-gray-600 transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="relative h-44 w-full img-zoom-wrapper">
            <Link to={`/post/${currentSliderArt.slug}`}>
              <img
                src={currentSliderArt.image}
                alt={currentSliderArt.title}
                className="w-full h-full object-cover"
              />
            </Link>
          </div>

          <div className="p-3.5">
            <h5 className="font-bengali font-bold text-sm text-gray-800 hover:text-[#800020] transition line-clamp-2 leading-snug mb-1">
              <Link to={`/post/${currentSliderArt.slug}`}>
                {currentSliderArt.title}
              </Link>
            </h5>
            <span className="text-[11px] text-gray-400 font-sans">
              {currentSliderArt.author_name} • <span className="font-bengali">{currentSliderArt.reading_time || '৪ মিনিট'}</span>
            </span>
          </div>
        </div>
      )}

      {/* 2. Connect & Follow (Social Widget) */}
      <div className="bg-white border border-[#e2ddd3] rounded-sm p-4 shadow-madstory">
        <h4 className="font-bengali font-bold text-sm text-[#1e2022] border-b border-[#ded7cc] pb-2 mb-3">
          যুক্ত থাকুন (Connect & Follow)
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs font-sans">
          <a
            href="https://facebook.com/themadstory"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 p-2 bg-[#1877f2]/10 hover:bg-[#1877f2] text-[#1877f2] hover:text-white rounded transition font-medium"
          >
            <Facebook className="w-4 h-4 flex-shrink-0" />
            <div className="leading-tight">
              <span className="block text-[11px] font-bold">12.5k</span>
              <span className="text-[9px] opacity-80">Followers</span>
            </div>
          </a>
          <a
            href="https://instagram.com/themadstory"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 p-2 bg-[#e4405f]/10 hover:bg-[#e4405f] text-[#e4405f] hover:text-white rounded transition font-medium"
          >
            <Instagram className="w-4 h-4 flex-shrink-0" />
            <div className="leading-tight">
              <span className="block text-[11px] font-bold">28.4k</span>
              <span className="text-[9px] opacity-80">Followers</span>
            </div>
          </a>
          <a
            href="https://twitter.com/themadstory"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 p-2 bg-[#1da1f2]/10 hover:bg-[#1da1f2] text-[#1da1f2] hover:text-white rounded transition font-medium"
          >
            <Twitter className="w-4 h-4 flex-shrink-0" />
            <div className="leading-tight">
              <span className="block text-[11px] font-bold">8.1k</span>
              <span className="text-[9px] opacity-80">Followers</span>
            </div>
          </a>
          <a
            href="https://youtube.com/@themadstory"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 p-2 bg-[#ff0000]/10 hover:bg-[#ff0000] text-[#ff0000] hover:text-white rounded transition font-medium"
          >
            <Youtube className="w-4 h-4 flex-shrink-0" />
            <div className="leading-tight">
              <span className="block text-[11px] font-bold">15.2k</span>
              <span className="text-[9px] opacity-80">Subscribers</span>
            </div>
          </a>
        </div>
      </div>

      {/* 3. Popular Ranked Articles (1, 2, 3...) */}
      <div className="bg-white border border-[#e2ddd3] rounded-sm p-4 shadow-madstory">
        <div className="flex items-center gap-2 border-b border-[#ded7cc] pb-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#800020]" />
          <h4 className="font-bengali font-bold text-sm text-[#1e2022]">
            জনপ্রিয় লেখা
          </h4>
        </div>
        <div className="space-y-3 font-bengali">
          {popularArticles.slice(0, 5).map((art, idx) => (
            <div key={art.id} className="flex items-start gap-3 group pb-2.5 border-b border-gray-100 last:border-b-0 last:pb-0">
              <span className="w-6 h-6 rounded-full bg-[#f4eee6] text-[#800020] font-bold text-xs flex items-center justify-center flex-shrink-0 font-sans border border-[#ded7cc]">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-xs sm:text-sm text-gray-800 group-hover:text-[#800020] transition line-clamp-2 leading-snug">
                  <Link to={`/post/${art.slug}`}>
                    {art.title}
                  </Link>
                </h5>
                <span className="text-[10px] text-gray-400 font-sans block mt-1">
                  {art.reading_time || '৫ মিনিট পাঠ'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Categories Tag Cloud */}
      <div className="bg-white border border-[#e2ddd3] rounded-sm p-4 shadow-madstory">
        <h4 className="font-bengali font-bold text-sm text-[#1e2022] border-b border-[#ded7cc] pb-2 mb-3">
          ক্যাটাগরি
        </h4>
        <div className="flex flex-wrap gap-1.5 font-bengali text-xs">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              className="px-2.5 py-1 bg-[#f7f2eb] hover:bg-[#800020] text-gray-700 hover:text-white rounded text-xs transition border border-[#ded7cc]"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 5. Newsletter Widget */}
      <NewsletterBox />
    </aside>
  );
};
