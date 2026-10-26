import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Feather, Compass, Heart } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const AboutPage: React.FC = () => {
  const { lang, t } = useLanguage();

  useEffect(() => {
    document.title = lang === 'en' ? 'About Us — The Mad Story' : 'আমাদের কথা — দ্য ম্যাড স্টোরি';
    return () => {
      document.title = 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা';
    };
  }, [lang]);

  return (
    <div className="py-10">
      <div className="madstory-container max-w-4xl mx-auto px-4">
        {/* Header Banner */}
        <div className="text-center mb-12">
          <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-[#800020] block mb-2">
            Editorial Mission & Philosophy
          </span>
          <h1 className="text-3xl sm:text-4xl font-bengali font-bold text-[#1e2022] mb-4">
            {lang === 'en' ? 'About The Mad Story: Our Story' : 'আমাদের কথা: দ্য ম্যাড স্টোরি'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-bengali max-w-2xl mx-auto leading-relaxed">
            {lang === 'en'
              ? 'A curated journey celebrating open inquiry, literature, fine arts, architecture, and contemporary cultural narratives.'
              : 'একটি মুক্তচিন্তার সাহিত্য, শিল্প, ডিজাইন ও সংস্কৃতির যৌথ নান্দনিক যাত্রা।'}
          </p>
        </div>

        {/* Feature Visual */}
        <div className="relative rounded overflow-hidden shadow-md mb-10 border border-[#ded7cc]">
          <img
            src="/assets/images/Client-Relation-1024x576.jpg"
            alt="The Mad Story Studio"
            className="w-full h-72 sm:h-96 object-cover"
          />
        </div>

        {/* Manifesto Content */}
        <div className="space-y-6 font-bengali text-gray-700 text-base leading-relaxed">
          <p>
            {lang === 'en' ? (
              <>
                <strong>The Mad Story</strong> is more than an editorial publication; it is an aesthetic movement. Stepping beyond conventional paradigms, we seek that elusive grace born at the crossroads of fine art, avant-garde design, introspective literature, and modern living.
              </>
            ) : (
              <>
                <strong>দ্য ম্যাড স্টোরি (The Mad Story)</strong> কেবল একটি প্রকাশনা মাধ্যম নয়; এটি একটি নান্দনিক আন্দোলন। প্রচলিত গৎবাঁধা চিন্তার বাইরে গিয়ে শিল্প, সাহিত্য, সংস্কৃতি এবং সমকালীন জীবনযাত্রার সংযোগস্থলে যে অদ্ভুত মাধুর্য জন্ম নেয়—আমরা তারই অনুসন্ধানী।
              </>
            )}
          </p>

          <blockquote className="border-l-4 border-[#800020] bg-[#f7f2eb] p-5 my-8 rounded-r font-serif text-lg text-gray-800 italic">
            {lang === 'en'
              ? '"Great art is impossible without a quiet madness and unwavering devotion. Behind every profound creation lies a solitary journey of deep wonder."'
              : '"পাগলামি বা একনিষ্ঠ উন্মাদনা ছাড়া মহৎ শিল্পের সৃষ্টি সম্ভব নয়। প্রতিটি সৃষ্টিশীল ভাবনার পেছনে থাকে এক নিভৃত ও গভীর অভিযাত্রা।"'}
          </blockquote>

          <h2 className="text-2xl font-bengali font-bold text-[#1e2022] pt-4">
            {lang === 'en' ? 'Our Philosophy & Pillars' : 'আমাদের দর্শন ও অঙ্গীকার'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 font-sans">
            <div className="p-5 bg-white border border-[#e2ddd3] rounded shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[#800020]">
                <Feather className="w-5 h-5" />
                <h3 className="font-bengali font-bold text-base text-[#1e2022]">
                  {lang === 'en' ? 'Literature & Free Expression' : 'সাহিত্য ও মুক্ত প্রকাশ'}
                </h3>
              </div>
              <p className="font-bengali text-xs text-gray-600 leading-relaxed">
                {lang === 'en'
                  ? 'A sanctuary for original poetry, short stories, and reflective essays by both emerging voices and seasoned literary authors.'
                  : 'নতুন ও প্রবীণ সাহিত্যিকদের মৌলিক গল্প, কবিতা ও চিন্তাশীল প্রবন্ধের আশ্রয়স্থল। শব্দের কারুকাজে জীবনের গভীর অর্থ উন্মোচন।'}
              </p>
            </div>

            <div className="p-5 bg-white border border-[#e2ddd3] rounded shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[#800020]">
                <Compass className="w-5 h-5" />
                <h3 className="font-bengali font-bold text-base text-[#1e2022]">
                  {lang === 'en' ? 'Art & Architecture' : 'শিল্প ও স্থাপত্য ভাবনা'}
                </h3>
              </div>
              <p className="font-bengali text-xs text-gray-600 leading-relaxed">
                {lang === 'en'
                  ? 'Critical discourse exploring modern interiors, fine arts, sustainable furniture craftsmanship, and urban spatial aesthetics.'
                  : 'চারুকলা, আধুনিক ইন্টেরিয়র, টেকসই আসবাব নকশা এবং নগর স্থাপত্যের সূক্ষ্ম নান্দনিকতা নিয়ে পর্যালোচনা।'}
              </p>
            </div>

            <div className="p-5 bg-white border border-[#e2ddd3] rounded shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[#800020]">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bengali font-bold text-base text-[#1e2022]">
                  {lang === 'en' ? 'Spotlight & Behind the Scenes' : 'স্পটলাইট ও সাক্ষাৎকার'}
                </h3>
              </div>
              <p className="font-bengali text-xs text-gray-600 leading-relaxed">
                {lang === 'en'
                  ? 'Candid conversations, deep studio visits, and creative process retrospectives with visionary directors, designers, and artisans.'
                  : 'নেপথ্যের নির্মাতা, ডিজাইনার, চলচ্চিত্রকার ও উদ্ভাবকদের সঙ্গে খোলামেলা কথোপকথন ও পেছনের গল্প।'}
              </p>
            </div>

            <div className="p-5 bg-white border border-[#e2ddd3] rounded shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-[#800020]">
                <Heart className="w-5 h-5" />
                <h3 className="font-bengali font-bold text-base text-[#1e2022]">
                  {lang === 'en' ? 'Mindful Living' : 'টেকসই জীবনধারা'}
                </h3>
              </div>
              <p className="font-bengali text-xs text-gray-600 leading-relaxed">
                {lang === 'en'
                  ? 'Advocating circular design, eco-conscious materiality, slow fashion, and the mindful curation of everyday surroundings.'
                  : 'পরিবেশবান্ধব চর্চা, সচেতন পোশাক নির্বাচন এবং মিনিমালিস্ট জীবনযাপনের আধুনিক সংজ্ঞায়ন।'}
              </p>
            </div>
          </div>

          <p>
            {lang === 'en'
              ? 'We welcome submissions, critical dialogues, exhibition proposals, and collaborative partnerships.'
              : 'আমাদের এই সৃজনশীল যাত্রায় আপনার যে কোনো প্রতিক্রিয়া, প্রস্তাবনা বা লেখা পাঠাতে নির্দ্বিধায় যোগাযোগ করুন।'}
          </p>

          <div className="pt-6 border-t border-[#ded7cc] text-center">
            <Link
              to="/contact"
              className="inline-block bg-[#800020] hover:bg-[#9b1b30] text-white font-bengali font-semibold px-6 py-2.5 rounded transition shadow-xs text-sm"
            >
              {lang === 'en' ? 'Contact Editorial Desk →' : 'আমাদের সাথে যোগাযোগ করুন →'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
