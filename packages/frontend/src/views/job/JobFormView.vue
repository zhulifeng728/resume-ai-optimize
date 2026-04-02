<template>
  <div class="job-form-view">
    <div class="page-header">
      <el-button text @click="$router.push({ name: 'jobs' })">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>{{ isEdit ? '编辑职位' : '新建职位' }}</h2>
    </div>

    <el-card v-loading="loadingJob">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" style="max-width: 700px">
        <el-form-item label="职位名称" prop="title">
          <el-input v-model="form.title" placeholder="如：高级前端工程师" />
        </el-form-item>
        <el-form-item label="公司" prop="company">
          <el-input v-model="form.company" placeholder="如：字节跳动" />
        </el-form-item>
        <el-form-item label="地点" prop="location">
          <el-input v-model="form.location" placeholder="如：北京" />
        </el-form-item>
        <el-form-item label="薪资" prop="salary">
          <el-input v-model="form.salary" placeholder="如：25k-40k" />
        </el-form-item>
        <el-form-item label="职位描述（JD）" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="16" placeholder="粘贴完整的职位描述..." />
        </el-form-item>
        <el-form-item label="来源链接" prop="sourceUrl">
          <el-input v-model="form.sourceUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button type="primary" :loading="saving" @click="handleSave">
              {{ isEdit ? '保存修改' : '创建' }}
            </el-button>
            <el-button @click="$router.push({ name: 'jobs' })">取消</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { useJobStore } from '@/stores/job';

const route = useRoute();
const router = useRouter();
const jobStore = useJobStore();

const jobId = computed(() => route.params.id as string | undefined);
const isEdit = computed(() => !!jobId.value);

const formRef = ref<FormInstance>();
const saving = ref(false);
const loadingJob = ref(false);

const form = ref({ title: '', company: '', location: '', salary: '', description: '', sourceUrl: '' });

const rules: FormRules = {
  title: [{ required: true, message: '请输入职位名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入职位描述', trigger: 'blur' }],
};

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const data = {
      title: form.value.title,
      company: form.value.company || undefined,
      location: form.value.location || undefined,
      salary: form.value.salary || undefined,
      description: form.value.description,
      sourceUrl: form.value.sourceUrl || undefined,
    };
    if (isEdit.value && jobId.value) {
      await jobStore.updateJob(jobId.value, data);
      ElMessage.success('保存成功');
    } else {
      await jobStore.createJob(data);
      ElMessage.success('创建成功');
    }
    router.push({ name: 'jobs' });
  } catch {
    ElMessage.error('保存失败，请重试');
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  if (isEdit.value && jobId.value) {
    loadingJob.value = true;
    try {
      await jobStore.fetchJob(jobId.value);
      const job = jobStore.currentJob;
      if (job) {
        form.value = {
          title: job.title,
          company: job.company || '',
          location: job.location || '',
          salary: job.salary || '',
          description: job.description,
          sourceUrl: job.sourceUrl || '',
        };
      }
    } finally {
      loadingJob.value = false;
    }
  }
});
</script>

<style scoped>
.job-form-view {
  padding: 32px;
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
}

.form-actions {
  display: flex;
  gap: 12px;
}
</style>
