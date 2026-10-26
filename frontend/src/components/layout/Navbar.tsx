import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ChevronDown, PenSquare, LayoutDashboard } from 'lucide-react';
import { Category } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface NavbarProps {
  categories: Category[];
}

interface NavItem {
  name: string;
  name_en?: string;
  slug: string;
  path: string;
  subcategories?: Category[];
}

export const Navbar: React.FC<NavbarProps> = ({ categories }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { user, openAuthModal } = useAuth();
  const { lang, t } = useLanguage();

  const mainNavItems: NavItem[] = [
    { name: 'হোম', name_en: 'Home', slug: '', path: '/' },
    ...categories.map(c => ({
      name: c.name,
      name_en: c.name_en,
      slug: c.slug,
      path: `/category/${c.slug}`,
      subcategories: c.subcategories || [],
    })),
    { name: 'আমাদের কথা', name_en: 'About', slug: 'about', path: '/about' },
    { name: 'যোগাযোগ', name_en: 'Contact', slug: 'contact', path: '/contact' },
  ];

  return (
    <nav className="hidden md:block bg-white border-b border-[#ded7cc] shadow-xs sticky top-[33px] z-30">
      <div className="madstory-container flex items-center justify-between">
        <ul className="flex items-center flex-wrap gap-1 text-[13px] font-bengali font-semibold text-[#1e2022] py-0.5">
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
                  className={({ isActive }) =>
                    `px-3 py-2.5 inline-flex items-center gap-1 transition-colors duration-200 border-b-2 ${
                      isActive
                        ? 'border-[#800020] text-[#800020]'
                        : 'border-transparent hover:text-[#800020]'
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
                    className={`absolute top-full left-0 w-56 bg-white border border-[#ded7cc] shadow-lg rounded-b py-2 transition-all duration-200 z-50 ${
                      activeDropdown === item.slug
                        ? 'opacity-100 visible translate-y-0 pointer-events-auto'
                        : 'opacity-0 invisible -translate-y-1 pointer-events-none'
                    }`}
                  >
                    {item.subcategories?.map((sub) => (
                      <Link
                        key={sub.slug}
                        to={`/category/${sub.slug}`}
                        className="block px-4 py-2 text-xs font-bengali text-gray-700 hover:bg-[#f5efe6] hover:text-[#800020] transition-colors"
                      >
                        {lang === 'en' && sub.name_en ? sub.name_en : sub.name}
                      </Link>
                    ))}
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
        </ul>

        {/* Right Action: Write Blog / Dashboard Pill */}
        <div className="flex items-center gap-2 py-1">
          {user ? (
            <Link
              to="/dashboard"
              className="px-3 py-1 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-bengali font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t('nav.dashboard')}</span>
            </Link>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-3 py-1 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-bengali font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <PenSquare className="w-3.5 h-3.5" />
              <span>{t('nav.writeBlog')}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
