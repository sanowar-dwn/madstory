import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../context/ToastContext';

export const NetworkStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showRestored, setShowRestored] = useState<boolean>(false);
  const { lang } = useLanguage();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      toast.success(
        lang === 'en'
          ? 'Internet connection restored! Back online.'
          : 'ইন্টারনেট সংযোগ পুনরুদ্ধার হয়েছে! আপনি আবার অনলাইনে আছেন।',
        { title: lang === 'en' ? 'Online' : 'অনলাইন' }
      );
      const timer = setTimeout(() => {
        setShowRestored(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
      toast.error(
        lang === 'en'
          ? 'You are currently offline. Check your internet connection.'
          : 'আপনার ইন্টারনেট সংযোগ বিচ্ছিন্ন রয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করুন।',
        {
          title: lang === 'en' ? 'Offline' : 'সংযোগ বিচ্ছিন্ন',
          duration: 0, // sticky until restored
          id: 'offline-alert',
        }
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [lang]);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[10000] bg-rose-600 text-white py-2 px-4 shadow-lg text-center font-bengali text-xs font-semibold flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4 animate-pulse flex-shrink-0" />
          <span>
            {lang === 'en'
              ? 'Warning: You are currently offline. Changes may not be saved to server.'
              : 'সতর্কতা: আপনার ইন্টারনেট সংযোগ বিচ্ছিন্ন। কোনো পরিবর্তন বা সংরক্ষণ কাজ নাও করতে পারে।'}
          </span>
        </motion.div>
      )}

      {showRestored && isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[10000] bg-emerald-600 text-white py-2 px-4 shadow-lg text-center font-bengali text-xs font-semibold flex items-center justify-center gap-2"
        >
          <Wifi className="w-4 h-4 flex-shrink-0" />
          <span>
            {lang === 'en'
              ? 'Connection restored. You are back online!'
              : 'সংযোগ পুনরুদ্ধার হয়েছে। আপনি অনলাইনে আছেন!'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
