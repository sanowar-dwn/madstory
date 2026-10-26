import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Article } from '../types';
import { HeartButton } from '../components/ui/HeartButton';
import { CommentTree } from '../components/ui/CommentTree';
import { useLanguage } from '../context/LanguageContext';
import { toast } from '../context/ToastContext';
import { Loader2, Clock, Eye, Share2, Facebook, Twitter, Link as LinkIcon, Check, ArrowLeft, Heart } from 'lucide-react';

export const PostDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const data = await api.getArticleBySlug(slug);
        setArticle(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('Error fetching article:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  // Dynamic SEO & Title management
  useEffect(() => {
    if (article) {
      const pageTitle = lang === 'en' && article.title_en ? article.title_en : article.title;
      document.title = `${pageTitle} — The Mad Story`;
    }
    return () => {
      document.title = 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা';
    };
  }, [article, lang]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('লেখার লিংকটি ক্লিপবোর্ডে কপি করা হয়েছে!', { title: 'কপি সম্পন্ন' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#800020] animate-spin mb-3" />
        <span className="font-bengali text-sm text-gray-500">লেখা লোড হচ্ছে...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="madstory-container py-20 text-center">
        <h2 className="text-2xl font-bengali font-bold text-gray-800 mb-4">লেখাটি খুঁজে পাওয়া যায়নি</h2>
        <Link to="/" className="inline-flex items-center gap-2 text-[#800020] font-bengali font-semibold hover:underline">
          <ArrowLeft className="w-4 h-4" />
          <span>প্রচ্ছদে ফিরে যান</span>
        </Link>
      </div>
    );
  }

  // Bilingual fields
  const displayTitle = (lang === 'en' && article.title_en) ? article.title_en : article.title;
  const displayExcerpt = (lang === 'en' && article.excerpt_en) ? article.excerpt_en : article.excerpt;
  const displayContent = (lang === 'en' && article.content_en) ? article.content_en : article.content;
  const displayReadingTime = (lang === 'en' && article.reading_time_en) ? article.reading_time_en : article.reading_time;

  return (
    <article className="py-8">
      <div className="madstory-container max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 font-bengali mb-6">
          <Link to="/" className="hover:text-[#800020] transition">{t('nav.home')}</Link>
          <span>/</span>
          {article.categories && article.categories.length > 0 && (
            <>
              <Link to={`/category/${article.categories[0].slug}`} className="hover:text-[#800020] transition">
                {lang === 'en' && article.categories[0].name_en ? article.categories[0].name_en : article.categories[0].name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-600 truncate max-w-xs">{displayTitle}</span>
        </nav>

        {/* M2M Category Badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {article.categories?.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="inline-block bg-[#800020] hover:bg-[#9b1b30] text-white text-xs font-bengali font-semibold px-3 py-1 rounded transition"
            >
              {lang === 'en' && cat.name_en ? cat.name_en : cat.name}
            </Link>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bengali font-bold text-[#1e2022] leading-tight mb-4">
          {displayTitle}
        </h1>

        {/* Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[#e2ddd3] mb-6 text-xs text-gray-500 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-xs font-bengali">
              {article.author_name.charAt(0)}
            </div>
            <div>
              <span className="font-semibold text-gray-800 block">{article.author_name}</span>
              <span className="text-gray-400 text-[11px]">The Mad Story Editorial Desk</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            {/* Heart Reaction Button */}
            <HeartButton
              slug={article.slug}
              initialHearted={article.is_hearted}
              initialCount={article.hearts_count}
              size="md"
            />

            <span className="flex items-center gap-1 font-bengali">
              <Clock className="w-3.5 h-3.5" />
              <span>{displayReadingTime || '৫ মিনিট পাঠ'}</span>
            </span>

            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{article.view_count || 1} views</span>
            </span>
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative rounded overflow-hidden shadow-md mb-8">
          <img
            src={article.image}
            alt={displayTitle}
            className="w-full max-h-[500px] object-cover"
          />
        </div>

        {/* Excerpt Lead */}
        {displayExcerpt && (
          <div className="bg-[#f7f2eb] border-l-4 border-[#800020] p-4 rounded-r mb-8">
            <p className="font-bengali text-base sm:text-lg text-gray-700 italic leading-relaxed">
              {displayExcerpt}
            </p>
          </div>
        )}

        {/* Article Body Content */}
        <div
          className="font-bengali text-gray-800 text-base leading-loose space-y-5 prose prose-lg max-w-none prose-headings:font-bengali prose-headings:text-[#1e2022] prose-blockquote:border-l-[#800020] prose-blockquote:bg-[#faf7f2] prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:font-serif"
          dangerouslySetInnerHTML={{ __html: displayContent || `<p>${displayExcerpt}</p>` }}
        />

        {/* Social Share & Bottom Reaction Bar */}
        <div className="border-t border-[#ded7cc] pt-6 mt-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <HeartButton
              slug={article.slug}
              initialHearted={article.is_hearted}
              initialCount={article.hearts_count}
              size="lg"
            />
            <span className="text-xs text-gray-500 font-bengali">এই লেখায় লাইক দিন</span>
          </div>

          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#800020]" />
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1877f2] text-white text-xs font-sans hover:opacity-90 transition"
            >
              <Facebook className="w-3.5 h-3.5" />
              <span>Facebook</span>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(displayTitle)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1da1f2] text-white text-xs font-sans hover:opacity-90 transition"
            >
              <Twitter className="w-3.5 h-3.5" />
              <span>Twitter</span>
            </a>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-sans transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <LinkIcon className="w-3.5 h-3.5" />}
              <span>{copied ? 'কপি হয়েছে!' : 'লিঙ্ক কপি'}</span>
            </button>
          </div>
        </div>

        {/* Tree Comments Section */}
        <CommentTree articleSlug={article.slug} />

        {/* Related Articles */}
        {article.related_articles && article.related_articles.length > 0 && (
          <div className="mt-14 border-t-2 border-[#800020] pt-6">
            <h3 className="font-bengali font-bold text-xl text-[#1e2022] mb-6">
              {t('section.related')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {article.related_articles.map((rel) => (
                <div key={rel.id} className="magazine-card group flex flex-col">
                  <div className="h-32 w-full overflow-hidden img-zoom-wrapper border-b border-[#e2ddd3]">
                    <Link to={`/post/${rel.slug}`}>
                      <img src={rel.image} alt={rel.title} className="w-full h-full object-cover" />
                    </Link>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h5 className="font-bengali font-bold text-xs text-gray-800 group-hover:text-[#800020] transition line-clamp-2 leading-snug flex-1">
                      <Link to={`/post/${rel.slug}`}>{rel.title}</Link>
                    </h5>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-sans mt-2">
                      <span>{rel.reading_time || '৪ মিনিট'}</span>
                      <HeartButton slug={rel.slug} initialHearted={rel.is_hearted} initialCount={rel.hearts_count} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
};
