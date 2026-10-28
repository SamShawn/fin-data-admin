import { Table, Tag } from 'antd';
import { useEffect, useState } from 'react';

import { apiClient } from '../api/client';

// 定义审计日志的类型
interface AuditLogItem {
  id: string;
  createdAt: string;
  username: string;
  module: string;
  action: string;
  resourceId?: string;
  ip?: string;
}

interface AuditLogResponse {
  items: AuditLogItem[];
  total: number;
}

export default function AuditLogPage() {
  const [data, setData] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<unknown, AuditLogResponse>('/audit-logs').then((res) => {
      setData(res.items || []);
      setLoading(false);
    });
  }, []);

  const columns = [
    { title: '时间', dataIndex: 'createdAt', key: 'createdAt' },
    { title: '操作人', dataIndex: 'username', key: 'username' },
    { title: '模块', dataIndex: 'module', key: 'module' },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => <Tag color="blue">{action}</Tag>,
    },
    { title: '资源ID', dataIndex: 'resourceId', key: 'resourceId' },
    { title: 'IP', dataIndex: 'ip', key: 'ip' },
  ];

  return (
    <Table columns={columns} dataSource={data} loading={loading} rowKey="id" scroll={{ y: 600 }} />
  );
}
