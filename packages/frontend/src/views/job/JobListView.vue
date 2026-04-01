<template>
  <div class="job-list-view">
    <div class="page-header">
      <h2>Job Descriptions</h2>
      <el-button type="primary" @click="$router.push({ name: 'job-create' })">
        <el-icon><Plus /></el-icon>
        Add JD
      </el-button>
    </div>

    <el-table
      v-loading="jobStore.loading"
      :data="jobStore.jobs"
      stripe
      style="width: 100%"
    >
      <el-table-column prop="title" label="Title" min-width="200" />
      <el-table-column prop="company" label="Company" width="160">
        <template #default="{ row }">
          {{ row.company || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="location" label="Location" width="140">
        <template #default="{ row }">
          {{ row.location || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="source" label="Source" width="120">
        <template #default="{ row }">
          <el-tag :type="row.source === 'CRAWLED' ? 'warning' : 'info'" size="small">
            {{ row.source === 'CRAWLED' ? 'Crawled' : 'Manual' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Created At" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="160" fixed="right">
        <template #default="{ row }">
          <el-button
            text
            type="primary"
            size="small"
            @click="$router.push({ name: 'job-edit', params: { id: row.id } })"
          >
            Edit
          </el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="jobStore.total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useJobStore } from '@/stores/job';

const jobStore = useJobStore();

const currentPage = ref(1);
const pageSize = 20;

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function handlePageChange(page: number) {
  currentPage.value = page;
  jobStore.fetchJobs(page, pageSize);
}

async function handleDelete(row: { id: string; title: string }) {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${row.title}"? This action cannot be undone.`,
      'Delete Job Description',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' }
    );
    await jobStore.deleteJob(row.id);
    ElMessage.success('Job description deleted.');
  } catch {
    // User cancelled
  }
}

onMounted(() => {
  jobStore.fetchJobs(currentPage.value, pageSize);
});
</script>

<style scoped>
.job-list-view {
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

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
