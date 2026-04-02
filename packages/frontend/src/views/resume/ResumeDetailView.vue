<template>
  <div class="resume-detail-view">
    <!-- 顶部栏 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="$router.push({ name: 'my-resumes' })">
          <el-icon><ArrowLeft /></el-icon> 返回
        </el-button>
        <div v-if="resume">
          <h2>{{ resume.title }}</h2>
          <el-tag :type="statusTagType(resume.status)" size="small">{{ statusLabel(resume.status) }}</el-tag>
        </div>
      </div>
      <div class="header-actions" v-if="resume">
        <el-button v-if="!isEditing" @click="startEdit">编辑</el-button>
        <template v-else>
          <el-button @click="cancelEdit">取消</el-button>
          <el-button type="success" :loading="saving" @click="saveResume">保存</el-button>
        </template>
        <el-button type="primary" @click="goToOptimize">AI 优化</el-button>
        <el-button @click="handleGenerateReviewDoc" :loading="generatingDoc">生成复习文档</el-button>
      </div>
    </div>

    <div v-loading="resumeStore.loading" class="content-area">
      <template v-if="resume">
        <!-- 简历内容 -->
        <el-card class="content-card">
          <template #header>
            <div class="card-header-row">
              <span class="card-header-title">简历内容</span>
            </div>
          </template>
          <div v-if="isEditing" class="md-editor-wrap">
            <div id="detail-md-editor"></div>
          </div>
          <div v-else class="resume-markdown" v-html="renderedResume"></div>
        </el-card>

        <!-- AI 优化版本 -->
        <el-card class="versions-card">
          <template #header>
            <div class="card-header-row">
              <span class="card-header-title">AI 优化版本</span>
              <el-button text size="small" :loading="versionsRefreshing" @click="refreshVersions">
                <el-icon><Refresh /></el-icon> 刷新
              </el-button>
            </div>
          </template>
          <div v-if="resumeStore.versions.length === 0" class="empty-tip">
            <el-empty description="暂无优化版本，点击「AI 优化」生成" :image-size="80" />
          </div>
          <el-table v-else :data="resumeStore.versions" stripe>
            <el-table-column label="版本" width="80">
              <template #default="{ row }">v{{ row.versionNumber }}</template>
            </el-table-column>
            <el-table-column prop="aiModel" label="AI 模型" min-width="160" />
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="状态" width="140">
              <template #default="{ row }">
                <el-tag v-if="row.status === 'PENDING'" type="info" size="small">等待中</el-tag>
                <el-tag v-else-if="row.status === 'PROCESSING'" type="warning" size="small">处理中</el-tag>
                <el-tooltip v-else-if="row.status === 'FAILED'" :content="row.errorMessage || '未知错误'" placement="top">
                  <el-tag type="danger" size="small" style="cursor:pointer">失败</el-tag>
                </el-tooltip>
                <el-tag v-else-if="row.status === 'CANCELLED'" type="info" size="small">已取消</el-tag>
                <template v-else>
                  <el-tag v-if="row.isSelected" type="success" size="small">已采用</el-tag>
                  <el-tag v-else type="primary" size="small">已完成</el-tag>
                </template>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button
                  text type="primary" size="small"
                  :disabled="row.status !== 'COMPLETED'"
                  @click="viewVersion(row)"
                >查看对比</el-button>
                <el-button
                  v-if="!row.isSelected && row.status === 'COMPLETED'"
                  text type="success" size="small"
                  @click="selectVersion(row)"
                >采用此版本</el-button>
                <el-button
                  v-if="row.status === 'PENDING' || row.status === 'PROCESSING'"
                  text type="danger" size="small"
                  @click="cancelVersion(row)"
                >取消</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </template>
    </div>

    <!-- 版本内容对比弹窗 -->
    <el-dialog v-model="versionDialogVisible" title="版本内容" width="760px" top="5vh">
      <div v-if="viewingVersion" class="version-diff">
        <div class="diff-meta">
          <el-tag size="small">v{{ viewingVersion.versionNumber }}</el-tag>
          <span>模型：{{ viewingVersion.aiModel }}</span>
          <span>{{ formatDate(viewingVersion.createdAt) }}</span>
        </div>
        <el-tabs>
          <el-tab-pane label="优化后内容">
            <div class="version-text">{{ viewingVersion.content }}</div>
          </el-tab-pane>
          <el-tab-pane label="原始内容">
            <div class="version-text">{{ resume?.originalText }}</div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { marked } from 'marked';
import { useResumeStore } from '@/stores/resume';
import { useApiKeyStore } from '@/stores/api-key';
import { resumeApi } from '@/api/resume';
import { reviewDocApi } from '@/api/review-doc';
import { optimizationApi } from '@/api/optimization';
import { ResumeStatus } from '@/constants/providers';
import type { ResumeVersion } from '@resume-ai/shared';

const route = useRoute();
const router = useRouter();
const resumeStore = useResumeStore();
const apiKeyStore = useApiKeyStore();

const resumeId = computed(() => route.params.id as string);
const resume = computed(() => resumeStore.currentResume);

const isEditing = ref(false);
const saving = ref(false);
const editText = ref('');
let vditorInstance: Vditor | null = null;

const renderedResume = computed(() =>
  resume.value?.originalText ? marked(resume.value.originalText) : '<p style="color:#aaa">暂无内容</p>'
);

watch(isEditing, async (val) => {
  if (val) {
    await nextTick();
    vditorInstance = new Vditor('detail-md-editor', {
      height: 520,
      mode: 'sv',
      toolbarConfig: { pin: true },
      cache: { enable: false },
      after: () => {
        vditorInstance?.setValue(editText.value);
      },
    });
  } else {
    vditorInstance?.destroy();
    vditorInstance = null;
  }
});

const versionDialogVisible = ref(false);
const viewingVersion = ref<ResumeVersion | null>(null);
const generatingDoc = ref(false);
const versionsRefreshing = ref(false);

async function refreshVersions() {
  versionsRefreshing.value = true;
  try {
    await resumeStore.fetchVersions(resumeId.value);
  } finally {
    versionsRefreshing.value = false;
  }
}

type TagType = 'success' | 'warning' | 'info' | 'danger' | 'primary';
const statusTagType = (status: ResumeStatus): TagType => ({
  [ResumeStatus.UPLOADED]: 'info' as TagType,
  [ResumeStatus.PARSING]: 'warning' as TagType,
  [ResumeStatus.PARSED]: 'success' as TagType,
  [ResumeStatus.PARSE_FAILED]: 'danger' as TagType,
}[status] || 'info');

const statusLabel = (status: ResumeStatus) => ({
  [ResumeStatus.UPLOADED]: '已上传',
  [ResumeStatus.PARSING]: '解析中',
  [ResumeStatus.PARSED]: '已解析',
  [ResumeStatus.PARSE_FAILED]: '解析失败',
}[status] || status);

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function startEdit() {
  editText.value = resume.value?.originalText || '';
  isEditing.value = true;
}

function cancelEdit() {
  isEditing.value = false;
}

async function saveResume() {
  const content = vditorInstance?.getValue() ?? editText.value;
  saving.value = true;
  try {
    await resumeApi.update(resumeId.value, { originalText: content });
    await resumeStore.fetchResume(resumeId.value);
    isEditing.value = false;
    ElMessage.success('保存成功');
  } finally {
    saving.value = false;
  }
}

function goToOptimize() {
  router.push({ name: 'optimize', query: { resumeId: resumeId.value } });
}

async function handleGenerateReviewDoc() {
  await apiKeyStore.fetchApiKeys();
  const activeKey = apiKeyStore.apiKeys.find(k => k.isDefault) || apiKeyStore.apiKeys[0];
  if (!activeKey) {
    ElMessage.warning('请先在「个人设置」中添加并启用 API Key');
    return;
  }
  generatingDoc.value = true;
  try {
    const res = await reviewDocApi.create({ resumeId: resumeId.value, apiKeyId: activeKey.id });
    ElMessage.success('复习文档生成成功');
    router.push({ name: 'review-doc-detail', params: { id: res.data.id } });
  } catch {
  } finally {
    generatingDoc.value = false;
  }
}

async function cancelVersion(version: ResumeVersion) {
  try {
    await optimizationApi.cancel(version.id);
    await resumeStore.fetchVersions(resumeId.value);
    ElMessage.success('已取消');
  } catch { }
}

function viewVersion(version: ResumeVersion) {
  viewingVersion.value = version;
  versionDialogVisible.value = true;
}

async function selectVersion(version: ResumeVersion) {
  try {
    await resumeApi.selectVersion(resumeId.value, version.id);
    await resumeStore.fetchVersions(resumeId.value);
    ElMessage.success(`已采用 v${version.versionNumber}`);
  } catch { }
}

onMounted(async () => {
  await resumeStore.fetchResume(resumeId.value);
  await resumeStore.fetchVersions(resumeId.value);
});
</script>

<style scoped>
.resume-detail-view {
  padding: 24px 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0 8px 0 0;
  font-size: 20px;
  font-weight: 600;
  display: inline;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.content-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header-title {
  font-weight: 600;
  font-size: 15px;
}

.char-count {
  font-size: 12px;
  color: #aab4be;
}

.resume-markdown {
  line-height: 1.9;
  font-size: 14px;
  color: #37474f;
  min-height: 200px;
}

.resume-markdown :deep(h1),
.resume-markdown :deep(h2),
.resume-markdown :deep(h3) {
  margin: 16px 0 8px;
  font-weight: 600;
  color: #1a1a2e;
}

.resume-markdown :deep(h2) { font-size: 16px; border-bottom: 1px solid #e8edf5; padding-bottom: 6px; }
.resume-markdown :deep(ul) { padding-left: 20px; }
.resume-markdown :deep(li) { margin: 4px 0; }
.resume-markdown :deep(p) { margin: 6px 0; }

.md-editor-wrap {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.empty-tip {
  padding: 20px 0;
}

.diff-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #78909c;
}

.version-text {
  white-space: pre-wrap;
  line-height: 1.9;
  font-size: 14px;
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;
  background: #f7f9fc;
  border-radius: 6px;
}
</style>
