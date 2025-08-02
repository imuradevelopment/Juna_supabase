import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import HomePage from '../pages/HomePage.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // メインページ
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    
    // 投稿一覧・検索・カテゴリ（統合ページ）
    {
      path: '/posts',
      name: 'posts',
      component: () => import('../pages/PostsPage.vue')
    },
    
    // 投稿詳細
    {
      path: '/posts/:id',
      name: 'post',
      component: () => import('../pages/PostDetailPage.vue')
    },
    
    // 投稿作成・編集
    {
      path: '/editor',
      name: 'editor',
      component: () => import('../pages/PostEditorPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/editor/:id',
      name: 'editor-id',
      component: () => import('../pages/PostEditorPage.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    
    // 認証（統合ページで切り替え）
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../pages/AuthPage.vue'),
      meta: { requiresGuest: true }
    },
    
    // ダッシュボード
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../pages/DashboardPage.vue'),
      meta: { requiresAuth: true }
    },
    
    // プロフィール
    {
      path: '/profile/:id',
      name: 'profile',
      component: () => import('../pages/ProfilePage.vue')
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('../pages/ProfileEditPage.vue'),
      meta: { requiresAuth: true }
    },
    
    // 404ページ
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/NotFoundPage.vue')
    }
  ],
  scrollBehavior(to, _, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' };
    }
    
    return { top: 0, behavior: 'smooth' };
  }
});

// ナビゲーションガード
router.beforeEach(async (to, _, next) => {
  const authStore = useAuthStore();
  
  // 認証状態の初期化が完了していない場合は待機
  if (!authStore.isAuthReady) {
    // 認証チェックの完了を待つ（最大5秒）
    const timeout = 5000;
    const startTime = Date.now();
    
    while (!authStore.isAuthReady && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // タイムアウトした場合はホームページにリダイレクト
    if (!authStore.isAuthReady) {
      console.warn('認証状態の初期化がタイムアウトしました');
      return next({ name: 'home' });
    }
  }
  
  // 認証状態の初期化が完了している場合は、通常の認証チェックを実行
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ path: '/auth', query: { redirect: to.fullPath } });
  } 
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'home' });
  } 
  else {
    next();
  }
});

export default router; 