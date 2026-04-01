<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">AI 简历优化</h1>
        <p class="hero-subtitle">基于真实 JD，让 AI 帮你打造完美简历</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="goToOptimize">
            立即优化简历
          </el-button>
          <el-button size="large" @click="goToReviewDoc">
            生成技术复习文档
          </el-button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <h2 class="section-title">核心功能</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📝</div>
          <h3>简历反向优化</h3>
          <p>输入真实 JD，AI 分析岗位要求，针对性优化你的简历内容</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📚</div>
          <h3>技术复习文档</h3>
          <p>基于简历内容，自动生成面试技术点复习文档，助你备战面试</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3>BYOK 架构</h3>
          <p>支持自带 API Key，数据安全可控，支持多家 AI 服务商</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3>实时流式输出</h3>
          <p>AI 生成过程实时展示，所见即所得，体验流畅</p>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works-section">
      <h2 class="section-title">使用流程</h2>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-number">1</div>
          <h3>上传简历</h3>
          <p>支持 PDF、Word 格式，或直接粘贴文本</p>
        </div>
        <div class="step-card">
          <div class="step-number">2</div>
          <h3>输入 JD</h3>
          <p>粘贴目标岗位的职位描述</p>
        </div>
        <div class="step-card">
          <div class="step-number">3</div>
          <h3>AI 优化</h3>
          <p>AI 分析并生成优化建议</p>
        </div>
        <div class="step-card">
          <div class="step-number">4</div>
          <h3>对比查看</h3>
          <p>查看优化前后对比，选择最佳版本</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const goToOptimize = () => {
  router.push({ name: 'optimize' });
};

const goToReviewDoc = () => {
  router.push({ name: 'review-doc' });
};
</script>

<style scoped>
.home-page {
  min-height: 100vh;
}

.hero-section {
  background: linear-gradient(135deg, #5B8DEF 0%, #3669EC 100%);
  color: white;
  padding: 120px 20px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 56px;
  font-weight: 700;
  margin-bottom: 20px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 24px;
  margin-bottom: 40px;
  opacity: 0.95;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.features-section,
.how-it-works-section {
  padding: 80px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 60px;
  color: #1f2937;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 32px;
}

.feature-card {
  padding: 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  transition: transform 0.2s, box-shadow 0.2s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #1f2937;
}

.feature-card p {
  color: #6b7280;
  line-height: 1.6;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
}

.step-card {
  text-align: center;
  padding: 24px;
}

.step-number {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #5B8DEF 0%, #3669EC 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  margin: 0 auto 20px;
}

.step-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2937;
}

.step-card p {
  color: #6b7280;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 18px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .section-title {
    font-size: 28px;
  }
}
</style>
