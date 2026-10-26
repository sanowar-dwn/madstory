import axios, { AxiosRequestConfig } from 'axios';
import {
  Article, Category, SiteSetting, ContactInquiryPayload, ContactInquiry,
  NewsletterSubscriber, HomeFeedPayload, User, AuthTokens, Comment,
  HomepageCustomization, DashboardStats, HeroSlide
} from '../types';
import { toast } from '../context/ToastContext';
import { parseApiError } from '../utils/errorHandler';

// Extend Axios request config for custom error handling options
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipGlobalToast?: boolean;
    _retry?: boolean;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('madstory_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors in real-time
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};

    // 1. Handle 401 Token Refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('madstory_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          localStorage.setItem('madstory_access_token', newAccess);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          }
          return apiClient(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('madstory_access_token');
          localStorage.removeItem('madstory_refresh_token');
          localStorage.removeItem('madstory_user');
          if (!originalRequest.skipGlobalToast) {
            toast.error('আপনার সেশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে পুনরায় লগইন করুন।', {
              title: 'লগইন প্রয়োজন (401)',
            });
          }
          return Promise.reject(refreshErr);
        }
      }
    }

    // 2. Real-Time Global Error Toast for other errors unless explicitly suppressed
    if (!originalRequest.skipGlobalToast) {
      const parsed = parseApiError(error);
      const titleMap: Record<number, string> = {
        400: 'যাচাইকরণ ব্যর্থ (Validation Error)',
        401: 'অনুমতি প্রয়োজন (Unauthorized)',
        403: 'প্রবেশাধিকার নেই (Forbidden)',
        404: 'পাওয়া যায়নি (Not Found)',
        429: 'অনুরোধের সীমা অতিক্রান্ত (Rate Limited)',
        500: 'সার্ভার ত্রুটি (Server Error 500)',
      };
      const title = error.response?.status ? titleMap[error.response.status] || 'ত্রুটি' : 'নেটওয়ার্ক ত্রুটি (Network Error)';

      toast.error(parsed.message, {
        title,
        details: parsed.fieldErrors || (parsed.raw ? JSON.stringify(parsed.raw) : undefined),
      });
    }

    return Promise.reject(error);
  }
);

export const api = {
  // ----------------------------------------------------------------------
  // Auth
  // ----------------------------------------------------------------------
  login: async (username: string, password: string): Promise<{ user: User; tokens: AuthTokens }> => {
    const res = await apiClient.post('/auth/login/', { username, password });
    const tokens: AuthTokens = {
      access: res.data.access,
      refresh: res.data.refresh,
    };
    localStorage.setItem('madstory_access_token', tokens.access);
    localStorage.setItem('madstory_refresh_token', tokens.refresh);

    // Fetch user details
    const userRes = await apiClient.get<User>('/auth/me/');
    localStorage.setItem('madstory_user', JSON.stringify(userRes.data));
    return { user: userRes.data, tokens };
  },

  register: async (payload: { username: string; email: string; password: string; first_name?: string; last_name?: string }) => {
    const res = await apiClient.post('/auth/register/', payload);
    if (res.data.tokens) {
      localStorage.setItem('madstory_access_token', res.data.tokens.access);
      localStorage.setItem('madstory_refresh_token', res.data.tokens.refresh);
      localStorage.setItem('madstory_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me/');
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('madstory_access_token');
    localStorage.removeItem('madstory_refresh_token');
    localStorage.removeItem('madstory_user');
  },

  // ----------------------------------------------------------------------
  // Settings & Navigation
  // ----------------------------------------------------------------------
  getSettings: async (): Promise<SiteSetting> => {
    try {
      const res = await apiClient.get<SiteSetting>('/settings/');
      return res.data;
    } catch {
      return {
        id: 1,
        site_name: 'The Mad Story',
        tagline_bn: 'শিল্প, সাহিত্য, সংস্কৃতি ও সমকালীন জীবনধারার ত্রৈমাসিক পত্রিকা',
        tagline_en: 'A Quarterly Magazine on Art, Literature, Culture & Modern Lifestyle',
        logo_en_url: '/assets/images/Madstory-logo.png',
        logo_bn_url: '/assets/images/Madstory-logo-bangla.png',
        facebook_url: 'https://facebook.com/themadstory',
        twitter_url: 'https://twitter.com/themadstory',
        instagram_url: 'https://instagram.com/themadstory',
        pinterest_url: 'https://pinterest.com/themadstory',
        youtube_url: 'https://youtube.com/@themadstory',
        email: 'editor@themadstory.com',
        phone: '+880 1711-234567',
        address: 'Dhanmondi, Dhaka 1205, Bangladesh',
        copyright_text_bn: '© ২০২৬ দ্য ম্যাড স্টোরি। সর্বস্বত্ব সংরক্ষিত।',
        copyright_text_en: '© 2026 The Mad Story. All Rights Reserved.',
      };
    }
  },

  getCategories: async (): Promise<Category[]> => {
    try {
      const res = await apiClient.get<{ results: Category[] } | Category[]>('/categories/?top_level=true');
      const data = res.data;
      return Array.isArray(data) ? data : data.results || [];
    } catch {
      return [
        { id: 1, name: 'ডিজাইন এন্ড লাইফস্টাইল', name_en: 'Design & Lifestyle', slug: 'design-lifestyle', display_order: 1, is_nav_visible: true },
        { id: 2, name: 'শিল্প ও সংস্কৃতি', name_en: 'Art & Culture', slug: 'art-culture', display_order: 2, is_nav_visible: true },
        { id: 3, name: 'সাহিত্য', name_en: 'Literature', slug: 'literature', display_order: 3, is_nav_visible: true },
        { id: 4, name: 'মিডিয়া এবং এন্টারটেইনমেন্ট', name_en: 'Media & Entertainment', slug: 'media-entertainment', display_order: 4, is_nav_visible: true },
        { id: 5, name: 'স্পটলাইট', name_en: 'Spotlight', slug: 'spotlight', display_order: 5, is_nav_visible: true },
        { id: 6, name: 'ইনসাইটস', name_en: 'Insights', slug: 'insights', display_order: 6, is_nav_visible: true },
        { id: 7, name: 'অন্যান্য', name_en: 'Others', slug: 'others', display_order: 7, is_nav_visible: true },
      ];
    }
  },

  getAllCategoriesFlat: async (): Promise<Category[]> => {
    try {
      const res = await apiClient.get<{ results: Category[] } | Category[]>('/categories/');
      const data = res.data;
      return Array.isArray(data) ? data : data.results || [];
    } catch {
      return [];
    }
  },

  // ----------------------------------------------------------------------
  // Articles & Homepage Feed
  // ----------------------------------------------------------------------
  getHomeFeed: async (): Promise<HomeFeedPayload> => {
    const res = await apiClient.get<HomeFeedPayload>('/articles/magazine_home/');
    return res.data;
  },

  getArticles: async (params?: { category__slug?: string; search?: string; page?: number; status?: string; page_size?: number }): Promise<{ count: number; results: Article[] }> => {
    const res = await apiClient.get('/articles/', { params });
    return res.data;
  },

  getArticleBySlug: async (slug: string): Promise<Article> => {
    const res = await apiClient.get<Article>(`/articles/${encodeURIComponent(slug)}/`);
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Heart Reactions
  // ----------------------------------------------------------------------
  toggleHeart: async (slug: string): Promise<{ is_hearted: boolean; hearts_count: number }> => {
    const res = await apiClient.post(`/articles/${encodeURIComponent(slug)}/heart/`);
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Tree Comments
  // ----------------------------------------------------------------------
  getComments: async (slug: string): Promise<Comment[]> => {
    const res = await apiClient.get<Comment[]>(`/articles/${encodeURIComponent(slug)}/comments/`);
    return res.data;
  },

  postComment: async (slug: string, content: string, parentId?: number | null): Promise<Comment> => {
    const res = await apiClient.post<Comment>(`/articles/${encodeURIComponent(slug)}/comments/`, {
      content,
      parent: parentId || null,
    });
    return res.data;
  },

  deleteComment: async (id: number) => {
    const res = await apiClient.delete(`/comments/${id}/`);
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Writer & Admin Dashboard Management
  // ----------------------------------------------------------------------
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>('/dashboard/stats/');
    return res.data;
  },

  getMyArticles: async (): Promise<Article[]> => {
    const res = await apiClient.get<{ results: Article[] } | Article[]>('/articles/my_posts/');
    const data = res.data;
    return Array.isArray(data) ? data : data.results || [];
  },

  getPendingArticles: async (): Promise<Article[]> => {
    const res = await apiClient.get<Article[]>('/articles/pending/');
    return res.data;
  },

  createArticle: async (payload: {
    title: string;
    title_en?: string;
    category_ids: number[];
    excerpt: string;
    excerpt_en?: string;
    content: string;
    content_en?: string;
    cover_image_url?: string;
    reading_time?: string;
    status?: 'draft' | 'pending_approval' | 'published';
  }): Promise<Article> => {
    const res = await apiClient.post<Article>('/articles/', payload);
    return res.data;
  },

  updateArticle: async (slug: string, payload: Partial<Article> & { category_ids?: number[]; cover_image_url?: string }): Promise<Article> => {
    const res = await apiClient.patch<Article>(`/articles/${encodeURIComponent(slug)}/`, payload);
    return res.data;
  },

  deleteArticle: async (slug: string) => {
    const res = await apiClient.delete(`/articles/${encodeURIComponent(slug)}/`);
    return res.data;
  },

  approveArticle: async (slug: string) => {
    const res = await apiClient.post(`/articles/${encodeURIComponent(slug)}/approve/`);
    return res.data;
  },

  rejectArticle: async (slug: string, reason: string) => {
    const res = await apiClient.post(`/articles/${encodeURIComponent(slug)}/reject/`, { reason });
    return res.data;
  },

  setArticleStatus: async (slug: string, status: string) => {
    const res = await apiClient.post(`/articles/${encodeURIComponent(slug)}/set_status/`, { status });
    return res.data;
  },

  toggleArticleFlag: async (slug: string, flag: 'is_featured_hero' | 'is_colti_trending' | 'is_nirbachito_choice') => {
    const res = await apiClient.post(`/articles/${encodeURIComponent(slug)}/toggle_flag/`, { flag });
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Superadmin Categories Management
  // ----------------------------------------------------------------------
  createCategory: async (payload: {
    name: string;
    name_en?: string;
    slug?: string;
    parent?: number | null;
    description?: string;
    description_en?: string;
    display_order?: number;
    is_nav_visible?: boolean;
  }): Promise<Category> => {
    const res = await apiClient.post<Category>('/categories/', payload);
    return res.data;
  },

  updateCategory: async (slug: string, payload: Partial<Category>): Promise<Category> => {
    const res = await apiClient.patch<Category>(`/categories/${encodeURIComponent(slug)}/`, payload);
    return res.data;
  },

  deleteCategory: async (slug: string) => {
    const res = await apiClient.delete(`/categories/${encodeURIComponent(slug)}/`);
    return res.data;
  },

  toggleCategoryNav: async (slug: string): Promise<{ is_nav_visible: boolean }> => {
    const res = await apiClient.post(`/categories/${encodeURIComponent(slug)}/toggle_nav/`);
    return res.data;
  },

  updateCategoryOrder: async (slug: string, display_order: number): Promise<{ display_order: number }> => {
    const res = await apiClient.post(`/categories/${encodeURIComponent(slug)}/set_order/`, { display_order });
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Superadmin Users Management
  // ----------------------------------------------------------------------
  getAdminUsers: async (params?: Record<string, any>): Promise<User[]> => {
    const res = await apiClient.get<User[] | { results: User[] }>('/admin/users/', { params });
    return Array.isArray(res.data) ? res.data : (res.data.results || []);
  },

  createAdminUser: async (payload: Partial<User> & { password?: string }): Promise<User> => {
    const res = await apiClient.post<User>('/admin/users/', payload);
    return res.data;
  },

  updateAdminUser: async (id: number, payload: Partial<User> & { password?: string }): Promise<User> => {
    const res = await apiClient.patch<User>(`/admin/users/${id}/`, payload);
    return res.data;
  },

  toggleUserRole: async (id: number) => {
    const res = await apiClient.post(`/admin/users/${id}/toggle_role/`);
    return res.data;
  },

  toggleUserActive: async (id: number) => {
    const res = await apiClient.post(`/admin/users/${id}/toggle_active/`);
    return res.data;
  },

  deleteAdminUser: async (id: number) => {
    const res = await apiClient.delete(`/admin/users/${id}/`);
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Superadmin Comments Management
  // ----------------------------------------------------------------------
  getAdminComments: async (params?: Record<string, any>): Promise<Comment[]> => {
    const res = await apiClient.get<Comment[] | { results: Comment[] }>('/admin/comments/', { params });
    return Array.isArray(res.data) ? res.data : (res.data.results || []);
  },

  toggleCommentApproval: async (id: number) => {
    const res = await apiClient.post(`/admin/comments/${id}/toggle_approval/`);
    return res.data;
  },

  deleteAdminComment: async (id: number) => {
    const res = await apiClient.delete(`/admin/comments/${id}/`);
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Superadmin Contact Messages (Inquiries)
  // ----------------------------------------------------------------------
  getAdminInquiries: async (params?: Record<string, any>): Promise<ContactInquiry[]> => {
    const res = await apiClient.get<ContactInquiry[] | { results: ContactInquiry[] }>('/admin/inquiries/', { params });
    return Array.isArray(res.data) ? res.data : (res.data.results || []);
  },

  setInquiryStatus: async (id: number, status: 'new' | 'in_review' | 'replied' | 'archived') => {
    const res = await apiClient.post(`/admin/inquiries/${id}/set_status/`, { status });
    return res.data;
  },

  deleteAdminInquiry: async (id: number) => {
    const res = await apiClient.delete(`/admin/inquiries/${id}/`);
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Superadmin Newsletter Subscribers
  // ----------------------------------------------------------------------
  getAdminSubscribers: async (params?: Record<string, any>): Promise<NewsletterSubscriber[]> => {
    const res = await apiClient.get<NewsletterSubscriber[] | { results: NewsletterSubscriber[] }>('/admin/subscribers/', { params });
    return Array.isArray(res.data) ? res.data : (res.data.results || []);
  },

  toggleSubscriberActive: async (id: number) => {
    const res = await apiClient.post(`/admin/subscribers/${id}/toggle_active/`);
    return res.data;
  },

  deleteAdminSubscriber: async (id: number) => {
    const res = await apiClient.delete(`/admin/subscribers/${id}/`);
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Site Settings (Update)
  // ----------------------------------------------------------------------
  updateSettings: async (payload: Partial<SiteSetting>): Promise<SiteSetting> => {
    const res = await apiClient.patch<SiteSetting>('/settings/', payload);
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Homepage Customization
  // ----------------------------------------------------------------------
  getHomepageCustomization: async (): Promise<HomepageCustomization> => {
    const res = await apiClient.get<HomepageCustomization>('/homepage-customization/');
    return res.data;
  },

  updateHomepageCustomization: async (payload: Partial<HomepageCustomization>): Promise<HomepageCustomization> => {
    const res = await apiClient.patch<HomepageCustomization>('/homepage-customization/', payload);
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Dedicated Hero Banner Slider Module
  // ----------------------------------------------------------------------
  getHeroSlides: async (): Promise<HeroSlide[]> => {
    try {
      const res = await apiClient.get<HeroSlide[] | { results: HeroSlide[] }>('/hero-slides/');
      return Array.isArray(res.data) ? res.data : (res.data.results || []);
    } catch {
      return [];
    }
  },

  createHeroSlide: async (payload: Partial<HeroSlide>): Promise<HeroSlide> => {
    const res = await apiClient.post<HeroSlide>('/hero-slides/', payload);
    return res.data;
  },

  updateHeroSlide: async (id: number, payload: Partial<HeroSlide>): Promise<HeroSlide> => {
    const res = await apiClient.patch<HeroSlide>(`/hero-slides/${id}/`, payload);
    return res.data;
  },

  deleteHeroSlide: async (id: number) => {
    const res = await apiClient.delete(`/hero-slides/${id}/`);
    return res.data;
  },

  toggleHeroSlideActive: async (id: number): Promise<{ is_active: boolean }> => {
    const res = await apiClient.post(`/hero-slides/${id}/toggle_active/`);
    return res.data;
  },

  updateHeroSlideOrder: async (id: number, display_order: number): Promise<{ display_order: number }> => {
    const res = await apiClient.post(`/hero-slides/${id}/set_order/`, { display_order });
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Media Storage & Upload (Cloudflare R2)
  // ----------------------------------------------------------------------
  uploadImage: async (file: File): Promise<{ url: string; filename: string; size: number }> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await apiClient.post<{ url: string; filename: string; size: number }>('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // ----------------------------------------------------------------------
  // Contact & Newsletter
  // ----------------------------------------------------------------------
  submitContact: async (payload: ContactInquiryPayload) => {
    const res = await apiClient.post('/contact/', payload);
    return res.data;
  },

  subscribeNewsletter: async (email: string) => {
    const res = await apiClient.post('/newsletter/', { email });
    return res.data;
  },
};
