import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { ContactInquiryPayload } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { toast } from '../context/ToastContext';

export const ContactPage: React.FC = () => {
  const { lang, t } = useLanguage();

  useEffect(() => {
    document.title = lang === 'en' ? 'Contact Us — The Mad Story' : 'যোগাযোগ — দ্য ম্যাড স্টোরি';
    return () => {
      document.title = 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা';
    };
  }, [lang]);
  const [formData, setFormData] = useState<ContactInquiryPayload>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (status !== 'idle') setStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setStatus('error');
      setResponseMsg(t('contact.requiredFields'));
      toast.warning(t('contact.requiredFields'), { title: 'অসম্পূর্ণ ফর্ম' });
      return;
    }

    setStatus('loading');
    try {
      const res = await api.submitContact(formData);
      setStatus('success');
      const succMsg = res.message || (lang === 'en' ? 'Thank you! Your message has been sent.' : 'ধন্যবাদ! আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে।');
      setResponseMsg(succMsg);
      toast.success(succMsg, { title: 'বার্তা প্রেরিত' });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      setStatus('error');
      setResponseMsg(t('contact.error'));
    }
  };

  return (
    <div className="py-10">
      <div className="madstory-container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-[11px] font-sans font-bold uppercase tracking-widest text-[#800020] block mb-2">
            {t('contact.getInTouch')}
          </span>
          <h1 className={`text-3xl sm:text-4xl font-bold text-[#1e2022] mb-3 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
            {t('contact.title')}
          </h1>
          <p className={`text-xs sm:text-sm text-gray-600 max-w-lg mx-auto ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left: Contact Info (5 cols) */}
          <div className="md:col-span-5 bg-[#f7f2eb] border border-[#ded7cc] p-6 rounded-sm space-y-6">
            <div>
              <h3 className={`font-bold text-base text-[#1e2022] mb-3 border-b border-[#ded7cc] pb-2 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                {t('contact.office')}
              </h3>
              <div className={`space-y-4 text-xs text-gray-700 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#800020] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-gray-900 font-sans">{t('contact.dhaka')}</strong>
                    <span>{t('contact.dhakaAddress')}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[#800020] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-gray-900 font-sans">{t('contact.emailInquiries')}</strong>
                    <span>editor@themadstory.com</span>
                    <br />
                    <span>submissions@themadstory.com</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#800020] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-gray-900 font-sans">{t('contact.helpline')}</strong>
                    <span>+880 1711-234567</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#ded7cc]">
              <h4 className={`font-semibold text-xs text-gray-800 mb-2 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                {t('contact.submissionGuide')}
              </h4>
              <p className={`text-[11px] text-gray-600 leading-relaxed ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                {t('contact.submissionText')}
              </p>
            </div>
          </div>

          {/* Right: Contact Form (7 cols) */}
          <div className="md:col-span-7 bg-white border border-[#e2ddd3] p-6 rounded-sm shadow-madstory">
            <h3 className={`font-bold text-lg text-[#1e2022] mb-4 border-b border-[#ded7cc] pb-2 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
              {t('contact.sendMsg')}
            </h3>

            {status === 'success' ? (
              <div className={`p-6 bg-emerald-50 border border-emerald-200 rounded text-center space-y-3 ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-900 text-lg">{t('contact.success')}</h4>
                <p className="text-sm text-emerald-800">{responseMsg}</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-3 px-4 py-1.5 bg-[#800020] text-white text-xs rounded hover:bg-[#9b1b30] transition"
                >
                  {t('contact.sendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={`space-y-4 text-xs ${lang === 'bn' ? 'font-bengali' : 'font-sans'}`}>
                {status === 'error' && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{responseMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    {t('contact.name')} <span className="text-[#800020]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('contact.namePlaceholder')}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      {t('contact.email')} <span className="text-[#800020]">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@mail.com"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">
                      {t('contact.phone')}
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+880 1..."
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    {t('contact.subject')}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t('contact.subjectPlaceholder')}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    {t('contact.message')} <span className="text-[#800020]">*</span>
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('contact.messagePlaceholder')}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-2.5 px-6 bg-[#800020] hover:bg-[#9b1b30] text-white font-semibold rounded transition flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('contact.sending')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{t('contact.submitBtn')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
