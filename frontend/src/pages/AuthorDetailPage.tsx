import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon, BookOpen, Eye, Heart, Calendar, MapPin,
  Globe, Twitter, Facebook, Instagram, Linkedin, Github,
  Edit3, Share2, Check, Clock, Search, ArrowRight,
  Sparkles, Camera, Image as ImageIcon, Save, X, Loader2
} from 'lucide-react';
import { api } from '../services/api';
import { AuthorDetail, Article, AuthorProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { toast } from '../context/ToastContext';
import { HeartButton } from '../components/ui/HeartButton';
import { ImageUpload } from '../components/ui/ImageUpload';
import { parseApiError } from '../utils/errorHandler';

export const AuthorDetailPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { t, lang } = useLanguage();

  const [author, setAuthor] = useState<AuthorDetail | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'hearted'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AuthorProfile> & { first_name?: string; last_name?: string }>({});

  const isOwner = Boolean(
    currentUser && (
      currentUser.username === username ||
      (author && currentUser.id === author.id) ||
      currentUser.is_superuser
    )
  );

  // Load author information
  const fetchAuthor = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const data = await api.getAuthor(username);
      setAuthor(data);
      setEditForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        display_name: data.profile?.display_name || '',
        display_name_en: data.profile?.display_name_en || '',
        designation: data.profile?.designation || '',
        designation_en: data.profile?.designation_en || '',
        bio: data.profile?.bio || '',
        bio_en: data.profile?.bio_en || '',
        avatar: data.profile?.avatar || '',
        cover_image: data.profile?.cover_image || '',
        location: data.profile?.location || '',
        location_en: data.profile?.location_en || '',
        website: data.profile?.website || '',
        facebook_url: data.profile?.facebook_url || '',
        twitter_url: data.profile?.twitter_url || '',
        instagram_url: data.profile?.instagram_url || '',
        linkedin_url: data.profile?.linkedin_url || '',
        github_url: data.profile?.github_url || '',
      });
    } catch (err: any) {
      console.error('Failed to load author profile:', err);
      toast.error('লেখক প্রোফাইল পাওয়া যায়নি।', { title: 'ত্রুটি' });
    } finally {
      setLoading(false);
    }
  };

  // Load author articles with sorting & search
  const fetchArticles = async () => {
    if (!username) return;
    setArticlesLoading(true);
    try {
      let ordering = '-published_at';
      if (activeTab === 'popular') ordering = '-view_count';
      if (activeTab === 'hearted') ordering = '-hearts';

      const data = await api.getAuthorArticles(username, {
        ordering,
        search: searchQuery.trim() || undefined,
      });
      setArticles(data.results || []);
    } catch (err) {
      console.error('Failed to load author articles:', err);
    } finally {
      setArticlesLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthor();
  }, [username]);

  useEffect(() => {
    if (author) {
      fetchArticles();
    }
  }, [author, activeTab, searchQuery]);

  // Page title
  useEffect(() => {
    if (author) {
      const displayName =
        (lang === 'en' ? author.profile?.display_name_en : author.profile?.display_name) ||
        author.profile?.display_name ||
        author.name ||
        author.username;
      document.title = `${displayName} — দ্য ম্যাড স্টোরি`;
    }
    return () => {
      document.title = 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা';
    };
  }, [author, lang]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('প্রোফাইলের লিঙ্ক কপি করা হয়েছে!', { title: 'শেয়ার' });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await api.updateMyProfile({
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        profile: {
          display_name: editForm.display_name,
          display_name_en: editForm.display_name_en,
          designation: editForm.designation,
          designation_en: editForm.designation_en,
          bio: editForm.bio,
          bio_en: editForm.bio_en,
          avatar: editForm.avatar,
          cover_image: editForm.cover_image,
          location: editForm.location,
          location_en: editForm.location_en,
          website: editForm.website,
          facebook_url: editForm.facebook_url,
          twitter_url: editForm.twitter_url,
          instagram_url: editForm.instagram_url,
          linkedin_url: editForm.linkedin_url,
          github_url: editForm.github_url,
        },
      });
      setAuthor(updated);
      setEditModalOpen(false);
      toast.success('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!', { title: 'সফল' });
    } catch (err) {
      const errorMsg = parseApiError(err).message;
      toast.error(errorMsg, { title: 'সংরক্ষণ ব্যর্থ' });
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 text-[#800020] animate-spin mb-4" />
        <p className="text-gray-500 font-bengali text-sm">লেখকের প্রোফাইল লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!author) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold font-bengali text-gray-800 mb-2">লেখক প্রোফাইল খুঁজে পাওয়া যায়নি</h2>
        <p className="text-gray-500 font-bengali mb-6">এই ইউজারনেমে কোনো লেখকের তথ্য নিবন্ধিত নেই।</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#800020] text-white text-sm font-bengali hover:bg-[#600018] transition"
        >
          প্রচ্ছদে ফিরে যান
        </Link>
      </div>
    );
  }

  const p = author.profile || {};
  const displayName =
    (lang === 'en' ? p.display_name_en : p.display_name) ||
    p.display_name ||
    author.name ||
    author.username;
  const designation =
    (lang === 'en' ? p.designation_en : p.designation) ||
    p.designation ||
    (author.is_staff ? 'সম্পাদকীয় দল' : 'নিয়মিত লেখক');
  const bio = (lang === 'en' ? p.bio_en : p.bio) || p.bio || '';
  const locationText = (lang === 'en' ? p.location_en : p.location) || p.location || '';
  const coverUrl = p.effective_cover || p.cover_image;
  const avatarUrl = p.effective_avatar || p.avatar;

  const joinDate = author.date_joined
    ? new Date(author.date_joined).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
        year: 'numeric',
        month: 'long',
      })
    : '';

  return (
    <div className="bg-[#fcfbfa] min-h-screen pb-16">
      {/* 1. Header Banner / Cover */}
      <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden bg-gradient-to-r from-[#2c000b] via-[#4d0014] to-[#800020]">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${displayName} cover`}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Quick buttons in cover top-right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
          {isOwner && (
            <button
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-sm text-xs font-bengali font-semibold shadow-sm backdrop-blur-xs transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#800020]" />
              <span>প্রোফাইল কাস্টমাইজ করুন</span>
            </button>
          )}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-sm text-xs font-bengali font-semibold shadow-sm backdrop-blur-xs transition"
            title="লিঙ্ক কপি করুন"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'কপি হয়েছে' : 'শেয়ার'}</span>
          </button>
        </div>
      </div>

      {/* 2. Author Profile Card */}
      <div className="madstory-container mx-auto">
        <div className="relative -mt-20 sm:-mt-24 bg-white border border-[#ded7cc] rounded-sm p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            {/* Avatar */}
            <div className="relative flex-shrink-0 self-center md:self-start">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-md overflow-hidden bg-[#800020] text-white flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bengali font-bold text-4xl sm:text-5xl">
                    {displayName.charAt(0)}
                  </span>
                )}
              </div>
              {author.is_staff && (
                <span
                  title="সম্পাদকীয় পরিষদ"
                  className="absolute bottom-1 right-1 bg-amber-500 text-white p-1.5 rounded-full shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                </span>
              )}
            </div>

            {/* Author Details */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <h1 className="text-2xl sm:text-3xl font-bold font-bengali text-[#1e2022]">
                      {displayName}
                    </h1>
                    {author.is_staff && (
                      <span className="px-2 py-0.5 text-[11px] font-sans font-semibold rounded bg-[#800020]/10 text-[#800020] border border-[#800020]/20">
                        Editorial Staff
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bengali text-[#800020] font-semibold mt-0.5">
                    {designation}
                  </p>
                  <p className="text-xs text-gray-400 font-sans">
                    @{author.username}
                  </p>
                </div>

                {isOwner && (
                  <button
                    onClick={() => navigate('/dashboard/profile')}
                    className="self-center sm:self-start text-xs text-gray-500 hover:text-[#800020] underline font-bengali"
                  >
                    ড্যাশবোর্ডে সম্পূর্ণ প্রোফাইল ব্যবস্থাপনা &rarr;
                  </button>
                )}
              </div>

              {/* Bio */}
              {bio ? (
                <p className="text-sm text-gray-700 font-bengali leading-relaxed max-w-3xl pt-1">
                  {bio}
                </p>
              ) : (
                <p className="text-xs text-gray-400 font-bengali italic pt-1">
                  {isOwner
                    ? 'আপনার পরিচিতি ও সাহিত্যকর্ম সম্পর্কে সংক্ষিপ্ত তথ্য যুক্ত করতে "প্রোফাইল কাস্টমাইজ করুন" এ ক্লিক করুন।'
                    : 'লেখকের পরিচিতি এখনো যুক্ত করা হয়নি।'}
                </p>
              )}

              {/* Meta Info Row: Location, Joined, Socials */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-5 text-xs text-gray-500 font-sans pt-2 border-t border-[#f0ece5]">
                {locationText && (
                  <span className="flex items-center gap-1.5 font-bengali">
                    <MapPin className="w-3.5 h-3.5 text-[#800020]" />
                    <span>{locationText}</span>
                  </span>
                )}
                {joinDate && (
                  <span className="flex items-center gap-1.5 font-bengali">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>যুক্ত হয়েছেন {joinDate}</span>
                  </span>
                )}

                {/* Social links */}
                <div className="flex items-center gap-3 pt-1 sm:pt-0">
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#800020] transition"
                      title="ওয়েবসাইট"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                  {p.twitter_url && (
                    <a
                      href={p.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#1da1f2] transition"
                      title="Twitter / X"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  {p.facebook_url && (
                    <a
                      href={p.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#1877f2] transition"
                      title="Facebook"
                    >
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {p.instagram_url && (
                    <a
                      href={p.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#e4405f] transition"
                      title="Instagram"
                    >
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {p.linkedin_url && (
                    <a
                      href={p.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-[#0a66c2] transition"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {p.github_url && (
                    <a
                      href={p.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-900 transition"
                      title="GitHub"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Metric Stats Strip */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mt-6 pt-6 border-t border-[#f0ece5]">
            <div className="text-center p-3 sm:p-4 rounded-sm bg-[#fcfbfa] border border-[#eee8df]">
              <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs font-bengali mb-1">
                <BookOpen className="w-3.5 h-3.5 text-[#800020]" />
                <span>প্রকাশিত লেখা</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-bengali text-[#1e2022]">
                {author.articles_count || 0}
              </div>
            </div>

            <div className="text-center p-3 sm:p-4 rounded-sm bg-[#fcfbfa] border border-[#eee8df]">
              <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs font-bengali mb-1">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>মোট পঠিত</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-bengali text-[#1e2022]">
                {author.total_views || 0}
              </div>
            </div>

            <div className="text-center p-3 sm:p-4 rounded-sm bg-[#fcfbfa] border border-[#eee8df]">
              <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs font-bengali mb-1">
                <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                <span>পাঠক ভালোবাসা</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-bengali text-[#1e2022]">
                {author.total_hearts || 0}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Author's Articles Section */}
        <div className="mt-12 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#800020] pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-bengali text-[#1e2022]">
                {displayName}-এর লেখালেখি
              </h2>
              <p className="text-xs text-gray-500 font-bengali mt-0.5">
                সর্বমোট {author.articles_count || 0}টি প্রকাশিত প্রবন্ধ, গল্প ও ফিচার
              </p>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="লেখার শিরোনাম খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs font-bengali border border-[#ded7cc] rounded-sm bg-white focus:outline-none focus:border-[#800020] w-48 sm:w-56"
                />
              </div>

              <div className="flex rounded-sm border border-[#ded7cc] bg-white p-0.5 text-xs font-bengali">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1 rounded-xs transition ${
                    activeTab === 'all'
                      ? 'bg-[#800020] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  সকল লেখা
                </button>
                <button
                  onClick={() => setActiveTab('popular')}
                  className={`px-3 py-1 rounded-xs transition ${
                    activeTab === 'popular'
                      ? 'bg-[#800020] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  সর্বাধিক পঠিত
                </button>
                <button
                  onClick={() => setActiveTab('hearted')}
                  className={`px-3 py-1 rounded-xs transition ${
                    activeTab === 'hearted'
                      ? 'bg-[#800020] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  পাঠক প্রিয়
                </button>
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          {articlesLoading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-[#800020] animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-bengali">লেখা লোড হচ্ছে...</p>
            </div>
          ) : articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((art) => {
                const title = (lang === 'en' ? art.title_en : art.title) || art.title;
                const excerpt = (lang === 'en' ? art.excerpt_en : art.excerpt) || art.excerpt;
                const pubDate = new Date(art.published_at).toLocaleDateString(
                  lang === 'en' ? 'en-US' : 'bn-BD',
                  { year: 'numeric', month: 'short', day: 'numeric' }
                );
                const category = art.categories?.[0];

                return (
                  <article
                    key={art.id}
                    className="magazine-card group flex flex-col bg-white border border-[#ded7cc] rounded-sm overflow-hidden hover:shadow-md transition"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                      <Link to={`/post/${art.slug}`}>
                        <img
                          src={art.image}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      {category && (
                        <Link
                          to={`/category/${category.slug}`}
                          className="absolute top-3 left-3 px-2 py-0.5 bg-[#800020] text-white text-[10px] font-bengali font-semibold uppercase tracking-wider rounded-xs shadow-sm hover:bg-[#600018] transition"
                        >
                          {category.name}
                        </Link>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-sans mb-2">
                        <span className="flex items-center gap-1 font-bengali">
                          <Calendar className="w-3 h-3" />
                          <span>{pubDate}</span>
                        </span>
                        <span className="flex items-center gap-1 font-bengali">
                          <Clock className="w-3 h-3" />
                          <span>{art.reading_time || '৪ মিনিট পাঠ'}</span>
                        </span>
                      </div>

                      <h3 className="font-bengali font-bold text-base text-[#1e2022] group-hover:text-[#800020] transition line-clamp-2 leading-snug mb-2">
                        <Link to={`/post/${art.slug}`}>{title}</Link>
                      </h3>

                      {excerpt && (
                        <p className="text-xs text-gray-600 font-bengali line-clamp-2 leading-relaxed mb-4 flex-1">
                          {excerpt}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-[#f0ece5] text-xs text-gray-400 mt-auto">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          <span>{art.view_count || 0}</span>
                        </span>

                        <div className="flex items-center gap-3">
                          <HeartButton
                            slug={art.slug}
                            initialHearted={art.is_hearted}
                            initialCount={art.hearts_count}
                            size="sm"
                          />
                          <Link
                            to={`/post/${art.slug}`}
                            className="text-[#800020] font-bengali text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                          >
                            <span>পড়ুন</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-[#ded7cc] rounded-sm p-12 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="font-bengali font-bold text-base text-gray-700">কোনো লেখা পাওয়া যায়নি</h3>
              <p className="text-xs text-gray-500 font-bengali max-w-sm mx-auto">
                {searchQuery
                  ? `"${searchQuery}" অনুসন্ধানে কোনো লেখা মেলেনি। অন্য শব্দ দিয়ে খুঁজুন।`
                  : 'এই লেখক এখনো কোনো আর্টিকেল প্রকাশ করেননি।'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Customization Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-[#ded7cc] rounded-sm shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col my-8">
            <div className="flex items-center justify-between p-5 border-b border-[#eee8df] bg-[#fcfbfa]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#800020]" />
                <h3 className="font-bengali font-bold text-lg text-gray-800">
                  লেখক প্রোফাইল কাস্টমাইজেশন
                </h3>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Image Previews & Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                    প্রোফাইল ছবি (Avatar)
                  </label>
                  <ImageUpload
                    value={editForm.avatar || ''}
                    onChange={(url) => setEditForm((prev) => ({ ...prev, avatar: url }))}
                    label="লেখক ছবি আপলোড"
                    aspectRatio="square"
                    className="mb-2"
                  />
                  <input
                    type="text"
                    value={editForm.avatar || ''}
                    onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                    placeholder="অথবা ইমেজের সরাসরি URL লিখুন"
                    className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                    কভার ব্যানার ছবি (Cover Banner)
                  </label>
                  <ImageUpload
                    value={editForm.cover_image || ''}
                    onChange={(url) => setEditForm((prev) => ({ ...prev, cover_image: url }))}
                    label="কভার ব্যানার আপলোড"
                    aspectRatio="banner"
                    className="mb-2"
                  />
                  <input
                    type="text"
                    value={editForm.cover_image || ''}
                    onChange={(e) => setEditForm({ ...editForm, cover_image: e.target.value })}
                    placeholder="অথবা কভার ছবির সরাসরি URL লিখুন"
                    className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                    লেখক প্রদর্শিত নাম (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={editForm.display_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                    placeholder="যেমন: আহমেদ রশীদ"
                    className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020] font-bengali"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                    লেখক প্রদর্শিত নাম (English)
                  </label>
                  <input
                    type="text"
                    value={editForm.display_name_en || ''}
                    onChange={(e) => setEditForm({ ...editForm, display_name_en: e.target.value })}
                    placeholder="e.g. Ahmed Rashid"
                    className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                    পদবি / উপাধি (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={editForm.designation || ''}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    placeholder="যেমন: সাহিত্য ও শিল্প সম্পাদক"
                    className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020] font-bengali"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                    পদবি / উপাধি (English)
                  </label>
                  <input
                    type="text"
                    value={editForm.designation_en || ''}
                    onChange={(e) => setEditForm({ ...editForm, designation_en: e.target.value })}
                    placeholder="e.g. Literature & Arts Columnist"
                    className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                    সংক্ষিপ্ত বায়ো (বাংলা)
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.bio || ''}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="আপনার সাহিত্যচর্চা, আগ্রহ ও অভিজ্ঞতা সম্পর্কে লিখুন..."
                    className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020] font-bengali"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                    সংক্ষিপ্ত বায়ো (English)
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.bio_en || ''}
                    onChange={(e) => setEditForm({ ...editForm, bio_en: e.target.value })}
                    placeholder="Write a brief overview of your writing career..."
                    className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                    অবস্থান / শহর (বাংলা)
                  </label>
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    placeholder="যেমন: ঢাকা, বাংলাদেশ"
                    className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020] font-bengali"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-bengali text-gray-700 mb-1">
                    অবস্থান / শহর (English)
                  </label>
                  <input
                    type="text"
                    value={editForm.location_en || ''}
                    onChange={(e) => setEditForm({ ...editForm, location_en: e.target.value })}
                    placeholder="e.g. Dhaka, Bangladesh"
                    className="w-full text-xs p-2 border border-[#ded7cc] rounded-sm focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-xs font-bold font-bengali text-gray-700 mb-2">
                  সামাজিক যোগাযোগ ও ওয়েবসাইটের লিঙ্ক
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-2.5 py-1.5">
                    <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="url"
                      value={editForm.website || ''}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="ওয়েবসাইট URL"
                      className="w-full focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-2.5 py-1.5">
                    <Twitter className="w-4 h-4 text-[#1da1f2] flex-shrink-0" />
                    <input
                      type="url"
                      value={editForm.twitter_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, twitter_url: e.target.value })}
                      placeholder="Twitter / X প্রোফাইল লিঙ্ক"
                      className="w-full focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-2.5 py-1.5">
                    <Facebook className="w-4 h-4 text-[#1877f2] flex-shrink-0" />
                    <input
                      type="url"
                      value={editForm.facebook_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, facebook_url: e.target.value })}
                      placeholder="Facebook প্রোফাইল লিঙ্ক"
                      className="w-full focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-2.5 py-1.5">
                    <Instagram className="w-4 h-4 text-[#e4405f] flex-shrink-0" />
                    <input
                      type="url"
                      value={editForm.instagram_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, instagram_url: e.target.value })}
                      placeholder="Instagram প্রোফাইল লিঙ্ক"
                      className="w-full focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-2.5 py-1.5">
                    <Linkedin className="w-4 h-4 text-[#0a66c2] flex-shrink-0" />
                    <input
                      type="url"
                      value={editForm.linkedin_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                      placeholder="LinkedIn প্রোফাইল লিঙ্ক"
                      className="w-full focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 border border-[#ded7cc] rounded-sm px-2.5 py-1.5">
                    <Github className="w-4 h-4 text-gray-700 flex-shrink-0" />
                    <input
                      type="url"
                      value={editForm.github_url || ''}
                      onChange={(e) => setEditForm({ ...editForm, github_url: e.target.value })}
                      placeholder="GitHub প্রোফাইল লিঙ্ক"
                      className="w-full focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#eee8df]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-[#ded7cc] text-gray-700 text-xs font-bengali rounded-sm hover:bg-gray-50 transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#800020] text-white text-xs font-bengali font-semibold rounded-sm hover:bg-[#600018] disabled:opacity-50 transition"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
