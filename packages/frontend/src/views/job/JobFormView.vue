<template>
  <div class="job-form-view">
    <div class="page-header">
      <el-button text @click="$router.push({ name: 'jobs' })">
        <el-icon><ArrowLeft /></el-icon>
        Back
      </el-button>
      <h2>{{ isEdit ? 'Edit Job Description' : 'New Job Description' }}</h2>
    </div>

    <el-card v-loading="loadingJob">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        style="max-width: 700px"
      >
        <el-form-item label="Title" prop="title">
          <el-input v-model="form.title" placeholder="e.g. Senior Frontend Engineer" />
        </el-form-item>
        <el-form-item label="Company" prop="company">
          <el-input v-model="form.company" placeholder="e.g. Google" />
        </el-form-item>
        <el-form-item label="Location" prop="location">
          <el-input v-model="form.location" placeholder="e.g. San Francisco, CA" />
        </el-form-item>
        <el-form-item label="Salary" prop="salary">
          <el-input v-model="form.salary" placeholder="e.g. $150k - $200k" />
        </el-form-item>
        <el-form-item label="Job Description" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="16"
            placeholder="Paste the full job description here..."
          />
        </el-form-item>
        <el-form-item label="Source URL" prop="sourceUrl">
          <el-input v-model="form.sourceUrl" placeholder="https://..." />
        </el-form-item>
        <el-form-item>
          <div class="form-actions">
            <el-button type="primary" :loading="saving" @click="handleSave">
              {{ isEdit ? 'Update' : 'Create' }}
            </el-button>
            <el-button @click="$router.push({ name: 'jobs' })">Cancel</el-button>
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

const form = ref({
  title: '',
  company: '',
  location: '',
  salary: '',
  description: '',
  sourceUrl: '',
});

const rules: FormRules = {
  title: [{ required: true, message: 'Title is required', trigger: 'blur' }],
  description: [{ required: true, message: 'Job description is required', trigger: 'blur' }],
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
      ElMessage.success('Job description updated.');
    } else {
      await jobStore.createJob(data);
      ElMessage.success('Job description created.');
    }
    router.push({ name: 'jobs' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Save failed';
    ElMessage.error(message);
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

.form-actions {
  display: flex;
  gap: 12px;
}
</style>
