import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router/router'
import { supabase } from './lib/supabase'
import { hexToRgb } from './utils/colorUtils'

// 存在するCSSファイルのみをインポート
import './assets/main.css'       // Tailwindとカスタムスタイルはすでにこのファイルに含まれています

// アプリケーションを作成する前に設定を取得
async function initializeApp() {
  try {
    // データベースから設定を取得
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .in('key', ['theme']);

    if (!error && data) {
      // テーマ設定を探す
      const themeSetting = data.find(setting => setting.key === 'theme');
      if (themeSetting?.value?.colors) {
        // CSS変数を設定
        const root = document.documentElement;
        Object.entries(themeSetting.value.colors).forEach(([key, value]) => {
          const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
          root.style.setProperty(cssVarName, hexToRgb(value as string));
        });
      }
    }
  } catch (error) {
    console.error('Failed to load initial theme:', error);
  }

  // bodyを表示
  document.body.style.visibility = 'visible';

  // Vueアプリケーションを初期化
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  app.mount('#app')
}

// アプリケーションを初期化
initializeApp() 