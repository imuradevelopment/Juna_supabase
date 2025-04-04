// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/fonts', 
    '@nuxt/icon', 
    '@nuxt/image', 
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss'
  ],
  
  // cookieモジュールの最適化設定を追加
  vite: {
    optimizeDeps: {
      include: ['cookie']
    }
  },
  
  // グローバルCSS
  css: ['~/assets/css/tiptap.css'],
  
  // Tailwind CSS設定
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    exposeConfig: true,
    viewer: false
  },
  
  // Nuxt Fonts設定
  fonts: {
    families: [
      {
        name: 'Roboto',
        // ウェイトとスタイルを指定
        weights: [400, 700],
        styles: ['normal', 'italic']
      },
      {
        name: 'Noto Sans JP',
        weights: [400, 500, 700],
        styles: ['normal']
      }
    ],
    // デフォルト設定を上書き
    defaults: {
      weights: [400],
      styles: ['normal']
    }
  },
  
  // Nuxt Image設定
  image: {
    // 画像の品質設定
    quality: 80,
    // 利用可能な画像サイズを設定
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536
    },
    // プレースホルダーの設定
    placeholder: {
      blur: 10
    }
  },
  
  // Nuxt Icon設定
  icon: {
    // SVGモードを使用
    mode: 'svg',
    // アイコンサイズのデフォルト設定
    size: '24px',
    // SVGのクラス名
    class: 'icon',
    // エイリアスの設定
    aliases: {
      'NuxtIcon': 'Icon'
    }
  },
  
  // Supabase設定
  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/*']
    }
  },
  
  runtimeConfig: {
    // サーバーサイドでのみ利用可能な環境変数
    supabase: {
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    // クライアントサイドでも利用可能な環境変数
    public: {
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY
      },
      // Tiptap設定
      tiptap: {
        // エディターのデフォルト設定
        defaultOptions: {
          placeholder: 'ここに内容を入力してください...'
        }
      }
    }
  },
  
  // TipTap設定
  build: {
    transpile: [
      '@tiptap/vue-3', 
      '@tiptap/pm', 
      '@tiptap/starter-kit',
      '@tiptap/extension-link',
      '@tiptap/extension-image',
      '@tiptap/extension-typography',
      '@tiptap/extension-code-block',
      '@tiptap/extension-placeholder'
    ]
  },
  
  // TiptapはクライアントサイドでのみロードされるようにVueコンポーネントを設定
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => [
        'editor-content',
        'editor-menu-bar',
        'editor-menu-bubble'
      ].includes(tag)
    }
  }
})