import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, PenSquare, LayoutDashboard, Search, Menu } from 'lucide-react';
import { Category, SiteSetting } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LogoFlipper } from '../ui/LogoFlipper';

interface NavbarProps {
  categories: Category[];
  settings?: SiteSetting;
  onOpenSearch?: () => void;
  onToggleMobileMenu?: () => void;
}

interface NavItem {
  name: string;
  name_en?: string;
  slug: string;
  path: string;
  subcategories?: Category[];
}

const RecursiveNavbarMenu: React.FC<{
  categories: Category[];
  lang: string;
  onSelect?: () => void;
}> = ({ categories, lang, onSelect }) => {
  return (
    <div className="py-1">
      {categories.map((sub) => {
        const hasChildren = sub.subcategories && sub.subcategories.length > 0;
        const subName = lang === 'en' && sub.name_en ? sub.name_en : sub.name;

        return (
          <div key={sub.slug} className="relative group/nested">
            <Link
              to={`/category/${sub.slug}`}
              onClick={onSelect}
              className="flex items-center justify-between px-4 py-2 text-xs font-bengali text-gray-700 hover:bg-[#f5efe6] hover:text-[#800020] transition-colors"
            >
              <span className="truncate pr-2">{subName}</span>
              {hasChildren && (
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover/nested:text-[#800020] shrink-0" />
              )}
            </Link>

            {hasChildren && (
              <div className="absolute top-0 left-full -ml-1 w-56 bg-white border border-[#ded7cc] shadow-xl rounded py-1 opacity-0 invisible group-hover/nested:opacity-100 group-hover/nested:visible transition-all duration-150 z-50">
                <RecursiveNavbarMenu categories={sub.subcategories!} lang={lang} onSelect={onSelect} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  categories,
  settings,
  onOpenSearch,
  onToggleMobileMenu,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, openAuthModal } = useAuth();
  const { lang, t } = useLanguage();
  const location = useLocation();

  // Show top categories in main line, overflow into "More" dropdown
  const MAX_PRIMARY_CATS = 5;
  const primaryCategories = categories.slice(0, MAX_PRIMARY_CATS);
  const overflowCategories = categories.slice(MAX_PRIMARY_CATS);

  const mainNavItems: NavItem[] = [
    { name: 'হোম', name_en: 'Home', slug: '', path: '/' },
    ...primaryCategories.map((c) => ({
      name: c.name,
      name_en: c.name_en,
      slug: c.slug,
      path: `/category/${c.slug}`,
      subcategories: c.subcategories || [],
    })),
  ];

  const secondaryNavItems: NavItem[] = [
    { name: 'আমাদের কথা', name_en: 'About', slug: 'about', path: '/about' },
    { name: 'যোগাযোগ', name_en: 'Contact', slug: 'contact', path: '/contact' },
  ];

  return (
    <nav className="bg-white border-b border-[#ded7cc] shadow-xs sticky top-[33px] z-30 transition-all">
      <div className="madstory-container flex items-center justify-between gap-3 lg:gap-6 h-14 md:h-16">
        {/* Left: Mobile Hamburger & Brand Logo (same line as navbar) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-1.5 -ml-1 text-gray-700 hover:text-[#800020] hover:bg-[#f5efe6] rounded transition"
              aria-label="মেনু খুলুন"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {/* Dual Animated Brand Logo */}
          <LogoFlipper
            logoEnUrl={settings?.logo_en_url || '/assets/images/Madstory-logo.png'}
            logoBnUrl={settings?.logo_bn_url || '/assets/images/Madstory-logo-bangla.png'}
            size="nav"
          />
        </div>

        {/* Center: Desktop Navigation Links (same line as logo) */}
        <div className="hidden md:flex items-center justify-center flex-1 min-w-0">
          <ul className="flex items-center gap-0.5 lg:gap-1.5 xl:gap-2 text-[13px] lg:text-[13.5px] xl:text-[14px] font-bengali font-semibold text-[#1e2022]">
            {/* Primary Category Links */}
            {mainNavItems.map((item) => {
              const hasSubs = item.subcategories && item.subcategories.length > 0;
              const displayName = lang === 'en' && item.name_en ? item.name_en : item.name;

              return (
                <li
                  key={item.slug || 'home'}
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown(item.slug)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <NavLink
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `px-2.5 py-4 inline-flex items-center gap-1 transition-colors duration-200 border-b-2 whitespace-nowrap ${
                        isActive
                          ? 'border-[#800020] text-[#800020]'
                          : 'border-transparent text-[#2c2c2c] hover:text-[#800020]'
                      }`
                    }
                  >
                    <span>{displayName}</span>
                    {hasSubs && (
                      <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-[#800020] transition-transform duration-200 group-hover:rotate-180" />
                    )}
                  </NavLink>

                  {/* Submenu Dropdown */}
                  {hasSubs && (
                    <div
                      className={`absolute top-full left-0 w-56 bg-white border border-[#ded7cc] shadow-xl rounded-b py-1 transition-all duration-200 z-50 ${
                        activeDropdown === item.slug
                          ? 'opacity-100 visible translate-y-0 pointer-events-auto'
                          : 'opacity-0 invisible -translate-y-1 pointer-events-none'
                      }`}
                    >
                      <RecursiveNavbarMenu
                        categories={item.subcategories || []}
                        lang={lang}
                        onSelect={() => setActiveDropdown(null)}
                      />
                      <div className="border-t border-[#f0ebe3] mt-1 pt-1">
                        <Link
                          to={item.path}
                          className="block px-4 py-1.5 text-[11px] font-bengali text-[#800020] font-bold hover:underline"
                        >
                          {lang === 'en' ? `View All (${displayName}) →` : `সব দেখুন (${displayName}) →`}
                        </Link>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}

            {/* "More / আরও" Dropdown if there are overflow categories */}
            {overflowCategories.length > 0 && (
              <li
                className="relative group"
                onMouseEnter={() => setActiveDropdown('overflow-more')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  className={`px-2.5 py-4 inline-flex items-center gap-1 transition-colors duration-200 border-b-2 whitespace-nowrap ${
                    overflowCategories.some((c) => location.pathname === `/category/${c.slug}`)
                      ? 'border-[#800020] text-[#800020]'
                      : 'border-transparent text-[#2c2c2c] hover:text-[#800020]'
                  }`}
                >
                  <span>{lang === 'en' ? 'More' : 'আরও'}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-[#800020] transition-transform duration-200 group-hover:rotate-180" />
                </button>

                <div
                  className={`absolute top-full left-0 w-60 bg-white border border-[#ded7cc] shadow-xl rounded-b py-1 transition-all duration-200 z-50 ${
                    activeDropdown === 'overflow-more'
                      ? 'opacity-100 visible translate-y-0 pointer-events-auto'
                      : 'opacity-0 invisible -translate-y-1 pointer-events-none'
                  }`}
                >
                  <RecursiveNavbarMenu
                    categories={overflowCategories}
                    lang={lang}
                    onSelect={() => setActiveDropdown(null)}
                  />
                  <div className="border-t border-[#f0ebe3] mt-1 pt-1">
                    <Link
                      to="/categories"
                      className="block px-4 py-1.5 text-[11px] font-bengali text-[#800020] font-bold hover:underline"
                    >
                      {lang === 'en' ? 'All Categories →' : 'সকল ক্যাটাগরি →'}
                    </Link>
                  </div>
                </div>
              </li>
            )}

            {/* Static Links: About & Contact */}
            {secondaryNavItems.map((item) => (
              <li key={item.slug}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `px-2.5 py-4 inline-flex items-center gap-1 transition-colors duration-200 border-b-2 whitespace-nowrap ${
                      isActive
                        ? 'border-[#800020] text-[#800020]'
                        : 'border-transparent text-[#2c2c2c] hover:text-[#800020]'
                    }`
                  }
                >
                  <span>{lang === 'en' && item.name_en ? item.name_en : item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Search & Write Blog / Dashboard CTA */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-2 text-gray-600 hover:text-[#800020] hover:bg-[#f5efe6] rounded-full transition flex items-center justify-center"
              title={t('nav.search')}
              aria-label={t('nav.search')}
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {user ? (
            <Link
              to="/dashboard"
              className="px-3 py-1.5 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-bengali font-semibold transition flex items-center gap-1.5 shadow-xs shrink-0"
              title={t('nav.dashboard')}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.dashboard')}</span>
            </Link>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-3 py-1.5 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-bengali font-semibold transition flex items-center gap-1.5 shadow-xs shrink-0"
              title={t('nav.writeBlog')}
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('nav.writeBlog')}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
