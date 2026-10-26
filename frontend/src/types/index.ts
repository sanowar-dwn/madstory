export interface Category {
  id: number;
  name: string;
  name_en?: string;
  slug: string;
  description?: string;
  description_en?: string;
  parent?: number | null;
  subcategories?: Category[];
  display_order: number;
  is_nav_visible: boolean;
  articles_count?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active?: boolean;
  date_joined?: string;
  articles_count?: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface HeroSlide {
  id: number;
  title: string;
  title_en?: string;
  subtitle?: string;
  subtitle_en?: string;
  image: string;
  button_text?: string;
  button_text_en?: string;
  button_link?: string;
  link?: string;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Article {
  id: number;
  title: string;
  title_en?: string;
  slug: string;
  // M2M categories
  categories: Category[];
  category_name?: string;
  category_name_en?: string;
  category_slug?: string;
  excerpt: string;
  excerpt_en?: string;
  content?: string;
  content_en?: string;
  image: string;
  author_name: string;
  reading_time: string;
  reading_time_en?: string;
  is_featured_hero: boolean;
  is_colti_trending: boolean;
  is_nirbachito_choice: boolean;
  view_count: number;
  status: 'draft' | 'pending_approval' | 'published' | 'rejected';
  rejection_reason?: string;
  published_at: string;
  hearts_count: number;
  comments_count: number;
  is_hearted: boolean;
  related_articles?: Article[];
}

export interface Comment {
  id: number;
  article: number;
  article_title?: string;
  article_slug?: string;
  user: number;
  user_name: string;
  parent: number | null;
  content: string;
  is_approved?: boolean;
  created_at: string;
  replies: Comment[];
  is_owner: boolean;
}

export interface HomepageCustomization {
  id: number;
  hero_articles: number[];
  colti_articles: number[];
  nirbachito_articles: number[];
  art_culture_articles: number[];
  featured_categories: number[];
  hero_article_details?: Article[];
  colti_article_details?: Article[];
  nirbachito_article_details?: Article[];
  art_culture_article_details?: Article[];
  featured_category_details?: Category[];
  ticker_text_bn: string;
  ticker_text_en: string;
  hero_title_bn: string;
  hero_title_en: string;
  colti_title_bn: string;
  colti_title_en: string;
  nirbachito_title_bn: string;
  nirbachito_title_en: string;
  art_culture_title_bn: string;
  art_culture_title_en: string;
  show_hero: boolean;
  show_lead: boolean;
  show_art_culture: boolean;
  show_category_blocks: boolean;
  show_sidebar: boolean;
  updated_at?: string;
}

export interface SiteSetting {
  id: number;
  site_name: string;
  tagline_bn: string;
  tagline_en: string;
  logo_en_url: string;
  logo_bn_url: string;
  facebook_url: string;
  twitter_url: string;
  instagram_url: string;
  pinterest_url: string;
  youtube_url: string;
  email: string;
  phone: string;
  address: string;
  copyright_text_bn: string;
  copyright_text_en: string;
}

export interface ContactInquiry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in_review' | 'replied' | 'archived';
  created_at: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  is_active: boolean;
  subscribed_at: string;
}

export interface ContactInquiryPayload {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export interface HomeFeedPayload {
  hero: Article[];
  colti: Article[];
  nirbachito: Article[];
  popular: Article[];
  recent: Article[];
}

export interface DashboardStats {
  is_staff: boolean;
  total_articles: number;
  published_articles: number;
  pending_articles: number;
  draft_articles?: number;
  rejected_articles?: number;
  total_users?: number;
  total_comments?: number;
  pending_comments?: number;
  total_categories?: number;
  total_inquiries?: number;
  new_inquiries?: number;
  total_subscribers?: number;
  total_hero_slides?: number;
  total_views: number;
  total_hearts: number;
}
