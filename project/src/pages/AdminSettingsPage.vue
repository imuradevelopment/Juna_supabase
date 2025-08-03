<template>
  <div class="min-h-screen bg-background">
    <!-- ヘッダー -->
    <div class="bg-surface shadow-sm border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="py-4 sm:py-6">
          <h1 class="text-2xl sm:text-3xl font-bold text-heading">
            サイト設定
          </h1>
        </div>
      </div>
    </div>

    <!-- ナビゲーション -->
    <div class="bg-surface shadow-sm border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav class="flex space-x-8" aria-label="管理メニュー">
          <router-link
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              item.current
                ? 'border-primary text-primary'
                : 'border-transparent text-text hover:text-text-muted hover:border-border-light',
              'py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            {{ item.name }}
          </router-link>
        </nav>
      </div>
    </div>

    <!-- メインコンテンツ -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid gap-8">
        <!-- テーマカラー設定 -->
        <div class="bg-surface shadow rounded-lg p-6">
          <h2 class="text-lg font-semibold text-heading mb-6">テーマカラー</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="(color, key) in themeColors" :key="key">
              <label :for="`color-${key}`" class="block text-sm font-medium text-text mb-2">
                {{ colorLabels[key] || key }}
              </label>
              <div class="flex items-center gap-3">
                <input
                  :id="`color-${key}`"
                  type="color"
                  v-model="themeColors[key]"
                  class="h-10 w-20 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  v-model="themeColors[key]"
                  class="flex-1 rounded-lg border border-border bg-surface-variant px-3 py-2 text-sm text-text"
                  pattern="#[0-9A-Fa-f]{6}"
                />
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              @click="resetThemeColors"
              class="px-4 py-2 text-sm font-medium text-text-muted hover:text-text"
            >
              デフォルトに戻す
            </button>
            <button
              @click="saveThemeColors"
              :disabled="saving"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {{ saving ? '保存中...' : 'テーマカラーを保存' }}
            </button>
          </div>
        </div>

        <!-- サイト情報設定 -->
        <div class="bg-surface shadow rounded-lg p-6">
          <h2 class="text-lg font-semibold text-heading mb-6">サイト基本情報</h2>
          
          <div class="space-y-4">
            <div>
              <label for="siteName" class="block text-sm font-medium text-text mb-2">
                サイト名
              </label>
              <input
                id="siteName"
                type="text"
                v-model="siteMetadata.siteName"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>

            <div>
              <label for="siteDescription" class="block text-sm font-medium text-text mb-2">
                サイト説明
              </label>
              <textarea
                id="siteDescription"
                v-model="siteMetadata.siteDescription"
                rows="3"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>

            <div>
              <label for="copyrightText" class="block text-sm font-medium text-text mb-2">
                コピーライト表記
              </label>
              <input
                id="copyrightText"
                type="text"
                v-model="siteMetadata.copyrightText"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>

            <div>
              <label for="logoText" class="block text-sm font-medium text-text mb-2">
                ロゴテキスト
              </label>
              <input
                id="logoText"
                type="text"
                v-model="siteMetadata.logoText"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              @click="saveSiteMetadata"
              :disabled="saving"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {{ saving ? '保存中...' : 'サイト情報を保存' }}
            </button>
          </div>
        </div>

        <!-- ドメイン文言設定 -->
        <div class="bg-surface shadow rounded-lg p-6">
          <h2 class="text-lg font-semibold text-heading mb-6">ドメイン文言設定</h2>
          
          <div class="space-y-4">
            <div>
              <label for="heroTitle" class="block text-sm font-medium text-text mb-2">
                ヒーローセクションのタイトル
              </label>
              <input
                id="heroTitle"
                type="text"
                v-model="domainTexts.heroTitle"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>

            <div>
              <label for="heroSubtitle" class="block text-sm font-medium text-text mb-2">
                ヒーローセクションのサブタイトル
              </label>
              <input
                id="heroSubtitle"
                type="text"
                v-model="domainTexts.heroSubtitle"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>

            <div>
              <label for="aboutTitle" class="block text-sm font-medium text-text mb-2">
                Aboutセクションのタイトル
              </label>
              <input
                id="aboutTitle"
                type="text"
                v-model="domainTexts.aboutTitle"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>

            <div>
              <label for="aboutDescription" class="block text-sm font-medium text-text mb-2">
                サイト説明文
              </label>
              <textarea
                id="aboutDescription"
                v-model="domainTexts.aboutDescription"
                rows="3"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  特徴1
                </label>
                <input
                  type="text"
                  v-model="domainTexts.feature1Title"
                  placeholder="タイトル"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2 text-text mb-2"
                />
                <textarea
                  v-model="domainTexts.feature1Description"
                  placeholder="説明"
                  rows="2"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2 text-text"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  特徴2
                </label>
                <input
                  type="text"
                  v-model="domainTexts.feature2Title"
                  placeholder="タイトル"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2 text-text mb-2"
                />
                <textarea
                  v-model="domainTexts.feature2Description"
                  placeholder="説明"
                  rows="2"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2 text-text"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  特徴3
                </label>
                <input
                  type="text"
                  v-model="domainTexts.feature3Title"
                  placeholder="タイトル"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2 text-text mb-2"
                />
                <textarea
                  v-model="domainTexts.feature3Description"
                  placeholder="説明"
                  rows="2"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2 text-text"
                />
              </div>
            </div>

            <div>
              <label for="targetDisabilitiesTitle" class="block text-sm font-medium text-text mb-2">
                対象カテゴリのタイトル
              </label>
              <input
                id="targetDisabilitiesTitle"
                type="text"
                v-model="domainTexts.targetDisabilitiesTitle"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-text mb-2">
                対象カテゴリリスト（1行に1つ）
              </label>
              <textarea
                v-model="targetDisabilitiesText"
                rows="6"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>

            <div>
              <label for="callToAction" class="block text-sm font-medium text-text mb-2">
                行動喚起文
              </label>
              <textarea
                id="callToAction"
                v-model="domainTexts.callToAction"
                rows="2"
                class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="startPostingButton" class="block text-sm font-medium text-text mb-2">
                  投稿開始ボタンテキスト
                </label>
                <input
                  id="startPostingButton"
                  type="text"
                  v-model="domainTexts.startPostingButton"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
                />
              </div>

              <div>
                <label for="viewPostsButton" class="block text-sm font-medium text-text mb-2">
                  投稿一覧ボタンテキスト
                </label>
                <input
                  id="viewPostsButton"
                  type="text"
                  v-model="domainTexts.viewPostsButton"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="recentPostsTitle" class="block text-sm font-medium text-text mb-2">
                  最新投稿セクションタイトル
                </label>
                <input
                  id="recentPostsTitle"
                  type="text"
                  v-model="domainTexts.recentPostsTitle"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
                />
              </div>

              <div>
                <label for="viewAllPosts" class="block text-sm font-medium text-text mb-2">
                  すべて見るリンクテキスト
                </label>
                <input
                  id="viewAllPosts"
                  type="text"
                  v-model="domainTexts.viewAllPosts"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
                />
              </div>

              <div>
                <label for="noRecentPosts" class="block text-sm font-medium text-text mb-2">
                  投稿がない場合のメッセージ
                </label>
                <input
                  id="noRecentPosts"
                  type="text"
                  v-model="domainTexts.noRecentPosts"
                  class="w-full rounded-lg border border-border bg-surface-variant px-4 py-2.5 text-text"
                />
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              @click="saveDomainTexts"
              :disabled="saving"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {{ saving ? '保存中...' : 'ドメイン文言を保存' }}
            </button>
          </div>
        </div>

        <!-- 機能設定 -->
        <div class="bg-surface shadow rounded-lg p-6">
          <h2 class="text-lg font-semibold text-heading mb-6">機能設定</h2>
          
          <div class="space-y-4">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="features.enableComments"
                class="h-4 w-4 text-primary rounded border-border"
              />
              <span class="ml-2 text-sm text-text">コメント機能を有効にする</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="features.enableLikes"
                class="h-4 w-4 text-primary rounded border-border"
              />
              <span class="ml-2 text-sm text-text">いいね機能を有効にする</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="features.enableCategories"
                class="h-4 w-4 text-primary rounded border-border"
              />
              <span class="ml-2 text-sm text-text">カテゴリー機能を有効にする</span>
            </label>

            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="features.enableSearch"
                class="h-4 w-4 text-primary rounded border-border"
              />
              <span class="ml-2 text-sm text-text">検索機能を有効にする</span>
            </label>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              @click="saveFeatures"
              :disabled="saving"
              class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              {{ saving ? '保存中...' : '機能設定を保存' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useSettingsStore } from '../stores/settings';
import { useNotification } from '../composables/useNotification';

const route = useRoute();
const settingsStore = useSettingsStore();
const { showSuccess, showError } = useNotification();

const navigation = computed(() => [
  { name: '概要', href: '/admin', current: route.path === '/admin' },
  { name: 'ユーザー管理', href: '/admin/users', current: route.path === '/admin/users' },
  { name: '投稿管理', href: '/admin/posts', current: route.path === '/admin/posts' },
  { name: 'コメント管理', href: '/admin/comments', current: route.path === '/admin/comments' },
  { name: 'サイト設定', href: '/admin/settings', current: route.path === '/admin/settings' },
]);

const saving = ref(false);

// デフォルトのテーマカラー
const defaultThemeColors = {
  primary: '#7C4DFF',
  primaryLight: '#9575CD',
  primaryDark: '#5E35B1',
  secondary: '#9C27B0',
  secondaryLight: '#BA68C8',
  secondaryDark: '#7B1FA2',
  accent: '#E91E63',
  error: '#F44336',
  errorDark: '#D32F2F',
  warning: '#FF9800',
  success: '#4CAF50',
  info: '#2196F3',
  background: '#1A0E2E',
  surface: '#231640',
  surfaceVariant: '#2D1B4E',
  border: '#4A3A6B',
  borderLight: '#5D4E7F',
  text: '#E8E3F5',
  textMuted: '#B8AECD',
  textWhite: '#ffffff',
  heading: '#F3E5F5'
};

// カラーラベルの日本語化
const colorLabels = {
  primary: 'プライマリー',
  primaryLight: 'プライマリー（明）',
  primaryDark: 'プライマリー（暗）',
  secondary: 'セカンダリー',
  secondaryLight: 'セカンダリー（明）',
  secondaryDark: 'セカンダリー（暗）',
  accent: 'アクセント',
  error: 'エラー',
  errorDark: 'エラー（暗）',
  warning: '警告',
  success: '成功',
  info: '情報',
  background: '背景',
  surface: 'サーフェス',
  surfaceVariant: 'サーフェス（バリアント）',
  border: 'ボーダー',
  borderLight: 'ボーダー（明）',
  text: 'テキスト',
  textMuted: 'テキスト（控えめ）',
  textWhite: 'テキスト（白）',
  heading: '見出し'
};

// ローカルの状態
const themeColors = reactive({ ...defaultThemeColors });
const siteMetadata = reactive({
  siteName: '',
  siteDescription: '',
  siteKeywords: '',
  copyrightText: '',
  logoText: ''
});
const features = reactive({
  enableComments: true,
  enableLikes: true,
  enableCategories: true,
  enableSearch: true,
  requireEmailVerification: false,
  allowGuestComments: false
});
const domainTexts = reactive({
  heroTitle: '',
  heroSubtitle: '',
  aboutTitle: '',
  aboutDescription: '',
  feature1Title: '',
  feature1Description: '',
  feature2Title: '',
  feature2Description: '',
  feature3Title: '',
  feature3Description: '',
  targetDisabilitiesTitle: '',
  targetDisabilities: [],
  callToAction: '',
  startPostingButton: '',
  viewPostsButton: '',
  recentPostsTitle: '',
  viewAllPosts: '',
  noRecentPosts: ''
});

// 対象カテゴリリストのテキスト管理用
const targetDisabilitiesText = computed({
  get: () => domainTexts.targetDisabilities.join('\n'),
  set: (value) => {
    domainTexts.targetDisabilities = value.split('\n').filter(line => line.trim());
  }
});

// 設定を読み込む
const loadSettings = () => {
  if (settingsStore.theme) {
    Object.assign(themeColors, settingsStore.theme);
  }
  if (settingsStore.siteMetadata) {
    Object.assign(siteMetadata, settingsStore.siteMetadata);
  }
  if (settingsStore.features) {
    Object.assign(features, settingsStore.features);
  }
  if (settingsStore.domainTexts) {
    Object.assign(domainTexts, settingsStore.domainTexts);
  }
};

// テーマカラーをデフォルトに戻す
const resetThemeColors = () => {
  Object.assign(themeColors, defaultThemeColors);
};

// テーマカラーを保存
const saveThemeColors = async () => {
  saving.value = true;
  try {
    const result = await settingsStore.updateSetting('theme', { colors: themeColors });
    if (result.success) {
      showSuccess('テーマカラーを保存しました');
    } else {
      throw new Error('保存に失敗しました');
    }
  } catch (error) {
    showError('テーマカラーの保存に失敗しました');
  } finally {
    saving.value = false;
  }
};

// サイト情報を保存
const saveSiteMetadata = async () => {
  saving.value = true;
  try {
    const result = await settingsStore.updateSetting('site_metadata', siteMetadata);
    if (result.success) {
      showSuccess('サイト情報を保存しました');
    } else {
      throw new Error('保存に失敗しました');
    }
  } catch (error) {
    showError('サイト情報の保存に失敗しました');
  } finally {
    saving.value = false;
  }
};

// 機能設定を保存
const saveFeatures = async () => {
  saving.value = true;
  try {
    const result = await settingsStore.updateSetting('features', features);
    if (result.success) {
      showSuccess('機能設定を保存しました');
    } else {
      throw new Error('保存に失敗しました');
    }
  } catch (error) {
    showError('機能設定の保存に失敗しました');
  } finally {
    saving.value = false;
  }
};

// ドメイン文言を保存
const saveDomainTexts = async () => {
  saving.value = true;
  try {
    const result = await settingsStore.updateSetting('domain_texts', domainTexts);
    if (result.success) {
      showSuccess('ドメイン文言を保存しました');
    } else {
      throw new Error('保存に失敗しました');
    }
  } catch (error) {
    showError('ドメイン文言の保存に失敗しました');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadSettings();
});
</script>