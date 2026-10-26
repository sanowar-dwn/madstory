import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, BookOpen } from 'lucide-react';
import { api } from '../../services/api';
import { Article } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getArticles({ search: query });
        setResults(res.results.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const placeholderText = lang === 'en'
    ? 'Search stories, art, architecture, lifestyle...'
    : 'অনুসন্ধান করুন (যেমন: ডিজাইন, ফার্নিচার, শিল্প, সাহিত্য)...';

  const idleText = lang === 'en'
    ? 'Type to search by title, author, or keyword...'
    : 'লেখা, ক্যাটাগরি বা লেখকের নাম লিখে অনুসন্ধান করুন...';

  const noResultsText = lang === 'en'
    ? 'No results found'
    : 'কোনো ফলাফল পাওয়া যায়নি';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-md shadow-2xl border border-[#ded7cc] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-[#e2ddd3] bg-[#fbf9f6]">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder={placeholderText}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full bg-transparent text-base text-[#1e2022] focus:outline-none placeholder:text-gray-400 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}
            autoFocus
          />
          {loading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin mr-2" />}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          {query.trim() === '' ? (
            <div className={`py-8 text-center text-gray-400 text-sm ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {idleText}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3">
              <div className="text-xs uppercase font-semibold text-gray-400 tracking-wider font-sans px-1">
                {lang === 'en' ? `Found (${results.length})` : `পাওয়া গেছে (${results.length})`}
              </div>
              {results.map((art) => {
                const title = lang === 'en' && art.title_en ? art.title_en : art.title;
                const catName = lang === 'en' && art.category_name_en ? art.category_name_en : art.category_name;
                return (
                  <div
                    key={art.id}
                    onClick={() => {
                      navigate(`/post/${art.slug}`);
                      onClose();
                    }}
                    className="flex items-center gap-3 p-2 rounded hover:bg-[#f5efe6] transition cursor-pointer group"
                  >
                    <img
                      src={art.image}
                      alt={title}
                      className="w-16 h-12 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-[#800020] font-semibold block truncate">
                        {catName}
                      </span>
                      <h4 className={`text-sm font-semibold text-gray-800 group-hover:text-[#800020] transition truncate ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                        {title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !loading ? (
            <div className="py-10 text-center text-gray-500">
              <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className={`text-sm ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>{noResultsText}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
