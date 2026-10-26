import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, Facebook, Instagram, Twitter, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { SiteSetting, Category, Article } from '../../types';
import { NewsletterBox } from '../ui/NewsletterBox';
import { useLanguage } from '../../context/LanguageContext';

interface FooterProps {
  settings?: SiteSetting;
  categories?: Category[];
  recentArticles?: Article[];
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  categories = [],
  recentArticles = [],
}) => {
  const { lang, t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyright = lang === 'en'
    ? (settings?.copyright_text_en || '© 2026 The Mad Story. All Rights Reserved.')
    : (settings?.copyright_text_bn || '© ২০২৬ দ্য ম্যাড স্টোরি। সর্বস্বত্ব সংরক্ষিত।');

  const brandTagline = lang === 'en'
    ? 'A quarterly publication dedicated to art, literature, culture, and contemporary life.'
    : 'শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার ত্রৈমাসিক পত্রিকা।';

  return (
    <footer className="bg-[#1c1c1e] text-[#a1a1aa] text-xs font-sans mt-16 border-t-4 border-[#800020]">
      {/* Upper Brand Section */}
      <div className="py-8 border-b border-[#2d2d30] text-center">
        <div className="madstory-container flex flex-col items-center">
          <Link to="/" className="inline-block mb-2">
            <img
              src="/assets/images/Madstory-logo.png"
              alt="The Mad Story"
              className="h-10 w-auto object-contain brightness-0 invert opacity-90 hover:opacity-100 transition"
            />
          </Link>
          <p className={`max-w-md text-gray-400 text-xs ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
            {brandTagline}
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-3 mt-4 text-gray-400">
            <a href={settings?.facebook_url || '#'} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-[#2a2a2d] hover:bg-[#800020] hover:text-white transition">
              <Facebook className="w-3.5 h-3.5" />
            </a>
            <a href={settings?.instagram_url || '#'} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-[#2a2a2d] hover:bg-[#800020] hover:text-white transition">
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a href={settings?.twitter_url || '#'} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-[#2a2a2d] hover:bg-[#800020] hover:text-white transition">
              <Twitter className="w-3.5 h-3.5" />
            </a>
            <a href={settings?.youtube_url || '#'} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-[#2a2a2d] hover:bg-[#800020] hover:text-white transition">
              <Youtube className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main 4-column widget area */}
      <div className="madstory-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Col 1: About */}
          <div>
            <h4 className={`text-white font-bold text-sm tracking-wider uppercase mb-4 border-b border-[#333] pb-2 inline-block ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {lang === 'en' ? 'About The Mad Story' : 'দ্য ম্যাড স্টোরি সম্পর্কে'}
            </h4>
            <p className={`text-gray-400 leading-relaxed text-xs mb-4 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {t('footer.aboutText')}
            </p>
            <div className="space-y-1.5 text-gray-400 text-xs font-sans">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#800020] flex-shrink-0" />
                <span>{settings?.address || 'Dhaka, Bangladesh'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#800020] flex-shrink-0" />
                <span>{settings?.email || 'editor@themadstory.com'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#800020] flex-shrink-0" />
                <span>{settings?.phone || '+880 1711-234567'}</span>
              </div>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className={`text-white font-bold text-sm tracking-wider uppercase mb-4 border-b border-[#333] pb-2 inline-block ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {lang === 'en' ? 'Popular Categories' : 'জনপ্রিয় ক্যাটাগরি'}
            </h4>
            <ul className={`space-y-2 text-xs ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {categories.slice(0, 6).map((c) => {
                const name = lang === 'en' && c.name_en ? c.name_en : c.name;
                return (
                  <li key={c.slug} className="flex items-center justify-between border-b border-[#2a2a2d] pb-1.5">
                    <Link to={`/category/${c.slug}`} className="hover:text-white transition">
                      • {name}
                    </Link>
                    <span className="text-[10px] text-gray-500 bg-[#252528] px-1.5 py-0.5 rounded font-sans">
                      {c.articles_count || '৮+'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Col 3: Recent articles */}
          <div>
            <h4 className={`text-white font-bold text-sm tracking-wider uppercase mb-4 border-b border-[#333] pb-2 inline-block ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {lang === 'en' ? 'Recent Stories' : 'সাম্প্রতিক লেখা'}
            </h4>
            <div className="space-y-3 text-xs">
              {recentArticles.slice(0, 3).map((art) => {
                const title = lang === 'en' && art.title_en ? art.title_en : art.title;
                const readTime = lang === 'en' && art.reading_time_en ? art.reading_time_en : (art.reading_time || '৪ মিনিট');

                return (
                  <Link
                    key={art.id}
                    to={`/post/${art.slug}`}
                    className="flex items-center gap-2.5 group"
                  >
                    <img
                      src={art.image}
                      alt={title}
                      className="w-14 h-11 object-cover rounded flex-shrink-0 opacity-80 group-hover:opacity-100 transition"
                    />
                    <div>
                      <h5 className={`text-gray-300 group-hover:text-white font-medium line-clamp-2 transition leading-snug ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                        {title}
                      </h5>
                      <span className="text-[10px] text-gray-500 font-sans block mt-0.5">
                        {readTime}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Col 4: Newsletter in footer */}
          <div>
            <h4 className={`text-white font-bold text-sm tracking-wider uppercase mb-4 border-b border-[#333] pb-2 inline-block ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {t('footer.newsletter')}
            </h4>
            <div className="bg-[#242427] p-4 rounded border border-[#333338]">
              <p className={`text-xs text-gray-300 mb-3 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                {t('footer.newsletterDesc')}
              </p>
              <NewsletterBox />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom copyright bar */}
      <div className="bg-[#141416] py-4 border-t border-[#26262a] text-center text-xs">
        <div className={`madstory-container flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
          <p>{copyright}</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-gray-300 transition">{t('nav.about')}</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-gray-300 transition">{t('nav.contact')}</Link>
            <span>•</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-[#800020] hover:text-white font-bold transition ml-2"
            >
              <span>{lang === 'en' ? 'Top' : 'উপরে যান'}</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
