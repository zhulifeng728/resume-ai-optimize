import client from './client';
import type { AuthResponse, LoginDto, RegisterDto, User } from '@resume-ai/shared';

export const authApi = {
  login: (data: LoginDto) => client.post<unknown, { data: AuthResponse }>('/auth/login', data),
  register: (data: RegisterDto) => client.post<unknown, { data: AuthResponse }>('/auth/register', data),
  refresh: (refreshToken: string) => client.post<unknown, { data: { accessToken: string } }>('/auth/refresh', { refreshToken }),
  logout: () => client.post('/auth/logout'),
  profile: () => client.get<unknown, { data: User }>('/auth/profile'),
};
