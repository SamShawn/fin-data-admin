import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { LoginRequest, LoginResponse } from '@fin/shared-types';
import { Form, Input, Button, Card, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../api/client';
import { useAuthStore } from '../store/auth';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // 使用 shared-types 中定义的类型
  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const res = await apiClient.post<unknown, LoginResponse>('/auth/login', values);
      setAuth(res.accessToken, res.refreshToken, res.user);
      message.success('登录成功');
      navigate('/');
    } catch {
      // 错误已由 axios 拦截器统一处理，这里静默捕获，无需打印
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f2f5',
      }}
    >
      <Card title="Fin Data Admin 登录" style={{ width: 400 }}>
        <Form onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名 (admin)" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码 (admin123)" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
