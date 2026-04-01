<template>
  <div class="resume-list-view">
    <div class="page-header">
      <div>
        <h2>我的简历</h2>
        <p class="subtitle">管理你的简历，最多可保存 <strong>5</strong> 份</p>
      </div>
      <div class="header-actions">
        <el-button @click="manualDialogVisible = true" :disabled="atLimit">
          <el-icon><EditPen /></el-icon>手动创建
        </el-button>
        <el-button type="primary" @click="uploadDialogVisible = true" :disabled="atLimit">
          <el-icon><Upload /></el-icon>上传简历
        </el-button>
      </div>
    </div>

    <!-- 进度条 -->
    <div class="quota-bar">
      <span class="quota-text">{{ resumeStore.total }}/5 份简历</span>
      <el-progress :percentage="(resumeStore.total / 5) * 100" :show-text="false" :stroke-width="6"
        :color="resumeStore.total >= 5 ? '#f56c6c' : '#3669EC'" style="flex:1" />
    </div>

    <div v-loading="resumeStore.loading">
      <!-- 空状态 -->
      <el-empty v-if="!resumeStore.loading && resumeStore.resumes.length === 0"
        description="还没有简历，上传或创建一份吧" :image-size="120">
        <el-button type="primary" @click="uploadDialogVisible = true">立即上传</el-button>
      </el-empty>

      <!-- 简历卡片列表 -->
      <div v-else class="resume-grid">
        <div
          v-for="resume in resumeStore.resumes"
          :key="resume.id"
          class="resume-card"
          @click="$router.push({ name: 'resume-detail', params: { id: resume.id } })"
        >
          <div class="card-icon">📄</div>
          <div class="card-body">
            <div class="card-title">{{ resume.title }}</div>
            <div class="card-meta">
              <el-tag :type="statusTagType(resume.status)" size="small">{{ statusLabel(resume.status) }}</el-tag>
              <span class="card-date">{{ formatDate(resume.createdAt) }}</span>
            </div>
            <div v-if="resume.fileName" class="card-filename">{{ resume.fileName }}</div>
          </div>
          <div class="card-actions" @click.stop>
            <el-button type="primary" size="small" text
              @click="$router.push({ name: 'optimize', query: { resumeId: resume.id } })">
              AI 优化
            </el-button>
            <el-button size="small" text type="danger" @click="handleDelete(resume)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传弹窗 -->
    <el-dialog v-model="uploadDialogVisible" title="上传简历" width="500px">
      <el-form label-position="top">
        <el-form-item label="简历标题" required>
          <el-input v-model="uploadTitle" placeholder="请输入简历标题，例如：前端开发简历" />
        </el-form-item>
        <el-form-item label="选择文件" required>
          <el-upload ref="uploadRef" drag :auto-upload="false" :limit="1"
            :on-exceed="() => ElMessage.warning('一次只能上传一个文件')"
            :on-change="(f: UploadFile) => selectedFile = f.raw || null"
            accept=".pdf,.docx,.doc,.png,.jpg,.jpeg">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">拖拽文件到此处或<em>点击上传</em></div>
            <template #tip>
              <div class="el-upload__tip">支持 PDF、DOCX、DOC、PNG、JPG 格式</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">上传</el-button>
      </template>
    </el-dialog>

    <!-- 手动创建弹窗 -->
    <el-dialog v-model="manualDialogVisible" title="手动创建简历" width="680px">
      <el-form :model="manualForm" label-position="top">
        <el-form-item label="简历标题" required>
          <el-input v-model="manualForm.title" placeholder="请输入简历标题" />
        </el-form-item>
        <el-form-item label="简历内容" required>
          <el-input v-model="manualForm.originalText" type="textarea" :rows="14"
            placeholder="粘贴或输入你的简历内容..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleManualCreate">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Upload, EditPen, UploadFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type UploadInstance, type UploadFile, type UploadRawFile } from 'element-plus';
import { useResumeStore } from '@/stores/resume';
import { resumeApi } from '@/api/resume';
import { ResumeStatus, type Resume } from '@resume-ai/shared';

const resumeStore = useResumeStore();

const uploadDialogVisible = ref(false);
const manualDialogVisible = ref(false);
const uploading = ref(false);
const creating = ref(false);
const uploadRef = ref<UploadInstance>();
const selectedFile = ref<UploadRawFile | null>(null);
const uploadTitle = ref('');
const manualForm = ref({ title: '', originalText: '' });

const atLimit = computed(() => resumeStore.total >= 5);

function statusTagType(status: ResumeStatus) {
  const map: Record<ResumeStatus, string> = {
    [ResumeStatus.UPLOADED]: 'info',
    [ResumeStatus.PARSING]: 'warning',
    [ResumeStatus.PARSED]: 'success',
    [ResumeStatus.PARSE_FAILED]: 'danger',
  };
  return map[status] || 'info';
}

function statusLabel(status: ResumeStatus) {
  const map: Record<ResumeStatus, string> = {
    [ResumeStatus.UPLOADED]: '已上传',
    [ResumeStatus.PARSING]: '解析中',
    [ResumeStatus.PARSED]: '已解析',
    [ResumeStatus.PARSE_FAILED]: '解析失败',
  };
  return map[status] || status;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function handleUpload() {
  if (!uploadTitle.value.trim()) { ElMessage.warning('请输入简历标题'); return; }
  if (!selectedFile.value) { ElMessage.warning('请选择文件'); return; }
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);
    formData.append('title', uploadTitle.value);
    await resumeApi.upload(formData);
    ElMessage.success('简历上传成功');
    uploadDialogVisible.value = false;
    uploadTitle.value = '';
    selectedFile.value = null;
    uploadRef.value?.clearFiles();
    await resumeStore.fetchResumes(1, 10);
  } catch {
  } finally {
    uploading.value = false;
  }
}

async function handleManualCreate() {
  if (!manualForm.value.title.trim() || !manualForm.value.originalText.trim()) {
    ElMessage.warning('标题和内容不能为空'); return;
  }
  creating.value = true;
  try {
    await resumeApi.create({ title: manualForm.value.title, originalText: manualForm.value.originalText });
    ElMessage.success('简历创建成功');
    manualDialogVisible.value = false;
    manualForm.value = { title: '', originalText: '' };
    await resumeStore.fetchResumes(1, 10);
  } catch {
  } finally {
    creating.value = false;
  }
}

async function handleDelete(resume: Resume) {
  try {
    await ElMessageBox.confirm(`确定删除「${resume.title}」吗？此操作不可撤销。`, '删除简历', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    });
    await resumeStore.deleteResume(resume.id);
    ElMessage.success('已删除');
  } catch { }
}

onMounted(() => resumeStore.fetchResumes(1, 10));
</script>

<style scoped>
.resume-list-view {
  padding: 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #78909c;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.quota-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.quota-text {
  font-size: 13px;
  color: #78909c;
  white-space: nowrap;
}

.resume-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.resume-card {
  background: white;
  border: 1px solid #e8edf5;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  display: flex;
  gap: 16px;
  transition: all 0.2s;
}

.resume-card:hover {
  border-color: #3669EC;
  box-shadow: 0 4px 16px rgba(54, 105, 236, 0.12);
  transform: translateY(-2px);
}

.card-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.card-date {
  font-size: 12px;
  color: #aab4be;
}

.card-filename {
  font-size: 12px;
  color: #90a4ae;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
}
</style>
