import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronDown, Facebook, Instagram, Twitter, Youtube, Globe, LayoutDashboard } from 'lucide-react';
import { Category, SiteSetting } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  settings?: SiteSetting;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  settings,
}) => {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const { lang, toggleLang, t } = useLanguage();
  const { user, openAuthModal, logout } = useAuth();

  if (!isOpen) return null;

  const toggleCat = (slug: string) => {
    setExpandedCat(prev => (prev === slug ? null : slug));
  };

  const copyright = lang === 'en'
    ? (settings?.copyright_text_en || '© 2026 The Mad Story')
    : (settings?.copyright_text_bn || '© ২০২৬ দ্য ম্যাড স্টোরি');

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Drawer header */}
        <div className="flex items-center justify-between p-4 border-b border-[#ded7cc] bg-[#fcfbf9]">
          <img
            src="/assets/images/Madstory-logo.png"
            alt="The Mad Story"
            className="h-9 w-auto object-contain"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-black transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User bar & Language switcher inside drawer */}
        <div className="p-3 bg-[#f5efe6] border-b border-[#ded7cc] flex items-center justify-between text-xs">
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-[#800020] hover:text-white transition font-sans font-semibold border border-[#ded7cc]"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'বাংলা' : 'English'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                onClick={onClose}
                className="font-semibold text-[#800020] hover:underline"
              >
                {user.username}
              </Link>
              <button
                onClick={() => { logout(); onClose(); }}
                className="text-gray-500 hover:text-rose-600 ml-1"
              >
                ({t('nav.logout')})
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => { openAuthModal('login'); onClose(); }}
                className="text-gray-700 hover:text-[#800020] font-semibold"
              >
                {t('nav.login')}
              </button>
              <span>/</span>
              <button
                onClick={() => { openAuthModal('signup'); onClose(); }}
                className="text-[#800020] hover:underline font-semibold"
              >
                {t('nav.signup')}
              </button>
            </div>
          )}
        </div>

        {/* Navigation items */}
        <div className="p-4 flex-1">
          <ul className={`space-y-1 text-sm font-semibold ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
            <li>
              <Link
                to="/"
                onClick={onClose}
                className="block py-2 px-3 text-gray-800 hover:text-[#800020] hover:bg-[#f7f2eb] rounded"
              >
                {t('nav.home')}
              </Link>
            </li>

            {user && (
              <li>
                <Link
                  to="/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-2 py-2 px-3 text-[#800020] bg-rose-50 hover:bg-rose-100 rounded"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('nav.dashboard')}</span>
                </Link>
              </li>
            )}

            {categories.map((cat) => {
              const hasSubs = cat.subcategories && cat.subcategories.length > 0;
              const isExpanded = expandedCat === cat.slug;
              const catName = lang === 'en' && cat.name_en ? cat.name_en : cat.name;

              return (
                <li key={cat.slug} className="border-b border-gray-100 last:border-b-0 pb-1">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/category/${cat.slug}`}
                      onClick={onClose}
                      className="py-2 px-3 text-gray-800 hover:text-[#800020] flex-1"
                    >
                      {catName}
                    </Link>
                    {hasSubs && (
                      <button
                        onClick={() => toggleCat(cat.slug)}
                        className="p-2 text-gray-400 hover:text-gray-700"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-[#800020]' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {hasSubs && isExpanded && (
                    <ul className="pl-6 pr-2 py-1 space-y-1 bg-[#faf7f2] rounded text-xs text-gray-600 font-normal">
                      {cat.subcategories.map((sub) => {
                        const subName = lang === 'en' && sub.name_en ? sub.name_en : sub.name;
                        return (
                          <li key={sub.slug}>
                            <Link
                              to={`/category/${sub.slug}`}
                              onClick={onClose}
                              className="block py-1.5 hover:text-[#800020]"
                            >
                              • {subName}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}

            <li>
              <Link
                to="/about"
                onClick={onClose}
                className="block py-2 px-3 text-gray-800 hover:text-[#800020] hover:bg-[#f7f2eb] rounded"
              >
                {t('nav.about')}
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                onClick={onClose}
                className="block py-2 px-3 text-gray-800 hover:text-[#800020] hover:bg-[#f7f2eb] rounded"
              >
                {t('nav.contact')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Drawer footer social links */}
        <div className="p-4 border-t border-[#ded7cc] bg-[#fbf9f6]">
          <div className="flex items-center justify-center gap-4 text-gray-500">
            <a href={settings?.facebook_url || '#'} target="_blank" rel="noreferrer" className="hover:text-[#1877f2]">
              <Facebook className="w-4 h-4" />
            </a>
            <a href={settings?.instagram_url || '#'} target="_blank" rel="noreferrer" className="hover:text-[#e4405f]">
              <Instagram className="w-4 h-4" />
            </a>
            <a href={settings?.twitter_url || '#'} target="_blank" rel="noreferrer" className="hover:text-[#1da1f2]">
              <Twitter className="w-4 h-4" />
            </a>
            <a href={settings?.youtube_url || '#'} target="_blank" rel="noreferrer" className="hover:text-[#ff0000]">
              <Youtube className="w-4 h-4" />
            </a>
          </div>
          <p className={`text-[10px] text-center text-gray-400 mt-2 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
            {copyright}
          </p>
        </div>
      </div>
    </div>
  );
};
