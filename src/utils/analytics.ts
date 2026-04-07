import { supabase } from '@/integrations/supabase/client';

// =============================================
// GOOGLE ANALYTICS 4 TRACKING UTILITIES
// =============================================

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const GA_TRACKING_ID = 'GA_MEASUREMENT_ID'; // Replace with actual GA4 ID

// Initialize GA4
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      custom_map: {
        'custom_parameter_1': 'page_section',
        'custom_parameter_2': 'user_role'
      }
    });
  }
};

// Track page views
export const trackPageView = (pagePath: string, pageTitle: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: pagePath,
      page_title: pageTitle
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  parameters: Record<string, any> = {}
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      ...parameters,
      timestamp: new Date().toISOString()
    });
  }
};

// Track school-specific events
export const trackSchoolEvent = {
  // Admin actions
  adminLogin: () => trackEvent('admin_login', { category: 'admin' }),
  adminAction: (action: string, section: string) =>
    trackEvent('admin_action', { action, section, category: 'admin' }),

  // Content engagement
  newsView: (newsId: string, title: string) =>
    trackEvent('news_view', { news_id: newsId, title, category: 'content' }),
  galleryView: (albumId: string, name: string) =>
    trackEvent('gallery_view', { album_id: albumId, name, category: 'content' }),

  // Student/Parent actions
  enrollmentInquiry: () => trackEvent('enrollment_inquiry', { category: 'enrollment' }),
  contactForm: () => trackEvent('contact_form_submit', { category: 'contact' }),

  // Project management
  projectCreate: (projectId: string, title: string) =>
    trackEvent('project_create', { project_id: projectId, title, category: 'project' }),
  projectUpdate: (projectId: string, title: string) =>
    trackEvent('project_update', { project_id: projectId, title, category: 'project' }),

  // Error tracking
  errorOccurred: (errorType: string, message: string) =>
    trackEvent('error', { error_type: errorType, message, category: 'error' })
};

// Track user role for analytics
export const setUserRole = (role: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      custom_parameter_2: role
    });
  }
};

// =============================================
// ANALYTICS DASHBOARD DATA
// =============================================

export interface AnalyticsData {
  pageViews: number;
  uniqueUsers: number;
  topPages: Array<{ path: string; views: number; title: string }>;
  userEngagement: {
    avgSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
  };
  schoolKPIs: {
    newsViews: number;
    galleryViews: number;
    contactForms: number;
    enrollmentInquiries: number;
  };
}

// Get analytics data from GA4 API (placeholder for future implementation)
export const getAnalyticsData = async (): Promise<AnalyticsData> => {
  // This would integrate with GA4 API in production
  // For now, return mock data
  return {
    pageViews: 1250,
    uniqueUsers: 340,
    topPages: [
      { path: '/news', views: 450, title: 'ข่าวสาร' },
      { path: '/gallery', views: 320, title: 'แกลเลอรี่' },
      { path: '/about', views: 280, title: 'เกี่ยวกับโรงเรียน' },
      { path: '/curriculum', views: 200, title: 'หลักสูตร' }
    ],
    userEngagement: {
      avgSessionDuration: 180, // seconds
      bounceRate: 0.35,
      pagesPerSession: 2.8
    },
    schoolKPIs: {
      newsViews: 450,
      galleryViews: 320,
      contactForms: 25,
      enrollmentInquiries: 15
    }
  };
};