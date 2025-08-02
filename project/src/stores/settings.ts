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
  heroTitle: string;
  heroSubtitle: string;
  aboutDescription: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
  feature3Title: string;
  feature3Description: string;
  targetDisabilitiesTitle: string;
  targetDisabilities: string[];
  callToAction: string;
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