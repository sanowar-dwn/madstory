import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../context/ToastContext';

export const NewsletterBox: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { lang, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      const errTxt = lang === 'en' ? 'Please provide a valid email address.' : 'অনুগ্রহ করে সঠিক ইমেইল ঠিকানা প্রদান করুন।';
      setStatus('error');
      setMessage(errTxt);
      toast.error(errTxt, { title: lang === 'en' ? 'Invalid Email' : 'ভুল ইমেইল' });
      return;
    }
    setStatus('loading');
    try {
      const res = await api.subscribeNewsletter(email);
      setStatus('success');
      const succTxt = res.message || (lang === 'en' ? 'Thank you! You have successfully subscribed.' : 'ধন্যবাদ! আপনি সফলভাবে যুক্ত হয়েছেন।');
      setMessage(succTxt);
      toast.success(succTxt, { title: lang === 'en' ? 'Subscribed' : 'যুক্ত হয়েছেন' });
      setEmail('');
    } catch {
      setStatus('error');
      const failTxt = lang === 'en' ? 'An error occurred. Please try again later.' : 'দুঃখিত, কোনো ত্রুটি হয়েছে। পরে চেষ্টা করুন।';
      setMessage(failTxt);
    }
  };

  return (
    <div className="bg-[#f7f2eb] border border-[#e2ddd3] p-5 rounded-sm">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-5 h-5 text-[#800020]" />
        <h4 className={`font-bold text-base text-[#1e2022] ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
          {t('footer.newsletter')}
        </h4>
      </div>
      <p className={`text-xs text-gray-600 mb-4 leading-relaxed ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
        {t('footer.newsletterDesc')}
      </p>

      {status === 'success' ? (
        <div className={`flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === 'error') setStatus('idle');
              }}
              placeholder={t('footer.emailPlaceholder')}
              disabled={status === 'loading'}
              className="w-full text-xs font-sans px-3 py-2.5 bg-white border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] text-gray-800 placeholder:text-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className={`w-full bg-[#800020] hover:bg-[#9b1b30] text-white text-xs font-semibold py-2 px-4 rounded transition flex items-center justify-center gap-2 shadow-sm ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{lang === 'en' ? 'Processing...' : 'প্রক্রিয়াকরণ...'}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{t('footer.subscribe')}</span>
              </>
            )}
          </button>
          {status === 'error' && (
            <div className={`flex items-center gap-1.5 text-[11px] text-rose-700 mt-1 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
