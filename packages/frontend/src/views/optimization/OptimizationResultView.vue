<template>
  <div class="optimization-result-view">
    <div class="page-header">
      <el-button text @click="$router.push({ name: 'optimize' })">
        <el-icon><ArrowLeft /></el-icon>
        Back to Optimize
      </el-button>
      <h2>Optimization Result</h2>
    </div>

    <div v-loading="loading" class="content-area">
      <template v-if="result">
        <el-card class="status-card">
          <div class="status-row">
            <div>
              <span class="detail-label">Status:</span>
              <el-tag :type="statusTagType(result.status)" size="small">
                {{ result.status }}
              </el-tag>
            </div>
            <el-button
              v-if="result.resumeVersionId && resumeId"
              type="primary"
              @click="goToResume"
            >
              View Resume Versions
            </el-button>
          </div>
          <div v-if="result.error" class="error-message">
            <el-alert :title="result.error" type="error" :closable="false" />
          </div>
        </el-card>

        <template v-if="originalText && optimizedText">
          <div class="diff-container">
            <div class="diff-panel">
              <h4 class="diff-title">Original Resume</h4>
              <div class="diff-content" v-html="originalHtml"></div>
            </div>
            <div class="diff-panel">
              <h4 class="diff-title">Optimized Resume</h4>
              <div class="diff-content" v-html="optimizedHtml"></div>
            </div>
          </div>

          <el-card v-if="versionData" class="details-card">
            <h4>Version Details</h4>
            <div class="detail-row">
              <span class="detail-label">Version:</span>
              <span>v{{ versionData.versionNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">AI Model:</span>
              <el-tag size="small">{{ versionData.aiModel }}</el-tag>
            </div>
            <div class="detail-row">
              <span class="detail-label">Created:</span>
              <span>{{ formatDate(versionData.createdAt) }}</span>
            </div>
          </el-card>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { diffWords } from 'diff';
import { optimizationApi } from '@/api/optimization';
import { resumeApi } from '@/api/resume';
import type { OptimizationResult, ResumeVersion } from '@resume-ai/shared';

const route = useRoute();
const router = useRouter();

const optimizationId = computed(() => route.params.id as string);
const loading = ref(false);
const result = ref<OptimizationResult | null>(null);
const versionData = ref<ResumeVersion | null>(null);
const originalText = ref('');
const optimizedText = ref('');
const resumeId = ref('');

function statusTagType(status: string): string {
  const map: Record<string, string> = {
    completed: 'success',
    processing: 'warning',
    pending: 'info',
    failed: 'danger',
  };
  return map[status] || 'info';
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const originalHtml = computed(() => {
  if (!originalText.value || !optimizedText.value) {
    return escapeHtml(originalText.value).replace(/\n/g, '<br>');
  }
  const changes = diffWords(originalText.value, optimizedText.value);
  let html = '';
  for (const part of changes) {
    const escaped = escapeHtml(part.value).replace(/\n/g, '<br>');
    if (part.removed) {
      html += `<span class="diff-removed">${escaped}</span>`;
    } else if (!part.added) {
      html += escaped;
    }
  }
  return html;
});

const optimizedHtml = computed(() => {
  if (!originalText.value || !optimizedText.value) {
    return escapeHtml(optimizedText.value).replace(/\n/g, '<br>');
  }
  const changes = diffWords(originalText.value, optimizedText.value);
  let html = '';
  for (const part of changes) {
    const escaped = escapeHtml(part.value).replace(/\n/g, '<br>');
    if (part.added) {
      html += `<span class="diff-added">${escaped}</span>`;
    } else if (!part.removed) {
      html += escaped;
    }
  }
  return html;
});

function goToResume() {
  if (resumeId.value) {
    router.push({ name: 'resume-detail', params: { id: resumeId.value } });
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const res = await optimizationApi.get(optimizationId.value);
    result.value = res.data;

    if (res.data.resumeVersionId) {
      // We need to find the resume that owns this version
      // The version contains resumeId, so we fetch it via the optimization result
      // For now, get versions by searching through user resumes
      const resumesRes = await resumeApi.list({ page: 1, limit: 100 });
      for (const resume of resumesRes.data.items) {
        const versionsRes = await resumeApi.getVersions(resume.id);
        const version = versionsRes.data.find((v: ResumeVersion) => v.id === res.data.resumeVersionId);
        if (version) {
          versionData.value = version;
          resumeId.value = resume.id;
          originalText.value = resume.originalText || '';
          optimizedText.value = version.content;
          break;
        }
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load optimization result';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.optimization-result-view {
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.status-card .status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message {
  margin-top: 16px;
}

.diff-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.diff-panel {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}

.diff-title {
  margin: 0;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color);
  font-size: 14px;
}

.diff-content {
  padding: 16px;
  font-size: 14px;
  line-height: 1.8;
  max-height: 600px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.diff-content :deep(.diff-added) {
  background-color: #e6ffec;
  color: #1a7f37;
  padding: 1px 3px;
  border-radius: 2px;
}

.diff-content :deep(.diff-removed) {
  background-color: #ffebe9;
  color: #cf222e;
  text-decoration: line-through;
  padding: 1px 3px;
  border-radius: 2px;
}

.details-card h4 {
  margin: 0 0 16px;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.detail-label {
  font-weight: 500;
  color: var(--el-text-color-secondary);
  min-width: 80px;
}
</style>
