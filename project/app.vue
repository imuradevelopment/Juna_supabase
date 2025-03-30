<template>
  <div class="container mx-auto px-4 py-8 max-w-6xl bg-gray-50">
    <h1 class="text-3xl font-bold text-center mb-8 text-primary-800">Nuxt3 カスタムカラースキーム スタイルガイド</h1>
    
    <div class="bg-gray-100 rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <h2 class="text-xl font-semibold mb-4 text-primary-900">カラーパレット</h2>
      
      <!-- プライマリーカラー -->
      <div class="mb-8">
        <h3 class="text-lg font-medium mb-3 text-primary-800">プライマリーカラー</h3>
        <div class="grid grid-cols-11 gap-2">
          <div class="p-4 rounded bg-primary-50 text-primary-800 text-xs text-center">50</div>
          <div class="p-4 rounded bg-primary-100 text-primary-800 text-xs text-center">100</div>
          <div class="p-4 rounded bg-primary-200 text-primary-800 text-xs text-center">200</div>
          <div class="p-4 rounded bg-primary-300 text-primary-800 text-xs text-center">300</div>
          <div class="p-4 rounded bg-primary-400 text-gray-50 text-xs text-center">400</div>
          <div class="p-4 rounded bg-primary-500 text-gray-50 text-xs text-center">500</div>
          <div class="p-4 rounded bg-primary-600 text-gray-50 text-xs text-center">600</div>
          <div class="p-4 rounded bg-primary-700 text-gray-50 text-xs text-center">700</div>
          <div class="p-4 rounded bg-primary-800 text-gray-50 text-xs text-center">800</div>
          <div class="p-4 rounded bg-primary-900 text-gray-50 text-xs text-center">900</div>
          <div class="p-4 rounded bg-primary-950 text-gray-50 text-xs text-center">950</div>
        </div>
        <p class="mt-2 text-primary-700">深い紫/インディゴ系: エレガントで高貴な印象を与えるプライマリーカラー</p>
      </div>
      
      <!-- セカンダリーカラー -->
      <div class="mb-8">
        <h3 class="text-lg font-medium mb-3 text-secondary-800">セカンダリーカラー</h3>
        <div class="grid grid-cols-11 gap-2">
          <div class="p-4 rounded bg-secondary-50 text-secondary-800 text-xs text-center">50</div>
          <div class="p-4 rounded bg-secondary-100 text-secondary-800 text-xs text-center">100</div>
          <div class="p-4 rounded bg-secondary-200 text-secondary-800 text-xs text-center">200</div>
          <div class="p-4 rounded bg-secondary-300 text-secondary-800 text-xs text-center">300</div>
          <div class="p-4 rounded bg-secondary-400 text-gray-50 text-xs text-center">400</div>
          <div class="p-4 rounded bg-secondary-500 text-gray-50 text-xs text-center">500</div>
          <div class="p-4 rounded bg-secondary-600 text-gray-50 text-xs text-center">600</div>
          <div class="p-4 rounded bg-secondary-700 text-gray-50 text-xs text-center">700</div>
          <div class="p-4 rounded bg-secondary-800 text-gray-50 text-xs text-center">800</div>
          <div class="p-4 rounded bg-secondary-900 text-gray-50 text-xs text-center">900</div>
          <div class="p-4 rounded bg-secondary-950 text-gray-50 text-xs text-center">950</div>
        </div>
        <p class="mt-2 text-secondary-700">ターコイズ/シアン系: 落ち着いた水色で爽やかさを加えるセカンダリーカラー</p>
      </div>
      
      <!-- グレースケール -->
      <div class="mb-8">
        <h3 class="text-lg font-medium mb-3 text-gray-800">グレースケール</h3>
        <div class="grid grid-cols-11 gap-2">
          <div class="p-4 rounded bg-gray-50 text-gray-800 text-xs text-center">50</div>
          <div class="p-4 rounded bg-gray-100 text-gray-800 text-xs text-center">100</div>
          <div class="p-4 rounded bg-gray-200 text-gray-800 text-xs text-center">200</div>
          <div class="p-4 rounded bg-gray-300 text-gray-800 text-xs text-center">300</div>
          <div class="p-4 rounded bg-gray-400 text-gray-50 text-xs text-center">400</div>
          <div class="p-4 rounded bg-gray-500 text-gray-50 text-xs text-center">500</div>
          <div class="p-4 rounded bg-gray-600 text-gray-50 text-xs text-center">600</div>
          <div class="p-4 rounded bg-gray-700 text-gray-50 text-xs text-center">700</div>
          <div class="p-4 rounded bg-gray-800 text-gray-50 text-xs text-center">800</div>
          <div class="p-4 rounded bg-gray-900 text-gray-50 text-xs text-center">900</div>
          <div class="p-4 rounded bg-gray-950 text-gray-50 text-xs text-center">950</div>
        </div>
        <p class="mt-2 text-gray-700">暗めのグレー系: ベースとなる色で統一感を持たせるグレートーン</p>
      </div>
      
      <!-- 状態カラー -->
      <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
        <!-- 成功カラー -->
        <div>
          <h3 class="text-lg font-medium mb-3 text-success-700">成功</h3>
          <div class="space-y-2">
            <div class="p-4 rounded bg-success-50 text-success-800 text-xs">50</div>
            <div class="p-4 rounded bg-success-100 text-success-800 text-xs">100</div>
            <div class="p-4 rounded bg-success-300 text-gray-50 text-xs">300</div>
            <div class="p-4 rounded bg-success-500 text-gray-50 text-xs">500</div>
            <div class="p-4 rounded bg-success-700 text-gray-50 text-xs">700</div>
          </div>
          <p class="mt-2 text-success-600 text-sm">緑系: 自然で直感的な成功を示す色</p>
        </div>
        
        <!-- 警告カラー -->
        <div>
          <h3 class="text-lg font-medium mb-3 text-warning-700">警告</h3>
          <div class="space-y-2">
            <div class="p-4 rounded bg-warning-50 text-warning-800 text-xs">50</div>
            <div class="p-4 rounded bg-warning-100 text-warning-800 text-xs">100</div>
            <div class="p-4 rounded bg-warning-300 text-gray-50 text-xs">300</div>
            <div class="p-4 rounded bg-warning-500 text-gray-50 text-xs">500</div>
            <div class="p-4 rounded bg-warning-700 text-gray-50 text-xs">700</div>
          </div>
          <p class="mt-2 text-warning-600 text-sm">琥珀/ゴールド系: 温かみのある注意喚起色</p>
        </div>
        
        <!-- エラーカラー -->
        <div>
          <h3 class="text-lg font-medium mb-3 text-error-700">エラー</h3>
          <div class="space-y-2">
            <div class="p-4 rounded bg-error-50 text-error-800 text-xs">50</div>
            <div class="p-4 rounded bg-error-100 text-error-800 text-xs">100</div>
            <div class="p-4 rounded bg-error-300 text-gray-50 text-xs">300</div>
            <div class="p-4 rounded bg-error-500 text-gray-50 text-xs">500</div>
            <div class="p-4 rounded bg-error-700 text-gray-50 text-xs">700</div>
          </div>
          <p class="mt-2 text-error-600 text-sm">純赤系: 鮮明で警告性の高い赤色</p>
        </div>
        
        <!-- 情報カラー -->
        <div>
          <h3 class="text-lg font-medium mb-3 text-info-700">情報</h3>
          <div class="space-y-2">
            <div class="p-4 rounded bg-info-50 text-info-800 text-xs">50</div>
            <div class="p-4 rounded bg-info-100 text-info-800 text-xs">100</div>
            <div class="p-4 rounded bg-info-300 text-gray-50 text-xs">300</div>
            <div class="p-4 rounded bg-info-500 text-gray-50 text-xs">500</div>
            <div class="p-4 rounded bg-info-700 text-gray-50 text-xs">700</div>
          </div>
          <p class="mt-2 text-info-600 text-sm">コバルトブルー系: 知的でクリアな印象</p>
        </div>
      </div>
    </div>

    <!-- アイコンコンポーネント -->
    <div class="bg-gray-100 rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <h2 class="text-xl font-semibold mb-4 text-primary-900">アイコンコンポーネント</h2>
      <div class="grid grid-cols-4 gap-4">
        <div class="flex flex-col items-center">
          <Icon name="mdi:home" class="text-4xl text-primary-500 mb-2" />
          <p class="text-primary-700 text-sm">プライマリー</p>
        </div>
        <div class="flex flex-col items-center">
          <Icon name="mdi:account" class="text-4xl text-secondary-500 mb-2" />
          <p class="text-secondary-700 text-sm">セカンダリー</p>
        </div>
        <div class="flex flex-col items-center">
          <Icon name="mdi:settings" class="text-4xl text-info-500 mb-2" />
          <p class="text-info-700 text-sm">情報</p>
        </div>
        <div class="flex flex-col items-center">
          <Icon name="mdi:menu" class="text-4xl text-warning-500 mb-2" />
          <p class="text-warning-700 text-sm">警告</p>
        </div>
      </div>
      <div class="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 bg-primary-100 rounded-lg flex items-center justify-center">
          <Icon name="mdi:check" class="text-3xl text-primary-600" />
        </div>
        <div class="p-4 bg-secondary-100 rounded-lg flex items-center justify-center">
          <Icon name="mdi:close" class="text-3xl text-secondary-600" />
        </div>
        <div class="p-4 bg-error-100 rounded-lg flex items-center justify-center">
          <Icon name="mdi:alert" class="text-3xl text-error-600" />
        </div>
        <div class="p-4 bg-success-100 rounded-lg flex items-center justify-center">
          <Icon name="mdi:thumb-up" class="text-3xl text-success-600" />
        </div>
      </div>
    </div>
        
    <!-- 画像コンポーネント -->
    <div class="bg-gray-100 rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <h2 class="text-xl font-semibold mb-4 text-primary-900">画像コンポーネント</h2>
      <div class="flex flex-col md:flex-row gap-6 justify-center">
        <div class="flex flex-col items-center">
          <NuxtImg
            src="https://images.unsplash.com/photo-1682687220208-22d7a2543e88"
            width="300"
            height="200"
            alt="サンプル画像1"
            placeholder
            class="rounded-lg shadow-sm border-2 border-primary-400 mb-2"
          />
          <p class="text-primary-700 text-sm">プライマリーボーダー</p>
        </div>
        <div class="flex flex-col items-center">
          <NuxtImg
            src="https://images.unsplash.com/photo-1682687220208-22d7a2543e88"
            width="300"
            height="200"
            alt="サンプル画像2"
            placeholder
            class="rounded-lg shadow-sm border-2 border-secondary-400 mb-2"
          />
          <p class="text-secondary-700 text-sm">セカンダリーボーダー</p>
        </div>
      </div>
    </div>
    
    <!-- フォント表示 -->
    <div class="bg-gray-100 rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <h2 class="text-xl font-semibold mb-4 text-primary-900">フォント表示</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="p-4 bg-primary-50 rounded-lg">
          <h3 class="text-lg font-medium mb-3 text-primary-800">Roboto</h3>
          <p class="font-roboto text-lg mb-2 text-primary-700">これは Roboto フォントのテキストです</p>
          <p class="font-roboto text-primary-600 text-sm">プライマリー配色での表示例</p>
        </div>
        <div class="p-4 bg-secondary-50 rounded-lg">
          <h3 class="text-lg font-medium mb-3 text-secondary-800">Noto Sans JP</h3>
          <p class="font-sans text-lg font-bold mb-2 text-secondary-700">これは Noto Sans JP フォントのテキストです</p>
          <p class="font-sans text-secondary-600 text-sm">セカンダリー配色での表示例</p>
        </div>
      </div>
    </div>

    <!-- ボタン -->
    <div class="bg-gray-100 rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <h2 class="text-xl font-semibold mb-4 text-primary-900">ボタン</h2>
      
      <!-- プライマリーボタン -->
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-3 text-primary-800">プライマリーボタン</h3>
        <div class="flex flex-wrap gap-4">
          <button class="px-4 py-2 bg-primary-500 text-gray-50 rounded">デフォルト</button>
          <button class="px-4 py-2 bg-primary-600 text-gray-50 rounded">ホバー</button>
          <button class="px-4 py-2 bg-primary-700 text-gray-50 rounded">アクティブ</button>
          <button class="px-4 py-2 bg-primary-300 text-gray-50 rounded opacity-60 cursor-not-allowed">無効</button>
        </div>
      </div>
      
      <!-- セカンダリーボタン -->
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-3 text-secondary-800">セカンダリーボタン</h3>
        <div class="flex flex-wrap gap-4">
          <button class="px-4 py-2 bg-secondary-500 text-gray-50 rounded">デフォルト</button>
          <button class="px-4 py-2 bg-secondary-600 text-gray-50 rounded">ホバー</button>
          <button class="px-4 py-2 bg-secondary-700 text-gray-50 rounded">アクティブ</button>
          <button class="px-4 py-2 bg-secondary-300 text-gray-50 rounded opacity-60 cursor-not-allowed">無効</button>
        </div>
      </div>
      
      <!-- アウトラインボタン -->
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-3 text-gray-800">アウトラインボタン</h3>
        <div class="flex flex-wrap gap-4">
          <button class="px-4 py-2 border border-primary-500 text-primary-500 rounded hover:bg-primary-500 hover:text-gray-50">プライマリー</button>
          <button class="px-4 py-2 border border-secondary-500 text-secondary-500 rounded hover:bg-secondary-500 hover:text-gray-50">セカンダリー</button>
          <button class="px-4 py-2 border border-success-500 text-success-500 rounded hover:bg-success-500 hover:text-gray-50">成功</button>
          <button class="px-4 py-2 border border-error-500 text-error-500 rounded hover:bg-error-500 hover:text-gray-50">エラー</button>
        </div>
      </div>
      
      <!-- 状態ボタン -->
      <div>
        <h3 class="text-lg font-medium mb-3 text-gray-800">状態ボタン</h3>
        <div class="flex flex-wrap gap-4">
          <button class="px-4 py-2 bg-success-500 text-gray-50 rounded">成功</button>
          <button class="px-4 py-2 bg-warning-500 text-gray-50 rounded">警告</button>
          <button class="px-4 py-2 bg-error-500 text-gray-50 rounded">エラー</button>
          <button class="px-4 py-2 bg-info-500 text-gray-50 rounded">情報</button>
        </div>
      </div>
    </div>
    
    <!-- テキスト要素 -->
    <div class="bg-gray-100 rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <h2 class="text-xl font-semibold mb-4 text-primary-900">テキスト要素</h2>
      
      <!-- 見出し -->
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-3 text-primary-800">見出し</h3>
        <h1 class="text-3xl font-bold text-primary-900 mb-2">見出し 1 (text-3xl)</h1>
        <h2 class="text-2xl font-bold text-primary-800 mb-2">見出し 2 (text-2xl)</h2>
        <h3 class="text-xl font-semibold text-primary-700 mb-2">見出し 3 (text-xl)</h3>
        <h4 class="text-lg font-semibold text-primary-600 mb-2">見出し 4 (text-lg)</h4>
        <h5 class="text-base font-medium text-primary-500 mb-2">見出し 5 (text-base)</h5>
        <h6 class="text-sm font-medium text-primary-400">見出し 6 (text-sm)</h6>
      </div>
      
      <!-- 段落テキスト -->
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-3 text-secondary-800">段落テキスト</h3>
        <p class="text-gray-600 mb-2">標準テキスト (text-gray-600) - これは標準的な段落テキストです。</p>
        <p class="text-gray-700 mb-2">強調テキスト (text-gray-700) - これは少し強調された段落テキストです。</p>
        <p class="text-gray-800">非常に強調されたテキスト (text-gray-800) - これは非常に強調された段落テキストです。</p>
      </div>
      
      <!-- リンク -->
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-3 text-secondary-800">リンク</h3>
        <div class="space-y-2">
          <a href="#" class="text-primary-500 hover:text-primary-600">標準リンク</a><br>
          <a href="#" class="text-secondary-500 hover:text-secondary-600">セカンダリーリンク</a><br>
          <a href="#" class="text-primary-500 hover:text-primary-600 hover:underline">ホバー時下線付きリンク</a>
        </div>
      </div>
      
      <!-- リスト -->
      <div>
        <h3 class="text-lg font-medium mb-3 text-secondary-800">リスト</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-4 bg-primary-50 rounded-lg">
            <h4 class="text-primary-700 mb-2">順序なしリスト</h4>
            <ul class="list-disc pl-5 text-primary-600">
              <li>リストアイテム 1</li>
              <li>リストアイテム 2</li>
              <li>リストアイテム 3</li>
            </ul>
          </div>
          <div class="p-4 bg-secondary-50 rounded-lg">
            <h4 class="text-secondary-700 mb-2">順序付きリスト</h4>
            <ol class="list-decimal pl-5 text-secondary-600">
              <li>リストアイテム 1</li>
              <li>リストアイテム 2</li>
              <li>リストアイテム 3</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
    
    <!-- フォーム要素 -->
    <div class="bg-gray-100 rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <h2 class="text-xl font-semibold mb-4 text-primary-900">フォーム要素</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- テキスト入力 -->
        <div class="mb-4">
          <label class="block text-primary-700 mb-2" for="input-text">テキスト入力</label>
          <input id="input-text" type="text" placeholder="テキストを入力" class="w-full rounded border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50">
        </div>
        
        <!-- セレクトボックス -->
        <div class="mb-4">
          <label class="block text-secondary-700 mb-2" for="select">セレクトボックス</label>
          <select id="select" class="w-full rounded border-gray-300 focus:border-secondary-500 focus:ring focus:ring-secondary-200 focus:ring-opacity-50">
            <option>オプション 1</option>
            <option>オプション 2</option>
            <option>オプション 3</option>
          </select>
        </div>
        
        <!-- テキストエリア -->
        <div class="mb-4">
          <label class="block text-primary-700 mb-2" for="textarea">テキストエリア</label>
          <textarea id="textarea" rows="3" placeholder="テキストを入力" class="w-full rounded border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"></textarea>
        </div>
        
        <!-- チェックボックスとラジオボタン -->
        <div class="space-y-4">
          <div>
            <h4 class="text-secondary-700 mb-2">チェックボックス</h4>
            <div class="space-y-2">
              <div class="flex items-center">
                <input id="checkbox-1" type="checkbox" class="rounded border-gray-300 text-primary-500 focus:ring-primary-200">
                <label for="checkbox-1" class="ml-2 text-primary-600">オプション 1</label>
              </div>
              <div class="flex items-center">
                <input id="checkbox-2" type="checkbox" class="rounded border-gray-300 text-primary-500 focus:ring-primary-200">
                <label for="checkbox-2" class="ml-2 text-primary-600">オプション 2</label>
              </div>
            </div>
          </div>
          
          <div>
            <h4 class="text-secondary-700 mb-2">ラジオボタン</h4>
            <div class="space-y-2">
              <div class="flex items-center">
                <input id="radio-1" type="radio" name="radio-group" class="border-gray-300 text-secondary-500 focus:ring-secondary-200">
                <label for="radio-1" class="ml-2 text-secondary-600">オプション 1</label>
              </div>
              <div class="flex items-center">
                <input id="radio-2" type="radio" name="radio-group" class="border-gray-300 text-secondary-500 focus:ring-secondary-200">
                <label for="radio-2" class="ml-2 text-secondary-600">オプション 2</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- カード・アラート・通知 -->
    <div class="bg-gray-100 rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <h2 class="text-xl font-semibold mb-4 text-primary-900">カード・アラート・通知</h2>
      
      <!-- カードサンプル -->
      <div class="mb-8">
        <h3 class="text-lg font-medium mb-3 text-primary-800">カード</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-primary-50 rounded-lg overflow-hidden shadow border border-primary-200">
            <div class="p-4 border-b border-primary-200 bg-primary-100">
              <h3 class="font-semibold text-primary-700">プライマリーカード</h3>
            </div>
            <div class="p-4">
              <p class="text-primary-600">これはカードの本文コンテンツです。さまざまな情報を表示するために使用できます。</p>
            </div>
            <div class="p-4 bg-primary-50 border-t border-primary-200">
              <button class="px-3 py-1 text-sm bg-primary-500 text-gray-50 rounded">アクション</button>
            </div>
          </div>
          
          <div class="bg-secondary-50 rounded-lg overflow-hidden shadow border border-secondary-200">
            <div class="p-4">
              <h3 class="font-semibold text-secondary-700 mb-2">セカンダリーカード</h3>
              <p class="text-secondary-600">これはよりシンプルなカードデザインです。さまざまな用途に使用できます。</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- アラート -->
      <div class="mb-8">
        <h3 class="text-lg font-medium mb-3 text-primary-800">アラート</h3>
        <div class="space-y-4">
          <div class="p-4 rounded-lg bg-success-50 border border-success-300 text-success-700">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-success-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm">成功アラート：操作が正常に完了しました。</p>
              </div>
            </div>
          </div>
          
          <div class="p-4 rounded-lg bg-warning-50 border border-warning-300 text-warning-700">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-warning-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm">警告アラート：この操作は取り消せません。</p>
              </div>
            </div>
          </div>
          
          <div class="p-4 rounded-lg bg-error-50 border border-error-300 text-error-700">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-error-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm">エラーアラート：処理中にエラーが発生しました。</p>
              </div>
            </div>
          </div>
          
          <div class="p-4 rounded-lg bg-info-50 border border-info-300 text-info-700">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-info-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm">情報アラート：新しい機能が利用可能になりました。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- バッジ -->
      <div>
        <h3 class="text-lg font-medium mb-3 text-primary-800">バッジ</h3>
        <div class="flex flex-wrap gap-3">
          <span class="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">プライマリー</span>
          <span class="px-2 py-1 text-xs rounded-full bg-secondary-100 text-secondary-800">セカンダリー</span>
          <span class="px-2 py-1 text-xs rounded-full bg-success-100 text-success-800">成功</span>
          <span class="px-2 py-1 text-xs rounded-full bg-warning-100 text-warning-800">警告</span>
          <span class="px-2 py-1 text-xs rounded-full bg-error-100 text-error-800">エラー</span>
          <span class="px-2 py-1 text-xs rounded-full bg-info-100 text-info-800">情報</span>
          <span class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">デフォルト</span>
        </div>
      </div>
    </div>    

  </div>
</template>
