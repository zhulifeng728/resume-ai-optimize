<template>
  <div class="review-doc-generate-page">
    <div class="page-container">
      <div class="page-header">
        <h1>生成技术复习文档</h1>
        <p>基于你的简历内容，AI 自动生成面试技术点复习文档</p>
      </div>

      <el-card class="generate-card">
        <el-steps :active="currentStep" align-center>
          <el-step title="选择简历" />
          <el-step title="生成文档" />
          <el-step title="查看结果" />
        </el-steps>

        <div class="step-content">
          <!-- 步骤 1: 选择简历 -->
          <div v-if="currentStep === 0" class="step-panel">
            <h3>选择要生成复习文档的简历</h3>
            <el-radio-group v-model="selectedResumeId" class="resume-list">
              <el-radio
                v-for="resume in resumes"
                :key="resume.id"
                :label="resume.id"
                class="resume-item"
              >
                <div class="resume-info">
                  <div class="resume-title">{{ resume.title }}</div>
                  <div class="resume-meta">
                    创建于 {{ formatDate(resume.createdAt) }}
                  </div>
                </div>
              </el-radio>
            </el-radio-group>
            <div class="step-actions">
              <el-button type="primary" :disabled="!selectedResumeId" @click="nextStep">
                下一步
              </el-button>
            </div>
          </div>

          <!-- 步骤 2: 生成中 -->
          <div v-if="currentStep === 1" class="step-panel">
            <div class="generating-panel">
              <el-icon class="generating-icon" :size="64"><Loading /></el-icon>
              <h3>AI 正在生成技术复习文档...</h3>
              <p>这可能需要几分钟时间，请耐心等待</p>
            </div>
          </div>

          <!-- 步骤 3: 完成 -->
          <div v-if="currentStep === 2" class="step-panel">
            <el-result icon="success" title="生成成功！">
              <template #extra>
                <el-button type="primary" @click="viewDocument">查看文档</el-button>
                <el-button @click="reset">再生成一份</el-button>
              </template>
            </el-result>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

const router = useRouter();

const currentStep = ref(0);
const selectedResumeId = ref('');
const resumes = ref<any[]>([]);
const generatedDocId = ref('');

onMounted(async () => {
  // TODO: 加载用户的简历列表
  resumes.value = [];
});

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN');
};

const nextStep = async () => {
  if (currentStep.value === 0) {
    currentStep.value = 1;
    try {
      // TODO: 调用 API 生成复习文档
      await new Promise(resolve => setTimeout(resolve, 3000));
      generatedDocId.value = 'mock-id';
      currentStep.value = 2;
    } catch (error) {
      ElMessage.error('生成失败，请重试');
      currentStep.value = 0;
    }
  }
};

const viewDocument = () => {
  router.push({ name: 'my-review-docs' });
};

const reset = () => {
  currentStep.value = 0;
  selectedResumeId.value = '';
  generatedDocId.value = '';
};
</script>

<style scoped>
.review-doc-generate-page {
  min-height: calc(100vh - 64px);
  padding: 40px 20px;
}

.page-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.page-header p {
  font-size: 16px;
  color: #6b7280;
}

.generate-card {
  padding: 32px;
}

.step-content {
  margin-top: 48px;
}

.step-panel {
  min-height: 300px;
}

.step-panel h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 24px;
}

.resume-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.resume-item {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s;
}

.resume-item:hover {
  border-color: #667eea;
  background: #f9fafb;
}

.resume-info {
  margin-left: 8px;
}

.resume-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 4px;
}

.resume-meta {
  font-size: 14px;
  color: #6b7280;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.generating-panel {
  text-align: center;
  padding: 60px 20px;
}

.generating-icon {
  color: #667eea;
  margin-bottom: 24px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.generating-panel h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 12px;
}

.generating-panel p {
  font-size: 14px;
  color: #6b7280;
}
</style>
