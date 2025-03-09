import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import HomePage from '../pages/HomePage.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../pages/AuthPage.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/login',
      redirect: to => {
        return { path: '/auth', query: { ...to.query, mode: 'login' } };
      }
    },
    {
      path: '/register',
      redirect: to => {
        return { path: '/auth', query: { ...to.query, mode: 'register' } };
      }
    },
    {
      path: '/categories',
      name: 'categories',
      component: () => import('../pages/CategoriesPage.vue')
    },
    {
      path: '/categories/:id',
      name: 'category',
      component: () => import('../pages/CategoryPage.vue')
    },
    {
      path: '/posts',
      name: 'posts',
      component: () => import('../pages/PostsPage.vue')
    },
    {
      path: '/posts/:id',
      name: 'post-detail',
      component: () => import('../pages/PostDetailPage.vue')
    },
    {
      path: '/create-post',
      name: 'create-post',
      component: () => import('../pages/CreatePostPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/posts/:id/edit',
      name: 'edit-post',
      component: () => import('../pages/EditPostPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/:id?',
      name: 'profile',
      component: () => import('../pages/ProfilePage.vue')
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('../pages/ProfileEditPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../pages/DashboardPage.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../pages/SearchPage.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/NotFoundPage.vue')
    }
  ]
});

// ナビゲーションガード
router.beforeEach(async (to, _, next) => {
  const authStore = useAuthStore();
  
  // 認証が必要なルートのチェック
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ path: '/auth', query: { redirect: to.fullPath } });
  } 
  // ゲスト専用ルートのチェック
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'home' });
  } 
  else {
    next();
  }
});

export default router; 