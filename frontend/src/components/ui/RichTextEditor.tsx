import React, { useState, useRef, useEffect } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Heading2, Heading3,
  Quote, List, ListOrdered, Link as LinkIcon, Image as ImageIcon,
  Code, Eye, Edit3, RotateCcw, Minus, UploadCloud, Loader2, X,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'আপনার প্রবন্ধের বিস্তারিত বক্তব্য লিখুন...',
  label = 'মূল প্রবন্ধ / কন্টেন্ট (Rich Text Editor)',
  error = false,
  errorMessage,
}) => {
  const [viewMode, setViewMode] = useState<'editor' | 'html' | 'preview'>('editor');
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { lang } = useLanguage();

  // Image Upload Dialog State
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    if (editorRef.current && viewMode === 'editor') {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, viewMode]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCmd = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  const promptLink = () => {
    const url = prompt(lang === 'en' ? 'Enter URL:' : 'লিঙ্কের ঠিকানা লিখুন:');
    if (url) {
      execCmd('createLink', url);
    }
  };

  const openImageModal = () => {
    setImageUrl('');
    setImageCaption('');
    setUploadError('');
    setImageModalOpen(true);
  };

  const handleFileUpload = async (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError(lang === 'en' ? 'Please select a valid image file.' : 'অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন।');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError(lang === 'en' ? 'Image exceeds 15MB size limit.' : 'ছবির আকার ১৫ মেগাবাইট অতিক্রম করেছে।');
      return;
    }

    setUploading(true);
    try {
      const res = await api.uploadImage(file);
      if (res && res.url) {
        setImageUrl(res.url);
      }
    } catch (err: any) {
      console.error('Editor image upload failed:', err);
      setUploadError(err?.response?.data?.error || (lang === 'en' ? 'Upload to Cloudflare R2 failed.' : 'ক্লাউডফ্লেয়ার R2 তে আপলোড ব্যর্থ হয়েছে।'));
    } finally {
      setUploading(false);
    }
  };

  const handleInsertImageToEditor = () => {
    if (!imageUrl.trim()) {
      toast.warning(
        lang === 'en' ? 'Please provide or upload an image.' : 'অনুগ্রহ করে একটি ছবি দিন বা আপলোড করুন।',
        { title: lang === 'en' ? 'Image Required' : 'ছবি আবশ্যক' }
      );
      return;
    }

    const captionHtml = imageCaption.trim()
      ? `<figcaption class="text-center text-xs text-gray-500 mt-1.5 font-serif italic">${imageCaption.trim()}</figcaption>`
      : '';
    const imgFigure = `<figure class="my-5 block"><img src="${imageUrl.trim()}" alt="${imageCaption.trim() || 'Article visual'}" class="w-full rounded-sm max-h-[550px] object-cover border border-[#e2ddd3] shadow-xs" />${captionHtml}</figure><p><br></p>`;

    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, imgFigure);
      handleInput();
    } else {
      onChange(value + imgFigure);
    }

    setImageModalOpen(false);
  };

  return (
    <div className="w-full">
      <div className={`border ${error ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/10' : 'border-[#ded7cc]'} rounded-sm bg-white overflow-hidden shadow-2xs font-sans transition-colors`}>
        {/* Top Label & Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between p-2.5 bg-[#fbf9f6] border-b border-[#ded7cc]">
        <span className="font-bengali font-bold text-xs text-[#1e2022] flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-[#800020]" />
          <span>{label}</span>
        </span>

        <div className="flex items-center gap-1 text-[11px] font-bengali">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`px-2.5 py-1 rounded transition ${
              viewMode === 'editor'
                ? 'bg-[#800020] text-white font-bold'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {lang === 'en' ? 'Visual Editor' : 'ভিজ্যুয়াল এডিটর'}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('html')}
            className={`px-2.5 py-1 rounded transition ${
              viewMode === 'html'
                ? 'bg-[#800020] text-white font-bold'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            HTML
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
              viewMode === 'preview'
                ? 'bg-[#800020] text-white font-bold'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>{lang === 'en' ? 'Live Preview' : 'লাইভ প্রিভিউ'}</span>
          </button>
        </div>
      </div>

      {/* Formatting Toolbar (Active in 'editor' mode) */}
      {viewMode === 'editor' && (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-[#faf7f2] border-b border-[#e2ddd3] text-gray-700">
          <button
            type="button"
            onClick={() => execCmd('bold')}
            className="p-1.5 hover:bg-[#ebd5b3] rounded transition"
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('italic')}
            className="p-1.5 hover:bg-[#ebd5b3] rounded transition"
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('underline')}
            className="p-1.5 hover:bg-[#ebd5b3] rounded transition"
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('strikeThrough')}
            className="p-1.5 hover:bg-[#ebd5b3] rounded transition"
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => execCmd('formatBlock', '<h2>')}
            className="px-2 py-1 text-xs font-bold hover:bg-[#ebd5b3] rounded transition"
            title="Heading 2"
          >
            H2
          </button>

          <button
            type="button"
            onClick={() => execCmd('formatBlock', '<h3>')}
            className="px-2 py-1 text-xs font-bold hover:bg-[#ebd5b3] rounded transition"
            title="Heading 3"
          >
            H3
          </button>

          <button
            type="button"
            onClick={() => execCmd('formatBlock', '<p>')}
            className="px-2 py-1 text-xs hover:bg-[#ebd5b3] rounded transition"
            title="Paragraph"
          >
            P
          </button>

          <div className="w-[1px] h-4 bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => execCmd('insertUnorderedList')}
            className="p-1.5 hover:bg-[#ebd5b3] rounded transition"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('insertOrderedList')}
            className="p-1.5 hover:bg-[#ebd5b3] rounded transition"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('formatBlock', '<blockquote>')}
            className="p-1.5 hover:bg-[#ebd5b3] rounded transition"
            title="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={promptLink}
            className="p-1.5 hover:bg-[#ebd5b3] rounded transition"
            title="Insert Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={openImageModal}
            className="p-1.5 bg-[#f0e8dc] hover:bg-[#ebd5b3] text-[#800020] font-bold rounded transition flex items-center gap-1"
            title={lang === 'en' ? 'Upload / Insert Image (Cloudflare R2)' : 'ছবি আপলোড ও যুক্ত করুন (Cloudflare R2)'}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">{lang === 'en' ? 'Upload Image' : 'ছবি আপলোড'}</span>
          </button>

          <button
            type="button"
            onClick={() => execCmd('insertHorizontalRule')}
            className="p-1.5 hover:bg-[#ebd5b3] rounded transition"
            title="Horizontal Line"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => execCmd('removeFormat')}
            className="p-1.5 hover:bg-[#ebd5b3] rounded transition text-gray-500 hover:text-gray-800"
            title="Clear Formatting"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Body Area */}
      <div className="min-h-[300px] p-4 text-sm font-bengali">
        {viewMode === 'editor' && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            onKeyUp={handleInput}
            onPaste={() => setTimeout(handleInput, 50)}
            className="outline-none min-h-[280px] leading-loose text-gray-800 space-y-4 prose max-w-none prose-headings:font-bengali prose-headings:text-[#1e2022] prose-blockquote:border-l-4 prose-blockquote:border-[#800020] prose-blockquote:bg-[#faf7f2] prose-blockquote:p-3 prose-blockquote:italic"
            data-placeholder={placeholder}
          />
        )}

        {viewMode === 'html' && (
          <textarea
            rows={12}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full font-mono text-xs p-3 bg-gray-900 text-emerald-400 rounded focus:outline-none leading-relaxed"
          />
        )}

        {viewMode === 'preview' && (
          <div className="min-h-[280px] bg-[#faf7f2] p-5 rounded border border-[#ded7cc]">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-3 font-sans">
              Live Article Preview
            </span>
            <div
              className="prose max-w-none text-gray-800 leading-loose space-y-4 prose-blockquote:border-l-4 prose-blockquote:border-[#800020] prose-blockquote:p-3 prose-blockquote:bg-white"
              dangerouslySetInnerHTML={{ __html: value || `<p className="text-gray-400 italic">কোনো কন্টেন্ট নেই...</p>` }}
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: UPLOAD IMAGE TO CLOUDFLARE R2 & INSERT INTO ARTICLE     */}
      {/* ------------------------------------------------------------- */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#800020]" />
                <h3 className="font-bold text-sm text-gray-900">
                  {lang === 'en' ? 'Upload Image (Cloudflare R2)' : 'ছবি আপলোড করুন (ক্লাউডফ্লেয়ার R2)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hidden File Picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
                e.target.value = '';
              }}
            />

            {/* Dropzone or Preview */}
            {imageUrl ? (
              <div className="relative rounded border border-[#ded7cc] overflow-hidden bg-gray-900">
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  className="w-full h-44 object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/70 text-emerald-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Cloudflare R2 Storage</span>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 px-2.5 py-1 bg-white/90 hover:bg-white text-gray-900 text-[11px] font-semibold rounded shadow"
                >
                  {lang === 'en' ? 'Change Image' : 'ছবি পরিবর্তন'}
                </button>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#ded7cc] hover:border-[#800020] bg-[#faf7f2] rounded p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                {uploading ? (
                  <div className="py-4 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-[#800020] animate-spin" />
                    <span className="text-xs font-semibold text-gray-700">
                      {lang === 'en' ? 'Uploading to Cloudflare R2...' : 'ক্লাউডফ্লেয়ার R2 তে আপলোড হচ্ছে...'}
                    </span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-[#800020]" />
                    <p className="text-xs font-semibold text-gray-800">
                      {lang === 'en' ? 'Click to upload from device' : 'ডিভাইস থেকে ছবি আপলোড করতে ক্লিক করুন'}
                    </p>
                    <span className="text-[10px] text-gray-500">
                      PNG, JPG, WEBP, GIF (Max 15MB)
                    </span>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Direct URL input fallback */}
            <div>
              <label className="block text-gray-700 text-xs font-bold mb-1">
                {lang === 'en' ? 'Or Image URL' : 'অথবা ছবির লিঙ্ক'}
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#ded7cc] rounded text-xs focus:outline-none focus:border-[#800020]"
              />
            </div>

            {/* Optional Caption */}
            <div>
              <label className="block text-gray-700 text-xs font-bold mb-1">
                {lang === 'en' ? 'Image Caption (Optional)' : 'ছবির ক্যাপশন / বিবরণ (ঐচ্ছিক)'}
              </label>
              <input
                type="text"
                placeholder={lang === 'en' ? 'e.g. Modernist pavilion in evening light' : 'যেমন: সন্ধ্যার আলোয় আধুনিক প্যাভিলিয়ন'}
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-[#ded7cc] rounded text-xs focus:outline-none focus:border-[#800020]"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs hover:bg-gray-50"
              >
                {lang === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="button"
                disabled={!imageUrl || uploading}
                onClick={handleInsertImageToEditor}
                className="px-4 py-1.5 bg-[#800020] hover:bg-[#600018] text-white rounded text-xs font-semibold disabled:opacity-50 transition"
              >
                {lang === 'en' ? 'Insert into Article' : 'প্রবন্ধে যুক্ত করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      {error && errorMessage && (
        <p className="flex items-center gap-1.5 text-rose-600 font-bengali text-xs mt-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
};
