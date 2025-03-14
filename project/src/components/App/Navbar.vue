<template>
  <header class="sticky top-0 z-50 transition-all duration-300">
    <nav class="border-b border-[rgb(var(--color-border)/0.5)] px-4 py-3 backdrop-blur-md bg-[rgb(var(--color-background)/0.8)]">
      <div class="container mx-auto">
        <!-- モバイルナビゲーション -->
        <div class="flex items-center justify-between">
          <!-- ロゴ -->
          <router-link to="/" class="group flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-8 w-8 text-[rgb(var(--color-primary-light))] transition-transform group-hover:scale-110">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-12h2v6h-2zm0 8h2v2h-2z" />
            </svg>
            <span class="ml-2 text-xl font-bold tracking-wide text-[rgb(var(--color-heading))]">Juna</span>
          </router-link>

          <div class="flex items-center space-x-3">
            <!-- デスクトップのみ表示するリンク -->
            <div class="hidden items-center space-x-5 sm:flex">
              <router-link 
                to="/posts" 
                class="active-nav-link relative py-1 text-[rgb(var(--color-secondary))] tracking-[0.02em] transition-colors hover:text-[rgb(var(--color-primary-light))]"
                active-class="active-nav-link"
              >投稿一覧</router-link>
              
              <!-- 認証済みユーザーのみ表示 - 投稿作成ボタン -->
              <router-link 
                v-if="authStore.isAuthenticated" 
                to="/editor" 
                class="hidden items-center text-[rgb(var(--color-primary-light))] transition-colors hover:text-[rgb(var(--color-primary))] md:flex"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                <span>投稿作成</span>
              </router-link>
            </div>

            <!-- 認証メニュー -->
            <div class="flex items-center space-x-3">
              <!-- 未認証の場合 -->
              <template v-if="!authStore.isAuthenticated">
                <router-link
                  to="/auth?mode=login"
                  class="rounded-full border-2 border-[rgb(var(--color-primary))] px-3 py-1.5 text-sm text-[rgb(var(--color-primary-light))] transition-all hover:bg-[rgb(var(--color-primary)/0.1)]"
                >
                  ログイン
                </router-link>
                <router-link
                  to="/auth?mode=register"
                  class="hidden rounded-full bg-[rgb(var(--color-primary))] px-3 py-1.5 text-sm text-[rgb(var(--color-text-white))] shadow-[0_1px_2px_rgb(var(--color-primary)/0.3)] transition-all hover:bg-[rgb(var(--color-primary-dark))] hover:shadow-[0_4px_6px_rgb(var(--color-primary)/0.4)] sm:block"
                >
                  会員登録
                </router-link>
              </template>
              
              <!-- 認証済みの場合 - プロフィールメニュー -->
              <div v-else class="relative" ref="dropdownRef">
                <div 
                  @click="toggleDropdown" 
                  class="flex cursor-pointer items-center rounded-full bg-[rgb(var(--color-primary)/0.2)] px-2 py-1.5 transition-colors hover:bg-[rgb(var(--color-primary)/0.3)]"
                >
                  <div 
                    class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full"
                  >
                    <img 
                      v-if="authStore.avatarUrl" 
                      :src="authStore.avatarUrl" 
                      :alt="authStore.displayName"
                      class="h-full w-full object-cover"
                    />
                    <div v-else class="flex h-full w-full items-center justify-center bg-[rgb(var(--color-primary-dark)/0.3)] text-sm text-[rgb(var(--color-text))]">
                      {{ getInitials(authStore.displayName) }}
                    </div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" class="ml-1 h-4 w-4 text-[rgb(var(--color-text))] hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                <!-- ドロップダウンメニュー -->
                <div 
                  v-show="dropdownOpen" 
                  class="absolute right-0 mt-2 z-50 w-48 rounded-lg border border-[rgb(var(--color-border-light)/0.2)] bg-[rgb(var(--color-background)/0.8)] py-2 shadow-lg backdrop-blur-md transition-all duration-200 ease-out animate-[dropdown_0.2s_ease-out_forwards] overflow-hidden"
                >
                  <router-link 
                    to="/dashboard" 
                    class="flex items-center px-4 py-2.5 text-sm text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.15)]"
                    @click="dropdownOpen = false"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    ダッシュボード
                  </router-link>
                  
                  <router-link 
                    :to="`/profile/${authStore.user?.id}`" 
                    class="flex items-center px-4 py-2.5 text-sm text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.15)]"
                    @click="dropdownOpen = false"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    プロフィール
                  </router-link>
                  
                  <router-link 
                    to="/editor" 
                    class="flex items-center px-4 py-2.5 text-sm text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.15)]"
                    @click="dropdownOpen = false"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    投稿作成
                  </router-link>
                  
                  <router-link 
                    to="/profile/edit" 
                    class="flex items-center px-4 py-2.5 text-sm text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.15)]"
                    @click="dropdownOpen = false"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    設定
                  </router-link>
                  
                  <div class="my-1 border-t border-[rgb(var(--color-border))/0.3]"></div>
                  
                  <button 
                    @click="handleLogout" 
                    class="flex w-full items-center px-4 py-2.5 text-left text-sm text-[rgb(var(--color-error))] transition-colors hover:bg-[rgb(var(--color-primary)/0.15)] hover:text-[rgb(var(--color-error-dark))]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    ログアウト
                  </button>
                </div>
              </div>
            </div>

            <!-- モバイルメニューボタン -->
            <button 
              @click="toggleMobileMenu" 
              class="rounded-lg p-1.5 text-[rgb(var(--color-text))] focus:outline-none sm:hidden"
              aria-label="モバイルメニュー"
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
        </div>
      </div>
    </nav>
    
    <!-- モバイルメニュー -->
    <div 
      v-if="isMenuOpen" 
      class="fixed inset-0 z-40 bg-[rgb(var(--color-background))/0.95] sm:hidden"
      @click="isMenuOpen = false"
    >
      <div 
        class="ml-auto h-full w-full max-w-xs overflow-y-auto bg-[rgb(var(--color-surface-variant))] px-4 py-6 shadow-[0_10px_15px_rgb(var(--color-background)/0.5)]"
        @click.stop
      >
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-lg font-medium text-[rgb(var(--color-heading))]">メニュー</h2>
          <button 
            @click="isMenuOpen = false" 
            class="rounded-lg p-1 text-[rgb(var(--color-text))]"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                stroke-width="2" 
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
          
        <nav class="space-y-1">
          <router-link to="/" class="block rounded px-2 py-2.5 text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.1)]" @click="isMenuOpen = false">ホーム</router-link>
          <router-link to="/posts" class="block rounded px-2 py-2.5 text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.1)]" @click="isMenuOpen = false">投稿一覧</router-link>
          
          <div class="my-3 border-t border-[rgb(var(--color-border))]"></div>
          
          <template v-if="authStore.isAuthenticated">
            <div class="mb-2 flex items-center p-2">
              <div class="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--color-primary)/0.3)]">
                <img 
                  v-if="authStore.avatarUrl" 
                  :src="authStore.avatarUrl" 
                  :alt="authStore.displayName"
                  class="h-full w-full rounded-full object-cover"
                />
                <span v-else class="text-[rgb(var(--color-text))]">{{ getInitials(authStore.displayName) }}</span>
              </div>
              <span class="font-medium text-[rgb(var(--color-heading))]">{{ authStore.displayName }}</span>
            </div>
            <router-link to="/editor" class="block rounded px-2 py-2.5 text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.1)]" @click="isMenuOpen = false">投稿作成</router-link>
            <router-link to="/dashboard" class="block rounded px-2 py-2.5 text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.1)]" @click="isMenuOpen = false">ダッシュボード</router-link>
            <router-link :to="`/profile/${authStore.user?.id}`" class="block rounded px-2 py-2.5 text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.1)]" @click="isMenuOpen = false">プロフィール</router-link>
            <router-link to="/profile/edit" class="block rounded px-2 py-2.5 text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.1)]" @click="isMenuOpen = false">設定</router-link>
            
            <div class="my-3 border-t border-[rgb(var(--color-border))]"></div>
            
            <button @click="handleLogout" class="w-full rounded px-2 py-2.5 text-left text-[rgb(var(--color-error))] transition-colors hover:bg-[rgb(var(--color-primary)/0.1)]">ログアウト</button>
          </template>
          <template v-else>
            <router-link to="/auth?mode=login" class="block rounded px-2 py-2.5 text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.1)]" @click="isMenuOpen = false">ログイン</router-link>
            <router-link to="/auth?mode=register" class="block rounded px-2 py-2.5 text-[rgb(var(--color-text))] transition-colors hover:bg-[rgb(var(--color-primary)/0.1)]" @click="isMenuOpen = false">会員登録</router-link>
          </template>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const dropdownOpen = ref(false);
const isMenuOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

// ドロップダウンの表示・非表示を切り替え
function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

// モバイルメニューの表示・非表示を切り替え
function toggleMobileMenu() {
  isMenuOpen.value = !isMenuOpen.value;
  
  // メニューを開いたらスクロールを無効化
  if (isMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}

// ドロップダウン以外の場所をクリックしたときに閉じる
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  window.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('click', handleClickOutside);
  // 念のためスクロールを有効に戻す
  document.body.style.overflow = '';
});

// ページ遷移時にメニューを閉じる
watch(() => router.currentRoute.value, () => {
  isMenuOpen.value = false;
  dropdownOpen.value = false;
  document.body.style.overflow = '';
});

// ログアウト処理
async function handleLogout() {
  try {
    await authStore.logout();
    router.push('/');
    isMenuOpen.value = false;
    dropdownOpen.value = false;
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
@keyframes dropdown {
  to { opacity: 1; transform: translateY(0); }
}

.active-nav-link {
  @apply relative;
}

.active-nav-link::after {
  content: '';
  @apply absolute -bottom-1 left-0 w-full h-0.5 bg-[rgb(var(--color-primary-light)/0.7)] rounded-full transition-all duration-300 ease-in-out;
}
</style> 