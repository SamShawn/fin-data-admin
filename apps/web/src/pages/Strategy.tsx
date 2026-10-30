import { Table, Button, Modal, Form, Input, message, Space } from 'antd';
import { useEffect, useState } from 'react';

import { apiClient } from '../api/client';

interface StrategyItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  params: Record<string, unknown>;
  status: number;
}

export default function StrategyPage() {
  const [data, setData] = useState<StrategyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    apiClient
      .get<unknown, { items: StrategyItem[] }>('/strategies')
      .then((res) => setData(res.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (values: {
    name: string;
    code: string;
    description?: string;
    params?: string;
  }) => {
    const payload = {
      ...values,
      params: values.params ? JSON.parse(values.params) : {},
    };

    if (editingId) {
      await apiClient.put(`/strategies/${editingId}`, payload);
    } else {
      await apiClient.post('/strategies', payload);
    }

    message.success('保存成功');
    setModalOpen(false);
    fetchData();
  };

  const columns = [
    { title: '策略名称', dataIndex: 'name' },
    { title: '策略代码', dataIndex: 'code' },
    { title: '描述', dataIndex: 'description' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: number) => (s === 1 ? '启用' : '停用'),
    },
    {
      title: '操作',
      render: (_: unknown, record: StrategyItem) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditingId(record.id);
              form.setFieldsValue({
                ...record,
                params: JSON.stringify(record.params, null, 2),
              });
              setModalOpen(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            onClick={async () => {
              await apiClient.delete(`/strategies/${record.id}`);
              message.success('删除成功');
              fetchData();
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Button
        type="primary"
        onClick={() => {
          setEditingId(null);
          form.resetFields();
          setModalOpen(true);
        }}
        style={{ marginBottom: 16 }}
      >
        新建策略
      </Button>
      <Table columns={columns} dataSource={data} loading={loading} rowKey="id" />

      <Modal
        title={editingId ? '编辑策略' : '新建策略'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item name="name" label="策略名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="策略代码" rules={[{ required: true }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="params" label="参数 (JSON 格式)">
            <Input.TextArea rows={6} placeholder='{"fastMA": 5, "slowMA": 20}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
