import React, { useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { toast } from '../../context/ToastContext';

interface HeartButtonProps {
  slug: string;
  initialHearted?: boolean;
  initialCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const HeartButton: React.FC<HeartButtonProps> = ({
  slug,
  initialHearted = false,
  initialCount = 0,
  size = 'md',
}) => {
  const { user, openAuthModal } = useAuth();
  const [isHearted, setIsHearted] = useState(initialHearted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info('লেখায় প্রতিক্রিয়া জানাতে অনুগ্রহ করে লগইন করুন।', { title: 'লগইন আবশ্যক' });
      openAuthModal('login');
      return;
    }

    if (loading) return;
    setLoading(true);
    setAnimating(true);

    try {
      const res = await api.toggleHeart(slug);
      setIsHearted(res.is_hearted);
      setCount(res.hearts_count);
    } catch (err) {
      console.error('Error toggling heart:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(false), 400);
    }
  };

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-[11px]' : size === 'lg' ? 'text-sm' : 'text-xs';

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-200 ${
        isHearted
          ? 'bg-rose-50 text-rose-600 border border-rose-200'
          : 'bg-black/5 hover:bg-black/10 text-gray-600 border border-transparent'
      } ${animating ? 'scale-110' : 'scale-100'}`}
      title={isHearted ? 'পছন্দ বাতিল করুন' : 'পছন্দ করুন (Heart)'}
    >
      {loading ? (
        <Loader2 className={`${iconSize} animate-spin text-rose-500`} />
      ) : (
        <Heart
          className={`${iconSize} transition-transform ${
            isHearted ? 'fill-rose-500 text-rose-500' : 'text-gray-500 hover:text-rose-500'
          }`}
        />
      )}
      <span className={`${textSize} font-sans font-semibold leading-none`}>
        {count}
      </span>
    </button>
  );
};
