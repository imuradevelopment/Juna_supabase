<template>
  <header class="sticky top-0 z-50 transition-all duration-300">
    <nav class="border-b border-gray-800/50 px-5 py-4 backdrop-blur-md bg-[#0f1118]/80">
      <div class="container mx-auto flex items-center justify-between">
        <!-- ロゴ -->
        <div class="flex items-center space-x-3">
          <router-link to="/" class="flex items-center group">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-9 w-9 logo-icon transition-transform group-hover:scale-110">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            <span class="text-2xl font-bold ml-2 logo-text tracking-wide">Juna</span>
          </router-link>
        </div>

        <!-- メインナビゲーション -->
        <div class="hidden md:flex items-center space-x-6">
          <router-link to="/" class="nav-link text-base">ホーム</router-link>
          <router-link to="/posts" class="nav-link text-base">投稿一覧</router-link>
          
          <!-- 認証済みユーザーのみ表示 - ドロップダウンにも同じリンクがあるので条件付けする -->
          <router-link 
            v-if="authStore.isAuthenticated && !isLargeScreen" 
            to="/editor" 
            class="nav-link text-base"
          >
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              投稿作成
            </span>
          </router-link>
        </div>

        <!-- 右側のナビゲーション -->
        <div class="flex items-center space-x-4">
          <!-- 検索ボタンを削除 -->
          
          <!-- 認証済みの場合 -->
          <template v-if="authStore.isAuthenticated">
            <div class="relative" ref="dropdownRef">
              <!-- プロフィールアイコン - 「い」ボタンを改良 -->
              <button @click="toggleDropdown" class="flex items-center bg-primary/20 hover:bg-primary/30 px-3 py-2 rounded-full transition-colors focus:outline-none">
                <div class="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center mr-1">
                  <img 
                    v-if="authStore.avatarUrl" 
                    :src="authStore.avatarUrl" 
                    :alt="authStore.displayName"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full avatar-placeholder flex items-center justify-center">
                    {{ getInitials(authStore.displayName) }}
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <!-- ドロップダウンメニュー - 背景の透明度を下げて視認性向上 -->
              <div 
                v-if="dropdownOpen" 
                class="absolute right-0 mt-2 w-48 py-2 dropdown-menu rounded-lg overflow-hidden"
              >
                <router-link 
                  to="/dashboard" 
                  class="dropdown-item"
                  @click="dropdownOpen = false"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  ダッシュボード
                </router-link>
                
                <router-link 
                  :to="`/profile/${authStore.user?.id}`" 
                  class="dropdown-item"
                  @click="dropdownOpen = false"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  プロフィール
                </router-link>
                
                <router-link 
                  to="/editor" 
                  class="dropdown-item"
                  @click="dropdownOpen = false"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  投稿作成
                </router-link>
                
                <router-link 
                  to="/profile/edit" 
                  class="dropdown-item"
                  @click="dropdownOpen = false"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  設定
                </router-link>
                
                <div class="border-t border-gray-700/30 my-1"></div>
                
                <button 
                  @click="handleLogout" 
                  class="dropdown-item text-red-400 hover:text-red-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  ログアウト
                </button>
              </div>
            </div>
          </template>

          <!-- 未認証の場合 - 統合認証ページへのリンク -->
          <template v-else>
            <router-link
              to="/auth?mode=login"
              class="btn-outline-primary px-4 py-1.5 rounded-full border-2 border-primary text-primary-light hover:bg-primary/10 transition-all"
            >
              ログイン
            </router-link>
            <router-link
              to="/auth?mode=register"
              class="hidden sm:block btn-primary gradient-bg px-4 py-1.5 rounded-full text-white shadow-sm shadow-primary/30 transition-all hover:shadow-md"
            >
              会員登録
            </router-link>
          </template>
        </div>
        
        <!-- モバイルメニューボタン -->
        <button 
          @click="toggleMobileMenu" 
          class="md:hidden p-2 rounded-lg focus:outline-none"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              v-if="!isMenuOpen" 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M4 6h16M4 12h16M4 18h16"
            />
            <path 
              v-else 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </nav>
    
    <!-- モバイルメニュー -->
    <div 
      v-if="isMenuOpen" 
      class="md:hidden fixed inset-0 z-40 bg-black bg-opacity-80 backdrop-blur-sm"
      @click="isMenuOpen = false"
    >
      <div 
        class="bg-gray-900 w-64 h-full p-5 transform transition-transform"
        @click.stop
      >
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">メニュー</h2>
          <button @click="isMenuOpen = false" class="rounded-full p-1 hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav class="flex flex-col space-y-4">
          <router-link to="/" class="block py-2" @click="isMenuOpen = false">ホーム</router-link>
          <router-link to="/posts" class="block py-2" @click="isMenuOpen = false">投稿一覧</router-link>
          
          <div class="border-t border-gray-800 my-2 pt-2">
            <template v-if="authStore.isAuthenticated">
              <div class="flex items-center py-2 mb-2">
                <div class="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-white mr-3">
                  <img 
                    v-if="authStore.avatarUrl" 
                    :src="authStore.avatarUrl" 
                    :alt="authStore.displayName"
                    class="w-full h-full object-cover rounded-full"
                  />
                  <span v-else>{{ getInitials(authStore.displayName) }}</span>
                </div>
                <span>{{ authStore.displayName }}</span>
              </div>
              <router-link to="/editor" class="block py-2" @click="isMenuOpen = false">投稿作成</router-link>
              <router-link to="/dashboard" class="block py-2" @click="isMenuOpen = false">ダッシュボード</router-link>
              <router-link :to="`/profile/${authStore.user?.id}`" class="block py-2" @click="isMenuOpen = false">プロフィール</router-link>
              <router-link to="/profile/edit" class="block py-2" @click="isMenuOpen = false">設定</router-link>
              <button @click="handleLogout" class="block w-full text-left py-2 text-red-400">ログアウト</button>
            </template>
            <template v-else>
              <router-link to="/auth?mode=login" class="block py-2" @click="isMenuOpen = false">ログイン</router-link>
              <router-link to="/auth?mode=register" class="block py-2" @click="isMenuOpen = false">会員登録</router-link>
            </template>
          </div>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const dropdownOpen = ref(false);
const isMenuOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const windowWidth = ref(window.innerWidth);

// 画面サイズを監視
function handleResize() {
  windowWidth.value = window.innerWidth;
}

// 大画面か判定するための計算プロパティ
const isLargeScreen = computed(() => {
  return windowWidth.value >= 1024; // lg breakpoint
});

// ドロップダウンの表示・非表示を切り替え
function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

// モバイルメニューの表示・非表示を切り替え
function toggleMobileMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

// ドロップダウン以外の場所をクリックしたときに閉じる
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleResize);
});

// ページ遷移時にメニューを閉じる
watch(() => router.currentRoute.value, () => {
  isMenuOpen.value = false;
  dropdownOpen.value = false;
});

// ログアウト処理
async function handleLogout() {
  try {
    await authStore.logout();
    router.push('/');
  } catch (error) {
    console.error('ログアウトエラー:', error);
  }
}

// ヘルパー関数
function getInitials(name: string | undefined): string {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
}
</script>

<style scoped lang="postcss">
.nav-link {
  @apply relative text-secondary hover:text-primary-light transition-colors duration-300 py-1;
  letter-spacing: 0.02em;
}

.nav-link.router-link-active {
  @apply text-primary-light;
}

.nav-link.router-link-active::after {
  content: '';
  @apply absolute bottom-[-4px] left-0 w-full h-[2px] bg-primary-light/70 rounded-full;
  animation: navIndicator 0.3s ease-in-out;
}

@keyframes navIndicator {
  from { width: 0; opacity: 0; left: 50%; transform: translateX(-50%); }
  to { width: 100%; opacity: 1; left: 0; transform: translateX(0); }
}

.btn-outline-primary {
  position: relative;
  overflow: hidden;
}

.btn-outline-primary::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 0;
  background: radial-gradient(circle, var(--color-primary-light) 0%, transparent 70%);
  opacity: 0;
  transform: translate(-50%, -50%);
  transition: height 0.5s ease, opacity 0.3s ease;
  z-index: -1;
  border-radius: 9999px;
}

.btn-outline-primary:hover::after {
  height: 150%;
  opacity: 0.15;
}

/* ドロップダウンメニューの視認性向上 */
.dropdown-menu {
  background-color: rgba(15, 17, 24, 0.95);
  border: 1px solid rgba(75, 85, 99, 0.2);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2), 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  @apply flex items-center px-4 py-2.5 text-sm text-gray-300 hover:bg-primary/15 transition-colors duration-150;
}

/* ドロップダウンアニメーション */
@keyframes dropdownFadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-menu {
  animation: dropdownFadeIn 0.2s ease-out forwards;
}
</style> 