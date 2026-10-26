import { Card, Descriptions, Tag } from 'antd';
import { useEffect, useState } from 'react';

import { apiClient } from '../api/client';

interface HealthData {
  status: string;
  db: boolean;
  redis: boolean;
  timestamp: string;
}

export default function HomePage() {
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    apiClient
      .get('/health')
      .then((data) => setHealth(data as unknown as HealthData))
      .catch(() =>
        setHealth({ status: 'down', db: false, redis: false, timestamp: new Date().toISOString() }),
      );
  }, []);

  return (
    <Card title="系统状态">
      {health ? (
        <Descriptions column={1}>
          <Descriptions.Item label="后端状态">
            <Tag color={health.status === 'ok' ? 'green' : 'red'}>{health.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="数据库连接">
            <Tag color={health.db ? 'green' : 'red'}>{health.db ? '正常' : '异常'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Redis 连接">
            <Tag color={health.redis ? 'green' : 'red'}>{health.redis ? '正常' : '异常'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="检测时间">{health.timestamp}</Descriptions.Item>
        </Descriptions>
      ) : (
        <div>正在检测后端服务...</div>
      )}
    </Card>
  );
}
