<template>
  <div class="dashboard">
    <h2>Dashboard</h2>
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>Resumes</template>
          <div class="stat-number">{{ resumeStore.total }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>Job Descriptions</template>
          <div class="stat-number">{{ jobStore.total }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>API Keys</template>
          <div class="stat-number">{{ apiKeyStore.apiKeys.length }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>Quick Actions</template>
          <div style="display: flex; flex-direction: column; gap: 8px">
            <el-button type="primary" @click="$router.push('/optimize')">AI Optimize</el-button>
            <el-button @click="$router.push('/resumes')">Upload Resume</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useResumeStore } from '@/stores/resume';
import { useJobStore } from '@/stores/job';
import { useApiKeyStore } from '@/stores/api-key';

const resumeStore = useResumeStore();
const jobStore = useJobStore();
const apiKeyStore = useApiKeyStore();

onMounted(async () => {
  await Promise.all([
    resumeStore.fetchResumes(),
    jobStore.fetchJobs(),
    apiKeyStore.fetchApiKeys(),
  ]);
});
</script>

<style scoped>
.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
  text-align: center;
}
</style>
