import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface LogoFlipperProps {
  logoEnUrl?: string;
  logoBnUrl?: string;
  size?: 'default' | 'small' | 'large';
}

export const LogoFlipper: React.FC<LogoFlipperProps> = ({
  logoEnUrl = '/assets/images/Madstory-logo.png',
  logoBnUrl = '/assets/images/Madstory-logo-bangla.png',
  size = 'default'
}) => {
  const [showBengali, setShowBengali] = useState(false);

  useEffect(() => {
    // 20-second loop alternating logos as specified in Cheerup theme
    const interval = setInterval(() => {
      setShowBengali(prev => !prev);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const heightClass = size === 'small' ? 'h-10' : size === 'large' ? 'h-20' : 'h-16';

  return (
    <Link 
      to="/" 
      className="inline-block group focus:outline-none"
      title="The Mad Story"
      onMouseEnter={() => setShowBengali(true)}
      onMouseLeave={() => setShowBengali(false)}
    >
      <div className={`relative flex items-center justify-center ${heightClass} min-w-[200px] sm:min-w-[240px]`}>
        {/* English Logo */}
        <img
          src={logoEnUrl}
          alt="The Mad Story"
          className={`absolute max-h-full w-auto object-contain transition-all duration-700 transform ${
            showBengali
              ? 'opacity-0 scale-95 pointer-events-none -rotate-1'
              : 'opacity-100 scale-100 pointer-events-auto rotate-0'
          }`}
        />

        {/* Bengali Logo */}
        <img
          src={logoBnUrl}
          alt="The Mad Story (বাংলা)"
          className={`absolute max-h-full w-auto object-contain transition-all duration-700 transform ${
            showBengali
              ? 'opacity-100 scale-100 pointer-events-auto rotate-0'
              : 'opacity-0 scale-95 pointer-events-none rotate-1'
          }`}
        />
      </div>
    </Link>
  );
};
