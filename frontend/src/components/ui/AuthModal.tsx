import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { parseApiError } from '../../utils/errorHandler';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register } = useAuth();
  const { lang, t } = useLanguage();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authModalMode === 'login') {
        await login(username, password);
      } else {
        await register({
          username,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
        });
      }
    } catch (err: any) {
      const parsed = parseApiError(err, lang);
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-white rounded-md shadow-2xl border border-[#ded7cc] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 bg-[#fbf9f6] border-b border-[#e2ddd3]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
            <h3 className="font-bengali font-bold text-base text-[#1e2022]">
              {authModalMode === 'login' ? 'ম্যাড স্টোরিতে প্রবেশ করুন' : 'নতুন লেখক / পাঠক অ্যাকাউন্ট তৈরি'}
            </h3>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 text-gray-400 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#e2ddd3] text-xs font-bengali font-semibold bg-[#faf7f2]">
          <button
            onClick={() => { openAuthModal('login'); setError(''); }}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              authModalMode === 'login'
                ? 'border-[#800020] text-[#800020] bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            লগইন (Login)
          </button>
          <button
            onClick={() => { openAuthModal('signup'); setError(''); }}
            className={`flex-1 py-3 text-center transition border-b-2 ${
              authModalMode === 'signup'
                ? 'border-[#800020] text-[#800020] bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            রেজিস্ট্রেশন (Sign Up)
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-800 rounded text-xs font-bengali">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-bengali text-xs">
            {authModalMode === 'signup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">নামের প্রথম অংশ</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">পদবি</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                ব্যবহারকারী নাম (Username) <span className="text-[#800020]">*</span>
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full pl-9 pr-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                />
              </div>
            </div>

            {authModalMode === 'signup' && (
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  ইমেইল ঠিকানা <span className="text-[#800020]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-9 pr-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-semibold mb-1">
                পাসওয়ার্ড <span className="text-[#800020]">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#800020] hover:bg-[#9b1b30] text-white font-semibold rounded transition flex items-center justify-center gap-2 shadow-sm text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>প্রক্রিয়াকরণ হচ্ছে...</span>
                </>
              ) : authModalMode === 'login' ? (
                'লগইন করুন'
              ) : (
                'অ্যাকাউন্ট তৈরি করুন'
              )}
            </button>
          </form>

          {/* Helper demo credentials */}
          <div className="mt-5 pt-3 border-t border-[#ded7cc] text-[11px] text-gray-500 font-sans text-center">
            <span className="font-semibold block mb-0.5 text-gray-700 font-bengali">ডেমো অ্যাকাউন্ট:</span>
            <span>Admin: <code>admin</code> / <code>adminpassword123</code></span>
            <br />
            <span>Writer: <code>sarah_writer</code> / <code>writer123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};
