import { defineStore } from 'pinia';
import { ref } from 'vue';
import { jobApi } from '@/api/job';
import type { Job, CreateJobDto, UpdateJobDto } from '@resume-ai/shared';

export const useJobStore = defineStore('job', () => {
  const jobs = ref<Job[]>([]);
  const currentJob = ref<Job | null>(null);
  const total = ref(0);
  const loading = ref(false);

  async function fetchJobs(page = 1, limit = 20) {
    loading.value = true;
    try {
      const res = await jobApi.list({ page, limit });
      jobs.value = res.data.items;
      total.value = res.data.total;
    } finally {
      loading.value = false;
    }
  }

  async function fetchJob(id: string) {
    const res = await jobApi.get(id);
    currentJob.value = res.data;
  }

  async function createJob(data: CreateJobDto) {
    const res = await jobApi.create(data);
    jobs.value.unshift(res.data);
    return res.data;
  }

  async function updateJob(id: string, data: UpdateJobDto) {
    const res = await jobApi.update(id, data);
    const index = jobs.value.findIndex((j) => j.id === id);
    if (index !== -1) jobs.value[index] = res.data;
    return res.data;
  }

  async function deleteJob(id: string) {
    await jobApi.delete(id);
    jobs.value = jobs.value.filter((j) => j.id !== id);
  }

  return { jobs, currentJob, total, loading, fetchJobs, fetchJob, createJob, updateJob, deleteJob };
});
