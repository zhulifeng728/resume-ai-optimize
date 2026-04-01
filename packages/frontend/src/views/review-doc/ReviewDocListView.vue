<template>
  <div class="review-doc-list-view">
    <div class="page-header">
      <h2>技术复习文档</h2>
      <el-button type="primary" @click="generateDialogVisible = true">
        <el-icon><Plus /></el-icon>
        生成新文档
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="reviewDocs"
      stripe
      style="width: 100%"
    >
      <el-table-column label="简历" min-width="180">
        <template #default="{ row }">
          {{ resumeTitleMap[row.resumeId] || row.resumeId }}
        </template>
      </el-table-column>
      <el-table-column label="技能" min-width="250">
        <template #default="{ row }">
          <el-tag
            v-for="skill in (row.skills || []).slice(0, 5)"
            :key="skill"
            size="small"
            class="skill-tag"
          >
            {{ skill }}
          </el-tag>
          <el-tag v-if="(row.skills || []).length > 5" size="small" type="info">
            +{{ row.skills.length - 5 }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="aiModel" label="AI 模型" width="180" />
      <el-table-column label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button
            text
            type="primary"
            size="small"
            @click="$router.push({ name: 'review-doc-detail', params: { id: row.id } })"
          >
            查看
          </el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>

    <!-- Generate Dialog -->
    <el-dialog v-model="generateDialogVisible" title="生成技术复习文档" width="500px">
      <el-form label-position="top">
        <el-form-item label="选择简历" required>
          <el-select v-model="generateForm.resumeId" placeholder="选择一份简历" style="width: 100%" filterable>
            <el-option
              v-for="r in resumeStore.resumes"
              :key="r.id"
              :label="r.title"
              :value="r.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择 API Key" required>
          <el-select v-model="generateForm.apiKeyId" placeholder="选择一个 API Key" style="width: 100%" filterable>
            <el-option
              v-for="k in apiKeyStore.apiKeys"
              :key="k.id"
              :value="k.id"
            >
              <div class="api-key-option">
                <el-tag size="small" type="info" style="margin-right: 8px">{{ k.provider }}</el-tag>
                {{ k.name }}
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="handleGenerate">
          生成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { reviewDocApi } from '@/api/review-doc';
import { useResumeStore } from '@/stores/resume';
import { useApiKeyStore } from '@/stores/api-key';
import type { ReviewDoc } from '@resume-ai/shared';

const router = useRouter();
const resumeStore = useResumeStore();
const apiKeyStore = useApiKeyStore();

const reviewDocs = ref<ReviewDoc[]>([]);
const total = ref(0);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = 20;

const generateDialogVisible = ref(false);
const generating = ref(false);
const generateForm = reactive({
  resumeId: '',
  apiKeyId: '',
});

const resumeTitleMap = ref<Record<string, string>>({});

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchDocs(page = 1) {
  loading.value = true;
  try {
    const res = await reviewDocApi.list({ page, limit: pageSize });
    reviewDocs.value = res.data.items;
    total.value = res.data.total;
  } finally {
    loading.value = false;
  }
}

function handlePageChange(page: number) {
  currentPage.value = page;
  fetchDocs(page);
}

async function handleGenerate() {
  if (!generateForm.resumeId || !generateForm.apiKeyId) {
    ElMessage.warning('请同时选择简历和 API Key');
    return;
  }
  generating.value = true;
  try {
    const res = await reviewDocApi.create({
      resumeId: generateForm.resumeId,
      apiKeyId: generateForm.apiKeyId,
    });
    ElMessage.success('技术复习文档已生成');
    generateDialogVisible.value = false;
    generateForm.resumeId = '';
    generateForm.apiKeyId = '';
    router.push({ name: 'review-doc-detail', params: { id: res.data.id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '生成失败';
    ElMessage.error(message);
  } finally {
    generating.value = false;
  }
}

async function handleDelete(row: ReviewDoc) {
  try {
    await ElMessageBox.confirm(
      '确定要删除这份技术复习文档吗？此操作无法撤销。',
      '删除技术复习文档',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    );
    await reviewDocApi.delete(row.id);
    ElMessage.success('技术复习文档已删除');
    await fetchDocs(currentPage.value);
  } catch {
    // User cancelled
  }
}

onMounted(async () => {
  await Promise.all([
    fetchDocs(currentPage.value),
    resumeStore.fetchResumes(1, 100),
    apiKeyStore.fetchApiKeys(),
  ]);
  // Build resume title map for display
  for (const r of resumeStore.resumes) {
    resumeTitleMap.value[r.id] = r.title;
  }
});
</script>

<style scoped>
.review-doc-list-view {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.skill-tag {
  margin: 2px 4px 2px 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.api-key-option {
  display: flex;
  align-items: center;
}
</style>
