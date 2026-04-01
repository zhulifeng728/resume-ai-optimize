import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: 'AI 简历优化 - 让你的简历脱颖而出' }
      },
      {
        path: 'optimize',
        name: 'optimize',
        component: () => import('@/views/optimization/OptimizationView.vue'),
        meta: { title: '简历优化', requiresAuth: true }
      },
      {
        path: 'review-doc',
        name: 'review-doc',
        component: () => import('@/views/review-doc/ReviewDocListView.vue'),
        meta: { title: '技术复习文档', requiresAuth: true }
      },
      {
        path: 'my/resumes',
        name: 'my-resumes',
        component: () => import('@/views/resume/ResumeListView.vue'),
        meta: { title: '我的简历', requiresAuth: true }
      },
      {
        path: 'my/review-docs',
        name: 'my-review-docs',
        component: () => import('@/views/review-doc/ReviewDocListView.vue'),
        meta: { title: '我的复习文档', requiresAuth: true }
      },
      {
        path: 'my/settings',
        name: 'my-settings',
        component: () => import('@/views/settings/SettingsView.vue'),
        meta: { title: '个人设置', requiresAuth: true }
      },
      {
        path: 'resume/:id',
        name: 'resume-detail',
        component: () => import('@/views/resume/ResumeDetailView.vue'),
        meta: { title: '简历详情', requiresAuth: true }
      },
      {
        path: 'review-doc/:id',
        name: 'review-doc-detail',
        component: () => import('@/views/review-doc/ReviewDocDetailView.vue'),
        meta: { title: '复习文档详情', requiresAuth: true }
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 存储待跳转的路由
let pendingRoute: string | null = null;

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title as string;
  }

  // 如果需要认证但未登录
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 保存待跳转的路由
    pendingRoute = to.fullPath;

    // 如果是首次访问，重定向到首页
    if (from.name === undefined) {
      next({ name: 'home', replace: true });
    } else {
      // 已经在应用内，阻止导航
      next(false);
    }

    // 延迟触发登录弹窗，确保组件已挂载
    setTimeout(() => {
      const event = new CustomEvent('open-login-dialog');
      window.dispatchEvent(event);
    }, 100);
  } else {
    next();
  }
});

// 导出函数供登录成功后使用
export function getPendingRoute() {
  return pendingRoute;
}

export function clearPendingRoute() {
  pendingRoute = null;
}

export default router;
