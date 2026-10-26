import React, { useState, useRef } from 'react';
import {
  UploadCloud, Image as ImageIcon, X, ExternalLink, Loader2,
  CheckCircle2, AlertCircle, Link as LinkIcon, RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../context/ToastContext';

export interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  helperText?: string;
  aspectRatio?: 'video' | 'square' | 'banner' | 'auto';
  presets?: { label: string; url: string }[];
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label,
  required = false,
  helperText,
  aspectRatio = 'video',
  presets = [],
  className = '',
}) => {
  const { lang } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');

  const aspectClass = {
    video: 'aspect-video',
    square: 'aspect-square',
    banner: 'aspect-[21/9]',
    auto: 'h-48',
  }[aspectRatio];

  const handleFileProcess = async (file: File) => {
    setErrorMsg('');
    if (!file.type.startsWith('image/')) {
      const msg = lang === 'en' ? 'Only image files are allowed.' : 'শুধুমাত্র ছবি আপলোড করা যাবে।';
      setErrorMsg(msg);
      toast.error(msg, { title: lang === 'en' ? 'Invalid File' : 'ভুল ফাইল ফরম্যাট' });
      return;
    }

    // 15 MB limit check
    if (file.size > 15 * 1024 * 1024) {
      const msg = lang === 'en' ? 'File size exceeds 15MB limit.' : 'ছবির আকার ১৫ মেগাবাইট অতিক্রম করেছে।';
      setErrorMsg(msg);
      toast.error(msg, { title: lang === 'en' ? 'File Too Large' : 'ছবির আকার অতিরিক্ত' });
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        onChange(res.url);
        toast.success(
          lang === 'en' ? 'Image uploaded successfully to cloud storage!' : 'ছবি সফলভাবে ক্লাউড স্টোরেজে আপলোড হয়েছে!'
        );
      }
    } catch (err: any) {
      console.error('Image upload failed:', err);
      const msg =
        err?.response?.data?.error ||
        (lang === 'en' ? 'Failed to upload image to Cloudflare R2.' : 'ছবি ক্লাউডফ্লেয়ার R2 তে আপলোড করতে ব্যর্থ হয়েছে।');
      setErrorMsg(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // reset input so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleApplyManualUrl = () => {
    if (manualUrl.trim()) {
      onChange(manualUrl.trim());
      setManualUrl('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className={`space-y-2 font-sans ${className}`}>
      {/* Label & Header */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block font-bold text-gray-700 text-xs">
            {label} {required && <span className="text-[#800020]">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[11px] text-gray-500 hover:text-[#800020] transition flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{showUrlInput ? (lang === 'en' ? 'Hide URL field' : 'লিংক ফিল্ড লুকান') : (lang === 'en' ? 'Paste direct URL' : 'সরাসরি লিংক দিন')}</span>
          </button>
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-gray-500">{helperText}</p>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Manual URL Input Bar (Collapsible) */}
      {showUrlInput && (
        <div className="flex items-center gap-2 p-2 bg-[#faf7f2] border border-[#ded7cc] rounded text-xs animate-in fade-in">
          <input
            type="text"
            placeholder={lang === 'en' ? 'Enter public image URL...' : 'ছবির সরাসরি URL দিন...'}
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className="flex-1 px-2.5 py-1.5 border border-[#ded7cc] rounded bg-white text-xs focus:outline-none focus:border-[#800020]"
          />
          <button
            type="button"
            onClick={handleApplyManualUrl}
            className="px-3 py-1.5 bg-[#800020] text-white rounded text-xs font-semibold hover:bg-[#600018] transition"
          >
            {lang === 'en' ? 'Apply' : 'যুক্ত করুন'}
          </button>
        </div>
      )}

      {/* Uploader / Preview Container */}
      {value ? (
        /* Image Preview Box */
        <div className="relative group border border-[#ded7cc] rounded-sm overflow-hidden bg-gray-900 shadow-xs">
          <div className={`w-full ${aspectClass} overflow-hidden flex items-center justify-center bg-gray-950`}>
            <img
              src={value}
              alt="Uploaded Preview"
              className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/images/18-1024x678.jpg';
              }}
            />
          </div>

          {/* Top Storage Badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{value.includes('r2.cloudflarestorage') || value.includes('r2.dev') ? 'Cloudflare R2 Storage' : 'Media Storage Active'}</span>
          </div>

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 p-4">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-900 rounded text-xs font-semibold flex items-center gap-1.5 shadow transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#800020]" />
              <span>{lang === 'en' ? 'Change Image' : 'ছবি পরিবর্তন করুন'}</span>
            </button>

            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-black/70 hover:bg-black text-white rounded shadow transition"
              title={lang === 'en' ? 'View full image' : 'আসল ছবি দেখুন'}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded shadow transition"
              title={lang === 'en' ? 'Remove image' : 'ছবি মুছে ফেলুন'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bottom URL chip */}
          <div className="p-2 bg-white border-t border-[#ded7cc] flex items-center justify-between text-[11px] text-gray-600">
            <span className="truncate max-w-[80%]" title={value}>
              {value}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[#800020] font-semibold hover:underline"
            >
              {lang === 'en' ? 'Upload New' : 'নতুন আপলোড'}
            </button>
          </div>
        </div>
      ) : (
        /* Drag & Drop Upload Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2.5 ${
            isDragging
              ? 'border-[#800020] bg-rose-50/50'
              : 'border-[#ded7cc] hover:border-[#800020] bg-[#faf7f2]/60 hover:bg-[#faf7f2]'
          }`}
        >
          {uploading ? (
            <div className="py-6 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-[#800020] animate-spin" />
              <p className="text-xs font-semibold text-gray-800">
                {lang === 'en' ? 'Uploading to Cloudflare R2...' : 'ক্লাউডফ্লেয়ার R2 তে আপলোড হচ্ছে...'}
              </p>
              <span className="text-[10px] text-gray-500">
                {lang === 'en' ? 'Please wait a moment' : 'অনুগ্রহ করে অপেক্ষা করুন'}
              </span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white border border-[#ded7cc] flex items-center justify-center text-[#800020] shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">
                  {lang === 'en' ? 'Click to upload image or drag & drop' : 'ছবি আপলোড করতে ক্লিক করুন অথবা টেনে আনুন'}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  WEBP, PNG, JPG, GIF, SVG (Max 15MB) • Stored on Cloudflare R2
                </p>
              </div>
              <button
                type="button"
                className="mt-1 px-3 py-1 bg-white border border-[#ded7cc] hover:border-[#800020] text-gray-700 text-xs rounded font-semibold shadow-2xs transition"
              >
                {lang === 'en' ? 'Browse Files' : 'ফাইল নির্বাচন করুন'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Presets (Quick selection) */}
      {presets.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-semibold text-gray-500">
            {lang === 'en' ? 'Quick Presets:' : 'রেডি ছবি:'}
          </span>
          {presets.map((p) => (
            <button
              type="button"
              key={p.url}
              onClick={() => onChange(p.url)}
              className={`text-[10px] px-2 py-0.5 rounded border transition ${
                value === p.url
                  ? 'bg-[#800020] text-white border-[#800020]'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
