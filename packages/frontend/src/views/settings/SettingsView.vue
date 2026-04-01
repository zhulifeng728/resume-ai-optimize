<template>
  <div class="settings-page">
    <div class="settings-layout">
      <!-- 侧边导航 -->
      <div class="settings-nav">
        <div
          v-for="tab in tabs"
          :key="tab.key"
          class="nav-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <el-icon><component :is="tab.icon" /></el-icon>
          {{ tab.label }}
        </div>
      </div>

      <!-- 内容区 -->
      <div class="settings-content">
        <!-- API Key 管理 -->
        <ApiKeyView v-if="activeTab === 'api-keys'" />

        <!-- 个人信息 -->
        <div v-if="activeTab === 'profile'" class="profile-section">
          <h2>个人信息</h2>
          <el-form :model="profileForm" label-position="top" style="max-width: 480px">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.name" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" disabled />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="savingProfile" @click="saveProfile">保存</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Key, User } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/stores/auth';
import ApiKeyView from './ApiKeyView.vue';

const authStore = useAuthStore();
const activeTab = ref('api-keys');
const savingProfile = ref(false);

const tabs = [
  { key: 'api-keys', label: 'API 密钥', icon: Key },
  { key: 'profile', label: '个人信息', icon: User },
];

const profileForm = ref({ name: '', email: '' });

onMounted(() => {
  profileForm.value = { name: authStore.user?.name || '', email: authStore.user?.email || '' };
});

async function saveProfile() {
  savingProfile.value = true;
  try {
    // TODO: 调用 patch profile API
    ElMessage.success('保存成功');
  } finally {
    savingProfile.value = false;
  }
}
</script>

<style scoped>
.settings-page {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.settings-nav {
  width: 160px;
  flex-shrink: 0;
  background: white;
  border-radius: 12px;
  padding: 8px;
  border: 1px solid #e8edf5;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: #546e7a;
  cursor: pointer;
  transition: all 0.15s;
}

.nav-item:hover {
  background: #f0f4ff;
  color: #3669EC;
}

.nav-item.active {
  background: #eff4ff;
  color: #3669EC;
  font-weight: 600;
}

.settings-content {
  flex: 1;
  min-width: 0;
}

.profile-section {
  background: white;
  border-radius: 12px;
  padding: 28px;
  border: 1px solid #e8edf5;
}

.profile-section h2 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 24px;
  color: #1a1a2e;
}
</style>
