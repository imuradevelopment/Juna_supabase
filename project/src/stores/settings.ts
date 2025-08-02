import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '../lib/supabase';
import { hexToRgb } from '../utils/colorUtils';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  secondaryDark: string;
  accent: string;
  error: string;
  errorDark: string;
  warning: string;
  success: string;
  info: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  border: string;
  borderLight: string;
  text: string;
  textMuted: string;
  heading: string;
}

interface SiteMetadata {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  copyrightText: string;
  logoText: string;
}

interface Features {
  enableComments: boolean;
  enableLikes: boolean;
  enableCategories: boolean;
  enableSearch: boolean;
  requireEmailVerification: boolean;
  allowGuestComments: boolean;
}

interface DomainTexts {
  // ホームページ - ヒーローセクション
  heroTitle: string;
  heroSubtitle: string;
  
  // ホームページ - Aboutセクション
  aboutTitle: string;
  aboutDescription: string;
  
  // ホームページ - 特徴
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  
  // ホームページ - 対象者
  targetDisabilitiesTitle: string;
  targetDisabilities: string[];
  
  // ホームページ - CTA
  callToAction: string;
  
  // ボタンテキスト
  startPostingButton: string;
  viewPostsButton: string;
  
  // その他のホームページ文言
  recentPostsTitle: string;
  viewAllPosts: string;
  noRecentPosts: string;
}

interface CommonUIElements {
  siteName: string;
  loading: string;
  error: string;
  save: string;
  cancel: string;
  delete: string;
  edit: string;
  create: string;
  update: string;
  submit: string;
  close: string;
  back: string;
  next: string;
  previous: string;
  search: string;
  searchPlaceholder: string;
  noResults: string;
  confirmDelete: string;
  confirmCancel: string;
  operationSuccess: string;
  operationFailed: string;
}

interface Auth {
  login: string;
  logout: string;
  register: string;
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  loginButton: string;
  registerButton: string;
  forgotPassword: string;
  resetPassword: string;
  loginSuccess: string;
  loginFailed: string;
  registerSuccess: string;
  registerFailed: string;
  logoutSuccess: string;
  emailRequired: string;
  passwordRequired: string;
  passwordMismatch: string;
  invalidCredentials: string;
  accountExists: string;
  verifyEmail: string;
}

interface Posts {
  title: string;
  createPost: string;
  editPost: string;
  postList: string;
  postDetail: string;
  postTitle: string;
  postContent: string;
  postTags: string;
  postCategory: string;
  selectCategory: string;
  noCategorySelected: string;
  publishSettings: string;
  published: string;
  draft: string;
  publish: string;
  unpublish: string;
  saveAsDraft: string;
  updating: string;
  publishing: string;
  savingDraft: string;
  confirmPublish: string;
  confirmUnpublish: string;
  confirmDeletePost: string;
  postNotFound: string;
  postNotPublished: string;
  postLoadError: string;
  noPostsFound: string;
  noPostsYet: string;
  sortByDate: string;
  sortByLikes: string;
  eyecatch: string;
  uploadEyecatch: string;
  changeEyecatch: string;
  removeEyecatch: string;
}

interface Comments {
  comments: string;
  comment: string;
  addComment: string;
  editComment: string;
  deleteComment: string;
  confirmDeleteComment: string;
  noComments: string;
  commentPosted: string;
  commentDeleted: string;
  commentError: string;
  loginToComment: string;
  sending: string;
}

interface Likes {
  like: string;
  unlike: string;
  likes: string;
  likeCount: string;
  loginToLike: string;
}

interface User {
  profile: string;
  editProfile: string;
  myPage: string;
  myPosts: string;
  drafts: string;
  settings: string;
  avatar: string;
  uploadAvatar: string;
  changeAvatar: string;
  bio: string;
  website: string;
  following: string;
  followers: string;
  follow: string;
  unfollow: string;
  userNotFound: string;
  profileUpdateSuccess: string;
  profileUpdateError: string;
}

interface Dashboard {
  dashboard: string;
  overview: string;
  recentPosts: string;
  drafts: string;
  statistics: string;
  totalPosts: string;
  publishedPosts: string;
  draftPosts: string;
  totalLikes: string;
  totalComments: string;
  weeklyPosts: string;
  noDrafts: string;
  viewPost: string;
  editDraft: string;
  publishDraft: string;
  deleteDraft: string;
  confirmPublishDraft: string;
  confirmDeleteDraft: string;
  draftWillBePublic: string;
  publishingDraft: string;
  deletingDraft: string;
}

interface Categories {
  categories: string;
  category: string;
  allCategories: string;
  selectCategory: string;
  createCategory: string;
  editCategory: string;
  deleteCategory: string;
  categoryName: string;
  categoryDescription: string;
  categoryColor: string;
  postsInCategory: string;
  confirmDeleteCategory: string;
  categoryHasPosts: string;
}

interface Admin {
  adminPanel: string;
  dashboard: string;
  users: string;
  posts: string;
  comments: string;
  settings: string;
  siteSettings: string;
  themeColors: string;
  siteInfo: string;
  features: string;
  domainTexts: string;
  userManagement: string;
  postManagement: string;
  commentManagement: string;
  totalUsers: string;
  activeUsers: string;
  bannedUsers: string;
  adminUsers: string;
  makeAdmin: string;
  removeAdmin: string;
  banUser: string;
  unbanUser: string;
  deleteUser: string;
  confirmBanUser: string;
  confirmDeleteUser: string;
  resetToDefault: string;
  savingSettings: string;
  settingsSaved: string;
  settingsError: string;
}

interface Errors {
  generalError: string;
  networkError: string;
  serverError: string;
  notFound: string;
  unauthorized: string;
  forbidden: string;
  validationError: string;
  requiredField: string;
  invalidFormat: string;
  tooShort: string;
  tooLong: string;
  uploadError: string;
  fileTooLarge: string;
  invalidFileType: string;
  sessionExpired: string;
  refreshPage: string;
}

interface Success {
  saved: string;
  updated: string;
  deleted: string;
  published: string;
  unpublished: string;
  followed: string;
  unfollowed: string;
  copied: string;
  sent: string;
  uploaded: string;
}

interface Navigation {
  home: string;
  posts: string;
  categories: string;
  about: string;
  contact: string;
  terms: string;
  privacy: string;
  help: string;
  myPage: string;
  createPost: string;
  dashboard: string;
  admin: string;
  login: string;
  logout: string;
  register: string;
}

interface Footer {
  copyright: string;
  allRightsReserved: string;
  poweredBy: string;
  contactUs: string;
  followUs: string;
  newsletter: string;
  subscribeNewsletter: string;
  enterEmail: string;
  subscribe: string;
}

interface Search {
  search: string;
  searchPosts: string;
  searchUsers: string;
  searchTags: string;
  searchResults: string;
  searchResultsFor: string;
  noSearchResults: string;
  searchTips: string;
}

interface Filter {
  filter: string;
  filterBy: string;
  sortBy: string;
  orderBy: string;
  ascending: string;
  descending: string;
  newest: string;
  oldest: string;
  mostLiked: string;
  mostCommented: string;
  alphabetical: string;
  reset: string;
  apply: string;
}

interface Pagination {
  page: string;
  of: string;
  showing: string;
  total: string;
  perPage: string;
  goToPage: string;
  firstPage: string;
  lastPage: string;
  previousPage: string;
  nextPage: string;
}

interface Notifications {
  notifications: string;
  newNotification: string;
  markAsRead: string;
  markAllAsRead: string;
  noNotifications: string;
  notificationSettings: string;
  emailNotifications: string;
  pushNotifications: string;
  notifyComments: string;
  notifyLikes: string;
  notifyFollows: string;
  notifyMentions: string;
}

interface Datetime {
  justNow: string;
  minutesAgo: string;
  hoursAgo: string;
  daysAgo: string;
  weeksAgo: string;
  monthsAgo: string;
  yearsAgo: string;
  today: string;
  yesterday: string;
  tomorrow: string;
  thisWeek: string;
  lastWeek: string;
  thisMonth: string;
  lastMonth: string;
  thisYear: string;
  lastYear: string;
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeColors | null>(null);
  const siteMetadata = ref<SiteMetadata | null>(null);
  const features = ref<Features | null>(null);
  const domainTexts = ref<DomainTexts | null>(null);
  const loading = ref(false);

  // 計算プロパティ
  const siteName = computed(() => siteMetadata.value?.siteName || 'Juna');
  const siteDescription = computed(() => siteMetadata.value?.siteDescription || '');
  const copyrightText = computed(() => siteMetadata.value?.copyrightText || '');
  const logoText = computed(() => siteMetadata.value?.logoText || 'Juna');

  // 設定を取得
  const fetchSettings = async () => {
    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*');

      if (error) throw error;

      data?.forEach(setting => {
        switch (setting.key) {
          case 'theme':
            theme.value = setting.value.colors;
            applyTheme(setting.value.colors);
            break;
          case 'site_metadata':
            siteMetadata.value = setting.value;
            break;
          case 'features':
            features.value = setting.value;
            break;
          case 'domain_texts':
            domainTexts.value = setting.value;
            break;
        }
      });
    } catch (error) {
      console.error('設定の取得エラー:', error);
    } finally {
      loading.value = false;
    }
  };

  // テーマを適用
  const applyTheme = (colors: ThemeColors) => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      // camelCaseをkebab-caseに変換
      const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      // HEXカラーをRGB値に変換してCSS変数に設定
      root.style.setProperty(cssVarName, hexToRgb(value));
    });
  };

  // 設定を更新
  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) throw error;

      // ローカルの状態も更新
      switch (key) {
        case 'theme':
          theme.value = value.colors;
          applyTheme(value.colors);
          break;
        case 'site_metadata':
          siteMetadata.value = value;
          break;
        case 'features':
          features.value = value;
          break;
        case 'domain_texts':
          domainTexts.value = value;
          break;
      }

      return { success: true };
    } catch (error) {
      console.error('設定の更新エラー:', error);
      return { success: false, error };
    }
  };

  // リアルタイム更新の購読
  const subscribeToSettings = () => {
    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => {
          // 他のユーザーによる変更を反映
          if (payload.new) {
            const setting = payload.new as any;
            switch (setting.key) {
              case 'theme':
                theme.value = setting.value.colors;
                applyTheme(setting.value.colors);
                break;
              case 'site_metadata':
                siteMetadata.value = setting.value;
                break;
              case 'features':
                features.value = setting.value;
                break;
              case 'domain_texts':
                domainTexts.value = setting.value;
                break;
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    theme,
    siteMetadata,
    features,
    domainTexts,
    loading,
    siteName,
    siteDescription,
    copyrightText,
    logoText,
    fetchSettings,
    updateSetting,
    subscribeToSettings
  };
});