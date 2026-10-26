import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, PenSquare, FileText, CheckCircle, Clock,
  Eye, Heart, Settings, Sliders, AlertTriangle, Check, X,
  Trash2, Edit3, ArrowUpRight, Loader2, Sparkles, PlusCircle,
  Users, MessageSquare, Mail, Bell, Shield, ShieldCheck,
  FolderTree, Globe, ToggleLeft, ToggleRight, Search, Filter,
  ExternalLink, Save, RefreshCw, Send, CheckCircle2, AlertCircle,
  ChevronDown, ChevronRight, ArrowUp, ArrowDown, Layers, EyeOff,
  List, CornerDownRight, ArrowUpDown, Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import {
  Article, Category, DashboardStats, HomepageCustomization,
  User, Comment, ContactInquiry, NewsletterSubscriber, SiteSetting,
  HeroSlide
} from '../types';
import { RichTextEditor } from '../components/ui/RichTextEditor';
import { ImageUpload } from '../components/ui/ImageUpload';
import { toast } from '../context/ToastContext';
import { parseApiError } from '../utils/errorHandler';

type DashboardTab =
  | 'overview'
  | 'hero_slider'
  | 'all_articles'
  | 'approval_queue'
  | 'write'
  | 'my_blogs'
  | 'categories'
  | 'users'
  | 'comments'
  | 'inquiries'
  | 'subscribers'
  | 'customization'
  | 'settings';

export const DashboardPage: React.FC = () => {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  useEffect(() => {
    document.title = lang === 'en' ? 'Dashboard — The Mad Story' : 'ড্যাশবোর্ড — দ্য ম্যাড স্টোরি';
    return () => {
      document.title = 'The Mad Story — শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার পত্রিকা';
    };
  }, [lang]);

  // Base data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myBlogs, setMyBlogs] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [pendingBlogs, setPendingBlogs] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [inquiriesList, setInquiriesList] = useState<ContactInquiry[]>([]);
  const [subscribersList, setSubscribersList] = useState<NewsletterSubscriber[]>([]);
  const [customization, setCustomization] = useState<HomepageCustomization | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSetting | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [articleSearch, setArticleSearch] = useState('');
  const [articleStatusFilter, setArticleStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [commentSearch, setCommentSearch] = useState('');
  const [inquirySearch, setInquirySearch] = useState('');

  // Write Blog form state
  const [newTitle, setNewTitle] = useState('');
  const [newTitleEn, setNewTitleEn] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newExcerptEn, setNewExcerptEn] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newContentEn, setNewContentEn] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('/assets/images/18-1024x678.jpg');
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>([]);
  const [readingTime, setReadingTime] = useState('৫ মিনিট পাঠ');
  const [readingTimeEn, setReadingTimeEn] = useState('5 min read');
  const [savingBlog, setSavingBlog] = useState(false);
  const [blogSuccessMsg, setBlogSuccessMsg] = useState('');
  const [writeFormAttempted, setWriteFormAttempted] = useState(false);

  // Article Edit Modal state
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleEn, setEditTitleEn] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editCatIds, setEditCatIds] = useState<number[]>([]);
  const [editStatus, setEditStatus] = useState<Article['status']>('published');
  const [savingEditArticle, setSavingEditArticle] = useState(false);
  const [editFormAttempted, setEditFormAttempted] = useState(false);

  // Category state & enhancements
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [categoryViewMode, setCategoryViewMode] = useState<'tree' | 'table'>('tree');
  const [categoryFilterType, setCategoryFilterType] = useState<'all' | 'top_level' | 'subcategories' | 'nav_visible' | 'nav_hidden'>('all');
  const [categorySortBy, setCategorySortBy] = useState<'order_asc' | 'order_desc' | 'name_asc' | 'articles_desc'>('order_asc');
  const [collapsedParentIds, setCollapsedParentIds] = useState<number[]>([]);

  // Category Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParent, setCatParent] = useState<number | null>(null);
  const [catDesc, setCatDesc] = useState('');
  const [catDescEn, setCatDescEn] = useState('');
  const [catOrder, setCatOrder] = useState(0);
  const [catNavVisible, setCatNavVisible] = useState(true);
  const [savingCat, setSavingCat] = useState(false);

  // User Modal state
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirst, setNewUserFirst] = useState('');
  const [newUserLast, setNewUserLast] = useState('');
  const [newUserStaff, setNewUserStaff] = useState(false);
  const [newUserActive, setNewUserActive] = useState(true);
  const [savingUser, setSavingUser] = useState(false);

  // Inquiry View Modal state
  const [viewingInquiry, setViewingInquiry] = useState<ContactInquiry | null>(null);

  // Hero Slides state & Modal state
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [heroSlideSearch, setHeroSlideSearch] = useState('');
  const [heroSlideModalOpen, setHeroSlideModalOpen] = useState(false);
  const [editingHeroSlide, setEditingHeroSlide] = useState<HeroSlide | null>(null);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideTitleEn, setSlideTitleEn] = useState('');
  const [slideSubtitle, setSlideSubtitle] = useState('');
  const [slideSubtitleEn, setSlideSubtitleEn] = useState('');
  const [slideImage, setSlideImage] = useState('/assets/images/18-1024x678.jpg');
  const [slideButtonText, setSlideButtonText] = useState('গল্পগুলো দেখুন');
  const [slideButtonTextEn, setSlideButtonTextEn] = useState('Explore Stories');
  const [slideButtonLink, setSlideButtonLink] = useState('/category/architecture-interiors');
  const [slideOrder, setSlideOrder] = useState(0);
  const [slideActive, setSlideActive] = useState(true);
  const [savingHeroSlide, setSavingHeroSlide] = useState(false);
  const [heroSlideSuccessMsg, setHeroSlideSuccessMsg] = useState('');

  // Rejection dialog
  const [rejectingArticle, setRejectingArticle] = useState<Article | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Save feedback states
  const [customSuccessMsg, setCustomSuccessMsg] = useState('');
  const [savingCustomization, setSavingCustomization] = useState(false);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal('login');
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [statsData, myData, catsData, flatCatsData] = await Promise.all([
        api.getDashboardStats(),
        api.getMyArticles(),
        api.getCategories(),
        api.getAllCategoriesFlat(),
      ]);
      setStats(statsData);
      setMyBlogs(myData);
      setCategories(catsData);
      setFlatCategories(flatCatsData.length ? flatCatsData : catsData);

      if (user.is_staff) {
        const [
          allArts,
          pendingData,
          usersData,
          commentsData,
          inquiriesData,
          subsData,
          customData,
          settingsData,
          heroSlidesData,
        ] = await Promise.all([
          api.getArticles({ page_size: 100 }),
          api.getPendingArticles(),
          api.getAdminUsers(),
          api.getAdminComments(),
          api.getAdminInquiries(),
          api.getAdminSubscribers(),
          api.getHomepageCustomization().catch(() => null),
          api.getSettings().catch(() => null),
          api.getHeroSlides().catch(() => []),
        ]);
        setAllArticles(allArts.results || []);
        setPendingBlogs(pendingData);
        setUsersList(usersData);
        setCommentsList(commentsData);
        setInquiriesList(inquiriesData);
        setSubscribersList(subsData);
        setCustomization(customData);
        setSiteSettings(settingsData);
        setHeroSlides(heroSlidesData);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Helper to check if rich text content actually has non-empty text, images, or media
  const isHtmlContentPresent = (html?: string): boolean => {
    if (!html) return false;
    if (/<(img|iframe|figure|svg|video|audio)[^>]*>/i.test(html)) return true;
    const text = html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length > 0;
  };

  // --------------------------------------------------------------------------
  // Handlers: Article Creation
  // --------------------------------------------------------------------------
  const handleCreateBlog = async (status: 'draft' | 'pending_approval' | 'published') => {
    setWriteFormAttempted(true);

    const finalTitle = newTitle.trim() || newTitleEn.trim();
    const finalTitleEn = newTitleEn.trim() || newTitle.trim();
    const hasContentBn = isHtmlContentPresent(newContent);
    const hasContentEn = isHtmlContentPresent(newContentEn);
    const hasAnyContent = hasContentBn || hasContentEn;

    if (!finalTitle && !hasAnyContent) {
      toast.warning(
        lang === 'en'
          ? 'Please enter an article title and content body.'
          : 'অনুগ্রহ করে প্রবন্ধের শিরোনাম এবং মূল বিষয়বস্তু লিখুন।',
        { title: lang === 'en' ? 'Missing Fields' : 'অসম্পূর্ণ ফর্ম' }
      );
      return;
    }

    if (!finalTitle) {
      toast.warning(
        lang === 'en'
          ? 'Please enter an article title (in Bengali or English).'
          : 'অনুগ্রহ করে প্রবন্ধের শিরোনাম লিখুন (বাংলা বা ইংরেজি)।',
        { title: lang === 'en' ? 'Title Required' : 'শিরোনাম প্রয়োজন' }
      );
      return;
    }

    if (!hasAnyContent) {
      toast.warning(
        lang === 'en'
          ? 'Please write the article content body in the editor.'
          : 'অনুগ্রহ করে এডিটরে মূল প্রবন্ধের বক্তব্য বা কন্টেন্ট লিখুন।',
        { title: lang === 'en' ? 'Content Required' : 'কন্টেন্ট প্রয়োজন' }
      );
      return;
    }

    const finalContent = hasContentBn ? newContent : newContentEn;
    const finalContentEn = hasContentEn ? newContentEn : newContent;

    setSavingBlog(true);
    setBlogSuccessMsg('');
    try {
      await api.createArticle({
        title: finalTitle,
        title_en: finalTitleEn,
        category_ids: selectedCatIds,
        excerpt: newExcerpt.trim() || newExcerptEn.trim() || finalTitle,
        excerpt_en: newExcerptEn.trim() || newExcerpt.trim() || finalTitleEn,
        content: finalContent,
        content_en: finalContentEn,
        cover_image_url: newCoverUrl,
        reading_time: readingTime,
        status: user?.is_staff ? status : 'pending_approval',
      });
      const successText =
        user?.is_staff
          ? (status === 'published' ? 'প্রবন্ধ সফলভাবে প্রকাশিত হয়েছে!' : 'খসড়া সফলভাবে সংরক্ষিত হয়েছে!')
          : 'আপনার লেখা সফলভাবে জমা দেওয়া হয়েছে! সম্পাদকের অনুমোদনের পর এটি প্রকাশিত হবে।';
      setBlogSuccessMsg(successText);
      toast.success(successText);
      setNewTitle('');
      setNewTitleEn('');
      setNewExcerpt('');
      setNewExcerptEn('');
      setNewContent('');
      setNewContentEn('');
      setSelectedCatIds([]);
      setWriteFormAttempted(false);
      loadData();
    } catch (err: any) {
      console.error('Error creating blog:', err);
    } finally {
      setSavingBlog(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Article Direct Controls
  // --------------------------------------------------------------------------
  const handleSetArticleStatus = async (slug: string, newStatus: string) => {
    try {
      await api.setArticleStatus(slug, newStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleArticleFlag = async (slug: string, flag: 'is_featured_hero' | 'is_colti_trending' | 'is_nirbachito_choice') => {
    try {
      await api.toggleArticleFlag(slug, flag);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteArticle = async (slug: string, title: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await api.deleteArticle(slug);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditArticleModal = (art: Article) => {
    setEditingArticle(art);
    setEditTitle(art.title);
    setEditTitleEn(art.title_en || '');
    setEditExcerpt(art.excerpt || '');
    setEditContent(art.content || '');
    setEditCoverUrl(art.image || '');
    setEditCatIds(art.categories?.map(c => c.id) || []);
    setEditStatus(art.status);
  };

  const handleSaveEditArticle = async () => {
    if (!editingArticle) return;
    setEditFormAttempted(true);

    const finalTitle = editTitle.trim() || editTitleEn.trim();
    const finalTitleEn = editTitleEn.trim() || editTitle.trim();
    const hasContent = isHtmlContentPresent(editContent);

    if (!finalTitle) {
      toast.warning('অনুগ্রহ করে প্রবন্ধের শিরোনাম লিখুন।', { title: 'শিরোনাম প্রয়োজন' });
      return;
    }

    if (!hasContent) {
      toast.warning('অনুগ্রহ করে প্রবন্ধের মূল বক্তব্য বা কন্টেন্ট লিখুন।', { title: 'কন্টেন্ট প্রয়োজন' });
      return;
    }

    setSavingEditArticle(true);
    try {
      await api.updateArticle(editingArticle.slug, {
        title: finalTitle,
        title_en: finalTitleEn,
        excerpt: editExcerpt,
        content: editContent,
        cover_image_url: editCoverUrl,
        category_ids: editCatIds,
        status: editStatus,
      });
      toast.success(lang === 'en' ? 'Article updated successfully!' : 'লেখা সফলভাবে আপডেট করা হয়েছে!');
      setEditingArticle(null);
      setEditFormAttempted(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEditArticle(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Approval Queue
  // --------------------------------------------------------------------------
  const handleApprove = async (slug: string) => {
    try {
      await api.approveArticle(slug);
      toast.success(lang === 'en' ? 'Article approved and published!' : 'লেখা অনুমোদিত ও প্রকাশিত হয়েছে!');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingArticle) return;
    try {
      await api.rejectArticle(rejectingArticle.slug, rejectReason);
      toast.info(lang === 'en' ? 'Article rejected.' : 'লেখা বাতিল করা হয়েছে।');
      setRejectingArticle(null);
      setRejectReason('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Category Management (CRUD & Enhancements)
  // --------------------------------------------------------------------------
  const autoSlugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const toggleCollapseParent = (id: number) => {
    setCollapsedParentIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleCategoryNav = async (cat: Category) => {
    try {
      await api.toggleCategoryNav(cat.slug);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveCategoryOrder = async (cat: Category, delta: number) => {
    const newOrder = Math.max(0, (cat.display_order || 0) + delta);
    try {
      await api.updateCategoryOrder(cat.slug, newOrder);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatNameEn('');
    setCatSlug('');
    setCatParent(null);
    setCatDesc('');
    setCatDescEn('');
    setCatOrder(categories.length + 1);
    setCatNavVisible(true);
    setCategoryModalOpen(true);
  };

  const openAddSubcategoryModal = (parentCat: Category) => {
    setEditingCategory(null);
    setCatName('');
    setCatNameEn('');
    setCatSlug('');
    setCatParent(parentCat.id);
    setCatDesc('');
    setCatDescEn('');
    setCatOrder((parentCat.subcategories?.length || 0) + 1);
    setCatNavVisible(true);
    setCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatNameEn(cat.name_en || '');
    setCatSlug(cat.slug);
    setCatParent(cat.parent || null);
    setCatDesc(cat.description || '');
    setCatDescEn(cat.description_en || '');
    setCatOrder(cat.display_order || 0);
    setCatNavVisible(cat.is_nav_visible !== false);
    setCategoryModalOpen(true);
  };

  const handleFilterArticlesByCategory = (slug: string) => {
    setArticleSearch(slug);
    setActiveTab('all_articles');
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setSavingCat(true);
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.slug, {
          name: catName,
          name_en: catNameEn,
          slug: catSlug || undefined,
          parent: catParent,
          description: catDesc,
          description_en: catDescEn,
          display_order: catOrder,
          is_nav_visible: catNavVisible,
        });
      } else {
        await api.createCategory({
          name: catName,
          name_en: catNameEn,
          slug: catSlug || undefined,
          parent: catParent,
          description: catDesc,
          description_en: catDescEn,
          display_order: catOrder,
          is_nav_visible: catNavVisible,
        });
      }
      toast.success(editingCategory ? 'ক্যাটাগরি সফলভাবে আপডেট করা হয়েছে!' : 'নতুন ক্যাটাগরি সফলভাবে তৈরি হয়েছে!');
      setCategoryModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (slug: string, name: string) => {
    if (!window.confirm(`Delete category "${name}"? Articles linked to it will not be deleted.`)) return;
    try {
      await api.deleteCategory(slug);
      toast.success(`ক্যাটাগরি "${name}" মুছে ফেলা হয়েছে।`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: User Management (CRUD)
  // --------------------------------------------------------------------------
  const openNewUserModal = () => {
    setNewUsername('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserFirst('');
    setNewUserLast('');
    setNewUserStaff(false);
    setNewUserActive(true);
    setUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserPassword.trim()) return;
    setSavingUser(true);
    try {
      await api.createAdminUser({
        username: newUsername,
        email: newUserEmail,
        password: newUserPassword,
        first_name: newUserFirst,
        last_name: newUserLast,
        is_staff: newUserStaff,
        is_active: newUserActive,
      });
      toast.success(`ব্যবহারকারী "${newUsername}" সফলভাবে তৈরি হয়েছে!`);
      setUserModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleUserRole = async (userId: number) => {
    try {
      await api.toggleUserRole(userId);
      toast.success('ব্যবহারকারীর পদমর্যাদা পরিবর্তিত হয়েছে!');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleUserActive = async (userId: number) => {
    try {
      await api.toggleUserActive(userId);
      toast.success('ব্যবহারকারীর অ্যাকাউন্ট স্ট্যাটাস পরিবর্তিত হয়েছে!');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;
    try {
      await api.deleteAdminUser(userId);
      toast.success(`ব্যবহারকারী "${username}" সফলভাবে মুছে ফেলা হয়েছে।`);
      loadData();
    } catch (err: any) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Comments Moderation
  // --------------------------------------------------------------------------
  const handleToggleCommentApproval = async (id: number) => {
    try {
      await api.toggleCommentApproval(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!window.confirm('Delete this comment permanently?')) return;
    try {
      await api.deleteAdminComment(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Contact Inquiries
  // --------------------------------------------------------------------------
  const handleSetInquiryStatus = async (id: number, newStatus: 'new' | 'in_review' | 'replied' | 'archived') => {
    try {
      await api.setInquiryStatus(id, newStatus);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInquiry = async (id: number) => {
    if (!window.confirm('Delete this inquiry message?')) return;
    try {
      await api.deleteAdminInquiry(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Newsletter Subscribers
  // --------------------------------------------------------------------------
  const handleToggleSubscriber = async (id: number) => {
    try {
      await api.toggleSubscriberActive(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubscriber = async (id: number) => {
    if (!window.confirm('Remove subscriber email?')) return;
    try {
      await api.deleteAdminSubscriber(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Homepage Customization Save
  // --------------------------------------------------------------------------
  const handleSaveCustomization = async () => {
    if (!customization) return;
    setSavingCustomization(true);
    setCustomSuccessMsg('');
    try {
      const updated = await api.updateHomepageCustomization(customization);
      setCustomization(updated);
      const msg = lang === 'en' ? 'Homepage customization saved successfully!' : 'হোমপেজ কাস্টমাইজেশন সফলভাবে সংরক্ষিত হয়েছে!';
      setCustomSuccessMsg(msg);
      toast.success(msg);
      setTimeout(() => setCustomSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCustomization(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Site Settings Save
  // --------------------------------------------------------------------------
  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteSettings) return;
    setSavingSettings(true);
    setSettingsSuccessMsg('');
    try {
      const updated = await api.updateSettings(siteSettings);
      setSiteSettings(updated);
      const msg = lang === 'en' ? 'Site settings saved successfully!' : 'ওয়েবসাইট সেটিংস সফলভাবে সংরক্ষিত হয়েছে!';
      setSettingsSuccessMsg(msg);
      toast.success(msg);
      setTimeout(() => setSettingsSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Hero Slider Management
  // --------------------------------------------------------------------------
  const openNewHeroSlideModal = () => {
    setEditingHeroSlide(null);
    setSlideTitle('');
    setSlideTitleEn('');
    setSlideSubtitle('');
    setSlideSubtitleEn('');
    setSlideImage('/assets/images/18-1024x678.jpg');
    setSlideButtonText(lang === 'en' ? 'Explore Stories' : 'গল্পগুলো দেখুন');
    setSlideButtonTextEn('Explore Stories');
    setSlideButtonLink('');
    setSlideOrder(heroSlides.length);
    setSlideActive(true);
    setHeroSlideModalOpen(true);
  };

  const openEditHeroSlideModal = (slide: HeroSlide) => {
    setEditingHeroSlide(slide);
    setSlideTitle(slide.title || '');
    setSlideTitleEn(slide.title_en || '');
    setSlideSubtitle(slide.subtitle || '');
    setSlideSubtitleEn(slide.subtitle_en || '');
    setSlideImage(slide.image || '/assets/images/18-1024x678.jpg');
    setSlideButtonText(slide.button_text || '');
    setSlideButtonTextEn(slide.button_text_en || '');
    setSlideButtonLink(slide.button_link || '');
    setSlideOrder(slide.display_order ?? 0);
    setSlideActive(slide.is_active);
    setHeroSlideModalOpen(true);
  };

  const handleSaveHeroSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideImage.trim()) {
      toast.warning(
        lang === 'en' ? 'Please provide or upload a banner image.' : 'অনুগ্রহ করে একটি ব্যানার ছবি আপলোড করুন বা লিংক দিন।',
        { title: lang === 'en' ? 'Image Required' : 'ছবি আবশ্যক' }
      );
      return;
    }
    setSavingHeroSlide(true);
    try {
      const finalTitle = slideTitle.trim() || `Banner ${heroSlides.length + 1}`;
      const payload: Partial<HeroSlide> = {
        title: finalTitle,
        title_en: slideTitleEn.trim(),
        subtitle: slideSubtitle.trim(),
        subtitle_en: slideSubtitleEn.trim(),
        image: slideImage.trim(),
        button_text: slideButtonText.trim(),
        button_text_en: slideButtonTextEn.trim(),
        button_link: slideButtonLink.trim(),
        display_order: Number(slideOrder) || 0,
        is_active: slideActive,
      };

      if (editingHeroSlide) {
        const updated = await api.updateHeroSlide(editingHeroSlide.id, payload);
        setHeroSlides((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        const msg = lang === 'en' ? 'Slide updated successfully!' : 'স্লাইড সফলভাবে আপডেট করা হয়েছে!';
        setHeroSlideSuccessMsg(msg);
        toast.success(msg);
      } else {
        const created = await api.createHeroSlide(payload);
        setHeroSlides((prev) => [...prev, created]);
        const msg = lang === 'en' ? 'New slide created successfully!' : 'নতুন স্লাইড সফলভাবে তৈরি করা হয়েছে!';
        setHeroSlideSuccessMsg(msg);
        toast.success(msg);
      }
      setHeroSlideModalOpen(false);
      setTimeout(() => setHeroSlideSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingHeroSlide(false);
    }
  };

  const handleToggleHeroSlideActive = async (id: number) => {
    try {
      const res = await api.toggleHeroSlideActive(id);
      setHeroSlides((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_active: res.is_active } : s))
      );
      toast.success(res.is_active ? 'স্লাইড সক্রিয় করা হয়েছে' : 'স্লাইড নিষ্ক্রিয় করা হয়েছে');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleMoveHeroSlideOrder = async (id: number, direction: 'up' | 'down') => {
    const sorted = [...heroSlides].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sorted.length) return;

    const currentSlide = sorted[idx];
    const targetSlide = sorted[targetIdx];

    try {
      const currentNewOrder = targetSlide.display_order;
      const targetNewOrder = currentSlide.display_order === targetSlide.display_order
        ? (direction === 'up' ? targetSlide.display_order + 1 : targetSlide.display_order - 1)
        : currentSlide.display_order;

      await Promise.all([
        api.updateHeroSlideOrder(currentSlide.id, currentNewOrder),
        api.updateHeroSlideOrder(targetSlide.id, targetNewOrder),
      ]);

      const fresh = await api.getHeroSlides();
      setHeroSlides(fresh);
      toast.success('স্লাইডের ক্রম সফলভাবে সংরক্ষিত হয়েছে');
    } catch (err: any) {
      console.error('Failed to change order', err);
    }
  };

  const handleDeleteHeroSlide = async (id: number, title: string) => {
    if (!window.confirm(lang === 'en' ? `Delete slide "${title}"?` : `"${title}" স্লাইডটি মুছে ফেলতে চান?`)) {
      return;
    }
    try {
      await api.deleteHeroSlide(id);
      setHeroSlides((prev) => prev.filter((s) => s.id !== id));
      const msg = lang === 'en' ? 'Slide removed successfully!' : 'স্লাইডটি মুছে ফেলা হয়েছে!';
      setHeroSlideSuccessMsg(msg);
      toast.success(msg);
      setTimeout(() => setHeroSlideSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
    }
  };

  // Loading state
  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#800020] animate-spin mb-3" />
        <span className="font-bengali text-sm text-gray-500">ড্যাশবোর্ড লোড হচ্ছে...</span>
      </div>
    );
  }

  // Filtered Articles
  const filteredAllArticles = allArticles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(articleSearch.toLowerCase()) ||
      (art.title_en && art.title_en.toLowerCase().includes(articleSearch.toLowerCase())) ||
      art.author_name.toLowerCase().includes(articleSearch.toLowerCase());
    const matchesStatus = articleStatusFilter === 'all' || art.status === articleStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Category KPI Metrics
  const totalCategoriesCount = flatCategories.length || categories.reduce((acc, c) => acc + 1 + (c.subcategories?.length || 0), 0);
  const topLevelCategoriesCount = categories.length;
  const subcategoriesCount = flatCategories.filter(c => c.parent).length || categories.reduce((acc, c) => acc + (c.subcategories?.length || 0), 0);
  const navVisibleCount = flatCategories.filter(c => c.is_nav_visible !== false).length;

  // Filtered & Sorted Tree Categories (Top level)
  const filteredTreeCategories = categories
    .filter((cat) => {
      const searchLower = categorySearch.toLowerCase();
      const parentMatches =
        cat.name.toLowerCase().includes(searchLower) ||
        (cat.name_en && cat.name_en.toLowerCase().includes(searchLower)) ||
        cat.slug.toLowerCase().includes(searchLower);

      const subMatches = cat.subcategories?.some((s) =>
        s.name.toLowerCase().includes(searchLower) ||
        (s.name_en && s.name_en.toLowerCase().includes(searchLower)) ||
        s.slug.toLowerCase().includes(searchLower)
      );

      const matchesSearch = !categorySearch || parentMatches || subMatches;
      if (!matchesSearch) return false;

      if (categoryFilterType === 'top_level') return true;
      if (categoryFilterType === 'subcategories') return (cat.subcategories?.length || 0) > 0;
      if (categoryFilterType === 'nav_visible') return cat.is_nav_visible !== false;
      if (categoryFilterType === 'nav_hidden') return cat.is_nav_visible === false;
      return true;
    })
    .sort((a, b) => {
      if (categorySortBy === 'order_asc') return (a.display_order || 0) - (b.display_order || 0);
      if (categorySortBy === 'order_desc') return (b.display_order || 0) - (a.display_order || 0);
      if (categorySortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (categorySortBy === 'articles_desc') return (b.articles_count || 0) - (a.articles_count || 0);
      return 0;
    });

  // Filtered & Sorted Flat Categories (For Table view)
  const filteredFlatCategories = flatCategories
    .filter((c) => {
      const searchLower = categorySearch.toLowerCase();
      const matchesSearch =
        !categorySearch ||
        c.name.toLowerCase().includes(searchLower) ||
        (c.name_en && c.name_en.toLowerCase().includes(searchLower)) ||
        c.slug.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      if (categoryFilterType === 'top_level') return !c.parent;
      if (categoryFilterType === 'subcategories') return !!c.parent;
      if (categoryFilterType === 'nav_visible') return c.is_nav_visible !== false;
      if (categoryFilterType === 'nav_hidden') return c.is_nav_visible === false;
      return true;
    })
    .sort((a, b) => {
      if (categorySortBy === 'order_asc') return (a.display_order || 0) - (b.display_order || 0);
      if (categorySortBy === 'order_desc') return (b.display_order || 0) - (a.display_order || 0);
      if (categorySortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (categorySortBy === 'articles_desc') return (b.articles_count || 0) - (a.articles_count || 0);
      return 0;
    });

  // Filtered Users
  const filteredUsers = usersList.filter((u) =>
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  // Filtered Comments
  const filteredComments = commentsList.filter((c) =>
    c.content.toLowerCase().includes(commentSearch.toLowerCase()) ||
    c.user_name.toLowerCase().includes(commentSearch.toLowerCase()) ||
    (c.article_title && c.article_title.toLowerCase().includes(commentSearch.toLowerCase()))
  );

  // Filtered Inquiries
  const filteredInquiries = inquiriesList.filter((inq) =>
    inq.name.toLowerCase().includes(inquirySearch.toLowerCase()) ||
    inq.email.toLowerCase().includes(inquirySearch.toLowerCase()) ||
    inq.subject.toLowerCase().includes(inquirySearch.toLowerCase())
  );

  // Filtered Hero Slides
  const filteredHeroSlides = heroSlides
    .filter((s) => {
      const q = heroSlideSearch.toLowerCase();
      return (
        !heroSlideSearch ||
        s.title.toLowerCase().includes(q) ||
        (s.title_en && s.title_en.toLowerCase().includes(q)) ||
        (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
        (s.subtitle_en && s.subtitle_en.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="py-8 bg-[#faf7f2] min-h-screen">
      <div className="madstory-container max-w-7xl mx-auto px-4">
        
        {/* Top Header Banner */}
        <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#800020] text-white flex items-center justify-center text-2xl font-bold font-sans shadow">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1e2022] font-sans">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
                </h1>
                {user?.is_superuser ? (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-sans font-bold uppercase rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Super Admin
                  </span>
                ) : user?.is_staff ? (
                  <span className="px-2 py-0.5 bg-rose-100 text-[#800020] text-[10px] font-sans font-bold uppercase rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Staff Editor
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-sans font-bold uppercase rounded-full">
                    Contributing Author
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-sans mt-0.5">
                {user?.email} • {lang === 'en' ? 'Manage publication, content & system configuration' : 'ম্যাগাজিন কনটেন্ট, পাঠক ও সিস্টেম ব্যবস্থাপনা'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('write')}
              className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <PenSquare className="w-4 h-4" />
              <span>{t('dash.write')}</span>
            </button>
            <Link
              to="/"
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-[#ded7cc] rounded text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
              <span>{lang === 'en' ? 'Live Website' : 'লাইভ সাইট'}</span>
            </Link>
          </div>
        </div>

        {/* Dashboard Layout: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Navigation Sidebar (3 cols) */}
          <aside className="lg:col-span-3 bg-white border border-[#ded7cc] rounded-sm p-3 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[11px] font-sans font-bold uppercase tracking-wider text-gray-400">
              {lang === 'en' ? 'Main Menu' : 'মূল মেনু'}
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                activeTab === 'overview' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>{t('dash.overview')}</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('write')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                activeTab === 'write' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PenSquare className="w-4 h-4" />
                <span>{t('dash.write')}</span>
              </div>
              <PlusCircle className="w-3.5 h-3.5 opacity-70" />
            </button>

            <button
              onClick={() => setActiveTab('my_blogs')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                activeTab === 'my_blogs' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>{t('dash.myBlogs')}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'my_blogs' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                {myBlogs.length}
              </span>
            </button>

            {/* Super Admin / Staff Exclusive Sections */}
            {user?.is_staff && (
              <>
                <div className="pt-4 px-3 py-1.5 text-[11px] font-sans font-bold uppercase tracking-wider text-gray-400 border-t border-gray-100 mt-2">
                  {lang === 'en' ? 'Superadmin Controls' : 'সুপারএডমিন কন্ট্রোল'}
                </div>

                <button
                  onClick={() => setActiveTab('all_articles')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    activeTab === 'all_articles' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4" />
                    <span>{t('dash.allArticles')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'all_articles' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {allArticles.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('approval_queue')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    activeTab === 'approval_queue' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('dash.approval')}</span>
                  </div>
                  {pendingBlogs.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold">
                      {pendingBlogs.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('hero_slider')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    activeTab === 'hero_slider' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>{t('dash.heroSlider')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'hero_slider' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {heroSlides.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    activeTab === 'categories' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FolderTree className="w-4 h-4" />
                    <span>{t('dash.categories')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'categories' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {categories.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    activeTab === 'users' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>{t('dash.users')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'users' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {usersList.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('comments')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    activeTab === 'comments' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>{t('dash.comments')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'comments' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {commentsList.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('inquiries')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    activeTab === 'inquiries' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4" />
                    <span>{t('dash.inquiries')}</span>
                  </div>
                  {stats?.new_inquiries ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold">
                      {stats.new_inquiries} new
                    </span>
                  ) : (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'inquiries' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                      {inquiriesList.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('subscribers')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    activeTab === 'subscribers' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4" />
                    <span>{t('dash.subscribers')}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'subscribers' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                    {subscribersList.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('customization')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    activeTab === 'customization' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4" />
                    <span>{t('dash.customization')}</span>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 opacity-70" />
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-semibold transition ${
                    activeTab === 'settings' ? 'bg-[#800020] text-white shadow-xs' : 'text-gray-700 hover:bg-[#f7f2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4" />
                    <span>{t('dash.siteSettings')}</span>
                  </div>
                </button>
              </>
            )}
          </aside>

          {/* Main Workspace (9 cols) */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* ------------------------------------------------------------- */}
            {/* TAB: OVERVIEW & ANALYTICS                                      */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs">
                    <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1">
                      {lang === 'en' ? 'Published Articles' : 'প্রকাশিত প্রবন্ধ'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-gray-900">
                      {stats?.published_articles || 0}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-sans mt-1 block">
                      Total: {stats?.total_articles || 0} in database
                    </span>
                  </div>

                  <div className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs">
                    <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1">
                      {lang === 'en' ? 'Pending Queue' : 'অনুমোদনের অপেক্ষায়'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-amber-600">
                      {stats?.pending_articles || 0}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-1 block">
                      Needs editor review
                    </span>
                  </div>

                  <div className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs">
                    <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1">
                      {lang === 'en' ? 'Total Views' : 'মোট পাঠ সংখ্যা'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-[#800020]">
                      {stats?.total_views || 0}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-1 block">
                      Cumulative impressions
                    </span>
                  </div>

                  <div className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs">
                    <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1">
                      {lang === 'en' ? 'Hearts & Reactions' : 'পছন্দ ও ভালোবাসা'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-rose-600">
                      {stats?.total_hearts || 0}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-1 block">
                      Reader engagements
                    </span>
                  </div>
                </div>

                {/* Second row of metrics for superadmins */}
                {user?.is_staff && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div
                      onClick={() => setActiveTab('users')}
                      className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs cursor-pointer hover:border-[#800020] transition group"
                    >
                      <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1 group-hover:text-[#800020]">
                        {lang === 'en' ? 'Users & Authors' : 'মোট ব্যবহারকারী'}
                      </span>
                      <div className="text-xl font-bold font-sans text-gray-900">
                        {stats?.total_users || 0}
                      </div>
                      <span className="text-[10px] text-gray-400 font-sans mt-1 block">Click to manage users →</span>
                    </div>

                    <div
                      onClick={() => setActiveTab('comments')}
                      className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs cursor-pointer hover:border-[#800020] transition group"
                    >
                      <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1 group-hover:text-[#800020]">
                        {lang === 'en' ? 'Comments' : 'পাঠকের মন্তব্য'}
                      </span>
                      <div className="text-xl font-bold font-sans text-gray-900">
                        {stats?.total_comments || 0}
                      </div>
                      <span className="text-[10px] text-gray-400 font-sans mt-1 block">Click to moderate →</span>
                    </div>

                    <div
                      onClick={() => setActiveTab('inquiries')}
                      className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs cursor-pointer hover:border-[#800020] transition group"
                    >
                      <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1 group-hover:text-[#800020]">
                        {lang === 'en' ? 'Inquiries Inbox' : 'যোগাযোগ বার্তা'}
                      </span>
                      <div className="text-xl font-bold font-sans text-gray-900">
                        {stats?.total_inquiries || 0}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-sans mt-1 block">{stats?.new_inquiries || 0} unread</span>
                    </div>

                    <div
                      onClick={() => setActiveTab('subscribers')}
                      className="bg-white border border-[#ded7cc] p-4 rounded-sm shadow-xs cursor-pointer hover:border-[#800020] transition group"
                    >
                      <span className="text-[11px] font-sans font-bold uppercase text-gray-400 block mb-1 group-hover:text-[#800020]">
                        {lang === 'en' ? 'Subscribers' : 'নিউজলেটার গ্রাহক'}
                      </span>
                      <div className="text-xl font-bold font-sans text-gray-900">
                        {stats?.total_subscribers || 0}
                      </div>
                      <span className="text-[10px] text-gray-400 font-sans mt-1 block">Active subscribers</span>
                    </div>
                  </div>
                )}

                {/* Quick Action Cards */}
                <div className="bg-white border border-[#ded7cc] p-6 rounded-sm shadow-xs">
                  <h3 className="font-bold text-base text-[#1e2022] mb-4 border-b border-gray-100 pb-2 font-sans">
                    {lang === 'en' ? 'Quick Actions & Management Shortcuts' : 'দ্রুত ব্যবস্থাপনা অ্যাকশন'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                      onClick={() => setActiveTab('write')}
                      className="p-4 rounded border border-[#e2ddd3] hover:border-[#800020] hover:bg-[#fbf9f6] text-left transition flex items-start gap-3"
                    >
                      <PenSquare className="w-5 h-5 text-[#800020] mt-0.5" />
                      <div>
                        <strong className="block text-xs text-gray-900 font-semibold">{t('dash.write')}</strong>
                        <span className="text-[11px] text-gray-500">Draft or publish a rich literary story</span>
                      </div>
                    </button>

                    {user?.is_staff && (
                      <>
                        <button
                          onClick={() => setActiveTab('all_articles')}
                          className="p-4 rounded border border-[#e2ddd3] hover:border-[#800020] hover:bg-[#fbf9f6] text-left transition flex items-start gap-3"
                        >
                          <FileText className="w-5 h-5 text-indigo-600 mt-0.5" />
                          <div>
                            <strong className="block text-xs text-gray-900 font-semibold">{t('dash.allArticles')}</strong>
                            <span className="text-[11px] text-gray-500">Directly edit, publish or delete articles</span>
                          </div>
                        </button>

                        <button
                          onClick={() => setActiveTab('hero_slider')}
                          className="p-4 rounded border border-[#e2ddd3] hover:border-[#800020] hover:bg-[#fbf9f6] text-left transition flex items-start gap-3"
                        >
                          <ImageIcon className="w-5 h-5 text-emerald-600 mt-0.5" />
                          <div>
                            <strong className="block text-xs text-gray-900 font-semibold">{t('dash.heroSlider')}</strong>
                            <span className="text-[11px] text-gray-500">Manage homepage banner slides & CTA links</span>
                          </div>
                        </button>

                        <button
                          onClick={() => setActiveTab('customization')}
                          className="p-4 rounded border border-[#e2ddd3] hover:border-[#800020] hover:bg-[#fbf9f6] text-left transition flex items-start gap-3"
                        >
                          <Sliders className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div>
                            <strong className="block text-xs text-gray-900 font-semibold">{t('dash.customization')}</strong>
                            <span className="text-[11px] text-gray-500">Curate homepage sections & tickers</span>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: ALL ARTICLES (SUPERADMIN FULL CRUD TABLE)                 */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'all_articles' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                      {lang === 'en' ? 'All Articles CMS Management' : 'সকল প্রবন্ধ ব্যবস্থাপনা'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {lang === 'en' ? 'Full control just like Django Admin: change status, toggle editorial badges, edit & delete.' : 'সকল লেখার স্ট্যাটাস পরিবর্তন, এডিট ও ডিলিট করুন।'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('write')}
                    className="px-3 py-1.5 bg-[#800020] text-white rounded text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Add Article' : 'নতুন প্রবন্ধ'}</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search title, author..."
                      value={articleSearch}
                      onChange={(e) => setArticleSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    />
                  </div>
                  <select
                    value={articleStatusFilter}
                    onChange={(e) => setArticleStatusFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans bg-white"
                  >
                    <option value="all">All Statuses</option>
                    <option value="published">Published</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="draft">Draft</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-sans font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Cover</th>
                        <th className="py-2.5 px-3">Title & Details</th>
                        <th className="py-2.5 px-3">Categories</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Editorial Badges</th>
                        <th className="py-2.5 px-3">Stats</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredAllArticles.map((art) => (
                        <tr key={art.id} className="hover:bg-gray-50 transition">
                          <td className="py-2 px-3">
                            <img
                              src={art.image}
                              alt={art.title}
                              className="w-12 h-9 object-cover rounded shadow-xs"
                            />
                          </td>
                          <td className="py-2 px-3 max-w-xs">
                            <Link
                              to={`/post/${art.slug}`}
                              className="font-bold text-gray-900 hover:text-[#800020] line-clamp-1 text-xs"
                              target="_blank"
                            >
                              {art.title}
                            </Link>
                            {art.title_en && (
                              <span className="text-[10px] text-gray-400 block line-clamp-1 font-sans">
                                {art.title_en}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-500 font-sans">
                              By {art.author_name}
                            </span>
                          </td>
                          <td className="py-2 px-3 max-w-[140px]">
                            <div className="flex flex-wrap gap-1">
                              {art.categories && art.categories.length > 0 ? (
                                art.categories.slice(0, 2).map((c) => (
                                  <span key={c.id} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[9px]">
                                    {c.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-[10px]">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={art.status}
                              onChange={(e) => handleSetArticleStatus(art.slug, e.target.value)}
                              className={`px-2 py-1 rounded text-[10px] font-bold font-sans border focus:outline-none ${
                                art.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : art.status === 'pending_approval'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : art.status === 'draft'
                                  ? 'bg-gray-50 text-gray-700 border-gray-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <option value="published">Published</option>
                              <option value="draft">Draft</option>
                              <option value="pending_approval">Pending</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleArticleFlag(art.slug, 'is_featured_hero')}
                                title="Hero Slider Feature"
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                  art.is_featured_hero
                                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                                    : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600'
                                }`}
                              >
                                Hero
                              </button>
                              <button
                                onClick={() => handleToggleArticleFlag(art.slug, 'is_colti_trending')}
                                title="Trending Section"
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                  art.is_colti_trending
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600'
                                }`}
                              >
                                Trending
                              </button>
                              <button
                                onClick={() => handleToggleArticleFlag(art.slug, 'is_nirbachito_choice')}
                                title="Editor Choice"
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                                  art.is_nirbachito_choice
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600'
                                }`}
                              >
                                Choice
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-sans text-[11px] text-gray-500">
                            <div>👁️ {art.view_count || 0}</div>
                            <div>❤️ {art.hearts_count || 0}</div>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditArticleModal(art)}
                                className="p-1.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded transition text-gray-600"
                                title="Edit Article"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <Link
                                to={`/post/${art.slug}`}
                                target="_blank"
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition text-gray-600"
                                title="View Live"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteArticle(art.slug, art.title)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600"
                                title="Delete Article"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: APPROVAL QUEUE                                           */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'approval_queue' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {t('dash.approval')}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {lang === 'en' ? 'Review articles submitted by contributing writers before publication.' : 'লেখকদের জমা দেওয়া লেখা যাচাই ও অনুমোদন করুন।'}
                  </p>
                </div>

                {pendingBlogs.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-semibold text-gray-600">
                      {lang === 'en' ? 'No pending articles in queue' : 'অনুমোদনের জন্য কোনো লেখা বাকি নেই'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">All submissions have been reviewed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingBlogs.map((art) => (
                      <div
                        key={art.id}
                        className="p-4 border border-[#e2ddd3] rounded-sm bg-[#fbf9f6] flex flex-col md:flex-row md:items-start justify-between gap-4"
                      >
                        <div className="flex gap-4">
                          <img
                            src={art.image}
                            alt={art.title}
                            className="w-24 h-20 object-cover rounded flex-shrink-0"
                          />
                          <div>
                            <h3 className="font-bold text-base text-[#1e2022]">
                              {art.title}
                            </h3>
                            {art.title_en && (
                              <h4 className="text-xs text-gray-400 font-sans">{art.title_en}</h4>
                            )}
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                              {art.excerpt}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-sans mt-2">
                              <span>Author: <strong>{art.author_name}</strong></span>
                              <span>•</span>
                              <span>Time: {art.reading_time || '5 min'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                          <button
                            onClick={() => handleApprove(art.slug)}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t('dash.approve')}</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingArticle(art);
                              setRejectReason('');
                            }}
                            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t('dash.reject')}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: WRITE BLOG (WYSIWYG + BILINGUAL)                         */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'write' && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {t('dash.write')}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    {lang === 'en' ? 'Craft articles with rich text formatting, bilingual support, and category tags.' : 'সমৃদ্ধ টেক্সট এডিটর ও দ্বৈত ভাষায় প্রবন্ধ রচনা করুন।'}
                  </p>
                </div>

                {blogSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{blogSuccessMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Titles */}
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          শিরোনাম (বাংলা) <span className="text-[#800020]">*</span>
                          <span className="text-[10px] text-gray-400 font-normal ml-1">
                            {lang === 'en' ? '(or English title)' : '(অথবা ইংরেজি শিরোনাম)'}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="যেমন: সমকালীন শিল্পের গতিপ্রকৃতি..."
                          className={`w-full px-3 py-2 text-xs border rounded focus:outline-none transition-colors ${
                            writeFormAttempted && !newTitle.trim() && !newTitleEn.trim()
                              ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                              : 'border-[#ded7cc] focus:border-[#800020]'
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Title (English) <span className="text-[#800020]">*</span>
                          <span className="text-[10px] text-gray-400 font-normal ml-1">
                            {lang === 'en' ? '(or Bengali title)' : '(অথবা বাংলা শিরোনাম)'}
                          </span>
                        </label>
                        <input
                          type="text"
                          value={newTitleEn}
                          onChange={(e) => setNewTitleEn(e.target.value)}
                          placeholder="e.g. Trends in Contemporary Art..."
                          className={`w-full px-3 py-2 text-xs border rounded focus:outline-none font-sans transition-colors ${
                            writeFormAttempted && !newTitle.trim() && !newTitleEn.trim()
                              ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                              : 'border-[#ded7cc] focus:border-[#800020]'
                          }`}
                        />
                      </div>
                    </div>
                    {writeFormAttempted && !newTitle.trim() && !newTitleEn.trim() && (
                      <p className="text-rose-600 text-[11px] font-bengali mt-1.5 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {lang === 'en'
                            ? 'Please provide a title in at least one language (Bengali or English).'
                            : 'অনুগ্রহ করে অন্তত একটি শিরোনাম প্রদান করুন (বাংলা অথবা ইংরেজি)।'}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Many-to-Many Categories */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      ক্যাটাগরি নির্বাচন (Many-to-Many)
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-3 bg-[#faf7f2] border border-[#ded7cc] rounded max-h-36 overflow-y-auto">
                      {categories.map((c) => {
                        const isSelected = selectedCatIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCatIds(prev =>
                                prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                              );
                            }}
                            className={`px-2.5 py-1 rounded text-xs transition border ${
                              isSelected
                                ? 'bg-[#800020] text-white border-[#800020]'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                            }`}
                          >
                            {c.name} {c.name_en ? `(${c.name_en})` : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        সারসংক্ষেপ (বাংলা)
                      </label>
                      <textarea
                        rows={2}
                        value={newExcerpt}
                        onChange={(e) => setNewExcerpt(e.target.value)}
                        placeholder="প্রবন্ধের সংক্ষিপ্ত ভূমিকা..."
                        className="w-full px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">
                        Excerpt (English)
                      </label>
                      <textarea
                        rows={2}
                        value={newExcerptEn}
                        onChange={(e) => setNewExcerptEn(e.target.value)}
                        placeholder="Brief summary in English..."
                        className="w-full px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                      />
                    </div>
                  </div>

                  {/* Main Rich Text Content (Bengali) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      মূল বিষয়বস্তু (Rich Text Editor - বাংলা) <span className="text-[#800020]">*</span>
                      <span className="text-[10px] text-gray-400 font-normal ml-1">
                        {lang === 'en' ? '(or English content body below)' : '(অথবা নিচের ইংরেজি বক্সে কন্টেন্ট লিখুন)'}
                      </span>
                    </label>
                    <RichTextEditor
                      value={newContent}
                      onChange={setNewContent}
                      placeholder="এখানে বিস্তারিত প্রবন্ধ লিখুন..."
                      error={writeFormAttempted && !isHtmlContentPresent(newContent) && !isHtmlContentPresent(newContentEn)}
                      errorMessage={
                        lang === 'en'
                          ? 'Please write the article content in the editor (in Bengali or English).'
                          : 'অনুগ্রহ করে এডিটরে মূল প্রবন্ধের বক্তব্য বা কন্টেন্ট লিখুন (বাংলা অথবা ইংরেজিতে)।'
                      }
                    />
                  </div>

                  {/* English Rich Text Content */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">
                      Content Body (English Translation - Optional)
                      <span className="text-[10px] text-gray-400 font-normal ml-1">
                        {lang === 'en' ? '(Required if Bengali content is not provided)' : '(বাংলা কন্টেন্ট না দিলে এখানে আবশ্যক)'}
                      </span>
                    </label>
                    <RichTextEditor
                      value={newContentEn}
                      onChange={setNewContentEn}
                      placeholder="Write full article in English..."
                      error={writeFormAttempted && !isHtmlContentPresent(newContent) && !isHtmlContentPresent(newContentEn)}
                    />
                  </div>

                  {/* Cover Image Upload (Cloudflare R2) & Reading time */}
                  <div className="space-y-4">
                    <ImageUpload
                      value={newCoverUrl}
                      onChange={setNewCoverUrl}
                      label={lang === 'en' ? 'Article Cover Image (Cloudflare R2)' : 'প্রবন্ধের কভার ছবি (ক্লাউডফ্লেয়ার R2)'}
                      helperText={lang === 'en' ? 'Upload high-resolution image directly to Cloudflare R2 storage' : 'সরাসরি ক্লাউডফ্লেয়ার R2 তে উচ্চ-রেজোলিউশনের ছবি আপলোড করুন'}
                      aspectRatio="video"
                      presets={[
                        { label: 'Living Room', url: '/assets/images/18-1024x678.jpg' },
                        { label: 'Tropical Island', url: '/assets/images/beach_resort_paradise_island_aerial_drone_top_view_summer_tropical_nature_landscape_holiday_travel_vacation-1024x683.jpg' },
                        { label: 'Architectural House', url: '/assets/images/shutterstock_398822470-1024x683.jpg' },
                        { label: 'Modern Interior', url: '/assets/images/Modern_living_room_interior_design_3d_render_illustration_7-1024x576.jpg' },
                      ]}
                    />

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {lang === 'en' ? 'Estimated Reading Time' : 'পাঠের আনুমানিক সময় (Reading Time)'}
                      </label>
                      <input
                        type="text"
                        value={readingTime}
                        onChange={(e) => setReadingTime(e.target.value)}
                        className="w-full sm:w-1/2 px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                      />
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                    {user?.is_staff ? (
                      <>
                        <button
                          type="button"
                          disabled={savingBlog}
                          onClick={() => handleCreateBlog('published')}
                          className="px-5 py-2.5 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                        >
                          {savingBlog ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          <span>সরাসরি প্রকাশ করুন (Publish Now)</span>
                        </button>
                        <button
                          type="button"
                          disabled={savingBlog}
                          onClick={() => handleCreateBlog('draft')}
                          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
                        >
                          <span>খসড়া হিসেবে রাখুন (Save Draft)</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={savingBlog}
                        onClick={() => handleCreateBlog('pending_approval')}
                        className="px-5 py-2.5 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                      >
                        {savingBlog ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        <span>অনুমোদনের জন্য জমা দিন (Submit for Review)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: MY BLOGS                                                 */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'my_blogs' && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {t('dash.myBlogs')}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    Articles created by your account.
                  </p>
                </div>

                {myBlogs.length === 0 ? (
                  <div className="py-12 text-center text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">You haven't written any articles yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {myBlogs.map((art) => (
                      <div key={art.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={art.image}
                            alt={art.title}
                            className="w-14 h-11 object-cover rounded shadow-xs"
                          />
                          <div>
                            <Link to={`/post/${art.slug}`} className="font-bold text-gray-900 hover:text-[#800020] text-xs">
                              {art.title}
                            </Link>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-sans mt-0.5">
                              <span>Views: {art.view_count || 0}</span>
                              <span>•</span>
                              <span>Hearts: {art.hearts_count || 0}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase ${
                            art.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800'
                              : art.status === 'pending_approval'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {art.status}
                          </span>
                          <button
                            onClick={() => openEditArticleModal(art)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: HERO BANNER SLIDER (DEDICATED IMAGES SLIDER MODULE)     */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'hero_slider' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-[#800020]" />
                      <span>{lang === 'en' ? 'Hero Banner Slider Management' : 'হিরো ব্যানার স্লাইডার ব্যবস্থাপনা'}</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">
                      {lang === 'en'
                        ? 'Manage pure homepage visual banner slides and their destination links. Clicking the banner image navigates to the specified URL.'
                        : 'হোমপেজের মূল ভিজ্যুয়াল ব্যানার স্লাইডার ও ব্যানারের লিঙ্ক নিয়ন্ত্রণ করুন। ব্যানারের ছবিতে ক্লিক করলে নির্ধারিত পেজ বা লিঙ্কে যাবে।'}
                    </p>
                  </div>
                  <button
                    onClick={openNewHeroSlideModal}
                    className="px-4 py-2 bg-[#800020] hover:bg-[#600018] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Add New Slide' : 'নতুন স্লাইড যোগ করুন'}</span>
                  </button>
                </div>

                {/* Success Notification */}
                {heroSlideSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs font-sans text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{heroSlideSuccessMsg}</span>
                  </div>
                )}

                {/* KPI Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#faf7f2] border border-[#e2ddd3] p-4 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-500 block mb-1">
                      {lang === 'en' ? 'Total Slides' : 'মোট স্লাইড'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-gray-900">
                      {heroSlides.length}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-0.5 block">
                      {lang === 'en' ? 'In database repository' : 'ডাটাবেজে সংরক্ষিত স্লাইড'}
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#e2ddd3] p-4 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-500 block mb-1">
                      {lang === 'en' ? 'Active on Homepage' : 'হোমপেজে সক্রিয়'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-emerald-700">
                      {heroSlides.filter((s) => s.is_active).length}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-sans mt-0.5 block">
                      {lang === 'en' ? 'Currently cycling in slider' : 'বর্তমানে স্লাইডারে দৃশ্যমান'}
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#e2ddd3] p-4 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-500 block mb-1">
                      {lang === 'en' ? 'Inactive / Draft' : 'নিষ্ক্রিয় বা খসড়া'}
                    </span>
                    <div className="text-2xl font-bold font-sans text-gray-400">
                      {heroSlides.filter((s) => !s.is_active).length}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans mt-0.5 block">
                      {lang === 'en' ? 'Hidden from homepage' : 'হোমপেজে প্রদর্শিত হচ্ছে না'}
                    </span>
                  </div>
                </div>

                {/* Search & Order Information Note */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={lang === 'en' ? 'Search slides by title or subtitle...' : 'শিরোনাম বা সাবটাইটেল দিয়ে স্লাইড খুঁজুন...'}
                      value={heroSlideSearch}
                      onChange={(e) => setHeroSlideSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white font-sans"
                    />
                  </div>
                  <div className="text-[11px] font-sans text-gray-500 bg-[#fbf9f6] border border-[#e8e2d8] px-3 py-2 rounded flex items-center gap-1.5 shrink-0">
                    <AlertCircle className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                    <span>{lang === 'en' ? 'Use ▲ / ▼ arrows to reorder. Active slides cycle automatically on homepage.' : 'ক্রম সাজাতে ▲ / ▼ ব্যবহার করুন। সক্রিয় স্লাইডগুলো সাইটে স্বয়ংক্রিয়ভাবে চলবে।'}</span>
                  </div>
                </div>

                {/* Slides List */}
                {filteredHeroSlides.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-[#ded7cc] rounded-sm bg-[#faf7f2]">
                    <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-sans font-semibold text-gray-600">
                      {lang === 'en' ? 'No hero slides found.' : 'কোনো হিরো স্লাইড পাওয়া যায়নি।'}
                    </p>
                    <button
                      onClick={openNewHeroSlideModal}
                      className="mt-3 px-3.5 py-1.5 bg-[#800020] text-white rounded text-xs font-semibold hover:bg-[#600018] transition"
                    >
                      {lang === 'en' ? 'Create First Hero Slide' : 'প্রথম হিরো স্লাইড তৈরি করুন'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredHeroSlides.map((slide, index) => (
                      <div
                        key={slide.id}
                        className={`p-4 border rounded-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          slide.is_active
                            ? 'bg-white border-[#ded7cc] hover:border-[#800020]/40 shadow-xs'
                            : 'bg-gray-50/70 border-gray-200 opacity-75'
                        }`}
                      >
                        {/* Left: Reorder arrows & Sequence badge */}
                        <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleMoveHeroSlideOrder(slide.id, 'up')}
                              disabled={index === 0}
                              className={`p-1 rounded transition border ${
                                index === 0
                                  ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black'
                              }`}
                              title={lang === 'en' ? 'Move up in sequence' : 'উপরে সরান'}
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveHeroSlideOrder(slide.id, 'down')}
                              disabled={index === filteredHeroSlides.length - 1}
                              className={`p-1 rounded transition border ${
                                index === filteredHeroSlides.length - 1
                                  ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-black'
                              }`}
                              title={lang === 'en' ? 'Move down in sequence' : 'নিচে সরান'}
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="w-8 h-8 rounded bg-[#faf7f2] border border-[#e2ddd3] flex items-center justify-center font-mono font-bold text-xs text-gray-700">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Slide Image Thumbnail */}
                        <div className="relative w-full md:w-48 h-28 shrink-0 rounded overflow-hidden border border-[#ded7cc] bg-black/5 group">
                          <img
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/images/18-1024x678.jpg';
                            }}
                          />
                          <a
                            href={slide.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-1.5 right-1.5 p-1 bg-black/60 hover:bg-black/80 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition"
                            title={lang === 'en' ? 'View high-res image' : 'আসল ছবি দেখুন'}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Content details */}
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-sans font-bold text-sm sm:text-base text-gray-900 truncate">
                              {slide.title || 'Banner Slide'}
                            </h3>
                            {slide.title_en && (
                              <span className="text-[11px] font-sans text-gray-500 font-medium truncate">
                                ({slide.title_en})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f7f2eb] border border-[#e2ddd3] text-xs font-sans text-gray-800">
                              <span className="font-semibold text-[#800020]">{lang === 'en' ? 'Link on Image:' : 'ছবির লিঙ্ক:'}</span>
                              <span className="font-mono text-[11px] text-gray-700 truncate max-w-xs">
                                {slide.button_link || slide.link || '(No link - static image)'}
                              </span>
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              Order: {slide.display_order}
                            </span>
                          </div>
                        </div>

                        {/* Status Toggle & Actions */}
                        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                          {/* Active Toggle */}
                          <button
                            onClick={() => handleToggleHeroSlideActive(slide.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans font-semibold transition border ${
                              slide.is_active
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                            }`}
                            title={lang === 'en' ? 'Toggle active visibility on homepage' : 'হোমপেজে দৃশ্যমানতা পরিবর্তন করুন'}
                          >
                            {slide.is_active ? (
                              <>
                                <ToggleRight className="w-4 h-4 text-emerald-600" />
                                <span>{lang === 'en' ? 'Active' : 'সক্রিয়'}</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                                <span>{lang === 'en' ? 'Hidden' : 'লুকায়িত'}</span>
                              </>
                            )}
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => openEditHeroSlideModal(slide)}
                            className="p-1.5 bg-[#faf7f2] hover:bg-[#f2ece1] text-gray-700 border border-[#ded7cc] rounded transition"
                            title={lang === 'en' ? 'Edit slide' : 'সম্পাদনা করুন'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDeleteHeroSlide(slide.id, slide.title)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded transition"
                            title={lang === 'en' ? 'Delete slide' : 'মুছে ফেলুন'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: CATEGORIES MANAGEMENT (IMPROVED HIERARCHY & CONTROLS)    */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'categories' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                
                {/* Header & Stats Overview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-[#800020]" />
                      <span>{lang === 'en' ? 'Category Taxonomy & Navigation Architecture' : 'ক্যাটাগরি ও ন্যাভিগেশন স্থাপত্য'}</span>
                    </h2>
                    <p className="text-xs text-gray-500 font-sans mt-0.5">
                      {lang === 'en'
                        ? 'Organize hierarchical sections, configure navbar order, and manage bilingual descriptions.'
                        : 'মূল বিভাগ ও উপ-বিভাগ সাজান, মেন্যু বিন্যাস করুন ও দ্বৈত ভাষার বিবরণ নিয়ন্ত্রণ করুন।'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={openNewCategoryModal}
                      className="px-3.5 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'New Top Category' : 'নতুন মূল বিভাগ'}</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-[#faf7f2] border border-[#ded7cc] p-3 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-400 block mb-0.5">
                      {lang === 'en' ? 'Total Categories' : 'মোট ক্যাটাগরি'}
                    </span>
                    <div className="text-xl font-bold font-sans text-gray-900">
                      {totalCategoriesCount}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans">
                      All taxonomy records
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#ded7cc] p-3 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-400 block mb-0.5">
                      {lang === 'en' ? 'Primary Sections' : 'মূল বিভাগসমূহ'}
                    </span>
                    <div className="text-xl font-bold font-sans text-[#800020]">
                      {topLevelCategoriesCount}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans">
                      Top-level parents
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#ded7cc] p-3 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-400 block mb-0.5">
                      {lang === 'en' ? 'Sub-categories' : 'উপ-বিভাগসমূহ'}
                    </span>
                    <div className="text-xl font-bold font-sans text-indigo-700">
                      {subcategoriesCount}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans">
                      Nested sub-sections
                    </span>
                  </div>

                  <div className="bg-[#faf7f2] border border-[#ded7cc] p-3 rounded-sm">
                    <span className="text-[10px] font-sans font-bold uppercase text-gray-400 block mb-0.5">
                      {lang === 'en' ? 'Navbar Visible' : 'ন্যাভবারে দৃশ্যমান'}
                    </span>
                    <div className="text-xl font-bold font-sans text-emerald-700">
                      {navVisibleCount}
                    </div>
                    <span className="text-[10px] text-gray-500 font-sans">
                      Active on menu bar
                    </span>
                  </div>
                </div>

                {/* Filter & View Mode Controls Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#f7f2eb] border border-[#ded7cc] rounded-sm">
                  {/* Left: View Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded border border-[#ded7cc]">
                    <button
                      onClick={() => setCategoryViewMode('tree')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                        categoryViewMode === 'tree'
                          ? 'bg-[#800020] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Hierarchy Tree' : 'শাখা বিন্যাস (Tree)'}</span>
                    </button>
                    <button
                      onClick={() => setCategoryViewMode('table')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition ${
                        categoryViewMode === 'table'
                          ? 'bg-[#800020] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Table View' : 'টেবিল ভিউ'}</span>
                    </button>
                  </div>

                  {/* Center & Right: Search, Filter, Sort */}
                  <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                    {/* Search */}
                    <div className="relative min-w-[180px] max-w-xs flex-1">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search category, English name, slug..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-white border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                      />
                      {categorySearch && (
                        <button
                          onClick={() => setCategorySearch('')}
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter Type */}
                    <select
                      value={categoryFilterType}
                      onChange={(e) => setCategoryFilterType(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    >
                      <option value="all">All Categories</option>
                      <option value="top_level">Primary Sections Only</option>
                      <option value="subcategories">Sub-categories Only</option>
                      <option value="nav_visible">Navbar Visible Only</option>
                      <option value="nav_hidden">Hidden from Navbar</option>
                    </select>

                    {/* Sort By */}
                    <select
                      value={categorySortBy}
                      onChange={(e) => setCategorySortBy(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs bg-white border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    >
                      <option value="order_asc">Order (Low → High)</option>
                      <option value="order_desc">Order (High → Low)</option>
                      <option value="name_asc">Name (A → Z)</option>
                      <option value="articles_desc">Articles (Most First)</option>
                    </select>
                  </div>
                </div>

                {/* --------------------------------------------------------- */}
                {/* VIEW 1: HIERARCHY TREE VIEW                                */}
                {/* --------------------------------------------------------- */}
                {categoryViewMode === 'tree' ? (
                  <div className="space-y-4">
                    {filteredTreeCategories.length === 0 ? (
                      <div className="py-12 text-center text-gray-400 border border-gray-100 rounded-sm">
                        <FolderTree className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#800020]" />
                        <p className="text-sm font-semibold text-gray-600">
                          {lang === 'en' ? 'No categories matching the filter' : 'কোনো ক্যাটাগরি পাওয়া যায়নি'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Try resetting search or filter options.</p>
                      </div>
                    ) : (
                      filteredTreeCategories.map((parent) => {
                        const isCollapsed = collapsedParentIds.includes(parent.id);
                        const hasSubs = parent.subcategories && parent.subcategories.length > 0;

                        return (
                          <div
                            key={parent.id}
                            className="border border-[#ded7cc] rounded-sm bg-white overflow-hidden shadow-2xs hover:border-[#800020]/40 transition"
                          >
                            {/* Parent Category Card Header */}
                            <div className="p-4 bg-[#fcfbf9] border-b border-[#ded7cc] flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-start md:items-center gap-3">
                                {hasSubs ? (
                                  <button
                                    onClick={() => toggleCollapseParent(parent.id)}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-600 transition mt-0.5 md:mt-0"
                                    title={isCollapsed ? 'Expand subcategories' : 'Collapse subcategories'}
                                  >
                                    {isCollapsed ? (
                                      <ChevronRight className="w-4 h-4 text-[#800020]" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-[#800020]" />
                                    )}
                                  </button>
                                ) : (
                                  <div className="w-6 h-6 flex items-center justify-center text-gray-300">
                                    •
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center flex-wrap gap-2">
                                    <h3 className="font-bold text-sm text-[#1e2022]">
                                      {parent.name}
                                    </h3>
                                    {parent.name_en && (
                                      <span className="text-xs text-gray-400 font-sans">
                                        ({parent.name_en})
                                      </span>
                                    )}
                                    <code className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                                      /{parent.slug}
                                    </code>
                                    {hasSubs && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        {parent.subcategories?.length} sub-sections
                                      </span>
                                    )}
                                  </div>

                                  {parent.description && (
                                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-1 max-w-xl">
                                      {parent.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Parent Quick Actions & Toggles */}
                              <div className="flex items-center flex-wrap gap-2 self-end md:self-center">
                                {/* Article Count Pill */}
                                <button
                                  onClick={() => handleFilterArticlesByCategory(parent.slug)}
                                  className="px-2 py-0.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded text-[11px] font-sans text-gray-700 font-semibold transition"
                                  title="View articles linked to this category"
                                >
                                  {parent.articles_count || 0} articles
                                </button>

                                {/* Order & Reorder Arrows */}
                                <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-[#ded7cc] text-[11px] font-sans font-bold text-gray-700">
                                  <span>#{parent.display_order}</span>
                                  <button
                                    onClick={() => handleMoveCategoryOrder(parent, -1)}
                                    className="p-0.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveCategoryOrder(parent, 1)}
                                    className="p-0.5 hover:bg-gray-100 rounded text-gray-500 hover:text-black"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* 1-Click Navbar Toggle */}
                                <button
                                  onClick={() => handleToggleCategoryNav(parent)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase border transition flex items-center gap-1 ${
                                    parent.is_nav_visible !== false
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                  }`}
                                  title="Toggle visibility in top navigation bar"
                                >
                                  {parent.is_nav_visible !== false ? '✓ In Nav' : '✕ Hidden'}
                                </button>

                                {/* Add Subcategory */}
                                <button
                                  onClick={() => openAddSubcategoryModal(parent)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                                  title="Add a subcategory directly under this parent"
                                >
                                  <PlusCircle className="w-3 h-3" />
                                  <span>Sub-category</span>
                                </button>

                                {/* Live Link */}
                                <Link
                                  to={`/category/${parent.slug}`}
                                  target="_blank"
                                  className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition"
                                  title="View on Live Website"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>

                                {/* Edit */}
                                <button
                                  onClick={() => openEditCategoryModal(parent)}
                                  className="p-1.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded text-gray-600 transition"
                                  title="Edit category"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteCategory(parent.slug, parent.name)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded text-rose-600 transition"
                                  title="Delete category"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Subcategories Branch List */}
                            {hasSubs && !isCollapsed && (
                              <div className="p-3 bg-white divide-y divide-gray-100">
                                {parent.subcategories?.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#faf7f2] rounded transition group"
                                  >
                                    <div className="flex items-center gap-2.5 pl-4 border-l-2 border-[#800020]/20">
                                      <CornerDownRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#800020] transition-colors" />
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-xs text-gray-800">
                                            {sub.name}
                                          </span>
                                          {sub.name_en && (
                                            <span className="text-[11px] text-gray-400 font-sans">
                                              ({sub.name_en})
                                            </span>
                                          )}
                                          <code className="text-[9px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded font-mono">
                                            /{sub.slug}
                                          </code>
                                        </div>
                                        {sub.description && (
                                          <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                                            {sub.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Subcategory Action Buttons */}
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                      <button
                                        onClick={() => handleFilterArticlesByCategory(sub.slug)}
                                        className="px-2 py-0.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded text-[10px] font-sans text-gray-600 transition"
                                      >
                                        {sub.articles_count || 0} articles
                                      </button>

                                      <span className="text-[10px] text-gray-400 font-sans">
                                        #{sub.display_order}
                                      </span>

                                      <Link
                                        to={`/category/${sub.slug}`}
                                        target="_blank"
                                        className="p-1 text-gray-400 hover:text-gray-700"
                                        title="View Live"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </Link>

                                      <button
                                        onClick={() => openEditCategoryModal(sub)}
                                        className="p-1 text-gray-500 hover:text-[#800020]"
                                        title="Edit subcategory"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>

                                      <button
                                        onClick={() => handleDeleteCategory(sub.slug, sub.name)}
                                        className="p-1 text-gray-400 hover:text-rose-600"
                                        title="Delete subcategory"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  /* --------------------------------------------------------- */
                  /* VIEW 2: FLAT TABULAR DATA VIEW                            */
                  /* --------------------------------------------------------- */
                  <div className="overflow-x-auto border border-gray-100 rounded-sm">
                    <table className="w-full text-left text-xs font-sans">
                      <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Name (BN & EN)</th>
                          <th className="py-2.5 px-3">Type & Parent</th>
                          <th className="py-2.5 px-3">Slug Route</th>
                          <th className="py-2.5 px-3">Display Order</th>
                          <th className="py-2.5 px-3">Navbar Status</th>
                          <th className="py-2.5 px-3">Articles</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredFlatCategories.map((cat) => (
                          <tr key={cat.id} className="hover:bg-gray-50 transition">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-gray-900">{cat.name}</div>
                              {cat.name_en && (
                                <span className="text-[10px] text-gray-400 font-normal block">{cat.name_en}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {cat.parent ? (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold">
                                  Sub-category
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold">
                                  Primary Section
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-gray-600 font-mono text-[11px]">
                              /{cat.slug}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1 font-bold">
                                <span>#{cat.display_order}</span>
                                <button
                                  onClick={() => handleMoveCategoryOrder(cat, -1)}
                                  className="p-0.5 text-gray-400 hover:text-black"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMoveCategoryOrder(cat, 1)}
                                  className="p-0.5 text-gray-400 hover:text-black"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => handleToggleCategoryNav(cat)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans uppercase border transition ${
                                  cat.is_nav_visible !== false
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-gray-100 text-gray-500 border-gray-200'
                                }`}
                              >
                                {cat.is_nav_visible !== false ? '✓ In Nav' : '✕ Hidden'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => handleFilterArticlesByCategory(cat.slug)}
                                className="px-2 py-0.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded text-[10px] text-gray-700 transition"
                              >
                                {cat.articles_count || 0}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  to={`/category/${cat.slug}`}
                                  target="_blank"
                                  className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition"
                                  title="View on site"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                                <button
                                  onClick={() => openEditCategoryModal(cat)}
                                  className="p-1.5 bg-gray-100 hover:bg-[#800020] hover:text-white rounded transition text-gray-600"
                                  title="Edit"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.slug, cat.name)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: USERS MANAGEMENT (SUPERADMIN FULL CONTROL)               */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'users' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                      {lang === 'en' ? 'User Directory & Role Management' : 'ব্যবহারকারী ও রোল নিয়ন্ত্রণ'}
                    </h2>
                    <p className="text-xs text-gray-500 font-sans">
                      Superadmins can create users, change staff permissions, and toggle active status.
                    </p>
                  </div>
                  <button
                    onClick={openNewUserModal}
                    className="px-3 py-1.5 bg-[#800020] text-white rounded text-xs font-semibold flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Create User' : 'নতুন ব্যবহারকারী'}</span>
                  </button>
                </div>

                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                  />
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Username & Email</th>
                        <th className="py-2.5 px-3">Full Name</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Articles</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">
                            <div>{u.username}</div>
                            <span className="text-[10px] text-gray-400 font-normal">{u.email || 'No email'}</span>
                          </td>
                          <td className="py-2.5 px-3 text-gray-700">
                            {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleToggleUserRole(u.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition border ${
                                u.is_superuser
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : u.is_staff
                                  ? 'bg-rose-50 text-[#800020] border-rose-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:border-gray-400'
                              }`}
                              title="Click to toggle staff privilege"
                            >
                              {u.is_superuser ? 'Super Admin' : u.is_staff ? 'Staff / Editor' : 'Author'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleToggleUserActive(u.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                                u.is_active !== false
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-gray-200 text-gray-600 line-through'
                              }`}
                              title="Click to toggle active/inactive"
                            >
                              {u.is_active !== false ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">{u.articles_count || 0}</td>
                          <td className="py-2.5 px-3 text-right">
                            {u.id !== user?.id && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.username)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: COMMENTS MODERATION                                      */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'comments' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {lang === 'en' ? 'Reader Comments Moderation' : 'মন্তব্য নিয়ন্ত্রণ ও মডারেশন'}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    Approve reader reviews or delete spam comments across all published articles.
                  </p>
                </div>

                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search comment text, author, or article..."
                    value={commentSearch}
                    onChange={(e) => setCommentSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                  />
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Article</th>
                        <th className="py-2.5 px-3">User</th>
                        <th className="py-2.5 px-3">Comment Text</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredComments.map((com) => (
                        <tr key={com.id} className="hover:bg-gray-50 transition">
                          <td className="py-2 px-3 max-w-[140px] truncate">
                            <span className="font-semibold text-gray-800">{com.article_title || 'Article'}</span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-gray-900">{com.user_name}</td>
                          <td className="py-2 px-3 max-w-xs text-gray-700 font-serif">
                            "{com.content}"
                          </td>
                          <td className="py-2 px-3">
                            <button
                              onClick={() => handleToggleCommentApproval(com.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                com.is_approved !== false
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {com.is_approved !== false ? 'Approved' : 'Pending'}
                            </button>
                          </td>
                          <td className="py-2 px-3 text-gray-400 text-[11px]">
                            {new Date(com.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => handleDeleteComment(com.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: CONTACT INQUIRIES                                        */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'inquiries' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {lang === 'en' ? 'Contact Inquiries & Submissions Inbox' : 'পাঠক অনুসন্ধান ও যোগাযোগ ইনবক্স'}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    Inquiries submitted through the Contact & Editorial Desk form.
                  </p>
                </div>

                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by sender, email, subject..."
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                  />
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Sender</th>
                        <th className="py-2.5 px-3">Subject & Message</th>
                        <th className="py-2.5 px-3">Phone</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInquiries.map((inq) => (
                        <tr key={inq.id} className="hover:bg-gray-50 transition">
                          <td className="py-2 px-3 font-semibold text-gray-900">
                            <div>{inq.name}</div>
                            <span className="text-[10px] text-gray-400 font-normal">{inq.email}</span>
                          </td>
                          <td
                            className="py-2 px-3 max-w-xs cursor-pointer hover:text-[#800020]"
                            onClick={() => setViewingInquiry(inq)}
                          >
                            <strong className="block text-gray-800 text-xs font-medium">{inq.subject}</strong>
                            <p className="text-gray-500 line-clamp-1 text-[11px]">{inq.message}</p>
                          </td>
                          <td className="py-2 px-3 text-gray-600">{inq.phone || '-'}</td>
                          <td className="py-2 px-3">
                            <select
                              value={inq.status}
                              onChange={(e) => handleSetInquiryStatus(inq.id, e.target.value as any)}
                              className="px-2 py-1 rounded text-[10px] font-bold border focus:outline-none bg-white"
                            >
                              <option value="new">New</option>
                              <option value="in_review">In Review</option>
                              <option value="replied">Replied</option>
                              <option value="archived">Archived</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-gray-400 text-[11px]">
                            {new Date(inq.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingInquiry(inq)}
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition"
                                title="View Message"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteInquiry(inq.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: SUBSCRIBERS                                              */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'subscribers' && user?.is_staff && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                    {lang === 'en' ? 'Newsletter Subscribers List' : 'নিউজলেটার গ্রাহক তালিকা'}
                  </h2>
                  <p className="text-xs text-gray-500 font-sans">
                    Manage reader email subscriptions and marketing outreach.
                  </p>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded">
                  <table className="w-full text-left text-xs font-sans">
                    <thead className="bg-[#f7f2eb] border-b border-[#ded7cc] text-gray-700 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Subscriber Email</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Subscribed Date</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {subscribersList.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50 transition">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{sub.email}</td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => handleToggleSubscriber(sub.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.is_active ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500 line-through'
                              }`}
                            >
                              {sub.is_active ? 'Active' : 'Unsubscribed'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-gray-400 text-[11px]">
                            {new Date(sub.subscribed_at).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white rounded transition text-rose-600"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: HOMEPAGE CUSTOMIZATION                                   */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'customization' && user?.is_staff && customization && (
              <div className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                      {t('dash.customization')}
                    </h2>
                    <p className="text-xs text-gray-500 font-sans">
                      Control ticker news, homepage sections, visibility toggles and curation.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveCustomization}
                    disabled={savingCustomization}
                    className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    {savingCustomization ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{lang === 'en' ? 'Save Changes' : 'পরিবর্তন সংরক্ষণ করুন'}</span>
                  </button>
                </div>

                {customSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2 font-sans">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{customSuccessMsg}</span>
                  </div>
                )}

                {/* Section Visibility Switches */}
                <div className="p-4 bg-[#faf7f2] border border-[#ded7cc] rounded-sm space-y-3">
                  <h4 className="font-bold text-xs uppercase font-sans text-gray-700 tracking-wider">
                    {lang === 'en' ? 'Section Visibility Toggles' : 'সেকশন দৃশ্যমানতা টগল'}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-sans">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_hero}
                        onChange={(e) => setCustomization({ ...customization, show_hero: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Hero Slider</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_lead}
                        onChange={(e) => setCustomization({ ...customization, show_lead: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Lead Story Section</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_art_culture}
                        onChange={(e) => setCustomization({ ...customization, show_art_culture: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Art & Culture Section</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_category_blocks}
                        onChange={(e) => setCustomization({ ...customization, show_category_blocks: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Category Grid Blocks</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customization.show_sidebar}
                        onChange={(e) => setCustomization({ ...customization, show_sidebar: e.target.checked })}
                        className="rounded text-[#800020] focus:ring-[#800020]"
                      />
                      <span>Sidebar (Popular & Socials)</span>
                    </label>
                  </div>
                </div>

                {/* Ticker Headlines */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      টিকার হেডলাইন (বাংলা)
                    </label>
                    <textarea
                      rows={2}
                      value={customization.ticker_text_bn}
                      onChange={(e) => setCustomization({ ...customization, ticker_text_bn: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">
                      Ticker Headlines (English)
                    </label>
                    <textarea
                      rows={2}
                      value={customization.ticker_text_en}
                      onChange={(e) => setCustomization({ ...customization, ticker_text_en: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-sans"
                    />
                  </div>
                </div>

                {/* Section Titles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Trending Section Title (BN)</label>
                    <input
                      type="text"
                      value={customization.colti_title_bn}
                      onChange={(e) => setCustomization({ ...customization, colti_title_bn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Trending Section Title (EN)</label>
                    <input
                      type="text"
                      value={customization.colti_title_en}
                      onChange={(e) => setCustomization({ ...customization, colti_title_en: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Editor's Choice Title (BN)</label>
                    <input
                      type="text"
                      value={customization.nirbachito_title_bn}
                      onChange={(e) => setCustomization({ ...customization, nirbachito_title_bn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Editor's Choice Title (EN)</label>
                    <input
                      type="text"
                      value={customization.nirbachito_title_en}
                      onChange={(e) => setCustomization({ ...customization, nirbachito_title_en: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* TAB: SITE SETTINGS (BRANDING, SOCIAL, CONTACT INFO)            */}
            {/* ------------------------------------------------------------- */}
            {activeTab === 'settings' && user?.is_staff && siteSettings && (
              <form onSubmit={handleSaveSiteSettings} className="bg-white border border-[#ded7cc] rounded-sm p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-[#1e2022] font-sans">
                      {lang === 'en' ? 'Website Configuration & Branding' : 'ওয়েবসাইট কনফিগারেশন ও ব্র্যান্ডিং'}
                    </h2>
                    <p className="text-xs text-gray-500 font-sans">
                      Control site branding, logos, social media links, and footer coordinates.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{lang === 'en' ? 'Save Settings' : 'সেটিংস সংরক্ষণ করুন'}</span>
                  </button>
                </div>

                {settingsSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2 font-sans">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{settingsSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Site Name</label>
                    <input
                      type="text"
                      value={siteSettings.site_name}
                      onChange={(e) => setSiteSettings({ ...siteSettings, site_name: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={siteSettings.email}
                      onChange={(e) => setSiteSettings({ ...siteSettings, email: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tagline (Bengali)</label>
                    <input
                      type="text"
                      value={siteSettings.tagline_bn}
                      onChange={(e) => setSiteSettings({ ...siteSettings, tagline_bn: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Tagline (English)</label>
                    <input
                      type="text"
                      value={siteSettings.tagline_en}
                      onChange={(e) => setSiteSettings({ ...siteSettings, tagline_en: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Helpline Phone</label>
                    <input
                      type="text"
                      value={siteSettings.phone}
                      onChange={(e) => setSiteSettings({ ...siteSettings, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Office Address</label>
                    <input
                      type="text"
                      value={siteSettings.address}
                      onChange={(e) => setSiteSettings({ ...siteSettings, address: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                    <ImageUpload
                      value={siteSettings.logo_bn_url || ''}
                      onChange={(url) => setSiteSettings({ ...siteSettings, logo_bn_url: url })}
                      label={lang === 'en' ? 'Bengali Logo (Cloudflare R2)' : 'বাংলা সাইট লোগো (ক্লাউডফ্লেয়ার R2)'}
                      helperText={lang === 'en' ? 'Upload header logo in Bengali' : 'হেডার ও ফুটারের জন্য বাংলা লোগো'}
                      aspectRatio="auto"
                    />
                    <ImageUpload
                      value={siteSettings.logo_en_url || ''}
                      onChange={(url) => setSiteSettings({ ...siteSettings, logo_en_url: url })}
                      label={lang === 'en' ? 'English Logo (Cloudflare R2)' : 'ইংরেজি সাইট লোগো (ক্লাউডফ্লেয়ার R2)'}
                      helperText={lang === 'en' ? 'Upload header logo in English' : 'হেডার ও ফুটারের জন্য ইংরেজি লোগো'}
                      aspectRatio="auto"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Facebook URL</label>
                    <input
                      type="text"
                      value={siteSettings.facebook_url}
                      onChange={(e) => setSiteSettings({ ...siteSettings, facebook_url: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Instagram URL</label>
                    <input
                      type="text"
                      value={siteSettings.instagram_url}
                      onChange={(e) => setSiteSettings({ ...siteSettings, instagram_url: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Twitter / X URL</label>
                    <input
                      type="text"
                      value={siteSettings.twitter_url}
                      onChange={(e) => setSiteSettings({ ...siteSettings, twitter_url: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">YouTube URL</label>
                    <input
                      type="text"
                      value={siteSettings.youtube_url}
                      onChange={(e) => setSiteSettings({ ...siteSettings, youtube_url: e.target.value })}
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                    />
                  </div>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT ARTICLE                                           */}
      {/* ------------------------------------------------------------- */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 font-sans">
                Edit Article: {editingArticle.title}
              </h3>
              <button
                onClick={() => setEditingArticle(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Title (Bengali) <span className="text-[#800020]">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none transition-colors ${
                    editFormAttempted && !editTitle.trim() && !editTitleEn.trim()
                      ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                      : 'border-[#ded7cc] focus:border-[#800020]'
                  }`}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Title (English)</label>
                <input
                  type="text"
                  value={editTitleEn}
                  onChange={(e) => setEditTitleEn(e.target.value)}
                  className={`w-full px-3 py-2 border rounded focus:outline-none transition-colors ${
                    editFormAttempted && !editTitle.trim() && !editTitleEn.trim()
                      ? 'border-rose-500 bg-rose-50/20 ring-1 ring-rose-500'
                      : 'border-[#ded7cc] focus:border-[#800020]'
                  }`}
                />
                {editFormAttempted && !editTitle.trim() && !editTitleEn.trim() && (
                  <p className="text-rose-600 text-[11px] font-bengali mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>অনুগ্রহ করে একটি শিরোনাম প্রদান করুন (বাংলা অথবা ইংরেজিতে)।</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Categories (Many-to-Many)</label>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 border border-gray-200 rounded max-h-28 overflow-y-auto">
                  {categories.map((c) => {
                    const isSelected = editCatIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setEditCatIds(prev =>
                            prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                          isSelected
                            ? 'bg-[#800020] text-white border-[#800020]'
                            : 'bg-white text-gray-700 border-gray-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <ImageUpload
                  value={editCoverUrl}
                  onChange={setEditCoverUrl}
                  label={lang === 'en' ? 'Article Cover Image (Cloudflare R2)' : 'প্রবন্ধের কভার ছবি (ক্লাউডফ্লেয়ার R2)'}
                  helperText={lang === 'en' ? 'Upload new cover image directly to Cloudflare R2' : 'ক্লাউডফ্লেয়ার R2 তে নতুন কভার ছবি আপলোড করুন'}
                  aspectRatio="video"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Excerpt</label>
                <textarea
                  rows={2}
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Content (Rich Text) <span className="text-[#800020]">*</span>
                </label>
                <RichTextEditor
                  value={editContent}
                  onChange={setEditContent}
                  error={editFormAttempted && !isHtmlContentPresent(editContent)}
                  errorMessage={
                    lang === 'en'
                      ? 'Please enter content body for the article.'
                      : 'অনুগ্রহ করে প্রবন্ধের মূল বিষয়বস্তু বা বক্তব্য লিখুন।'
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingEditArticle}
                  onClick={handleSaveEditArticle}
                  className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded font-semibold flex items-center gap-1.5 transition"
                >
                  {savingEditArticle ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Article</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT CATEGORY (ENHANCED LIVE PREVIEW)         */}
      {/* ------------------------------------------------------------- */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveCategory}
            className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-[#800020]" />
                <h3 className="font-bold text-base text-gray-900 font-sans">
                  {editingCategory ? `Edit Category: ${editingCategory.name}` : (catParent ? 'Add Sub-category' : 'New Primary Category')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans">
              {/* Dual Language Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    ক্যাটাগরির নাম (বাংলা) <span className="text-[#800020]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      if (!editingCategory && !catSlug && !catNameEn) {
                        setCatSlug(autoSlugify(e.target.value));
                      }
                    }}
                    placeholder="যেমন: সমকালীন শিল্প ও ভাস্কর্য..."
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Category Name (English Translation)
                  </label>
                  <input
                    type="text"
                    value={catNameEn}
                    onChange={(e) => {
                      setCatNameEn(e.target.value);
                      if (!editingCategory && (!catSlug || catSlug === autoSlugify(catName))) {
                        setCatSlug(autoSlugify(e.target.value));
                      }
                    }}
                    placeholder="e.g. Contemporary Sculpture & Visual Arts"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* URL Slug & Parent Hierarchy */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700">URL Route Slug</label>
                    <button
                      type="button"
                      onClick={() => setCatSlug(autoSlugify(catNameEn || catName))}
                      className="text-[10px] text-[#800020] hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" /> Auto-generate
                    </button>
                  </div>
                  <div className="flex items-center">
                    <span className="px-2 py-2 bg-gray-100 border border-r-0 border-[#ded7cc] rounded-l text-gray-500 font-mono text-[11px]">
                      /category/
                    </span>
                    <input
                      type="text"
                      value={catSlug}
                      onChange={(e) => setCatSlug(autoSlugify(e.target.value))}
                      placeholder="sculpture-arts"
                      className="w-full px-3 py-2 border border-[#ded7cc] rounded-r focus:outline-none focus:border-[#800020] font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Parent Category (মূল বিভাগ)
                  </label>
                  <select
                    value={catParent === null ? '' : catParent}
                    onChange={(e) => setCatParent(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white"
                  >
                    <option value="">None (Top-Level Primary Section)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.name_en ? `(${c.name_en})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dual Language Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    বিবরণ (বাংলা)
                  </label>
                  <textarea
                    rows={2}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="বিভাগের সংক্ষিপ্ত পরিচয় যা ক্যাটাগরি আর্কাইভে প্রদর্শিত হবে..."
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Description (English)
                  </label>
                  <textarea
                    rows={2}
                    value={catDescEn}
                    onChange={(e) => setCatDescEn(e.target.value)}
                    placeholder="Brief description for category archive page..."
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Order & Navigation Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-[#faf7f2] p-3 rounded border border-[#ded7cc]">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Display Order Index
                  </label>
                  <input
                    type="number"
                    value={catOrder}
                    onChange={(e) => setCatOrder(Number(e.target.value))}
                    className="w-32 px-3 py-1.5 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] bg-white font-bold"
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Lower numbers appear first on the menu
                  </span>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={catNavVisible}
                      onChange={(e) => setCatNavVisible(e.target.checked)}
                      className="rounded text-[#800020] focus:ring-[#800020] w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-gray-800 block text-xs">
                        Show on Navigation Bar
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {catNavVisible ? 'Visible on top menu & mobile drawer' : 'Accessible via URL only'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Live Magazine Header Preview Box */}
              <div className="p-3.5 bg-white border border-[#ded7cc] rounded space-y-2">
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-gray-400 block">
                  Live Preview in Magazine Header
                </span>
                <div className="flex items-center gap-3 p-3 bg-[#fcfbf9] border border-dashed border-[#ded7cc] rounded">
                  <div className="px-3 py-1 bg-white border border-[#800020] text-[#800020] font-semibold text-xs rounded shadow-2xs">
                    {catName || 'ক্যাটাগরি নাম'}
                  </div>
                  {catNameEn && (
                    <div className="text-[11px] text-gray-400 font-sans">
                      EN: {catNameEn}
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400 font-mono ml-auto">
                    /category/{catSlug || 'slug'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-5 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  {savingCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{editingCategory ? 'Update Category' : 'Save Category'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE USER                                            */}
      {/* ------------------------------------------------------------- */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleCreateUser}
            className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 font-sans">
                Create New User Account
              </h3>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Username <span className="text-[#800020]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. editor_david"
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Password <span className="text-[#800020]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={newUserFirst}
                    onChange={(e) => setNewUserFirst(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newUserLast}
                    onChange={(e) => setNewUserLast(e.target.value)}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserStaff}
                    onChange={(e) => setNewUserStaff(e.target.checked)}
                    className="rounded text-[#800020] focus:ring-[#800020]"
                  />
                  <span className="font-semibold text-gray-800">Grant Staff / Editor Privileges</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newUserActive}
                    onChange={(e) => setNewUserActive(e.target.checked)}
                    className="rounded text-[#800020] focus:ring-[#800020]"
                  />
                  <span className="font-semibold text-gray-800">Active Account</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-4 py-2 bg-[#800020] hover:bg-[#9b1b30] text-white rounded font-semibold flex items-center gap-1.5 transition"
                >
                  {savingUser ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Create User</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: VIEW INQUIRY MESSAGE                                   */}
      {/* ------------------------------------------------------------- */}
      {viewingInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 font-sans">
                Inquiry Details
              </h3>
              <button
                onClick={() => setViewingInquiry(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-sans">
              <div className="flex items-center justify-between">
                <div>
                  <strong className="block text-sm text-gray-900">{viewingInquiry.name}</strong>
                  <span className="text-gray-500">{viewingInquiry.email} {viewingInquiry.phone ? `• ${viewingInquiry.phone}` : ''}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">
                  {viewingInquiry.status}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-400 block mb-0.5 text-[10px] uppercase font-bold">Subject</span>
                <p className="font-bold text-gray-900">{viewingInquiry.subject}</p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-400 block mb-0.5 text-[10px] uppercase font-bold">Message Body</span>
                <div className="p-3 bg-gray-50 rounded border border-gray-200 text-gray-800 leading-relaxed font-serif whitespace-pre-wrap">
                  {viewingInquiry.message}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">
                  Received on {new Date(viewingInquiry.created_at).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => setViewingInquiry(null)}
                  className="px-4 py-1.5 bg-[#800020] text-white rounded text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REJECT ARTICLE WITH REASON                             */}
      {/* ------------------------------------------------------------- */}
      {rejectingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-900 font-sans">
                প্রত্যাখ্যানের কারণ লিখুন (Reason for Rejection)
              </h3>
              <button
                onClick={() => setRejectingArticle(null)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-gray-600 font-sans">
                Article: <strong>{rejectingArticle.title}</strong>
              </p>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="লেখকের উন্নতির জন্য সুস্পষ্ট কারণ বা সংশোধন পরামর্শ উল্লেখ করুন..."
                className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setRejectingArticle(null)}
                  className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded text-xs"
                >
                  বাতিল (Cancel)
                </button>
                <button
                  onClick={handleRejectConfirm}
                  className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold"
                >
                  প্রত্যাখ্যান নিশ্চিত করুন (Confirm Reject)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: CREATE / EDIT HERO SLIDE (WITH LIVE BANNER PREVIEW)   */}
      {/* ------------------------------------------------------------- */}
      {heroSlideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-2xl border border-[#ded7cc] w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#800020]" />
                <h3 className="font-bold text-base text-gray-900 font-sans">
                  {editingHeroSlide
                    ? (lang === 'en' ? 'Edit Hero Banner Slide' : 'হিরো ব্যানার স্লাইড সম্পাদনা করুন')
                    : (lang === 'en' ? 'Add New Hero Banner Slide' : 'নতুন হিরো ব্যানার স্লাইড যোগ করুন')}
                </h3>
              </div>
              <button
                onClick={() => setHeroSlideModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveHeroSlide} className="space-y-4 text-xs font-sans">
              
              {/* Banner Image Upload (Cloudflare R2) */}
              <div>
                <ImageUpload
                  value={slideImage}
                  onChange={setSlideImage}
                  label={lang === 'en' ? 'Banner Image (Cloudflare R2)' : 'ব্যানারের ছবি (ক্লাউডফ্লেয়ার R2)'}
                  required
                  helperText={lang === 'en' ? 'Upload high-resolution landscape banner image directly to Cloudflare R2' : 'সরাসরি ক্লাউডফ্লেয়ার R2 তে উচ্চ-রেজোলিউশনের ল্যান্ডস্কেপ ব্যানার ছবি আপলোড করুন'}
                  aspectRatio="banner"
                  presets={[
                    { label: 'Living Room 3D', url: '/assets/images/18-1024x678.jpg' },
                    { label: 'Tropical Island', url: '/assets/images/beach_resort_paradise_island_aerial_drone_top_view_summer_tropical_nature_landscape_holiday_travel_vacation-1024x683.jpg' },
                    { label: 'Architectural House', url: '/assets/images/shutterstock_398822470-1024x683.jpg' },
                    { label: 'Minimal Interior', url: '/assets/images/Modern_living_room_interior_design_3d_render_illustration_7-1024x576.jpg' },
                  ]}
                />
              </div>

              {/* Destination Link on the Image */}
              <div>
                <label className="block font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-[#800020]" />
                  {lang === 'en' ? 'Destination Link / URL on Banner Image' : 'ব্যানারের ছবির উপর ক্লিকযোগ্য লিঙ্ক (URL)'}
                  <span className="ml-1 text-[10px] text-gray-400 font-normal">({lang === 'en' ? 'optional' : 'ঐচ্ছিক'})</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={slideButtonLink}
                    onChange={(e) => setSlideButtonLink(e.target.value)}
                    placeholder={lang === 'en' ? 'https://example.com  or  /category/architecture-interiors' : 'https://... অথবা /category/my-category'}
                    className="w-full pl-3 pr-24 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020] font-mono text-xs"
                    title={lang === 'en' ? 'Enter a full URL (https://...) or an internal path (/page)' : 'পূর্ণ URL (https://...) অথবা আভ্যন্তরীণ পাথ (/page) দিন'}
                  />
                  {slideButtonLink && (
                    <button
                      type="button"
                      onClick={() => setSlideButtonLink('')}
                      title={lang === 'en' ? 'Clear link' : 'লিঙ্ক মুছুন'}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                    >
                      ✕ {lang === 'en' ? 'Clear' : 'মুছুন'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {/* Quick-fill suggestions */}
                  <span className="text-[10px] text-gray-400">{lang === 'en' ? 'Quick fill:' : 'দ্রুত পূরণ:'}</span>
                  {['/about', '/contact', '/category/lifestyle'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSlideButtonLink(preset)}
                      className="text-[10px] px-1.5 py-0.5 border border-[#ded7cc] rounded font-mono text-gray-500 hover:border-[#800020] hover:text-[#800020] transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {lang === 'en'
                    ? 'Clicking anywhere on this banner image will navigate to this URL. Leave blank to make the banner non-clickable.'
                    : 'ভিজিটররা হোমপেজে এই ব্যানার ছবিতে ক্লিক করলে সরাসরি এই পেজ বা লিঙ্কে চলে যাবে। ফাঁকা রাখলে ব্যানার ক্লিকযোগ্য হবে না।'}
                </span>
              </div>

              {/* Title / Label for Admin & Alt attribute */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Banner Title / Label (Bengali)' : 'ব্যানারের নাম / পরিচিতি (বাংলা)'}
                  </label>
                  <input
                    type="text"
                    value={slideTitle}
                    onChange={(e) => setSlideTitle(e.target.value)}
                    placeholder="যেমন: আধুনিক স্থাপত্য প্রদর্শনী"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Banner Title / Label (English)' : 'ব্যানারের নাম / পরিচিতি (ইংরেজি)'}
                  </label>
                  <input
                    type="text"
                    value={slideTitleEn}
                    onChange={(e) => setSlideTitleEn(e.target.value)}
                    placeholder="e.g. Modern Architecture Exhibition"
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Display Order & Active Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    {lang === 'en' ? 'Display Order Weight' : 'প্রদর্শনের ক্রম (Display Order)'}
                  </label>
                  <input
                    type="number"
                    value={slideOrder}
                    onChange={(e) => setSlideOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-[#ded7cc] rounded focus:outline-none focus:border-[#800020]"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    {lang === 'en' ? 'Lower values appear first (e.g. 0, 1, 2...)' : 'ছোট সংখ্যা আগে প্রদর্শিত হবে (যেমন: ০, ১, ২...)'}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="slideActiveCheckbox"
                    checked={slideActive}
                    onChange={(e) => setSlideActive(e.target.checked)}
                    className="w-4 h-4 text-[#800020] rounded border-[#ded7cc] focus:ring-[#800020]"
                  />
                  <label htmlFor="slideActiveCheckbox" className="font-bold text-gray-700 cursor-pointer select-none">
                    {lang === 'en' ? 'Active on Homepage Slider' : 'হোমপেজ স্লাইডারে সক্রিয় রাখুন'}
                  </label>
                </div>
              </div>

              {/* LIVE BANNER PREVIEW (Exact Homepage Look: Pure image with link) */}
              <div className="pt-2">
                <label className="block font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#800020]" />
                    <span>{lang === 'en' ? 'Live Banner Preview (Exact Homepage Look)' : 'লাইভ ব্যানার প্রিভিউ (হোমপেজে যেভাবে দেখাবে)'}</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {lang === 'en' ? 'Pure banner image with link' : 'শুধু ব্যানার ছবি এবং ক্লিকযোগ্য লিঙ্ক'}
                  </span>
                </label>
                <div className="relative w-full h-52 sm:h-64 rounded-md overflow-hidden border border-[#ded7cc] bg-black shadow-inner group cursor-pointer">
                  <img
                    src={slideImage || '/assets/images/18-1024x678.jpg'}
                    alt="Preview"
                    className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/images/18-1024x678.jpg';
                    }}
                  />
                  
                  {/* Top Link Preview Pill */}
                  <div className={`absolute top-3 left-3 backdrop-blur-xs text-white text-[10px] font-mono px-2.5 py-1 rounded-full shadow flex items-center gap-1.5 ${slideButtonLink ? 'bg-black/75' : 'bg-gray-700/80'}`}>
                    <span className={`w-2 h-2 rounded-full ${slideButtonLink ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
                    {slideButtonLink ? (
                      <>
                        <span>{lang === 'en' ? 'Link →' : 'লিঙ্ক →'}</span>
                        <span className="max-w-[200px] truncate">{slideButtonLink}</span>
                        {(slideButtonLink.startsWith('http://') || slideButtonLink.startsWith('https://')) && (
                          <span className="text-yellow-300 text-[9px]">[{lang === 'en' ? 'external' : 'বাহ্যিক'}]</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-300">{lang === 'en' ? 'No link (non-clickable)' : 'কোনো লিঙ্ক নেই'}</span>
                    )}
                  </div>

                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white/80 text-[10px] px-2 py-0.5 rounded">
                    Slide #{slideOrder}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setHeroSlideModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded text-xs hover:bg-gray-50 transition"
                >
                  {lang === 'en' ? 'Cancel' : 'বাতিল'}
                </button>
                <button
                  type="submit"
                  disabled={savingHeroSlide}
                  className="px-5 py-2 bg-[#800020] hover:bg-[#600018] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-60"
                >
                  {savingHeroSlide ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === 'en' ? 'Saving...' : 'সংরক্ষণ হচ্ছে...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Save Hero Slide' : 'স্লাইড সংরক্ষণ করুন'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
