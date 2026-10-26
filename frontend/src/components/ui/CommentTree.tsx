import React, { useState, useEffect } from 'react';
import { MessageSquare, Reply, Trash2, Send, Loader2, User } from 'lucide-react';
import { Comment } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from '../../context/ToastContext';

interface CommentTreeProps {
  articleSlug: string;
}

export const CommentTree: React.FC<CommentTreeProps> = ({ articleSlug }) => {
  const { user, openAuthModal } = useAuth();
  const { t } = useLanguage();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [topContent, setTopContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const data = await api.getComments(articleSlug);
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [articleSlug]);

  const handlePostTopComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info('মন্তব্য করতে অনুগ্রহ করে লগইন করুন।', { title: 'লগইন আবশ্যক' });
      openAuthModal('login');
      return;
    }
    if (!topContent.trim()) {
      toast.warning('অনুগ্রহ করে মন্তব্যের বিষয়বস্তু লিখুন।');
      return;
    }

    setSubmitting(true);
    try {
      await api.postComment(articleSlug, topContent);
      setTopContent('');
      toast.success('আপনার মন্তব্য সফলভাবে প্রকাশিত হয়েছে!');
      await fetchComments();
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('আপনি কি এই মন্তব্যটি মুছে ফেলতে চান?')) return;
    try {
      await api.deleteComment(id);
      toast.success('মন্তব্যটি সফলভাবে মুছে ফেলা হয়েছে।');
      await fetchComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <div className="mt-12 border-t-2 border-[#800020] pt-8">
      {/* Title */}
      <div className="flex items-center gap-2.5 mb-6">
        <MessageSquare className="w-5 h-5 text-[#800020]" />
        <h3 className="font-bengali font-bold text-xl text-[#1e2022]">
          {t('comment.title')} ({comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)})
        </h3>
      </div>

      {/* Top Comment Form */}
      {user ? (
        <form onSubmit={handlePostTopComment} className="mb-8 p-4 bg-[#fbf9f6] border border-[#ded7cc] rounded-sm">
          <div className="flex items-center gap-2 mb-2 font-bengali text-xs text-gray-700">
            <span className="w-6 h-6 rounded-full bg-[#800020] text-white flex items-center justify-center font-bold text-[10px]">
              {user.username.charAt(0).toUpperCase()}
            </span>
            <span className="font-semibold">{user.username} হিসেবে মন্তব্য করছেন</span>
          </div>

          <textarea
            rows={3}
            value={topContent}
            onChange={(e) => setTopContent(e.target.value)}
            placeholder={t('comment.write')}
            className="w-full p-3 border border-[#ded7cc] rounded text-xs font-bengali focus:outline-none focus:border-[#800020] bg-white leading-relaxed"
          />

          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={submitting || !topContent.trim()}
              className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white text-xs font-bengali font-semibold rounded transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>পাঠানো হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{t('comment.submit')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-5 bg-[#fbf9f6] border border-[#ded7cc] rounded-sm text-center font-bengali text-xs">
          <p className="text-gray-600 mb-3">{t('comment.loginToComment')}</p>
          <button
            onClick={() => openAuthModal('login')}
            className="px-5 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white font-semibold rounded text-xs transition"
          >
            লগইন / রেজিস্ট্রেশন করুন
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-8 text-center text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#800020]" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentNode
              key={comment.id}
              comment={comment}
              articleSlug={articleSlug}
              onCommentAdded={fetchComments}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-gray-400 font-bengali text-xs">
          এখনো কোনো মন্তব্য নেই। প্রথম মন্তব্যটি আপনিই লিখুন!
        </p>
      )}
    </div>
  );
};

interface CommentNodeProps {
  comment: Comment;
  articleSlug: string;
  onCommentAdded: () => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const CommentNode: React.FC<CommentNodeProps> = ({
  comment,
  articleSlug,
  onCommentAdded,
  onDelete,
}) => {
  const { user, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info('উত্তরে মন্তব্য করতে অনুগ্রহ করে লগইন করুন।', { title: 'লগইন আবশ্যক' });
      openAuthModal('login');
      return;
    }
    if (!replyText.trim()) {
      toast.warning('অনুগ্রহ করে উত্তরের টেক্সট লিখুন।');
      return;
    }

    setSubmittingReply(true);
    try {
      await api.postComment(articleSlug, replyText, comment.id);
      setReplyText('');
      setReplyOpen(false);
      toast.success('আপনার উত্তর সফলভাবে যোগ করা হয়েছে!');
      await onCommentAdded();
    } catch (err) {
      console.error('Error posting reply:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const formattedDate = new Date(comment.created_at).toLocaleDateString('bn-BD', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col">
      {/* Comment Card */}
      <div className="flex items-start gap-3 p-3.5 bg-white border border-[#e2ddd3] rounded-sm shadow-xs">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#f4eee6] border border-[#ded7cc] text-[#800020] flex items-center justify-center font-bold text-xs flex-shrink-0">
          {comment.user_name.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-gray-900 font-sans">{comment.user_name}</span>
              <span className="text-[10px] text-gray-400 font-bengali">• {formattedDate}</span>
            </div>

            {/* Actions: delete */}
            {(comment.is_owner || user?.is_staff) && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-gray-400 hover:text-rose-600 transition p-1"
                title={t('comment.delete')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-gray-700 font-bengali leading-relaxed break-words">
            {comment.content}
          </p>

          {/* Reply trigger button */}
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                setReplyOpen(!replyOpen);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-bengali text-[#800020] hover:text-[#9b1b30] font-semibold transition"
            >
              <Reply className="w-3 h-3" />
              <span>{t('comment.reply')}</span>
            </button>
          </div>

          {/* Inline Reply Form */}
          {replyOpen && (
            <form onSubmit={handlePostReply} className="mt-3 pt-3 border-t border-gray-100">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`@${comment.user_name} কে উত্তর লিখুন...`}
                className="w-full p-2.5 border border-[#ded7cc] rounded text-xs font-bengali focus:outline-none focus:border-[#800020] bg-[#faf7f2]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setReplyOpen(false)}
                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 font-bengali"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="px-3 py-1 bg-[#800020] hover:bg-[#9b1b30] text-white text-xs font-bengali font-semibold rounded flex items-center gap-1 transition disabled:opacity-50"
                >
                  {submittingReply ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>উত্তর পাঠান</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Recursive Nested Replies (Tree Hierarchy) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-6 sm:pl-10 mt-3 space-y-3 border-l-2 border-[#ded7cc] ml-4">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply.id}
              comment={reply}
              articleSlug={articleSlug}
              onCommentAdded={onCommentAdded}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
