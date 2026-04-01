<template>
  <div class="layout-container">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <router-link to="/" class="logo">
            <span class="logo-icon">📝</span>
            <span class="logo-text">AI 简历优化</span>
          </router-link>
          <nav class="nav-menu">
            <router-link to="/optimize" class="nav-link">简历优化</router-link>
            <router-link to="/review-doc" class="nav-link">技术复习</router-link>
          </nav>
        </div>
        <div class="header-right">
          <template v-if="authStore.isAuthenticated">
            <el-dropdown @command="handleCommand">
              <span class="user-dropdown">
                <el-avatar :size="32" :style="{ background: '#3669EC' }">
                  {{ authStore.user?.name?.charAt(0) }}
                </el-avatar>
                <span class="user-name">{{ authStore.user?.name }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="my-resumes">我的简历</el-dropdown-item>
                  <el-dropdown-item command="my-review-docs">我的复习文档</el-dropdown-item>
                  <el-dropdown-item command="my-settings">个人设置</el-dropdown-item>
                  <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button text @click="openLoginDialog">登录</el-button>
            <el-button type="primary" @click="openRegisterDialog">注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <p>&copy; 2026 AI 简历优化. All rights reserved.</p>
      </div>
    </footer>

    <!-- 登录弹窗 -->
    <el-dialog v-model="showLoginDialog" title="登录" width="400px" :close-on-click-modal="false">
      <LoginForm @success="handleLoginSuccess" @switch-to-register="switchToRegister" />
    </el-dialog>

    <!-- 注册弹窗 -->
    <el-dialog v-model="showRegisterDialog" title="注册" width="400px" :close-on-click-modal="false">
      <RegisterForm @success="handleRegisterSuccess" @switch-to-login="switchToLogin" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ArrowDown } from '@element-plus/icons-vue';
import LoginForm from '@/components/LoginForm.vue';
import RegisterForm from '@/components/RegisterForm.vue';
import { provideLoginDialog } from '@/composables/useLoginDialog';
import { getPendingRoute, clearPendingRoute } from '@/router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();

const { showLoginDialog, showRegisterDialog, openLoginDialog, openRegisterDialog } = provideLoginDialog();

// 监听全局登录弹窗事件
const handleOpenLoginDialog = () => {
  ElMessage.warning('请先登录');
  openLoginDialog();
};

onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchProfile();
  }

  // 监听路由守卫触发的登录弹窗事件
  window.addEventListener('open-login-dialog', handleOpenLoginDialog);
});

onUnmounted(() => {
  window.removeEventListener('open-login-dialog', handleOpenLoginDialog);
});

function handleCommand(command: string) {
  switch (command) {
    case 'my-resumes':
      router.push({ name: 'my-resumes' });
      break;
    case 'my-review-docs':
      router.push({ name: 'my-review-docs' });
      break;
    case 'my-settings':
      router.push({ name: 'my-settings' });
      break;
    case 'logout':
      authStore.logout();
      router.push({ name: 'home' });
      break;
  }
}

function handleLoginSuccess() {
  showLoginDialog.value = false;

  // 登录成功后，如果有待跳转的路由，则跳转
  const pending = getPendingRoute();
  if (pending) {
    clearPendingRoute();
    router.push(pending);
  }
}

function handleRegisterSuccess() {
  showRegisterDialog.value = false;

  // 注册成功后，如果有待跳转的路由，则跳转
  const pending = getPendingRoute();
  if (pending) {
    clearPendingRoute();
    router.push(pending);
  }
}

function switchToRegister() {
  showLoginDialog.value = false;
  showRegisterDialog.value = true;
}

function switchToLogin() {
  showRegisterDialog.value = false;
  showLoginDialog.value = true;
}
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f7ff;
}

.header {
  background: white;
  border-bottom: 1px solid #e3f2fd;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.08);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 48px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  font-size: 20px;
  font-weight: 700;
  color: #3669EC;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  color: #3669EC;
}

.nav-menu {
  display: flex;
  gap: 32px;
}

.nav-link {
  text-decoration: none;
  color: #546e7a;
  font-size: 15px;
  font-weight: 500;
  transition: color 0.2s;
  position: relative;
  padding: 20px 0;
}

.nav-link:hover {
  color: #3669EC;
}

.nav-link.router-link-active {
  color: #3669EC;
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #3669EC;
  border-radius: 3px 3px 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-dropdown:hover {
  background: #e3f2fd;
}

.user-name {
  font-size: 14px;
  color: #37474f;
  font-weight: 500;
}

.main-content {
  flex: 1;
}

.footer {
  background: white;
  border-top: 1px solid #e3f2fd;
  padding: 24px 0;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  text-align: center;
  color: #78909c;
  font-size: 14px;
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }

  .header-content {
    padding: 0 16px;
  }
}
</style>
