<template>
  <div class="review-doc-detail-view">
    <div class="page-header">
      <el-button text @click="$router.push({ name: 'review-docs' })">
        <el-icon><ArrowLeft /></el-icon>
        Back
      </el-button>
      <h2>Review Document</h2>
      <el-button class="export-btn" @click="exportMarkdown">
        <el-icon><Download /></el-icon>
        Export as Markdown
      </el-button>
    </div>

    <div v-loading="loading" class="content-area">
      <template v-if="doc">
        <div class="skills-bar" v-if="doc.skills && doc.skills.length > 0">
          <span class="skills-label">Skills:</span>
          <el-tag
            v-for="skill in doc.skills"
            :key="skill"
            size="small"
            class="skill-tag"
          >
            {{ skill }}
          </el-tag>
        </div>

        <div class="doc-layout">
          <!-- TOC Sidebar -->
          <aside class="toc-sidebar">
            <h4>Table of Contents</h4>
            <nav class="toc-nav">
              <a
                v-for="heading in tocItems"
                :key="heading.id"
                :href="`#${heading.id}`"
                :class="['toc-link', `toc-level-${heading.level}`]"
                @click.prevent="scrollToHeading(heading.id)"
              >
                {{ heading.text }}
              </a>
            </nav>
          </aside>

          <!-- Content Area -->
          <main class="doc-content">
            <div class="markdown-body" ref="contentRef" v-html="renderedContent"></div>
          </main>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { ArrowLeft, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { marked } from 'marked';
import { reviewDocApi } from '@/api/review-doc';
import type { ReviewDoc } from '@resume-ai/shared';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

const route = useRoute();
const docId = computed(() => route.params.id as string);

const doc = ref<ReviewDoc | null>(null);
const loading = ref(false);
const contentRef = ref<HTMLElement | null>(null);

const tocItems = ref<TocItem[]>([]);

const renderedContent = computed(() => {
  if (!doc.value?.content) return '';

  // Configure marked with custom heading renderer to add IDs
  const renderer = new marked.Renderer();
  const headings: TocItem[] = [];

  renderer.heading = function ({ text, depth }: { text: string; depth: number }) {
    const cleanText = text.replace(/<[^>]*>/g, '');
    const slug = cleanText
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    if (depth === 2 || depth === 3) {
      headings.push({ id: slug, text: cleanText, level: depth });
    }

    return `<h${depth} id="${slug}">${text}</h${depth}>`;
  };

  const html = marked(doc.value.content, { renderer }) as string;
  tocItems.value = headings;
  return html;
});

function scrollToHeading(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function exportMarkdown() {
  if (!doc.value) return;
  const blob = new Blob([doc.value.content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `review-doc-${doc.value.id}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  ElMessage.success('Markdown file downloaded.');
}

onMounted(async () => {
  loading.value = true;
  try {
    const res = await reviewDocApi.get(docId.value);
    doc.value = res.data;
    await nextTick();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load review document';
    ElMessage.error(message);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.review-doc-detail-view {
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
  flex: 1;
}

.export-btn {
  flex-shrink: 0;
}

.content-area {
  min-height: 400px;
}

.skills-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.skills-label {
  font-weight: 600;
  margin-right: 8px;
  color: var(--el-text-color-primary);
}

.skill-tag {
  margin: 2px 0;
}

.doc-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 24px;
  align-items: start;
}

.toc-sidebar {
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.toc-sidebar h4 {
  margin: 0 0 12px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.toc-nav {
  display: flex;
  flex-direction: column;
}

.toc-link {
  display: block;
  padding: 4px 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  text-decoration: none;
  line-height: 1.5;
  transition: color 0.2s;
}

.toc-link:hover {
  color: var(--el-color-primary);
}

.toc-level-3 {
  padding-left: 16px;
  font-size: 12px;
}

.doc-content {
  min-width: 0;
}

.markdown-body {
  line-height: 1.8;
  font-size: 15px;
  color: var(--el-text-color-primary);
}

.markdown-body :deep(h1) {
  font-size: 28px;
  border-bottom: 1px solid var(--el-border-color);
  padding-bottom: 8px;
  margin: 24px 0 16px;
}

.markdown-body :deep(h2) {
  font-size: 22px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding-bottom: 6px;
  margin: 24px 0 12px;
}

.markdown-body :deep(h3) {
  font-size: 18px;
  margin: 20px 0 10px;
}

.markdown-body :deep(pre) {
  background: var(--el-fill-color-darker);
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 14px;
}

.markdown-body :deep(code) {
  background: var(--el-fill-color);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 14px;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
}

.markdown-body :deep(blockquote) {
  border-left: 4px solid var(--el-color-primary);
  margin: 16px 0;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 0 4px 4px 0;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 24px;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--el-border-color);
  padding: 8px 12px;
  text-align: left;
}

.markdown-body :deep(th) {
  background: var(--el-fill-color-light);
  font-weight: 600;
}

@media (max-width: 768px) {
  .doc-layout {
    grid-template-columns: 1fr;
  }

  .toc-sidebar {
    position: static;
  }
}
</style>
