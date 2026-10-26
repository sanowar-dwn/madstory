import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, Facebook, Instagram, Twitter, Youtube, Globe, User, LogOut, LayoutDashboard, PenSquare } from 'lucide-react';
import { SiteSetting } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface TopBarProps {
  settings?: SiteSetting;
  onOpenSearch: () => void;
  onToggleMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ settings, onOpenSearch, onToggleMobileMenu }) => {
  const { user, openAuthModal, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();

  const tickerText = lang === 'en'
    ? (settings?.copyright_text_en ? 'Spending my Last Day Off on This Beautiful Resort | Driving Convertibles is a Fashion Statement | Words Are Cunning' : 'Spending my Last Day Off on This Beautiful Resort | Driving Convertibles is a Fashion Statement')
    : (settings?.copyright_text_bn ? 'Spending my Last Day Off on This Beautiful Resort | Driving Convertibles is a Fashion Statement | শব্দেরা খুব চতুর | ইউরোপিয়ান অ্যাক্সেসিবিলিটি অ্যাক্ট ২০২৫' : 'Spending my Last Day Off on This Beautiful Resort | Driving Convertibles is a Fashion Statement');

  return (
    <div className="bg-[#fcfbf9] border-b border-[#e8e4dc] text-xs text-gray-700 py-1.5 px-4 sticky top-0 z-40">
      <div className="madstory-container flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breaking Ticker */}
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1 text-gray-700 hover:text-[#800020] transition"
            aria-label="মেনু খুলুন"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Ticker badge */}
          <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 bg-[#800020] text-white px-2 py-0.5 rounded text-[10px] font-bengali font-bold tracking-wider">
            <span>{t('nav.breaking')}</span>
          </div>

          {/* Marquee ticker */}
          <div className="overflow-hidden whitespace-nowrap relative flex-1 text-gray-600 font-bengali text-xs">
            <div className="inline-block animate-ticker cursor-default">
              <span className="mr-8">{tickerText}</span>
              <span className="mr-8">{tickerText}</span>
            </div>
          </div>
        </div>

        {/* Right: Language Switcher, User Menu & Search */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Language Switcher Pill */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100 hover:bg-[#800020] hover:text-white transition text-[11px] font-sans font-semibold border border-gray-200"
            title="ভাষা পরিবর্তন করুন / Switch Language"
          >
            <Globe className="w-3 h-3" />
            <span>{lang === 'bn' ? 'বাংলা' : 'EN'}</span>
            <span className="text-[9px] opacity-60">({lang === 'bn' ? 'EN' : 'বাং'})</span>
          </button>

          {/* User Account / Auth Dropdown */}
          {user ? (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-1.5 font-bengali text-xs text-gray-800 hover:text-[#800020] transition font-semibold"
              >
                <span className="w-5 h-5 rounded-full bg-[#800020] text-white flex items-center justify-center text-[10px]">
                  {user.username.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:inline">{user.username}</span>
              </Link>
              <Link
                to="/dashboard"
                className="p-1 text-gray-500 hover:text-[#800020] transition"
                title={t('nav.dashboard')}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={logout}
                className="p-1 text-gray-400 hover:text-rose-600 transition"
                title={t('nav.logout')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l border-gray-200 pl-2">
              <button
                onClick={() => openAuthModal('login')}
                className="font-bengali text-xs text-gray-700 hover:text-[#800020] transition font-semibold"
              >
                {t('nav.login')}
              </button>
              <span className="text-gray-300">/</span>
              <button
                onClick={() => openAuthModal('signup')}
                className="font-bengali text-xs text-[#800020] hover:underline font-semibold"
              >
                {t('nav.signup')}
              </button>
            </div>
          )}

          {/* Social Profiles */}
          <div className="hidden xl:flex items-center gap-2 text-gray-400 border-l border-gray-200 pl-2">
            <a href={settings?.facebook_url || '#'} target="_blank" rel="noreferrer" className="hover:text-[#1877f2]">
              <Facebook className="w-3 h-3" />
            </a>
            <a href={settings?.instagram_url || '#'} target="_blank" rel="noreferrer" className="hover:text-[#e4405f]">
              <Instagram className="w-3 h-3" />
            </a>
            <a href={settings?.twitter_url || '#'} target="_blank" rel="noreferrer" className="hover:text-[#1da1f2]">
              <Twitter className="w-3 h-3" />
            </a>
          </div>

          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1 text-gray-600 hover:text-[#800020] font-bengali transition text-xs p-1"
            title={t('nav.search')}
          >
            <Search className="w-3.5 h-3.5 text-gray-500" />
            <span className="hidden sm:inline">{t('nav.search')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
