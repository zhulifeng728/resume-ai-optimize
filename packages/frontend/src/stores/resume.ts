import { defineStore } from 'pinia';
import { ref } from 'vue';
import { resumeApi } from '@/api/resume';
import type { Resume, ResumeVersion } from '@resume-ai/shared';

export const useResumeStore = defineStore('resume', () => {
  const resumes = ref<Resume[]>([]);
  const currentResume = ref<Resume | null>(null);
  const versions = ref<ResumeVersion[]>([]);
  const total = ref(0);
  const loading = ref(false);

  async function fetchResumes(page = 1, limit = 20) {
    loading.value = true;
    try {
      const res = await resumeApi.list({ page, limit });
      resumes.value = res.data.items;
      total.value = res.data.total;
    } finally {
      loading.value = false;
    }
  }

  async function fetchResume(id: string) {
    loading.value = true;
    try {
      const res = await resumeApi.get(id);
      currentResume.value = res.data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchVersions(resumeId: string) {
    const res = await resumeApi.getVersions(resumeId);
    versions.value = res.data;
  }

  async function deleteResume(id: string) {
    await resumeApi.delete(id);
    resumes.value = resumes.value.filter((r) => r.id !== id);
  }

  return { resumes, currentResume, versions, total, loading, fetchResumes, fetchResume, fetchVersions, deleteResume };
});
