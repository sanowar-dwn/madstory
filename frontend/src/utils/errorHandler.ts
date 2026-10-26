import { AxiosError } from 'axios';

export interface StandardApiError {
  message: string;
  fieldErrors?: Record<string, string[]>;
  status?: number;
  code?: string;
  raw?: any;
}

// Bengali translations for common field names
const FIELD_LABELS: Record<string, { bn: string; en: string }> = {
  title: { bn: 'শিরোনাম (Title)', en: 'Title' },
  slug: { bn: 'স্লাগ / URL (Slug)', en: 'Slug' },
  content: { bn: 'মূল বিষয়বস্তু (Content)', en: 'Content' },
  category: { bn: 'ক্যাটাগরি (Category)', en: 'Category' },
  categories: { bn: 'ক্যাটাগরি সমূহ (Categories)', en: 'Categories' },
  featured_image: { bn: 'প্রধান ছবি (Featured Image)', en: 'Featured Image' },
  image_url: { bn: 'ছবির লিংক (Image URL)', en: 'Image URL' },
  username: { bn: 'ব্যবহারকারী নাম (Username)', en: 'Username' },
  email: { bn: 'ইমেইল (Email)', en: 'Email' },
  password: { bn: 'পাসওয়ার্ড (Password)', en: 'Password' },
  name: { bn: 'নাম (Name)', en: 'Name' },
  subject: { bn: 'বিষয় (Subject)', en: 'Subject' },
  message: { bn: 'বার্তা (Message)', en: 'Message' },
  order: { bn: 'ক্রম (Order)', en: 'Order' },
  display_order: { bn: 'প্রদর্শন ক্রম (Display Order)', en: 'Display Order' },
  link: { bn: 'লিংক (Link)', en: 'Link' },
  button_link: { bn: 'বাটন লিংক (Button Link)', en: 'Button Link' },
  button_text: { bn: 'বাটন টেক্সট (Button Text)', en: 'Button Text' },
  status: { bn: 'স্ট্যাটাস (Status)', en: 'Status' },
};

export function parseApiError(error: any, lang: 'bn' | 'en' = 'bn'): StandardApiError {
  if (!error) {
    return {
      message: lang === 'en' ? 'An unknown error occurred.' : 'একটি অজানা ত্রুটি ঘটেছে।',
    };
  }

  // Network error (no response received from backend)
  if (error.isAxiosError && !error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        message:
          lang === 'en'
            ? 'Request timed out. The server took too long to respond.'
            : 'অনুরোধের সময়সীমা শেষ হয়েছে। সার্ভার সাড়া দিতে অতিরিক্ত সময় নিচ্ছে।',
        code: 'TIMEOUT',
        raw: error,
      };
    }
    return {
      message:
        lang === 'en'
          ? 'Network error: Cannot reach the backend server (127.0.0.1:8000). Please ensure backend is running.'
          : 'সার্ভারের সাথে সংযোগ স্থাপন করা যাচ্ছে না। অনুগ্রহ করে ইন্টারনেট ও ব্যাকএন্ড চালু আছে কিনা যাচাই করুন।',
      code: 'NETWORK_ERROR',
      raw: error,
    };
  }

  const status = error.response?.status;
  const data = error.response?.data;
  let code = data?.code || (status ? `HTTP_${status}` : 'UNKNOWN_ERROR');

  const fieldErrors: Record<string, string[]> = {};
  const messageParts: string[] = [];

  // Parse structured errors dictionary
  if (data && typeof data === 'object') {
    // If backend provided our standardized errors dict
    const sourceErrors = data.errors || data;

    if (typeof sourceErrors === 'object' && !Array.isArray(sourceErrors)) {
      Object.entries(sourceErrors).forEach(([key, val]) => {
        // Skip metadata keys
        if (['status', 'status_code', 'code', 'detail', 'message'].includes(key) && key in data) {
          return;
        }

        const fieldName = FIELD_LABELS[key]
          ? FIELD_LABELS[key][lang]
          : key.replace(/_/g, ' ').toUpperCase();

        const messages: string[] = Array.isArray(val)
          ? val.map((v) => String(v))
          : [String(val)];

        fieldErrors[key] = messages;
        messageParts.push(`${fieldName}: ${messages.join(', ')}`);
      });
    }

    // Direct detail or message
    if (data.detail && typeof data.detail === 'string' && messageParts.length === 0) {
      messageParts.push(data.detail);
    } else if (data.message && typeof data.message === 'string' && messageParts.length === 0) {
      messageParts.push(data.message);
    } else if (data.error && typeof data.error === 'string' && messageParts.length === 0) {
      messageParts.push(data.error);
    }
  }

  // Fallbacks based on HTTP status code
  let primaryMessage = messageParts.join('\n');

  if (!primaryMessage) {
    if (status === 400) {
      primaryMessage =
        lang === 'en'
          ? 'Validation failed. Please verify the information entered.'
          : 'তথ্য যাচাইয়ে ব্যর্থ হয়েছে। অনুগ্রহ করে সঠিক তথ্য প্রদান করুন।';
    } else if (status === 401) {
      primaryMessage =
        lang === 'en'
          ? 'Authentication required. Please sign in.'
          : 'লগইন মেয়াদ উত্তীর্ণ হয়েছে। অনুগ্রহ করে পুনরায় লগইন করুন।';
    } else if (status === 403) {
      primaryMessage =
        lang === 'en'
          ? 'Access denied. You do not have permission for this action.'
          : 'অনুমতি নেই। এই কাজটি করার অধিকার আপনার নেই।';
    } else if (status === 404) {
      primaryMessage =
        lang === 'en'
          ? 'The requested resource was not found.'
          : 'অনুরোধকৃত তথ্য বা পৃষ্ঠাটি খুঁজে পাওয়া যায়নি।';
    } else if (status === 429) {
      primaryMessage =
        lang === 'en'
          ? 'Too many requests. Please slow down and try again.'
          : 'অতিরিক্ত অনুরোধ পাঠানো হয়েছে। কিছুক্ষণ পর পুনরায় চেষ্টা করুন।';
    } else if (status && status >= 500) {
      primaryMessage =
        lang === 'en'
          ? 'Internal server error (500). Our team has been notified.'
          : 'সার্ভারে অভ্যন্তরীণ ত্রুটি (500) দেখা দিয়েছে। অনুগ্রহ করে একটু পর চেষ্টা করুন।';
    } else {
      primaryMessage = error.message || 'একটি ত্রুটি ঘটেছে।';
    }
  }

  return {
    message: primaryMessage,
    fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
    status,
    code,
    raw: data || error,
  };
}
