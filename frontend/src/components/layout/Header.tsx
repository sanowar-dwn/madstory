import React from 'react';
import { LogoFlipper } from '../ui/LogoFlipper';
import { SiteSetting } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  settings?: SiteSetting;
}

export const Header: React.FC<HeaderProps> = ({ settings }) => {
  const { lang } = useLanguage();

  const tagline = lang === 'en'
    ? (settings?.tagline_en || 'A Quarterly Magazine on Art, Literature, Culture & Modern Lifestyle')
    : (settings?.tagline_bn || 'শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা');

  return (
    <header className="bg-white border-b border-[#ece7df] py-5 px-4 text-center">
      <div className="madstory-container flex flex-col items-center justify-center">
        {/* Animated Dual Logo Switcher */}
        <LogoFlipper
          logoEnUrl={settings?.logo_en_url || '/assets/images/Madstory-logo.png'}
          logoBnUrl={settings?.logo_bn_url || '/assets/images/Madstory-logo-bangla.png'}
          size="default"
        />

        {/* Tagline / Subtitle */}
        <p className="mt-1 text-xs text-gray-500 font-bengali tracking-wide font-normal">
          {tagline}
        </p>
      </div>
    </header>
  );
};
