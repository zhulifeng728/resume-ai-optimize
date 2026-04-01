<template>
  <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
    <el-form-item prop="email">
      <el-input v-model="form.email" placeholder="邮箱" size="large" prefix-icon="Message" />
    </el-form-item>
    <el-form-item prop="password">
      <el-input
        v-model="form.password"
        type="password"
        placeholder="密码"
        size="large"
        prefix-icon="Lock"
        show-password
      />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" size="large" :loading="loading" native-type="submit" style="width: 100%">
        登录
      </el-button>
    </el-form-item>
    <div class="form-footer">
      还没有账号？<a @click="$emit('switch-to-register')">立即注册</a>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';

const emit = defineEmits(['success', 'switch-to-register']);

const authStore = useAuthStore();
const formRef = ref<FormInstance>();
const loading = ref(false);

const form = reactive({ email: '', password: '' });

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
};

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    await authStore.login(form);
    ElMessage.success('登录成功');
    emit('success');
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.form-footer {
  text-align: center;
  color: #78909c;
  font-size: 14px;
  margin-top: 16px;
}

.form-footer a {
  color: #3669EC;
  cursor: pointer;
  text-decoration: none;
}

.form-footer a:hover {
  text-decoration: underline;
}
</style>
