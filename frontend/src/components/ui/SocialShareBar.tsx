import React, { useState, useRef, useEffect } from 'react';
import {
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  Check,
  Send,
  Mail,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../context/ToastContext';

interface SocialShareBarProps {
  title: string;
  excerpt?: string;
  url?: string;
  articleId?: number;
  variant?: 'top' | 'bottom' | 'floating';
  className?: string;
}

// WhatsApp brand SVG icon
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="0"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export const SocialShareBar: React.FC<SocialShareBarProps> = ({
  title,
  excerpt = '',
  url,
  articleId,
  variant = 'bottom',
  className = '',
}) => {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [shortCopied, setShortCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const rawUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Normalized decoded URL: when copied to clipboard, displays clean Bengali script
  // in messaging apps (WhatsApp, Telegram, Messenger) rather than ugly %E0%A6...
  const cleanUrl = React.useMemo(() => {
    try {
      return decodeURI(rawUrl);
    } catch {
      return rawUrl;
    }
  }, [rawUrl]);

  // Safe single-encoded URL for social share popups (eliminates double-encoding %25 bugs)
  const safeEncodedUrl = React.useMemo(() => {
    return encodeURIComponent(cleanUrl);
  }, [cleanUrl]);

  // Canonical short link if articleId is provided (ASCII only, ultra compact)
  const shortUrl = React.useMemo(() => {
    if (!articleId) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://themadstory.com';
    return `${origin}/post/${articleId}`;
  }, [articleId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Open popups cleanly in the center of the user screen
  const openSharePopup = (targetUrl: string, name: string) => {
    const width = 600;
    const height = 520;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      targetUrl,
      name,
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );
  };

  const handleCopyLink = async (targetUrl?: unknown, isShort = false) => {
    const textToCopy = typeof targetUrl === 'string' && targetUrl.trim() ? targetUrl.trim() : cleanUrl;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      if (isShort) {
        setShortCopied(true);
        setTimeout(() => setShortCopied(false), 2200);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
      toast.success(
        isShort
          ? (lang === 'en' ? 'Short URL copied to clipboard!' : 'শর্ট লিংকটি ক্লিপবোর্ডে কপি করা হয়েছে!')
          : (lang === 'en' ? 'Article link copied to clipboard!' : 'লেখার লিংকটি ক্লিপবোর্ডে কপি করা হয়েছে!'),
        { title: lang === 'en' ? 'Link Copied' : 'কপি সম্পন্ন' }
      );
    } catch {
      toast.error(
        lang === 'en' ? 'Failed to copy link.' : 'লিঙ্ক কপি করতে সমস্যা হয়েছে।'
      );
    }
  };

  // Native Web Share API if supported
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt || title,
          url: cleanUrl,
        });
        toast.success(lang === 'en' ? 'Shared successfully!' : 'শেয়ার সম্পন্ন হয়েছে!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      setDropdownOpen((prev) => !prev);
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  // Share Channels configurations
  const channels = [
    {
      id: 'facebook',
      name: 'Facebook',
      nameBn: 'ফেসবুক',
      icon: Facebook,
      color: 'bg-[#1877f2] hover:bg-[#166fe5] text-white',
      border: 'hover:border-[#1877f2]',
      action: () =>
        openSharePopup(
          `https://www.facebook.com/sharer/sharer.php?u=${safeEncodedUrl}`,
          'FacebookShare'
        ),
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      nameBn: 'হোয়াটসঅ্যাপ',
      icon: WhatsAppIcon,
      color: 'bg-[#25d366] hover:bg-[#20ba59] text-white',
      border: 'hover:border-[#25d366]',
      action: () => {
        const text = `${title}\n\n${cleanUrl}`;
        openSharePopup(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`,
          'WhatsAppShare'
        );
      },
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      nameBn: 'এক্সে (টুইটার)',
      icon: Twitter,
      color: 'bg-[#0f1419] hover:bg-black text-white',
      border: 'hover:border-black',
      action: () =>
        openSharePopup(
          `https://twitter.com/intent/tweet?url=${safeEncodedUrl}&text=${encodeURIComponent(title)}`,
          'TwitterShare'
        ),
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      nameBn: 'লিঙ্কডইন',
      icon: Linkedin,
      color: 'bg-[#0a66c2] hover:bg-[#084e96] text-white',
      border: 'hover:border-[#0a66c2]',
      action: () =>
        openSharePopup(
          `https://www.linkedin.com/sharing/share-offsite/?url=${safeEncodedUrl}`,
          'LinkedInShare'
        ),
    },
    {
      id: 'telegram',
      name: 'Telegram',
      nameBn: 'টেলিগ্রাম',
      icon: Send,
      color: 'bg-[#229ed9] hover:bg-[#1e8ec3] text-white',
      border: 'hover:border-[#229ed9]',
      action: () =>
        openSharePopup(
          `https://t.me/share/url?url=${safeEncodedUrl}&text=${encodeURIComponent(title)}`,
          'TelegramShare'
        ),
    },
    {
      id: 'email',
      name: 'Email',
      nameBn: 'ইমেইল',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
      border: 'hover:border-gray-600',
      action: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
          (excerpt ? excerpt + '\n\n' : '') + cleanUrl
        )}`;
      },
    },
  ];

  // 1. TOP HEADER VARIANT (Compact Meta Bar Button + Dropdown Popover)
  if (variant === 'top') {
    return (
      <div className={`relative inline-block ${className}`} ref={dropdownRef}>
        <div className="flex items-center gap-1.5">
          {hasNativeShare ? (
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#faf7f2] hover:bg-[#800020] text-gray-700 hover:text-white border border-[#ded7cc] transition text-xs font-sans shadow-2xs group"
              title={lang === 'en' ? 'Share this article' : 'লেখাটি শেয়ার করুন'}
              aria-label="Share article"
            >
              <Share2 className="w-3.5 h-3.5 text-[#800020] group-hover:text-white transition" />
              <span>{lang === 'en' ? 'Share' : 'শেয়ার'}</span>
            </button>
          ) : (
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#faf7f2] hover:bg-[#800020] text-gray-700 hover:text-white border border-[#ded7cc] transition text-xs font-sans shadow-2xs group"
              title={lang === 'en' ? 'Share this article' : 'লেখাটি শেয়ার করুন'}
              aria-expanded={dropdownOpen}
              aria-label="Share options"
            >
              <Share2 className="w-3.5 h-3.5 text-[#800020] group-hover:text-white transition" />
              <span>{lang === 'en' ? 'Share' : 'শেয়ার'}</span>
              <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-white transition" />
            </button>
          )}

          {/* Quick Copy Link icon pill next to share */}
          <button
            onClick={() => handleCopyLink()}
            className="p-1 rounded bg-[#faf7f2] hover:bg-gray-200 text-gray-600 border border-[#ded7cc] transition shadow-2xs"
            title={lang === 'en' ? 'Copy link' : 'লিঙ্ক কপি করুন'}
            aria-label="Copy article link"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <LinkIcon className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Dropdown Menu Popover */}
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-sm shadow-xl border border-[#ded7cc] py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-3 py-1.5 border-b border-gray-100 mb-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                {lang === 'en' ? 'Share Article' : 'লেখাটি শেয়ার করুন'}
              </span>
            </div>

            <div className="px-1 space-y-0.5">
              {channels.map((ch) => {
                const IconComponent = ch.icon;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      ch.action();
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-[#faf7f2] text-gray-700 hover:text-gray-900 text-xs font-sans transition text-left"
                  >
                    <span className={`p-1 rounded ${ch.color} flex items-center justify-center`}>
                      <IconComponent className="w-3 h-3" />
                    </span>
                    <span className="font-medium">{lang === 'en' ? ch.name : ch.nameBn}</span>
                  </button>
                );
              })}

              <div className="pt-1 mt-1 border-t border-gray-100 space-y-0.5">
                <button
                  onClick={() => {
                    handleCopyLink(cleanUrl, false);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-[#faf7f2] text-gray-700 hover:text-[#800020] text-xs font-sans transition text-left"
                >
                  <span className="p-1 rounded bg-gray-100 text-gray-700 flex items-center justify-center">
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <LinkIcon className="w-3 h-3" />}
                  </span>
                  <span className="font-medium">
                    {copied
                      ? (lang === 'en' ? 'Copied to Clipboard!' : 'কপি হয়েছে!')
                      : (lang === 'en' ? 'Copy Article Link' : 'লেখাটির লিংক কপি')}
                  </span>
                </button>

                {shortUrl && (
                  <button
                    onClick={() => {
                      handleCopyLink(shortUrl, true);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-[#faf7f2] text-gray-700 hover:text-[#800020] text-xs font-sans transition text-left"
                    title={shortUrl}
                  >
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-mono text-[10px] font-bold">
                      {shortCopied ? <Check className="w-3 h-3 text-emerald-600" /> : '#ID'}
                    </span>
                    <span className="font-medium">
                      {shortCopied
                        ? (lang === 'en' ? 'Short URL Copied!' : 'শর্ট লিংক কপি হয়েছে!')
                        : (lang === 'en' ? 'Copy Short Link' : 'শর্ট লিংক কপি')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. BOTTOM VARIANT (Full Featured Responsive Section Under Article Body)
  return (
    <div className={`p-5 sm:p-6 bg-[#fcfbfa] border border-[#e2ddd3] rounded-sm shadow-2xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left Label with Burgundy Accent */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#800020]/10 flex items-center justify-center text-[#800020] shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bengali font-bold text-sm sm:text-base text-[#1e2022] leading-tight">
              {lang === 'en' ? 'Share this article' : 'লেখাটি ভালো লাগলে শেয়ার করুন'}
            </h4>
            <p className="text-[11px] text-gray-500 font-sans mt-0.5">
              {lang === 'en'
                ? 'Spread the word across your social circle'
                : 'আপনার প্রিয়জনদের সাথে সাহিত্য ও সংস্কৃতি ছড়িয়ে দিন'}
            </p>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Facebook */}
          <button
            onClick={channels[0].action}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1877f2] hover:bg-[#166fe5] text-white text-xs font-sans font-medium shadow-2xs hover:shadow transition"
            title={lang === 'en' ? 'Share on Facebook' : 'ফেসবুকে শেয়ার করুন'}
          >
            <Facebook className="w-3.5 h-3.5" />
            <span>Facebook</span>
          </button>

          {/* WhatsApp */}
          <button
            onClick={channels[1].action}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#25d366] hover:bg-[#20ba59] text-white text-xs font-sans font-medium shadow-2xs hover:shadow transition"
            title={lang === 'en' ? 'Share on WhatsApp' : 'হোয়াটসঅ্যাপে পাঠান'}
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Twitter / X */}
          <button
            onClick={channels[2].action}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-black hover:bg-neutral-800 text-white text-xs font-sans font-medium shadow-2xs hover:shadow transition"
            title={lang === 'en' ? 'Share on X (Twitter)' : 'এক্সে শেয়ার করুন'}
          >
            <Twitter className="w-3.5 h-3.5" />
            <span>X</span>
          </button>

          {/* LinkedIn */}
          <button
            onClick={channels[3].action}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0a66c2] hover:bg-[#084e96] text-white text-xs font-sans font-medium shadow-2xs hover:shadow transition"
            title={lang === 'en' ? 'Share on LinkedIn' : 'লিঙ্কডইনে শেয়ার করুন'}
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
          </button>

          {/* Native Share button (if supported on mobile/tablet) */}
          {hasNativeShare && (
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#800020] hover:bg-[#9b1b30] text-white text-xs font-sans font-medium shadow-2xs hover:shadow transition"
              title={lang === 'en' ? 'More sharing options' : 'অন্যান্য মাধ্যমে শেয়ার'}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'More' : 'আরও'}</span>
            </button>
          )}

          {/* Copy Clean Link Button with dynamic tick state */}
          <button
            onClick={() => handleCopyLink(cleanUrl, false)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded border transition text-xs font-sans font-medium shadow-2xs ${
              copied
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-white hover:bg-gray-50 border-[#ded7cc] text-gray-700 hover:text-gray-900'
            }`}
            title={lang === 'en' ? 'Copy article URL' : 'লেখার লিংক কপি করুন'}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>{lang === 'en' ? 'Copied!' : 'কপি সম্পন্ন!'}</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5 text-gray-500" />
                <span>{lang === 'en' ? 'Copy Link' : 'লিঙ্ক কপি'}</span>
              </>
            )}
          </button>

          {/* Optional Short Link (#ID) Pill Button */}
          {shortUrl && (
            <button
              onClick={() => handleCopyLink(shortUrl, true)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition text-xs font-sans font-medium shadow-2xs ${
                shortCopied
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-white hover:bg-amber-50 border-[#ded7cc] text-gray-600 hover:text-amber-900'
              }`}
              title={lang === 'en' ? `Copy short URL (${shortUrl})` : `সংক্ষিপ্ত লিংক কপি করুন (${shortUrl})`}
            >
              {shortCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'en' ? 'Short URL Copied!' : 'শর্ট লিংক কপি!'}</span>
                </>
              ) : (
                <>
                  <span className="font-mono text-[11px] font-bold text-[#800020]">#ID</span>
                  <span>{lang === 'en' ? 'Short URL' : 'শর্ট লিংক'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
