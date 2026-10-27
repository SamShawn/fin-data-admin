import { message } from 'antd';
import axios from 'axios';

import { useAuthStore } from '../store/auth';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

// 请求拦截器
apiClient.interceptors.request.use((config) => {
  config.headers['X-Request-Id'] = crypto.randomUUID();

  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 假设后端统一返回 { code, message, data, requestId }
    // 这里直接解包 data 字段，让业务层拿到的就是纯数据
    const res = response.data;
    if (res.code && res.code !== 0 && res.code !== 200) {
      message.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message));
    }
    return res.data !== undefined ? res.data : res;
  },
  async (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message || error.message || '网络错误';

    // 在响应拦截器的 401 分支中
    if (status === 401) {
      // 如果没 refreshToken 或者是登录接口本身报错，直接踢出
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken || error.config.url.includes('/auth/login')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // 尝试刷新 Token
        const res = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken: newAccess, refreshToken: newRefresh, user } = res.data.data;
        useAuthStore.getState().setAuth(newAccess, newRefresh, user);

        // 重新发送原请求
        error.config.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient.request(error.config);
      } catch (refreshErr) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    } else if (status === 403) {
      message.error('无权限执行此操作');
    } else {
      message.error(msg);
    }
    return Promise.reject(error);
  },
);
