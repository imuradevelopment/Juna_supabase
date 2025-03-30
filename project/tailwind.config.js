/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#0f0a1f',  /* アクティブアイテムの背景、フォーカス状態の背景 */
          100: '#1a1236', /* 選択された項目の背景、アラート背景 */
          200: '#231a4f', /* ホバー状態の背景、アクティブなナビゲーション項目 */
          300: '#2c2167', /* バッジ、タグの背景 */
          400: '#352980', /* プログレスバー、アイコンの塗り */
          500: '#3f3199', /* 主要ボタン、ブランドカラー、リンク色 */
          600: '#4938b2', /* ホバー状態のボタン、アクティブなリンク */
          700: '#5847cb', /* フォーカス状態のボタン、クリック状態 */
          800: '#6b5de3', /* 特に強調したいテキスト、ヘッダーアクセント */
          900: '#8678eb', /* 特殊な強調見出し */
          950: '#a193f2', /* 最も暗いアクセント、フッターなど */
        },
        secondary: {
          50: '#062029',  /* 補助的な区画の背景 */
          100: '#0a2e3a', /* セカンダリボタンのホバー背景 */
          200: '#0e3b4b', /* 特集記事のアクセント、シンプルなバッジ */
          300: '#12495d', /* プロフィールのアクセント、トグルボタン */
          400: '#17566e', /* アイコンの塗り、進捗表示 */
          500: '#1b647f', /* セカンダリボタン、アバター枠線 */
          600: '#1f7290', /* セカンダリボタンのホバー状態 */
          700: '#2380a1', /* アクティブなセカンダリボタン */
          800: '#2a8fb2', /* セカンダリ見出し */
          900: '#35a3c7', /* 特別なセカンダリテキスト */
          950: '#40b7dc', /* 最も暗いセカンダリ、特殊強調 */
        },
        gray: {
          50: '#131419',  /* ページ背景、モーダル背景 */
          100: '#1a1b21', /* カード背景、コンテナ背景 */
          200: '#24252d', /* ボーダー、区切り線、分割線 */
          300: '#2f3039', /* 非アクティブ要素、無効化された要素 */
          400: '#4c4d5a', /* プレースホルダーテキスト、アイコン色 */
          500: '#6a6c7b', /* キャプション、日時表示など弱いテキスト */
          600: '#8c8e9f', /* 標準テキスト、本文 */
          700: '#a9acba', /* 強調テキスト、コメント投稿者名 */
          800: '#d0d2de', /* 記事タイトル、主見出し */
          900: '#e8eaf3', /* ページタイトル、最も重要な見出し */
          950: '#f8faff', /* 最も暗いテキスト、特別な強調 */
        },
        success: {
          50: '#072714',  /* 成功メッセージの背景 */
          100: '#0a361b', /* 成功バナーの背景、承認済み要素 */
          300: '#16753c', /* 公開済みアイコン、認証マーク背景 */
          500: '#27b45a', /* 主要成功メッセージ、公開ボタン */
          700: '#4bd77d', /* 確定済み表示、成功テキスト */
        },
        warning: {
          50: '#2d1c04',  /* 警告メッセージの背景 */
          100: '#462c08', /* 警告バナーの背景、通知カード */
          300: '#95600f', /* 警告アイコン、注意喚起バッジ */
          500: '#cd8c16', /* 警告ボタン、下書き表示 */
          700: '#f3a72d', /* 重要な警告テキスト */
        },
        error: {
          50: '#260808',  /* エラーメッセージの背景 */
          100: '#4a0f0f', /* エラーバナーの背景、問題のある項目のハイライト */
          300: '#a11b1b', /* バリデーションエラーの境界線、削除確認アイコン */
          500: '#d82a2a', /* エラーメッセージ、削除ボタン、必須フィールド表示 */
          700: '#ef4d4d', /* 重大なエラーテキスト、アカウント削除ボタン */
        },
        info: {
          50: '#041a31',  /* 情報メッセージの背景 */
          100: '#082b52', /* 情報バナーの背景、ヒントボックス */
          300: '#0c59a6', /* 情報アイコンの背景、通知バッジ */
          500: '#1b80e5', /* 情報メッセージ、ヘルプボタン */
          700: '#4da3fa', /* 重要な情報テキスト */
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function({ addBase }) {
      addBase({
        'body': {
          backgroundColor: '#131419', // gray-50に定義した色と同じ
          color: '#8c8e9f', // gray-600に定義した色と同じ
        },
        // テキスト入力、テキストエリア
        'input[type=text], input[type=email], input[type=password], input[type=number], input[type=search], input[type=tel], input[type=url], input[type=date], input[type=datetime-local], input[type=month], input[type=week], input[type=time], textarea': {
          backgroundColor: '#24252d', // gray-200
          borderColor: '#2f3039', // gray-300
          color: '#d0d2de', // gray-800
          '&::placeholder': {
            color: '#4c4d5a', // gray-400
          },
          '&:focus': {
            borderColor: '#3f3199', // primary-500
            boxShadow: '0 0 0 2px rgba(63, 49, 153, 0.25)' // primary-500の半透明
          }
        },
        // セレクトボックス
        'select': {
          backgroundColor: '#24252d', // gray-200
          borderColor: '#2f3039', // gray-300
          color: '#d0d2de', // gray-800
          '&:focus': {
            borderColor: '#3f3199', // primary-500
            boxShadow: '0 0 0 2px rgba(63, 49, 153, 0.25)' // primary-500の半透明
          }
        },
        // form-checkbox, form-radioクラスのスタイル（@tailwindcss/forms用）
        '.form-checkbox, .form-radio, input[type=checkbox], input[type=radio]': {
          backgroundColor: '#24252d', // gray-200
          borderColor: '#2f3039', // gray-300
          color: '#3f3199', // primary-500（チェック時の色）
          '&:focus': {
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(63, 49, 153, 0.25)' // primary-500の半透明
          }
        },
        // 無効状態のフォーム要素
        'input:disabled, select:disabled, textarea:disabled, button:disabled': {
          backgroundColor: '#1a1b21', // gray-100
          borderColor: '#24252d', // gray-200
          color: '#4c4d5a', // gray-400
          opacity: 0.7,
          cursor: 'not-allowed'
        },
        // エラー状態のフォーム要素
        '.error-input, .has-error': {
          borderColor: '#d82a2a', // error-500
          '&:focus': {
            borderColor: '#d82a2a', // error-500
            boxShadow: '0 0 0 2px rgba(216, 42, 42, 0.25)' // error-500の半透明
          }
        }
      })
    }
  ],
} 