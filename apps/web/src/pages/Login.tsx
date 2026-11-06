import { UserOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { LoginRequest, LoginResponse } from '@fin/shared-types';
import { Form, Input, Button, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiClient } from '../api/client';
import { useAuthStore } from '../store/auth';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onFinish = async (values: LoginRequest) => {
    setLoading(true);
    try {
      const res = await apiClient.post<unknown, LoginResponse>('/auth/login', values);
      setAuth(res.accessToken, res.refreshToken, res.user);
      message.success('安全接入成功，欢迎回来 ' + res.user.displayName);
      navigate('/');
    } catch {
      // 错误已由 Axios 拦截器统一提示
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
        width: '100vw',
        backgroundColor: '#050505', // 极深底色
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ================= 背景动效层 ================= */}

      {/* 1. 赛博网格 (SVG) */}
      <svg
        style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.05, zIndex: 0 }}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* 2. 呼吸极光 (增强版，更亮、范围更广、动效更强) */}
      <div
        style={{
          position: 'absolute',
          width: '100vw',
          height: '100vw',
          maxWidth: 1200,
          maxHeight: 1200,
          // 👇 提高紫色光晕的不透明度，并让扩散范围更大
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.35) 0%, rgba(5, 5, 5, 0) 60%)',
          top: '-30%',
          left: '-15%',
          filter: 'blur(80px)',
          zIndex: 0,
          animation: 'pulse-glow 8s infinite alternate',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '90vw',
          height: '90vw',
          maxWidth: 1000,
          maxHeight: 1000,
          // 👇 提高青色光晕的不透明度
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(5, 5, 5, 0) 60%)',
          bottom: '-30%',
          right: '-15%',
          filter: 'blur(80px)',
          zIndex: 0,
          animation: 'pulse-glow 6s infinite alternate-reverse',
        }}
      />

      {/* 💡 额外增加一个中心向四周扩散的脉冲光环 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, rgba(5, 5, 5, 0) 70%)',
          zIndex: 0,
          animation: 'center-pulse 4s infinite alternate',
        }}
      />

      {/* 3. 底部边缘暗角 (Vignette) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 150px rgba(0,0,0,0.9)', // 四周压暗，聚焦中心
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* ================= 悬浮登录卡片 ================= */}
      <div
        style={{
          width: 420,
          padding: '48px 40px',
          background: 'rgba(20, 20, 24, 0.7)', // 高透明度面板
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)', // 顶部高光，模拟受光面
          boxShadow: '0 32px 80px -20px rgba(0, 0, 0, 0.9)',
          zIndex: 2,
          position: 'relative',
          // 让卡片出现时有平滑的升起动画
          animation: 'slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Logo 与标题 */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: '0 auto 20px auto',
              background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
              borderRadius: 16,
              boxShadow: '0 0 32px rgba(124, 58, 237, 0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 28 }}>F</span>
          </div>
          <h1
            style={{
              color: '#fff',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
              margin: 0,
              textShadow: '0 2px 10px rgba(255,255,255,0.2)',
            }}
          >
            NEBULA FIN
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: 13, marginTop: 8, letterSpacing: 1 }}>
            NEXT-GEN QUANTITATIVE TERMINAL
          </p>
        </div>

        <Form onFinish={onFinish} size="large" layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: '请输入操作员代码' }]}>
            <Input
              prefix={<UserOutlined style={{ color: '#52525b', fontSize: 16 }} />}
              placeholder="操作员代码 (admin)"
              className="cyber-input"
              style={{
                backgroundColor: 'rgba(8, 8, 10, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                height: 52,
                color: '#ededed',
                fontSize: 15,
              }}
            />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '请输入安全密钥' }]}>
            <Input.Password
              prefix={<LockOutlined style={{ color: '#52525b', fontSize: 16 }} />}
              placeholder="安全密钥 (admin123)"
              className="cyber-input"
              style={{
                backgroundColor: 'rgba(8, 8, 10, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                height: 52,
                color: '#ededed',
                fontSize: 15,
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 40, marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 52,
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: 2,
                background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
                border: 'none',
                boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              安全接入 <ArrowRightOutlined />
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            textAlign: 'center',
            marginTop: 40,
            color: '#52525b',
            fontSize: 11,
            letterSpacing: 1,
          }}
        >
          SYSTEM V1.0.0 • SECURED BY JWT & RBAC
        </div>
      </div>
    </div>
  );
}
