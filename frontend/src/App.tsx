import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { TopBar } from './components/layout/TopBar';
import { Header } from './components/layout/Header';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { SearchModal } from './components/ui/SearchModal';
import { AuthModal } from './components/ui/AuthModal';
import { HomePage } from './pages/HomePage';
import { PostDetailPage } from './pages/PostDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { DashboardPage } from './pages/DashboardPage';
import { api } from './services/api';
import { Category, SiteSetting, Article } from './types';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { NetworkStatusBanner } from './components/ui/NetworkStatusBanner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Scroll restoration component
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent: React.FC = () => {
  const [settings, setSettings] = useState<SiteSetting | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        const [settingsData, categoriesData, articlesData] = await Promise.all([
          api.getSettings(),
          api.getCategories(),
          api.getArticles()
        ]);
        setSettings(settingsData);
        setCategories(categoriesData);
        setRecentArticles(articlesData.results || []);
      } catch (err) {
        console.error('App init error:', err);
      }
    };
    initApp();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbfa]">
      <NetworkStatusBanner />
      <ScrollToTop />

      {/* 1. Top Bar with Language Switcher & User Account */}
      <TopBar
        settings={settings}
        onOpenSearch={() => setSearchOpen(true)}
        onToggleMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* 2. Brand Header with Dual Logo Flipper */}
      <Header settings={settings} />

      {/* 3. Primary Sticky Navigation with Write Blog trigger */}
      <Navbar categories={categories} />

      {/* 4. Main Page View with Error Boundary Isolation */}
      <main className="flex-1">
        <ErrorBoundary
          fallbackTitle="পৃষ্ঠাটি প্রদর্শন করা সম্ভব হচ্ছে না"
          fallbackMessage="এই পৃষ্ঠাটিতে কিছু সমস্যা দেখা দিয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন অথবা প্রচ্ছদে ফিরে যান।"
        >
          <Routes>
            <Route path="/" element={<HomePage categories={categories} />} />
            <Route path="/post/:slug" element={<PostDetailPage />} />
            <Route path="/category/:slug" element={<CategoryPage categories={categories} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* 5. Footer */}
      <Footer
        settings={settings}
        categories={categories}
        recentArticles={recentArticles}
      />

      {/* 6. Modals & Overlays */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        categories={categories}
        settings={settings}
      />

      <AuthModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary
      fallbackTitle="ম্যাড স্টোরি লোড করতে সমস্যা হয়েছে"
      fallbackMessage="অ্যাপ্লিকেশনে ত্রুটি ঘটেছে। অনুগ্রহ করে পৃষ্ঠাটি রিফ্রেশ করুন।"
    >
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
