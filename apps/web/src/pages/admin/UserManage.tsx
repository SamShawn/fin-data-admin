import { Table, Button, Input, Modal, Form, Select, message } from 'antd';
import { useEffect, useState } from 'react';

import { apiClient } from '../../api/client';

interface Role {
  id: string;
  name: string;
}

interface UserItem {
  id: string;
  username: string;
  displayName: string;
  department?: string;
  status: number;
  roles: Role[];
}

interface UserListResponse {
  items: UserItem[];
  total: number;
}

interface RoleListResponse {
  items: Role[];
}

interface CreateUserForm {
  username: string;
  password: string;
  displayName: string;
  department?: string;
  roleIds?: string[];
}

export default function UserManage() {
  const [data, setData] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<CreateUserForm>();

  const fetchUsers = () => {
    setLoading(true);
    apiClient.get<unknown, UserListResponse>('/admin/users').then((res) => {
      setData(res.items);
      setLoading(false);
    });
  };

  const fetchRoles = () => {
    apiClient.get<unknown, RoleListResponse>('/admin/roles').then((res) => setRoles(res.items));
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const handleCreate = async (values: CreateUserForm) => {
    await apiClient.post('/admin/users', values);
    message.success('创建成功');
    setModalOpen(false);
    fetchUsers();
  };

  const columns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '姓名', dataIndex: 'displayName' },
    { title: '部门', dataIndex: 'department' },
    {
      title: '角色',
      dataIndex: 'roles',
      render: (roles: Role[]) => roles.map((r) => r.name).join(', '),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: number) => (s === 1 ? '启用' : '禁用'),
    },
  ];

  return (
    <div>
      <Button type="primary" onClick={() => setModalOpen(true)} style={{ marginBottom: 16 }}>
        新建用户
      </Button>
      <Table columns={columns} dataSource={data} loading={loading} rowKey="id" />

      <Modal
        title="新建用户"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="displayName" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Input />
          </Form.Item>
          <Form.Item name="roleIds" label="角色">
            <Select mode="multiple" options={roles.map((r) => ({ label: r.name, value: r.id }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
