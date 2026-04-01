<template>
  <div class="api-key-view">
    <div class="page-header">
      <div>
        <h2>API Key 管理</h2>
        <p class="subtitle">配置 AI 服务商 Key，支持 NVIDIA NIM、DeepSeek、OpenAI、Claude 等</p>
      </div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon> 添加 Key
      </el-button>
    </div>

    <div v-loading="apiKeyStore.loading">
      <!-- 空状态 -->
      <el-empty v-if="!apiKeyStore.loading && apiKeyStore.apiKeys.length === 0"
        description="还没有 API Key，点击右上角添加" :image-size="100" />

      <!-- Key 卡片列表 -->
      <div v-else class="key-grid">
        <div
          v-for="key in apiKeyStore.apiKeys"
          :key="key.id"
          class="key-card"
          :class="{ 'key-card--active': key.isDefault }"
        >
          <!-- 激活标记 -->
          <div class="key-card-badge" v-if="key.isDefault">
            <el-icon><CircleCheckFilled /></el-icon> 使用中
          </div>

          <div class="key-card-top">
            <div class="key-provider-icon">{{ providerIcon(key.provider) }}</div>
            <div class="key-card-info">
              <div class="key-name">{{ key.name }}</div>
              <el-tag :type="providerTagType(key.provider)" size="small">
                {{ getProviderName(key.provider) }}
              </el-tag>
            </div>
          </div>

          <div class="key-card-details">
            <div class="key-detail-row" v-if="key.modelId">
              <span class="detail-label">模型</span>
              <span class="detail-value">{{ key.modelId }}</span>
            </div>
            <div class="key-detail-row" v-if="key.baseUrl">
              <span class="detail-label">地址</span>
              <span class="detail-value url-text" :title="key.baseUrl">{{ truncateUrl(key.baseUrl) }}</span>
            </div>
            <div class="key-detail-row">
              <span class="detail-label">Key</span>
              <span class="detail-value masked-key">{{ key.maskedKey }}</span>
            </div>
            <div class="key-detail-row">
              <span class="detail-label">创建</span>
              <span class="detail-value">{{ formatDate(key.createdAt) }}</span>
            </div>
          </div>

          <div class="key-card-footer">
            <div class="enable-toggle">
              <el-switch
                :model-value="key.isDefault"
                active-text="启用"
                inactive-text=""
                :loading="togglingId === key.id"
                @change="(val: boolean) => handleToggleDefault(key, val)"
              />
            </div>
            <div class="key-card-actions">
              <el-button text size="small" :loading="testingId === key.id" @click="handleTest(key)">
                测试
              </el-button>
              <el-button text size="small" @click="openEditDialog(key)">编辑</el-button>
              <el-button text type="danger" size="small" @click="handleDelete(key)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加弹窗 -->
    <el-dialog v-model="addDialogVisible" title="添加 API Key" width="540px" :close-on-click-modal="false">
      <el-form :model="addForm" label-position="top">
        <el-form-item label="服务商" required>
          <el-select v-model="addForm.provider" placeholder="选择服务商" style="width: 100%" @change="onProviderChange">
            <el-option v-for="p in providerOptions" :key="p.value" :label="p.label" :value="p.value">
              <span>{{ providerIcon(p.value) }} {{ p.label }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="名称" required>
          <el-input v-model="addForm.name" placeholder="例如：我的 DeepSeek Key" />
        </el-form-item>
        <el-form-item label="API Key" required>
          <el-input v-model="addForm.apiKey" type="password" placeholder="粘贴你的 API Key" show-password />
        </el-form-item>
        <el-form-item label="Base URL（可选）">
          <el-input v-model="addForm.baseUrl" placeholder="自定义 API 接入点" />
          <div class="form-tip" v-if="addForm.provider">默认：{{ defaultBaseUrl }}</div>
        </el-form-item>
        <el-form-item label="模型 ID（可选）">
          <div class="model-input-row">
            <el-select
              v-if="addAvailableModels.length"
              v-model="addForm.modelId"
              filterable
              allow-create
              placeholder="选择或输入模型 ID"
              style="flex: 1"
            >
              <el-option v-for="m in addAvailableModels" :key="m" :label="m" :value="m" />
            </el-select>
            <el-input v-else v-model="addForm.modelId" placeholder="例如：deepseek-chat" style="flex: 1" />
            <el-button
              :loading="fetchingAddModels"
              :disabled="!addForm.provider || !addForm.apiKey.trim()"
              @click="fetchModelsForAdd"
            >
              获取模型
            </el-button>
          </div>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="addForm.setAsDefault">添加后立即启用</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleAdd">添加</el-button>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑 API Key" width="480px" :close-on-click-modal="false">
      <el-form :model="editForm" label-position="top">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="Base URL">
          <el-input v-model="editForm.baseUrl" placeholder="自定义 API 接入点" />
        </el-form-item>
        <el-form-item label="模型 ID">
          <div class="model-input-row">
            <el-select
              v-if="editAvailableModels.length"
              v-model="editForm.modelId"
              filterable
              allow-create
              placeholder="选择或输入模型 ID"
              style="flex: 1"
            >
              <el-option v-for="m in editAvailableModels" :key="m" :label="m" :value="m" />
            </el-select>
            <el-input v-else v-model="editForm.modelId" style="flex: 1" />
            <el-button
              :loading="fetchingEditModels"
              @click="fetchModelsForEdit"
            >
              获取模型
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { Plus, CircleCheckFilled } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useApiKeyStore } from '@/stores/api-key';
import { apiKeyApi } from '@/api/api-key';
import { LlmProvider, PROVIDER_CONFIGS } from '@/constants/providers';
import type { ApiKey } from '@resume-ai/shared';

const apiKeyStore = useApiKeyStore();

const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const saving = ref(false);
const testingId = ref<string | null>(null);
const togglingId = ref<string | null>(null);
const editingId = ref('');

const addAvailableModels = ref<string[]>([]);
const editAvailableModels = ref<string[]>([]);
const fetchingAddModels = ref(false);
const fetchingEditModels = ref(false);

const providerOptions = Object.values(LlmProvider).map(v => ({ value: v, label: PROVIDER_CONFIGS[v].name }));

const addForm = reactive({
  provider: '' as LlmProvider | '',
  name: '',
  apiKey: '',
  baseUrl: '',
  modelId: '',
  setAsDefault: true,
});

const editForm = reactive({ name: '', baseUrl: '', modelId: '' });

const defaultBaseUrl = computed(() =>
  addForm.provider ? PROVIDER_CONFIGS[addForm.provider as LlmProvider]?.defaultBaseUrl || '' : ''
);

function providerIcon(provider: LlmProvider): string {
  const map: Record<string, string> = {
    [LlmProvider.NVIDIA_NIM]: '🟢',
    [LlmProvider.OPENAI]: '⚡',
    [LlmProvider.CLAUDE]: '🟠',
    [LlmProvider.DEEPSEEK]: '🔵',
    [LlmProvider.CUSTOM]: '⚙️',
  };
  return map[provider] || '🤖';
}

function getProviderName(provider: LlmProvider) {
  return PROVIDER_CONFIGS[provider]?.name || provider;
}

function providerTagType(provider: LlmProvider) {
  const map: Record<string, string> = {
    [LlmProvider.NVIDIA_NIM]: 'success',
    [LlmProvider.OPENAI]: '',
    [LlmProvider.CLAUDE]: 'warning',
    [LlmProvider.DEEPSEEK]: 'info',
    [LlmProvider.CUSTOM]: 'danger',
  };
  return map[provider] || 'info';
}

function truncateUrl(url: string | null) {
  if (!url) return '-';
  return url.length > 42 ? url.substring(0, 39) + '...' : url;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function onProviderChange(provider: LlmProvider) {
  const config = PROVIDER_CONFIGS[provider];
  if (config) {
    addForm.baseUrl = config.defaultBaseUrl;
    addForm.modelId = config.defaultModel;
  }
}

function openAddDialog() {
  Object.assign(addForm, { provider: '', name: '', apiKey: '', baseUrl: '', modelId: '', setAsDefault: true });
  addAvailableModels.value = [];
  addDialogVisible.value = true;
}

function openEditDialog(key: ApiKey) {
  editingId.value = key.id;
  Object.assign(editForm, { name: key.name, baseUrl: key.baseUrl || '', modelId: key.modelId || '' });
  editAvailableModels.value = [];
  editDialogVisible.value = true;
}

async function fetchModelsForAdd() {
  fetchingAddModels.value = true;
  try {
    const res = await apiKeyApi.listModels({
      provider: addForm.provider as string,
      apiKey: addForm.apiKey,
      baseUrl: addForm.baseUrl || undefined,
    });
    addAvailableModels.value = res.data.models;
    if (addAvailableModels.value.length === 0) {
      ElMessage.warning('未获取到模型列表');
    }
  } catch {
    // 拦截器已显示服务端错误
  } finally {
    fetchingAddModels.value = false;
  }
}

async function fetchModelsForEdit() {
  fetchingEditModels.value = true;
  try {
    const res = await apiKeyApi.getModelsByKeyId(editingId.value);
    editAvailableModels.value = res.data.models;
    if (editAvailableModels.value.length === 0) {
      ElMessage.warning('未获取到模型列表');
    }
  } catch {
    // 拦截器已显示服务端错误
  } finally {
    fetchingEditModels.value = false;
  }
}

async function handleToggleDefault(key: ApiKey, val: boolean) {
  togglingId.value = key.id;
  try {
    await apiKeyStore.updateApiKey(key.id, { isDefault: val });
    // 如果启用，把其他 key 的 isDefault 置为 false（本地同步）
    if (val) {
      apiKeyStore.apiKeys.forEach(k => { if (k.id !== key.id) k.isDefault = false; });
    }
  } finally {
    togglingId.value = null;
  }
}

async function handleAdd() {
  if (!addForm.provider || !addForm.name.trim() || !addForm.apiKey.trim()) {
    ElMessage.warning('服务商、名称和 API Key 不能为空');
    return;
  }
  saving.value = true;
  try {
    await apiKeyStore.createApiKey({
      provider: addForm.provider as LlmProvider,
      name: addForm.name,
      apiKey: addForm.apiKey,
      baseUrl: addForm.baseUrl || undefined,
      modelId: addForm.modelId || undefined,
    });
    if (addForm.setAsDefault && apiKeyStore.apiKeys.length > 0) {
      const newKey = apiKeyStore.apiKeys[apiKeyStore.apiKeys.length - 1];
      await apiKeyStore.updateApiKey(newKey.id, { isDefault: true });
      apiKeyStore.apiKeys.forEach(k => { if (k.id !== newKey.id) k.isDefault = false; });
    }
    ElMessage.success('添加成功');
    addDialogVisible.value = false;
  } finally {
    saving.value = false;
  }
}

async function handleEdit() {
  saving.value = true;
  try {
    await apiKeyStore.updateApiKey(editingId.value, {
      name: editForm.name,
      baseUrl: editForm.baseUrl || undefined,
      modelId: editForm.modelId || undefined,
    });
    ElMessage.success('保存成功');
    editDialogVisible.value = false;
  } finally {
    saving.value = false;
  }
}

async function handleTest(key: ApiKey) {
  testingId.value = key.id;
  try {
    await apiKeyStore.testApiKey(key.id);
    ElMessage.success(`「${key.name}」连接正常`);
  } catch {
    ElMessage.error(`「${key.name}」测试失败，请检查 Key 是否有效`);
  } finally {
    testingId.value = null;
  }
}

async function handleDelete(key: ApiKey) {
  try {
    await ElMessageBox.confirm(`确定删除「${key.name}」吗？`, '删除 API Key', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning',
    });
    await apiKeyStore.deleteApiKey(key.id);
    ElMessage.success('已删除');
  } catch { }
}

onMounted(() => apiKeyStore.fetchApiKeys());
</script>

<style scoped>
.api-key-view {
  padding: 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}

.page-header h2 {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #1a1a2e;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #78909c;
}

.key-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.key-card {
  background: white;
  border: 1.5px solid #e8edf5;
  border-radius: 12px;
  padding: 20px;
  position: relative;
  transition: all 0.2s;
}

.key-card--active {
  border-color: #3669EC;
  box-shadow: 0 0 0 3px rgba(54, 105, 236, 0.1);
}

.key-card-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #3669EC;
  font-weight: 600;
}

.key-card-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.key-provider-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.key-card-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.key-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.key-card-details {
  background: #f7f9fc;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.key-detail-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.detail-label {
  color: #90a4ae;
  min-width: 30px;
  flex-shrink: 0;
}

.detail-value {
  color: #37474f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.masked-key {
  font-family: monospace;
  letter-spacing: 1px;
}

.key-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.key-card-actions {
  display: flex;
  gap: 0;
}

.form-tip {
  font-size: 12px;
  color: #90a4ae;
  margin-top: 4px;
}

.model-input-row {
  display: flex;
  gap: 8px;
  width: 100%;
}
</style>
