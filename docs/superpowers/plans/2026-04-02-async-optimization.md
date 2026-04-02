# Async Optimization Task Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 点击「开始优化」后立即返回，后端异步执行 AI 优化，前端通过状态标签展示进度（处理中 / 已完成 / 失败），用户手动刷新查看结果。

**Architecture:** 在 `ResumeVersion` 表新增 `status` 和 `errorMessage` 字段。`POST /optimizations` 立即创建 `status=PENDING` 的版本记录并返回，后台 `setImmediate` 异步执行 AI 调用，完成后更新状态。前端提交后展示"任务已提交"提示，简历详情页版本列表显示状态标签。`OptimizationResultView.vue` 是旧的流式结果页，本次一并删除。

**Tech Stack:** NestJS + Prisma (PostgreSQL), Vue 3 + Element Plus, TypeScript shared types

---

## File Map

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/backend/prisma/schema.prisma` | 修改 | 新增 `OptimizationStatus` enum 和 `ResumeVersion.status/errorMessage` 字段 |
| `packages/backend/src/optimization/optimization.service.ts` | 修改 | 改为异步：立即创建版本记录，后台执行 AI；更新 optimizeStream 状态 |
| `packages/backend/src/optimization/optimization.controller.ts` | 修改 | 返回类型改为 `{ versionId, status }` |
| `packages/shared/src/types/resume.ts` | 修改 | `ResumeVersion` 接口加 `status` 和 `errorMessage` 字段，新增 `OptimizationStatus` enum |
| `packages/shared/src/types/api.ts` | 修改 | 新增 `OptimizationSubmitResult` 接口 |
| `packages/frontend/src/api/optimization.ts` | 修改 | `create` 返回类型改为 `OptimizationSubmitResult`，移除 `get` 和 `streamUrl` |
| `packages/frontend/src/views/optimization/OptimizationView.vue` | 修改 | 提交后显示"任务已提交"提示和刷新按钮 |
| `packages/frontend/src/views/optimization/OptimizationResultView.vue` | 删除 | 旧的流式结果页，已无用 |
| `packages/frontend/src/views/resume/ResumeDetailView.vue` | 修改 | 版本列表状态列显示 pending/processing/completed/failed 标签 |

---

## Task 1: 更新 Prisma Schema

**Files:**
- Modify: `packages/backend/prisma/schema.prisma`

- [ ] **Step 1: 在 schema.prisma 中新增 enum 和字段**

在现有 enum 块（`LlmProvider` 之后）添加：

```prisma
enum OptimizationStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

在 `ResumeVersion` model 中，紧接 `isSelected` 字段后加入：

```prisma
  status        OptimizationStatus @default(PENDING)
  errorMessage  String?            @map("error_message") @db.Text
```

- [ ] **Step 2: 生成并应用迁移**

```bash
cd /Users/lifeng/Desktop/xiangmu/resume-ai-optimize
pnpm db:migrate
# 提示输入迁移名称时输入: add_optimization_status
pnpm db:generate
```

Expected: 迁移成功，Prisma client 重新生成，`OptimizationStatus` enum 可从 `@prisma/client` 导入

- [ ] **Step 3: Commit**

```bash
git add packages/backend/prisma/
git commit -m "feat: add OptimizationStatus enum and status fields to ResumeVersion"
```

---

## Task 2: 更新 Shared Types

**Files:**
- Modify: `packages/shared/src/types/resume.ts`
- Modify: `packages/shared/src/types/api.ts`

- [ ] **Step 1: 在 resume.ts 中新增 enum 和更新接口**

在文件顶部 `ResumeStatus` enum 后添加：

```typescript
export enum OptimizationStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
```

在 `ResumeVersion` 接口中加入两个字段：

```typescript
  status: OptimizationStatus;
  errorMessage: string | null;
```

- [ ] **Step 2: 在 api.ts 中新增提交结果接口**

```typescript
import type { OptimizationStatus } from './resume';

export interface OptimizationSubmitResult {
  versionId: string;
  status: OptimizationStatus;
}
```

- [ ] **Step 3: 确认 index.ts 已导出新增内容**

检查 `packages/shared/src/types/index.ts`，确保有 `export * from './resume'` 和 `export * from './api'`。如已存在则无需修改。

- [ ] **Step 4: 重新构建 shared 包**

```bash
cd /Users/lifeng/Desktop/xiangmu/resume-ai-optimize/packages/shared
pnpm build
```

Expected: 构建成功，无 TypeScript 错误

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/types/
git commit -m "feat: add OptimizationStatus enum and OptimizationSubmitResult type to shared"
```

---

## Task 3: 更新后端 OptimizationService

**Files:**
- Modify: `packages/backend/src/optimization/optimization.service.ts`

- [ ] **Step 1: 更新 import，引入 Prisma enum 和 Logger**

在文件顶部 import 区域添加：

```typescript
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { OptimizationStatus } from '@prisma/client';
```

在 class 内部顶部添加：

```typescript
private readonly logger = new Logger(OptimizationService.name);
```

- [ ] **Step 2: 改写 optimize 方法为异步模式**

将 `optimize` 方法完整替换为：

```typescript
async optimize(userId: string, resumeId: string, jobId: string, apiKeyId: string) {
  const resume = await this.resumeService.findOne(userId, resumeId);
  const job = await this.jobService.findOne(userId, jobId);

  if (!resume.originalText) {
    throw new BadRequestException('Resume has no text content. Please parse or enter text first.');
  }

  const lastVersion = await this.prisma.resumeVersion.findFirst({
    where: { resumeId },
    orderBy: { versionNumber: 'desc' },
  });

  const version = await this.prisma.resumeVersion.create({
    data: {
      resumeId,
      content: '',
      versionNumber: (lastVersion?.versionNumber || 0) + 1,
      aiModel: 'pending',
      jobId,
      status: OptimizationStatus.PENDING,
    },
  });

  setImmediate(() =>
    this._runOptimization(version.id, userId, apiKeyId, resume.originalText!, job.description)
      .catch(err => this.logger.error('Unhandled optimization error', err))
  );

  return { versionId: version.id, status: OptimizationStatus.PENDING };
}
```

- [ ] **Step 3: 新增私有方法 _runOptimization**

在 `optimize` 方法后添加：

```typescript
private async _runOptimization(
  versionId: string,
  userId: string,
  apiKeyId: string,
  resumeText: string,
  jobDescription: string,
) {
  try {
    await this.prisma.resumeVersion.update({
      where: { id: versionId },
      data: { status: OptimizationStatus.PROCESSING },
    });

    const messages = buildResumeOptimizePrompt(resumeText, jobDescription);
    const result = await this.aiGateway.complete(userId, apiKeyId, messages, { temperature: 0.7, maxTokens: 4096 });

    let parsed: any;
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { optimizedResume: result.content };
    } catch {
      parsed = { optimizedResume: result.content };
    }

    await this.prisma.resumeVersion.update({
      where: { id: versionId },
      data: {
        content: parsed.optimizedResume || result.content,
        diffData: { sections: parsed.sections, matchScore: parsed.matchScore, suggestions: parsed.suggestions },
        aiModel: result.model,
        status: OptimizationStatus.COMPLETED,
      },
    });
  } catch (err: any) {
    await this.prisma.resumeVersion.update({
      where: { id: versionId },
      data: {
        status: OptimizationStatus.FAILED,
        errorMessage: err?.message || 'Unknown error',
      },
    });
  }
}
```

- [ ] **Step 4: 更新 optimizeStream 方法，在完成时设置 COMPLETED 状态**

找到 `optimizeStream` 方法中 `prisma.resumeVersion.create` 调用，在 `data` 对象中加入：

```typescript
status: OptimizationStatus.COMPLETED,
```

- [ ] **Step 5: Commit**

```bash
git add packages/backend/src/optimization/optimization.service.ts
git commit -m "feat: make optimization async - return immediately with PENDING status"
```

---

## Task 4: 更新后端 OptimizationController

**Files:**
- Modify: `packages/backend/src/optimization/optimization.controller.ts`

- [ ] **Step 1: 验证后端编译**

当前 controller 的 `create` 方法直接 `return this.optimizationService.optimize(...)` 即可，service 已返回正确结构。检查是否有强制 `OptimizationResult` 类型注解导致编译错误，如有则移除。

```bash
cd /Users/lifeng/Desktop/xiangmu/resume-ai-optimize/packages/backend
pnpm build
```

Expected: 编译成功，无 TypeScript 错误

- [ ] **Step 2: Commit**

```bash
git add packages/backend/src/optimization/
git commit -m "feat: update optimization controller for async flow"
```

---

## Task 5: 更新前端 API 层 + 删除旧结果页

**Files:**
- Modify: `packages/frontend/src/api/optimization.ts`
- Delete: `packages/frontend/src/views/optimization/OptimizationResultView.vue`

- [ ] **Step 1: 更新 optimization.ts**

完整替换文件内容为：

```typescript
import client from './client';
import type { OptimizationRequest, OptimizationSubmitResult } from '@resume-ai/shared';

export const optimizationApi = {
  create: (data: OptimizationRequest) =>
    client.post<unknown, { data: OptimizationSubmitResult }>('/optimizations', data),
};
```

- [ ] **Step 2: 删除 OptimizationResultView.vue**

```bash
rm packages/frontend/src/views/optimization/OptimizationResultView.vue
```

检查路由配置文件（通常在 `packages/frontend/src/router/index.ts`），移除对 `OptimizationResultView` 的引用。

- [ ] **Step 3: Commit**

```bash
git add packages/frontend/src/api/optimization.ts
git add packages/frontend/src/router/
git rm packages/frontend/src/views/optimization/OptimizationResultView.vue
git commit -m "feat: update optimization API client, remove legacy result view"
```

---

## Task 6: 更新优化页面（OptimizationView.vue）

**Files:**
- Modify: `packages/frontend/src/views/optimization/OptimizationView.vue`

- [ ] **Step 1: 更新 script setup 的 import 区域**

将 import 区域改为（保留已有的 `jobApi`，移除不再使用的 `diffWords`、`CircleCheckFilled`、`OptimizationResult`、`ResumeVersion`、`resumeApi`）：

```typescript
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Loading, Key } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useResumeStore } from '@/stores/resume';
import { useApiKeyStore } from '@/stores/api-key';
import { jobApi } from '@/api/job';
import { optimizationApi } from '@/api/optimization';
import type { Job } from '@resume-ai/shared';
```

- [ ] **Step 2: 替换 script setup 中的状态变量和函数**

移除：`optimizing`、`result`、`originalText`、`optimizedText`、`originalHtml`、`optimizedHtml`、`escapeHtml`、`resetForm`（旧版）

新增：

```typescript
const submitting = ref(false);
const submitted = ref(false);
const submittedVersionId = ref('');

async function startOptimization() {
  if (!activeKey.value) return;
  submitting.value = true;
  try {
    let jobId = selectedJobId.value;
    if (jdTab.value === 'manual') {
      const jobRes = await jobApi.create({ title: '手动输入职位', description: manualJd.value });
      jobId = jobRes.data.id;
    }
    const res = await optimizationApi.create({
      resumeId: selectedResumeId.value,
      jobId,
      apiKeyId: activeKey.value.id,
    });
    submittedVersionId.value = res.data.versionId;
    submitted.value = true;
  } catch {
    ElMessage.error('提交失败，请重试');
  } finally {
    submitting.value = false;
  }
}

function resetForm() {
  submitted.value = false;
  submittedVersionId.value = '';
}
```

- [ ] **Step 3: 更新模板**

将 `<template v-if="result">` 结果展示区域（含 diff-container）替换为：

```html
<!-- 提交成功提示 -->
<template v-if="submitted">
  <el-card class="submitted-card">
    <div class="submitted-content">
      <el-icon color="#e6a23c" :size="40"><Loading /></el-icon>
      <h3>优化任务已提交</h3>
      <p>AI 正在后台处理，请稍后前往简历详情页查看结果。</p>
      <div class="submitted-actions">
        <el-button @click="resetForm">再提交一次</el-button>
        <el-button type="primary" @click="$router.push({ name: 'resume-detail', params: { id: selectedResumeId } })">
          查看简历版本
        </el-button>
      </div>
    </div>
  </el-card>
</template>
```

将提交按钮的 `:loading="optimizing"` 改为 `:loading="submitting"`，文案改为 `{{ submitting ? '提交中...' : '开始优化' }}`。

- [ ] **Step 4: 在 style scoped 中添加新样式，移除旧 diff 样式**

移除 `.result-header`、`.result-title`、`.result-actions`、`.diff-container`、`.diff-panel`、`.diff-panel-title`、`.dot`、`.dot-red`、`.dot-green`、`.diff-content` 相关样式。

添加：

```css
.submitted-card {
  border-radius: 12px;
}

.submitted-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  gap: 12px;
  text-align: center;
}

.submitted-content h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.submitted-content p {
  margin: 0;
  font-size: 14px;
  color: #78909c;
}

.submitted-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/views/optimization/OptimizationView.vue
git commit -m "feat: show submitted state instead of waiting for AI result"
```

---

## Task 7: 更新简历详情页版本列表状态标签

**Files:**
- Modify: `packages/frontend/src/views/resume/ResumeDetailView.vue`

- [ ] **Step 1: 在 import 中加入 Refresh 图标**

找到现有的 `import { ArrowLeft } from '@element-plus/icons-vue'`，改为：

```typescript
import { ArrowLeft, Refresh } from '@element-plus/icons-vue';
```

- [ ] **Step 2: 新增 versionsRefreshing ref 和 refreshVersions 函数**

在 `generatingDoc` ref 附近添加：

```typescript
const versionsRefreshing = ref(false);

async function refreshVersions() {
  versionsRefreshing.value = true;
  try {
    await resumeStore.fetchVersions(resumeId.value);
  } finally {
    versionsRefreshing.value = false;
  }
}
```

- [ ] **Step 3: 更新版本卡片 header，加入刷新按钮**

找到 `<el-card class="versions-card">` 的 `#header` slot：

```html
<template #header>
  <div class="card-header-row">
    <span class="card-header-title">AI 优化版本</span>
    <el-button text size="small" :loading="versionsRefreshing" @click="refreshVersions">
      <el-icon><Refresh /></el-icon> 刷新
    </el-button>
  </div>
</template>
```

- [ ] **Step 4: 更新版本列表的状态列**

找到 `<el-table-column label="状态" width="100">` 部分，替换为：

```html
<el-table-column label="状态" width="140">
  <template #default="{ row }">
    <el-tag v-if="row.status === 'PENDING'" type="info" size="small">等待中</el-tag>
    <el-tag v-else-if="row.status === 'PROCESSING'" type="warning" size="small">处理中</el-tag>
    <el-tag v-else-if="row.status === 'FAILED'" type="danger" size="small">失败</el-tag>
    <template v-else>
      <el-tag v-if="row.isSelected" type="success" size="small">已采用</el-tag>
      <el-tag v-else type="primary" size="small">已完成</el-tag>
    </template>
  </template>
</el-table-column>
```

- [ ] **Step 5: 对非 COMPLETED 状态禁用操作按钮**

找到操作列，更新为：

```html
<el-table-column label="操作" width="180">
  <template #default="{ row }">
    <el-button
      text type="primary" size="small"
      :disabled="row.status !== 'COMPLETED'"
      @click="viewVersion(row)"
    >查看对比</el-button>
    <el-button
      v-if="!row.isSelected && row.status === 'COMPLETED'"
      text type="success" size="small"
      @click="selectVersion(row)"
    >采用此版本</el-button>
  </template>
</el-table-column>
```

- [ ] **Step 6: Commit**

```bash
git add packages/frontend/src/views/resume/ResumeDetailView.vue
git commit -m "feat: show optimization status tags and refresh button in version list"
```

---

## Task 8: 端到端验证

- [ ] **Step 1: 启动服务（在两个独立终端中运行）**

```bash
# 终端 1
pnpm dev:backend

# 终端 2
pnpm dev:frontend
```

- [ ] **Step 2: 验证正常流程**

1. 登录，选择一份有内容的简历
2. 进入「AI 优化」页面，选择简历和职位，点击「开始优化」
3. 验证：按钮短暂 loading 后，页面切换为"任务已提交"提示（不再长时间等待）
4. 点击「查看简历版本」跳转到简历详情页
5. 验证：版本列表中出现新版本，状态为「等待中」
6. 点击「刷新」按钮，验证状态变为「处理中」（如果 AI 还在跑）
7. 再次点击「刷新」，等待 AI 完成后状态变为「已完成」
8. 点击「查看对比」验证内容正常显示，「采用此版本」按钮可用

- [ ] **Step 3: 验证失败场景**

使用无效的 API Key 触发失败，验证版本状态变为「失败」，「查看对比」按钮为禁用状态。
