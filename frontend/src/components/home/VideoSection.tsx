import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Film, Youtube, Clock, Sparkles, FolderTree, ArrowRight } from 'lucide-react';
import { Video } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface VideoSectionProps {
  videos: Video[];
  title?: string;
  subtitle?: string;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  videos,
  title,
  subtitle,
}) => {
  const { lang, t } = useLanguage();
  const theaterRef = useRef<HTMLDivElement>(null);

  // Find initial featured video or fall back to first video
  const featured = videos.find((v) => v.is_featured) || videos[0];
  const [activeVideo, setActiveVideo] = useState<Video | null>(featured || null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');

  // Group videos by category
  const categorizedGroups = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; name_en: string; videos: Video[] }>();

    videos.forEach((vid) => {
      const slug = vid.category_slug || 'uncategorized';
      const name = vid.category_name || (lang === 'en' ? 'Featured Stories' : 'বিশেষ ভিডিও সংকলন');
      const name_en = vid.category_name_en || 'Featured Stories';

      if (!map.has(slug)) {
        map.set(slug, { slug, name, name_en, videos: [] });
      }
      map.get(slug)!.videos.push(vid);
    });

    return Array.from(map.values());
  }, [videos, lang]);

  const visibleGroups = useMemo(() => {
    if (selectedCategorySlug === 'all') return categorizedGroups;
    return categorizedGroups.filter((g) => g.slug === selectedCategorySlug);
  }, [categorizedGroups, selectedCategorySlug]);

  if (!videos || videos.length === 0 || !activeVideo) {
    return null;
  }

  const sectionTitle = title || (lang === 'en' ? 'Video Stories' : 'ভিডিও স্টোরি');
  const sectionSubtitle = subtitle || (lang === 'en' ? 'Interviews, visual essays & cultural documentaries' : 'বিশেষ সাক্ষাৎকার, ভিজ্যুয়াল স্টোরি ও তথ্যচিত্র');

  const getDisplayTitle = (v: Video) => (lang === 'en' && v.title_en ? v.title_en : v.title);
  const getDisplayDesc = (v: Video) => (lang === 'en' && v.description_en ? v.description_en : v.description);

  const activeTitle = getDisplayTitle(activeVideo);
  const activeDesc = getDisplayDesc(activeVideo);

  // Derive video source
  const isYoutube = activeVideo.video_type === 'youtube';
  const youtubeEmbedUrl = activeVideo.embed_url || (activeVideo.youtube_id ? `https://www.youtube.com/embed/${activeVideo.youtube_id}?rel=0&modestbranding=1` : activeVideo.youtube_url);
  const directVideoSrc = activeVideo.effective_video_url || activeVideo.video_url || activeVideo.video_file || '';
  const activePoster = activeVideo.effective_thumbnail || activeVideo.thumbnail || '';

  const handleSelectVideo = (vid: Video) => {
    setActiveVideo(vid);
    if (theaterRef.current) {
      theaterRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <section className="my-12 space-y-10">
      {/* 1. Main Spotlight Theater Stage Box */}
      <div
        ref={theaterRef}
        className="bg-[#121417] text-white rounded-lg p-5 sm:p-7 lg:p-8 shadow-xl border border-gray-800"
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-gray-800 pb-5 mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#800020] text-rose-100 uppercase tracking-wider">
                <Film className="w-3 h-3" />
                {lang === 'en' ? 'Mad Story Studio' : 'ম্যাড স্টোরি স্টুডিও'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            </div>
            <h2 className="font-bengali font-bold text-2xl sm:text-3xl text-white tracking-wide">
              {sectionTitle}
            </h2>
            {sectionSubtitle && (
              <p className="text-xs sm:text-sm text-gray-400 font-bengali mt-1 max-w-xl">
                {sectionSubtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="px-2.5 py-1 bg-white/10 rounded-md text-gray-300 font-sans">
              {videos.length} {lang === 'en' ? 'Videos' : 'টি ভিডিও'}
            </span>
          </div>
        </div>

        {/* Theater Player & Playlist Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Stage Video Player (8 cols on lg) */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-gray-800">
              {isYoutube ? (
                <iframe
                  key={activeVideo.id}
                  src={youtubeEmbedUrl}
                  title={activeTitle}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : directVideoSrc ? (
                <video
                  key={activeVideo.id}
                  src={directVideoSrc}
                  poster={activePoster}
                  controls
                  playsInline
                  className="w-full h-full object-contain bg-black"
                >
                  <source src={directVideoSrc} type="video/mp4" />
                  Your browser does not support HTML5 video playback.
                </video>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <Film className="w-12 h-12 mb-3 text-gray-600" />
                  <p className="text-sm font-bengali">ভিডিও লোড করা যাচ্ছে না</p>
                </div>
              )}
            </div>

            {/* Video Details Info Bar */}
            <div className="space-y-2 bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center flex-wrap gap-2 text-xs">
                {isYoutube ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600/90 text-white font-semibold text-[11px]">
                    <Youtube className="w-3.5 h-3.5" />
                    YouTube
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#800020] text-white font-semibold text-[11px]">
                    <Film className="w-3.5 h-3.5" />
                    {lang === 'en' ? 'Direct Video' : 'সরাসরি ভিডিও'}
                  </span>
                )}

                {(activeVideo.category_name || activeVideo.category_name_en) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/15 text-rose-200 font-semibold text-[11px]">
                    <FolderTree className="w-3 h-3 text-rose-300" />
                    {lang === 'en' && activeVideo.category_name_en ? activeVideo.category_name_en : activeVideo.category_name}
                  </span>
                )}

                {activeVideo.duration && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-gray-300 font-sans text-[11px]">
                    <Clock className="w-3 h-3 text-gray-400" />
                    {activeVideo.duration}
                  </span>
                )}

                {activeVideo.is_featured && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold text-[11px]">
                    <Sparkles className="w-3 h-3" />
                    {lang === 'en' ? 'Featured Spotlight' : 'নির্বাচিত ভিডিও'}
                  </span>
                )}
              </div>

              <h3 className="font-bengali font-bold text-lg sm:text-xl text-white leading-snug">
                {activeTitle}
              </h3>

              {activeDesc && (
                <p className="text-xs sm:text-sm text-gray-300 font-bengali leading-relaxed pt-1 border-t border-white/5">
                  {activeDesc}
                </p>
              )}
            </div>
          </div>

          {/* Interactive Playlist Sidebar (4 cols on lg) */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between pb-1 px-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {lang === 'en' ? 'Playlist & Stories' : 'ভিডিও প্লেলিস্ট'}
              </span>
              <span className="text-[11px] text-gray-500 font-sans">
                {videos.findIndex((v) => v.id === activeVideo.id) + 1} / {videos.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
              {videos.map((vid) => {
                const isCurrent = vid.id === activeVideo.id;
                const vTitle = getDisplayTitle(vid);
                const thumb = vid.effective_thumbnail || vid.thumbnail || (vid.youtube_id ? `https://img.youtube.com/vi/${vid.youtube_id}/hqdefault.jpg` : '');

                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => setActiveVideo(vid)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all flex items-start gap-3 group border cursor-pointer ${
                      isCurrent
                        ? 'bg-[#800020]/30 border-[#800020] text-white shadow-md'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-gray-300'
                    }`}
                  >
                    {/* Thumbnail box with play overlay */}
                    <div className="relative w-24 sm:w-28 aspect-video rounded overflow-hidden shrink-0 bg-black/60 border border-white/10">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={vTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-600">
                          <Film className="w-5 h-5" />
                        </div>
                      )}

                      {/* Play badge overlay */}
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                          isCurrent ? 'bg-black/40 opacity-100' : 'bg-black/30 opacity-70 group-hover:opacity-100'
                        }`}
                      >
                        {isCurrent ? (
                          <span className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center shadow">
                            <Play className="w-3 h-3 fill-white ml-0.5" />
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center group-hover:bg-[#800020] transition">
                            <Play className="w-3 h-3 fill-white ml-0.5" />
                          </span>
                        )}
                      </div>

                      {/* Duration pill */}
                      {vid.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-gray-200 px-1 py-0.2 rounded font-mono font-medium">
                          {vid.duration}
                        </span>
                      )}
                    </div>

                    {/* Content metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-300 font-semibold font-bengali">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                            {lang === 'en' ? 'Playing' : 'চলছে'}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-sans">
                          {vid.video_type === 'youtube' ? 'YouTube' : 'Direct'}
                        </span>
                        {(vid.category_name || vid.category_name_en) && (
                          <span className="text-[10px] text-rose-300/80 truncate max-w-[80px]">
                            • {lang === 'en' && vid.category_name_en ? vid.category_name_en : vid.category_name}
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xs sm:text-sm font-bengali font-semibold line-clamp-2 leading-snug transition ${
                          isCurrent ? 'text-white' : 'text-gray-200 group-hover:text-white'
                        }`}
                      >
                        {vTitle}
                      </h4>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Categorized Sections for Videos */}
      {categorizedGroups.length > 0 && (
        <div className="space-y-8 pt-4">
          {/* Categorized Sections Header & Category Quick-Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#800020] pb-3 gap-3">
            <div>
              <h3 className="font-bengali font-bold text-xl sm:text-2xl text-[#1e2022] tracking-wide flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-[#800020]" />
                <span>{lang === 'en' ? 'Categorized Video Stories' : 'ক্যাটাগরিভিত্তিক ভিডিও সংকলন'}</span>
              </h3>
              <p className="text-xs text-gray-500 font-bengali mt-0.5">
                {lang === 'en'
                  ? 'Explore curated visual documentaries, interviews & essays by category'
                  : 'শিল্প, সংস্কৃতি, সাহিত্য ও জীবনধারার বিভিন্ন বিষয়ে ভিডিও প্রতিবেদন অন্বেষণ করুন'}
              </p>
            </div>

            {/* Category Filter Pills */}
            {categorizedGroups.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedCategorySlug('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                    selectedCategorySlug === 'all'
                      ? 'bg-[#800020] text-white shadow-2xs'
                      : 'bg-[#f4eee6] text-gray-700 hover:bg-[#e8e0d4]'
                  }`}
                >
                  {lang === 'en' ? 'All' : 'সকল'} ({videos.length})
                </button>
                {categorizedGroups.map((group) => {
                  const groupTitle = lang === 'en' && group.name_en ? group.name_en : group.name;
                  return (
                    <button
                      key={group.slug}
                      type="button"
                      onClick={() => setSelectedCategorySlug(group.slug)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                        selectedCategorySlug === group.slug
                          ? 'bg-[#800020] text-white shadow-2xs'
                          : 'bg-[#f4eee6] text-gray-700 hover:bg-[#e8e0d4]'
                      }`}
                    >
                      {groupTitle} ({group.videos.length})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Categorized Video Blocks */}
          <div className="space-y-10">
            {visibleGroups.map((group) => {
              const groupTitle = lang === 'en' && group.name_en ? group.name_en : group.name;

              return (
                <div key={group.slug} className="space-y-4">
                  {/* Category Block Header */}
                  <div className="flex items-center justify-between border-b border-[#ded7cc] pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
                      <h4 className="font-bengali font-bold text-lg text-[#1e2022] tracking-wide">
                        {groupTitle}
                      </h4>
                      <span className="text-xs text-gray-500 font-sans">
                        ({group.videos.length} {lang === 'en' ? 'videos' : 'টি ভিডিও'})
                      </span>
                    </div>

                    {group.slug !== 'uncategorized' && (
                      <Link
                        to={`/category/${group.slug}`}
                        className="badge-sob"
                      >
                        {t('nav.all')} →
                      </Link>
                    )}
                  </div>

                  {/* Video Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.videos.map((vid) => {
                      const isCurrent = vid.id === activeVideo.id;
                      const vTitle = getDisplayTitle(vid);
                      const vDesc = getDisplayDesc(vid);
                      const thumb = vid.effective_thumbnail || vid.thumbnail || (vid.youtube_id ? `https://img.youtube.com/vi/${vid.youtube_id}/hqdefault.jpg` : '');

                      return (
                        <div
                          key={vid.id}
                          className={`magazine-card group flex flex-col transition-all cursor-pointer ${
                            isCurrent ? 'ring-2 ring-[#800020] shadow-md' : ''
                          }`}
                          onClick={() => handleSelectVideo(vid)}
                        >
                          {/* Video Thumbnail Box */}
                          <div className="relative aspect-video w-full overflow-hidden img-zoom-wrapper border-b border-[#e2ddd3] bg-black/90">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={vTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <Film className="w-8 h-8" />
                              </div>
                            )}

                            {/* Play Icon Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/40 transition">
                              <span className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                                isCurrent ? 'bg-[#800020] text-white' : 'bg-black/75 text-white group-hover:bg-[#800020]'
                              }`}>
                                <Play className="w-5 h-5 fill-white ml-0.5" />
                              </span>
                            </div>

                            {/* Category pill */}
                            <span className="absolute top-2.5 left-2.5 bg-[#800020]/90 text-white text-[10px] font-bengali font-semibold px-2 py-0.5 rounded shadow">
                              {groupTitle}
                            </span>

                            {/* Now Playing indicator or Duration */}
                            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                              {isCurrent && (
                                <span className="bg-rose-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow flex items-center gap-1 font-bengali">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                  {lang === 'en' ? 'Now Playing' : 'চলছে'}
                                </span>
                              )}
                              {vid.duration && (
                                <span className="bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow">
                                  {vid.duration}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Card Content Body */}
                          <div className="p-4 flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              {vid.video_type === 'youtube' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 font-sans">
                                  <Youtube className="w-3 h-3" />
                                  YouTube
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#800020] font-sans">
                                  <Film className="w-3 h-3" />
                                  Direct Video
                                </span>
                              )}

                              {vid.is_featured && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 font-sans">
                                  <Sparkles className="w-3 h-3" />
                                  Spotlight
                                </span>
                              )}
                            </div>

                            <h4 className="font-bengali font-bold text-sm sm:text-base text-[#1e2022] group-hover:text-[#800020] transition line-clamp-2 leading-snug mb-2 flex-1">
                              {vTitle}
                            </h4>

                            {vDesc && (
                              <p className="text-xs text-gray-500 font-bengali line-clamp-2 leading-relaxed mb-3">
                                {vDesc}
                              </p>
                            )}

                            <div className="dotted-divider mt-auto" />

                            <div className="flex items-center justify-between text-[11px] text-gray-400 font-sans pt-2">
                              <span className="font-bengali text-[#800020] font-semibold group-hover:underline flex items-center gap-1">
                                <Play className="w-3 h-3 fill-current" />
                                {lang === 'en' ? 'Watch Story' : 'ভিডিও দেখুন'}
                              </span>
                              <span className="font-mono text-gray-400">{vid.duration || 'HD'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
