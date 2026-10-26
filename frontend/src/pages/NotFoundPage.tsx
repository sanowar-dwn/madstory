import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-24 text-center">
      <div className="madstory-container max-w-md mx-auto px-4">
        <span className="text-6xl font-serif font-bold text-[#800020] block mb-2">404</span>
        <h1 className="text-2xl font-bengali font-bold text-[#1e2022] mb-3">
          পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-bengali mb-6 leading-relaxed">
          আপনি যে পাতাটি খুঁজছেন তা স্থানান্তরিত হয়েছে অথবা মুছে ফেলা হয়েছে।
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-bengali font-semibold transition"
          >
            <Home className="w-4 h-4" />
            <span>প্রচ্ছদে ফিরে যান</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-bengali font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>পেছনে যান</span>
          </button>
        </div>
      </div>
    </div>
  );
};
