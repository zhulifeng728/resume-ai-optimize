<template>
  <div class="job-list-view">
    <div class="page-header">
      <h2>职位管理</h2>
      <el-button type="primary" @click="$router.push({ name: 'job-create' })">
        <el-icon><Plus /></el-icon>
        新建职位
      </el-button>
    </div>

    <el-table v-loading="jobStore.loading" :data="jobStore.jobs" stripe style="width: 100%">
      <el-table-column prop="title" label="职位名称" min-width="200" />
      <el-table-column prop="company" label="公司" width="160">
        <template #default="{ row }">{{ row.company || '-' }}</template>
      </el-table-column>
      <el-table-column prop="location" label="地点" width="140">
        <template #default="{ row }">{{ row.location || '-' }}</template>
      </el-table-column>
      <el-table-column label="来源" width="100">
        <template #default="{ row }">
          <el-tag :type="row.source === 'CRAWLED' ? 'warning' : 'info'" size="small">
            {{ row.source === 'CRAWLED' ? '爬取' : '手动' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" width="160">
        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" size="small"
            @click="$router.push({ name: 'job-edit', params: { id: row.id } })">编辑</el-button>
          <el-button text type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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

const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

function handlePageChange(page: number) {
  currentPage.value = page;
  jobStore.fetchJobs(page, pageSize);
}

async function handleDelete(row: { id: string; title: string }) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.title}」吗？`, '删除职位', {
      confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
    });
    await jobStore.deleteJob(row.id);
    ElMessage.success('已删除');
  } catch { }
}

onMounted(() => jobStore.fetchJobs(currentPage.value, pageSize));
</script>

<style scoped>
.job-list-view {
  padding: 32px;
  max-width: 1100px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1a1a2e;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
