import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'bn' | 'en';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const translations: Record<string, { bn: string; en: string }> = {
  // Navigation & Branding
  'nav.home': { bn: 'হোম', en: 'Home' },
  'nav.about': { bn: 'আমাদের কথা', en: 'About' },
  'nav.contact': { bn: 'যোগাযোগ', en: 'Contact' },
  'nav.dashboard': { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  'nav.login': { bn: 'লগইন', en: 'Login' },
  'nav.signup': { bn: 'রেজিস্ট্রেশন', en: 'Sign Up' },
  'nav.logout': { bn: 'লগআউট', en: 'Logout' },
  'nav.search': { bn: 'খুঁজুন', en: 'Search' },
  'nav.breaking': { bn: 'চলতি খবর', en: 'Trending' },
  'nav.viewAll': { bn: 'সব দেখুন', en: 'View All' },
  'nav.all': { bn: 'সব', en: 'All' },
  'nav.writeBlog': { bn: 'ব্লগ লিখুন', en: 'Write Blog' },

  // Sections
  'section.trending': { bn: 'চলতি', en: 'Trending' },
  'section.choice': { bn: 'নির্বাচিত', en: 'Editor\'s Choice' },
  'section.artCulture': { bn: 'শিল্প ও সংস্কৃতি', en: 'Art & Culture' },
  'section.stories': { bn: 'সমকালীন গল্প ও ফ্যাশন', en: 'Stories & Fashion' },
  'section.popular': { bn: 'জনপ্রিয় লেখা', en: 'Popular Articles' },
  'section.categories': { bn: 'ক্যাটাগরি', en: 'Categories' },
  'section.featured': { bn: 'বিশেষ ফিচার', en: 'Featured Story' },
  'section.readMore': { bn: 'সম্পূর্ণ পড়ুন →', en: 'Read More →' },
  'section.related': { bn: 'সম্পর্কিত অন্যান্য লেখা', en: 'Related Stories' },

  // Comments & Hearts
  'heart.like': { bn: 'পছন্দ করুন', en: 'Heart' },
  'comment.title': { bn: 'মন্তব্যসমূহ', en: 'Comments' },
  'comment.write': { bn: 'একটি মন্তব্য লিখুন...', en: 'Write a comment...' },
  'comment.reply': { bn: 'উত্তর দিন', en: 'Reply' },
  'comment.replyTo': { bn: 'উত্তর লিখুন...', en: 'Write a reply...' },
  'comment.submit': { bn: 'মন্তব্য পোস্ট করুন', en: 'Post Comment' },
  'comment.delete': { bn: 'মুছে ফেলুন', en: 'Delete' },
  'comment.loginToComment': { bn: 'মন্তব্য করতে অথবা লাইক দিতে অনুগ্রহ করে লগইন করুন।', en: 'Please login to comment or react with hearts.' },

  // Contact Page
  'contact.getInTouch': { bn: 'যোগাযোগ', en: 'Get In Touch' },
  'contact.title': { bn: 'যোগাযোগ ও লেখা পাঠানোর ঠিকানা', en: 'Contact & Editorial Inquiries' },
  'contact.subtitle': { bn: 'আপনার কোনো মন্তব্য, অনুসন্ধিৎসা, বিজ্ঞাপন কিংবা লেখা প্রকাশের বিষয়ে আমাদের সাথে সরাসরি যুক্ত হোন।', en: 'Reach out to us directly for feedback, editorial inquiries, advertising, or manuscript submissions.' },
  'contact.office': { bn: 'সম্পাদকীয় দফতর', en: 'Editorial Office' },
  'contact.dhaka': { bn: 'ঢাকা ব্যুরো:', en: 'Dhaka Bureau:' },
  'contact.dhakaAddress': { bn: 'বাড়ি ১৪, রোড ৭, ধানমন্ডি, ঢাকা ১২০৫, বাংলাদেশ', en: 'House 14, Road 7, Dhanmondi, Dhaka 1205, Bangladesh' },
  'contact.emailInquiries': { bn: 'ইমেইল যোগাযোগ:', en: 'Email Inquiries:' },
  'contact.helpline': { bn: 'হেল্পলাইন:', en: 'Helpline:' },
  'contact.submissionGuide': { bn: 'লেখা পাঠানোর নির্দেশিকা:', en: 'Submission Guidelines:' },
  'contact.submissionText': { bn: 'মৌলিক গল্প, কবিতা ও শিল্পালোচনার ওয়ার্ড বা পিডিএফ ফাইল ইমেইলে পাঠাতে পারেন। আমাদের সম্পাদক পরিষদ দ্রুত আপনার সাথে যোগাযোগ করবে।', en: 'Submit your original stories, poetry, and cultural critiques as DOC or PDF via email. Our editorial board reviews submissions promptly.' },
  'contact.sendMsg': { bn: 'বার্তা পাঠান', en: 'Send a Message' },
  'contact.name': { bn: 'আপনার পূর্ণ নাম', en: 'Full Name' },
  'contact.namePlaceholder': { bn: 'নাম লিখুন...', en: 'Enter your name...' },
  'contact.email': { bn: 'ইমেইল ঠিকানা', en: 'Email Address' },
  'contact.phone': { bn: 'ফোন নম্বর (ঐচ্ছিক)', en: 'Phone Number (Optional)' },
  'contact.subject': { bn: 'বিষয় (Subject)', en: 'Subject' },
  'contact.subjectPlaceholder': { bn: 'বার্তার বিষয়...', en: 'Subject of your inquiry...' },
  'contact.message': { bn: 'আপনার বিস্তারিত বার্তা', en: 'Your Message' },
  'contact.messagePlaceholder': { bn: 'আপনার বার্তা বা প্রশ্ন লিখুন...', en: 'Write your message or inquiry here...' },
  'contact.submitBtn': { bn: 'বার্তা পাঠান', en: 'Send Message' },
  'contact.sending': { bn: 'পাঠানো হচ্ছে...', en: 'Sending...' },
  'contact.success': { bn: 'ধন্যবাদ!', en: 'Thank You!' },
  'contact.sendAnother': { bn: 'নতুন বার্তা পাঠান', en: 'Send Another Message' },
  'contact.requiredFields': { bn: 'অনুগ্রহ করে নাম, ইমেইল এবং বার্তার ঘর পূরণ করুন।', en: 'Please fill in your name, email, and message.' },
  'contact.error': { bn: 'দুঃখিত, কোনো সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।', en: 'Sorry, an error occurred. Please try again.' },

  // Category Page
  'category.archive': { bn: 'ক্যাটাগরি আর্কাইভ', en: 'Category Archive' },
  'category.defaultDesc': { bn: 'শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার বিশেষ রচনা সম্ভার।', en: 'A curated collection of art, literature, culture, and contemporary perspectives.' },
  'category.subcategories': { bn: 'উপ-বিভাগ:', en: 'Sub-categories:' },
  'category.loading': { bn: 'লেখা লোড হচ্ছে...', en: 'Loading stories...' },
  'category.empty': { bn: 'এই ক্যাটাগরিতে এখনো কোনো লেখা নেই', en: 'No stories available in this category yet' },
  'category.emptyDesc': { bn: 'শীঘ্রই নতুন লেখা যুক্ত করা হবে।', en: 'New articles will be published soon.' },
  'category.backHome': { bn: 'প্রচ্ছদে ফিরে যান', en: 'Back to Home' },

  // Footer & Misc
  'footer.aboutText': { bn: 'দ্য ম্যাড স্টোরি — শিল্প, সাহিত্য, সংস্কৃতি ও আধুনিক জীবন ভাবনার স্বাধীন প্ল্যাটফর্ম। চিন্তা ও মননের নান্দনিক মেলবন্ধন।', en: 'The Mad Story — An independent platform for art, literature, culture, and contemporary thought.' },
  'footer.quickLinks': { bn: 'গুরুত্বপূর্ণ লিঙ্ক', en: 'Quick Links' },
  'footer.newsletter': { bn: 'নিউজলেটার', en: 'Newsletter' },
  'footer.newsletterDesc': { bn: 'নিয়মিত সাহিত্য ও সংস্কৃতির সেরা লেখাগুলো ইমেইলে পেতে সাবস্ক্রাইব করুন।', en: 'Subscribe to receive the best literary works and cultural digests directly in your inbox.' },
  'footer.subscribe': { bn: 'সাবস্ক্রাইব', en: 'Subscribe' },
  'footer.allRights': { bn: 'সর্বস্বত্ব সংরক্ষিত।', en: 'All Rights Reserved.' },
  'footer.emailPlaceholder': { bn: 'আপনার ইমেইল ঠিকানা...', en: 'Your email address...' },

  // Dashboard
  'dash.title': { bn: 'ম্যাগাজিন ড্যাশবোর্ড', en: 'Magazine Dashboard' },
  'dash.overview': { bn: 'সারসংক্ষেপ', en: 'Overview' },
  'dash.write': { bn: 'নতুন ব্লগ লিখুন', en: 'Write Blog' },
  'dash.myBlogs': { bn: 'আমার ব্লগসমূহ', en: 'My Articles' },
  'dash.allArticles': { bn: 'সকল প্রবন্ধ', en: 'All Articles' },
  'dash.approval': { bn: 'অনুমোদন সারি', en: 'Approval Queue' },
  'dash.categories': { bn: 'ক্যাটাগরি নিয়ন্ত্রণ', en: 'Categories' },
  'dash.users': { bn: 'ব্যবহারকারী', en: 'Users' },
  'dash.comments': { bn: 'মন্তব্য নিয়ন্ত্রণ', en: 'Comments' },
  'dash.inquiries': { bn: 'বার্তা ইনবক্স', en: 'Inquiries' },
  'dash.subscribers': { bn: 'নিউজলেটার গ্রাহক', en: 'Subscribers' },
  'dash.customization': { bn: 'হোমপেজ কাস্টমাইজেশন', en: 'Homepage Customization' },
  'dash.heroSlider': { bn: 'হিরো ব্যানার স্লাইডার', en: 'Hero Banner Slider' },
  'dash.siteSettings': { bn: 'ওয়েবসাইট সেটিংস', en: 'Site Settings' },
  'dash.approve': { bn: 'অনুমোদন করুন', en: 'Approve' },
  'dash.reject': { bn: 'প্রত্যাখ্যান', en: 'Reject' },
  'dash.pending': { bn: 'অনুমোদনের অপেক্ষায়', en: 'Pending Approval' },
  'dash.published': { bn: 'প্রকাশিত', en: 'Published' },
  'dash.draft': { bn: 'খসড়া', en: 'Draft' },
  'dash.rejected': { bn: 'প্রত্যাখ্যাত', en: 'Rejected' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('madstory_lang') as Language) || 'bn';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('madstory_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'bn' ? 'en' : 'bn');
  };

  const t = (key: string): string => {
    const item = translations[key];
    if (!item) return key;
    return item[lang] || item['bn'] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
