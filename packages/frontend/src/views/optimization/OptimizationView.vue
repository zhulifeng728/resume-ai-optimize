<template>
  <div class="optimization-view">
    <div class="page-header">
      <h2>AI 简历优化</h2>
      <p class="subtitle">基于真实职位描述，AI 帮你精准优化简历内容</p>
    </div>

    <!-- 提交成功提示 -->
    <template v-if="submitted">
      <el-card class="submitted-card">
        <div class="submitted-content">
          <el-icon color="#e6a23c" :size="40"><Loading /></el-icon>
          <h3>优化任务已提交</h3>
          <p>AI 正在后台处理，请稍后前往简历详情页查看结果。</p>
          <div class="submitted-actions">
            <el-button @click="resetForm">再提交一次</el-button>
            <el-button type="primary" @click="$router.push({ name: 'resume-detail', params: { id: selectedResumeId } })">
              查看简历版本
            </el-button>
          </div>
        </div>
      </el-card>
    </template>

    <!-- 优化表单 -->
    <template v-else>
      <el-card class="form-card">
        <el-form label-position="top">
          <!-- Step 1: 选择简历 -->
          <div class="step-section">
            <div class="step-label"><span class="step-num">1</span> 选择简历</div>
            <el-select v-model="selectedResumeId" placeholder="请选择一份简历" style="width: 100%" filterable>
              <el-option v-for="r in resumeStore.resumes" :key="r.id" :label="r.title" :value="r.id" />
            </el-select>
            <div v-if="resumeStore.resumes.length === 0" class="tip-text">
              <router-link to="/my/resumes">还没有简历？去上传一份</router-link>
            </div>
          </div>

          <!-- Step 2: 职位描述 -->
          <div class="step-section">
            <div class="step-label"><span class="step-num">2</span> 目标职位描述</div>
            <el-tabs v-model="jdTab" class="jd-tabs">
              <el-tab-pane label="从已保存的职位选择" name="saved">
                <el-select v-model="selectedJobId" placeholder="选择一个职位" style="width: 100%" filterable
                  :loading="jobLoading">
                  <el-option
                    v-for="j in jobs"
                    :key="j.id"
                    :value="j.id"
                    :label="`${j.title}${j.company ? ' · ' + j.company : ''}`"
                  />
                </el-select>
                <div v-if="jobs.length === 0 && !jobLoading" class="tip-text">
                  暂无已保存职位，可切换到「手动输入」
                </div>
              </el-tab-pane>
              <el-tab-pane label="手动输入 JD" name="manual">
                <el-input
                  v-model="manualJd"
                  type="textarea"
                  :rows="8"
                  placeholder="粘贴职位描述（JD）内容..."
                />
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- API Key 提示 -->
          <div class="api-key-hint" v-if="activeKeyName">
            <el-icon><Key /></el-icon>
            <span>将使用 API Key：<strong>{{ activeKeyName }}</strong></span>
            <router-link to="/my/settings" class="change-link">更换</router-link>
          </div>
          <el-alert v-else type="warning" :closable="false" show-icon>
            <template #title>
              未配置 API Key，<router-link to="/my/settings">去设置</router-link>
            </template>
          </el-alert>

          <el-button
            type="primary"
            size="large"
            :disabled="!canSubmit"
            :loading="submitting"
            style="width: 100%; margin-top: 24px"
            @click="startOptimization"
          >
            {{ submitting ? '提交中...' : '开始优化' }}
          </el-button>
        </el-form>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Loading, Key } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useResumeStore } from '@/stores/resume';
import { useApiKeyStore } from '@/stores/api-key';
import { jobApi } from '@/api/job';
import { optimizationApi } from '@/api/optimization';
import type { Job } from '@resume-ai/shared';

const route = useRoute();
const router = useRouter();
const resumeStore = useResumeStore();
const apiKeyStore = useApiKeyStore();

const selectedResumeId = ref('');
const jdTab = ref<'saved' | 'manual'>('saved');
const selectedJobId = ref('');
const manualJd = ref('');
const jobs = ref<Job[]>([]);
const jobLoading = ref(false);
const submitting = ref(false);
const submitted = ref(false);
const submittedVersionId = ref('');

const activeKey = computed(() => apiKeyStore.apiKeys.find(k => k.isDefault) || apiKeyStore.apiKeys[0] || null);
const activeKeyName = computed(() => activeKey.value ? `${activeKey.value.name} (${activeKey.value.provider})` : '');

const canSubmit = computed(() => {
  if (!selectedResumeId.value || !activeKey.value) return false;
  if (jdTab.value === 'saved') return !!selectedJobId.value;
  return manualJd.value.trim().length > 20;
});

async function startOptimization() {
  if (!activeKey.value) return;
  submitting.value = true;
  try {
    let jobId = selectedJobId.value;
    if (jdTab.value === 'manual') {
      const jobRes = await jobApi.create({ title: '手动输入职位', description: manualJd.value });
      jobId = jobRes.data.id;
    }
    const res = await optimizationApi.create({
      resumeId: selectedResumeId.value,
      jobId,
      apiKeyId: activeKey.value.id,
    });
    submittedVersionId.value = res.data.versionId;
    submitted.value = true;
  } catch {
    ElMessage.error('提交失败，请重试');
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  submitted.value = false;
  submittedVersionId.value = '';
}

watch(() => resumeStore.resumes, (resumes) => {
  const queryId = route.query.resumeId as string;
  if (queryId && resumes.some(r => r.id === queryId)) selectedResumeId.value = queryId;
}, { immediate: true });

onMounted(async () => {
  await Promise.all([
    resumeStore.fetchResumes(1, 100),
    apiKeyStore.fetchApiKeys(),
  ]);
  // 加载职位列表
  jobLoading.value = true;
  try {
    const res = await jobApi.list({ page: 1, limit: 100 });
    jobs.value = res.data.items;
  } finally {
    jobLoading.value = false;
  }
});
</script>

<style scoped>
.optimization-view {
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 28px;
}

.page-header h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #1a1a2e;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #78909c;
}

.form-card {
  border-radius: 12px;
}

.step-section {
  margin-bottom: 28px;
}

.step-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 12px;
}

.step-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #3669EC;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.jd-tabs {
  margin-top: 0;
}

.tip-text {
  font-size: 13px;
  color: #90a4ae;
  margin-top: 8px;
}

.tip-text a, .tip-text router-link {
  color: #3669EC;
}

.api-key-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f0f4ff;
  border-radius: 8px;
  font-size: 13px;
  color: #546e7a;
  border: 1px solid #dce8ff;
}

.change-link {
  margin-left: auto;
  color: #3669EC;
  font-size: 13px;
  text-decoration: none;
}

.submitted-card {
  border-radius: 12px;
}

.submitted-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  gap: 12px;
  text-align: center;
}

.submitted-content h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.submitted-content p {
  margin: 0;
  font-size: 14px;
  color: #78909c;
}

.submitted-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
</style>
