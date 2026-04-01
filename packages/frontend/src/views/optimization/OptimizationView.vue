<template>
  <div class="optimization-view">
    <div class="page-header">
      <h2>AI 简历优化</h2>
      <p class="subtitle">基于真实职位描述，AI 帮你精准优化简历内容</p>
    </div>

    <!-- 结果展示 -->
    <template v-if="result">
      <div class="result-header">
        <div class="result-title">
          <el-icon color="#67c23a" :size="22"><CircleCheckFilled /></el-icon>
          <span>优化完成</span>
        </div>
        <div class="result-actions">
          <el-button @click="resetForm">再优化一次</el-button>
          <el-button type="primary" @click="$router.push({ name: 'resume-detail', params: { id: selectedResumeId } })">
            查看简历版本
          </el-button>
        </div>
      </div>
      <div class="diff-container">
        <div class="diff-panel">
          <div class="diff-panel-title">
            <span class="dot dot-red"></span> 原始简历
          </div>
          <div class="diff-content" v-html="originalHtml"></div>
        </div>
        <div class="diff-panel">
          <div class="diff-panel-title">
            <span class="dot dot-green"></span> 优化后简历
          </div>
          <div class="diff-content" v-html="optimizedHtml"></div>
        </div>
      </div>
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
            :loading="optimizing"
            style="width: 100%; margin-top: 24px"
            @click="startOptimization"
          >
            {{ optimizing ? '正在优化中...' : '开始优化' }}
          </el-button>
        </el-form>
      </el-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CircleCheckFilled, Key } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { diffWords } from 'diff';
import { useResumeStore } from '@/stores/resume';
import { useApiKeyStore } from '@/stores/api-key';
import { jobApi } from '@/api/job';
import { optimizationApi } from '@/api/optimization';
import { resumeApi } from '@/api/resume';
import type { OptimizationResult, ResumeVersion, Job } from '@resume-ai/shared';

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
const optimizing = ref(false);
const result = ref<OptimizationResult | null>(null);
const originalText = ref('');
const optimizedText = ref('');

const activeKey = computed(() => apiKeyStore.apiKeys.find(k => k.isDefault) || apiKeyStore.apiKeys[0] || null);
const activeKeyName = computed(() => activeKey.value ? `${activeKey.value.name} (${activeKey.value.provider})` : '');

const canSubmit = computed(() => {
  if (!selectedResumeId.value || !activeKey.value) return false;
  if (jdTab.value === 'saved') return !!selectedJobId.value;
  return manualJd.value.trim().length > 20;
});

function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const originalHtml = computed(() => {
  if (!originalText.value || !optimizedText.value) return escapeHtml(originalText.value).replace(/\n/g, '<br>');
  const changes = diffWords(originalText.value, optimizedText.value);
  return changes.filter(p => !p.added).map(p => {
    const e = escapeHtml(p.value).replace(/\n/g, '<br>');
    return p.removed ? `<span class="diff-removed">${e}</span>` : e;
  }).join('');
});

const optimizedHtml = computed(() => {
  if (!originalText.value || !optimizedText.value) return escapeHtml(optimizedText.value).replace(/\n/g, '<br>');
  const changes = diffWords(originalText.value, optimizedText.value);
  return changes.filter(p => !p.removed).map(p => {
    const e = escapeHtml(p.value).replace(/\n/g, '<br>');
    return p.added ? `<span class="diff-added">${e}</span>` : e;
  }).join('');
});

async function startOptimization() {
  if (!activeKey.value) return;
  optimizing.value = true;
  try {
    const resumeRes = await resumeApi.get(selectedResumeId.value);
    originalText.value = resumeRes.data.originalText || '';

    let jobId = selectedJobId.value;
    // 手动输入时先创建一个临时 job
    if (jdTab.value === 'manual') {
      const jobRes = await jobApi.create({ title: '手动输入职位', description: manualJd.value });
      jobId = jobRes.data.id;
    }

    const res = await optimizationApi.create({
      resumeId: selectedResumeId.value,
      jobId,
      apiKeyId: activeKey.value.id,
    });
    result.value = res.data;

    if (res.data.resumeVersionId) {
      const versionsRes = await resumeApi.getVersions(selectedResumeId.value);
      const version = versionsRes.data.find((v: ResumeVersion) => v.id === res.data.resumeVersionId);
      if (version) optimizedText.value = version.content;
    }
  } catch {
  } finally {
    optimizing.value = false;
  }
}

function resetForm() {
  result.value = null;
  originalText.value = '';
  optimizedText.value = '';
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

/* 结果区域 */
.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.result-actions {
  display: flex;
  gap: 10px;
}

.diff-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.diff-panel {
  border: 1px solid #e8edf5;
  border-radius: 10px;
  overflow: hidden;
  background: white;
}

.diff-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f7f9fc;
  border-bottom: 1px solid #e8edf5;
  font-size: 14px;
  font-weight: 600;
  color: #37474f;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-red { background: #f56c6c; }
.dot-green { background: #67c23a; }

.diff-content {
  padding: 16px;
  font-size: 14px;
  line-height: 1.9;
  max-height: 600px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.diff-content :deep(.diff-added) {
  background: #e6ffec;
  color: #1a7f37;
  padding: 1px 2px;
  border-radius: 2px;
}

.diff-content :deep(.diff-removed) {
  background: #ffebe9;
  color: #cf222e;
  text-decoration: line-through;
  padding: 1px 2px;
  border-radius: 2px;
}

@media (max-width: 768px) {
  .diff-container {
    grid-template-columns: 1fr;
  }
}
</style>
