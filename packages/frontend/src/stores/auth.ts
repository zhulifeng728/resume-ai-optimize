import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth';
import type { User, LoginDto, RegisterDto } from '@resume-ai/shared';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(localStorage.getItem('accessToken'));
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'));

  const isAuthenticated = computed(() => !!accessToken.value);

  async function login(data: LoginDto) {
    const res = await authApi.login(data);
    setAuth(res.data);
    return res.data;
  }

  async function register(data: RegisterDto) {
    const res = await authApi.register(data);
    setAuth(res.data);
    return res.data;
  }

  async function refresh(): Promise<string> {
    if (!refreshToken.value) throw new Error('No refresh token');
    const res = await authApi.refresh(refreshToken.value);
    accessToken.value = res.data.accessToken;
    localStorage.setItem('accessToken', res.data.accessToken);
    return res.data.accessToken;
  }

  async function fetchProfile() {
    const res = await authApi.profile();
    user.value = res.data;
  }

  function setAuth(auth: { user: User; tokens: { accessToken: string; refreshToken: string } }) {
    user.value = auth.user;
    accessToken.value = auth.tokens.accessToken;
    refreshToken.value = auth.tokens.refreshToken;
    localStorage.setItem('accessToken', auth.tokens.accessToken);
    localStorage.setItem('refreshToken', auth.tokens.refreshToken);
  }

  function logout() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  return { user, accessToken, refreshToken, isAuthenticated, login, register, refresh, fetchProfile, logout };
});
