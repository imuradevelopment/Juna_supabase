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
          100: '#102134',  /* 最も暗いネイビー */
          300: '#1a293f',  /* 濃いネイビーブルー（基本） */
          500: '#344b6d',  /* ミディアムネイビーブルー */
          700: '#425c84',  /* 明るめネイビーブルー */
          900: '#52729c',  /* 最も明るいネイビーブルー */
        },
        secondary: {
          100: '#694b24',  /* 暗いゴールド */
          300: '#896f3d',  /* 基本ゴールド/ブロンズ */
          500: '#b19765',  /* ミディアムゴールド */
          700: '#c5ac79',  /* 明るめゴールド */
          900: '#edd4a1',  /* 最も明るいゴールド */
        },
        gray: {
          100: '#323740',  /* 暗いグレー */
          300: '#404751',  /* 基本スレートグレー */
          500: '#686f79',  /* ミディアムグレー */
          700: '#7c838d',  /* 明るめグレー */
          900: '#a4afb9',  /* 最も明るいグレー */
        },
        success: {
          100: '#0a361b',  /* 成功バナーの背景 */
          300: '#16753c',  /* 公開済みアイコン */
          500: '#27b45a',  /* 主要成功メッセージ */
          700: '#4bd77d',  /* 確定済み表示 */
        },
        warning: {
          100: '#462c08',  /* 警告バナーの背景 */
          300: '#95600f',  /* 警告アイコン */
          500: '#cd8c16',  /* 警告ボタン */
          700: '#f3a72d',  /* 重要な警告テキスト */
        },
        error: {
          100: '#4a0f0f',  /* エラーバナーの背景 */
          300: '#a11b1b',  /* バリデーションエラー */
          500: '#d82a2a',  /* エラーメッセージ */
          700: '#ef4d4d',  /* 重大なエラーテキスト */
        },
        info: {
          100: '#082b52',  /* 情報バナーの背景 */
          300: '#0c59a6',  /* 情報アイコンの背景 */
          500: '#1b80e5',  /* 情報メッセージ */
          700: '#4da3fa',  /* 重要な情報テキスト */
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function({ addBase }) {
      addBase({
        'body': {
          backgroundColor: '#102134', // primary-100に定義した色と同じ
          color: '#7c838d', // gray-700に定義した色と同じ
        },
        // テキスト入力、テキストエリア
        'input[type=text], input[type=email], input[type=password], input[type=number], input[type=search], input[type=tel], input[type=url], input[type=date], input[type=datetime-local], input[type=month], input[type=week], input[type=time], textarea': {
          backgroundColor: '#1a293f', // primary-300
          borderColor: '#404751', // gray-300
          color: '#a4afb9', // gray-900
          '&::placeholder': {
            color: '#686f79', // gray-500
          },
          '&:hover': {
            borderColor: '#52729c', // primary-900
          },
          '&:focus': {
            borderColor: '#b19765', // secondary-500
            boxShadow: '0 0 0 2px rgba(177, 151, 101, 0.25)' // secondary-500の半透明
          }
        },
        // セレクトボックス
        'select': {
          backgroundColor: '#1a293f', // primary-300
          borderColor: '#404751', // gray-300
          color: '#a4afb9', // gray-900
          '&:hover': {
            borderColor: '#52729c', // primary-900
          },
          '&:focus': {
            borderColor: '#b19765', // secondary-500
            boxShadow: '0 0 0 2px rgba(177, 151, 101, 0.25)' // secondary-500の半透明
          }
        },
        // form-checkbox, form-radioクラスのスタイル（@tailwindcss/forms用）
        '.form-checkbox, .form-radio, input[type=checkbox], input[type=radio]': {
          backgroundColor: '#1a293f', // primary-300
          borderColor: '#404751', // gray-300
          color: '#c5ac79', // secondary-700（チェック時の色）
          '&:hover': {
            borderColor: '#52729c', // primary-900
          },
          '&:focus': {
            outline: 'none',
            borderColor: '#b19765', // secondary-500
            boxShadow: '0 0 0 2px rgba(177, 151, 101, 0.25)' // secondary-500の半透明
          }
        },
        // 無効状態のフォーム要素
        'input:disabled, select:disabled, textarea:disabled, button:disabled': {
          backgroundColor: '#102134', // primary-100
          borderColor: '#344b6d', // primary-500
          color: '#686f79', // gray-500
          opacity: 0.7,
          cursor: 'not-allowed'
        },
        // エラー状態のフォーム要素
        '.error-input, .has-error': {
          borderColor: '#d82a2a', // error-500
          '&:focus': {
            borderColor: '#ef4d4d', // error-700
            boxShadow: '0 0 0 2px rgba(216, 42, 42, 0.25)' // error-500の半透明
          }
        }
      })
    }
  ],
} 