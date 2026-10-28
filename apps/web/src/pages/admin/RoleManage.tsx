import { Table, Button, Modal, Tree, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useEffect, useState } from 'react';

import { apiClient } from '../../api/client';

interface Permission {
  id: string;
  name: string;
  code: string;
  module: string;
}

interface RoleItem {
  id: string;
  name: string;
  code: string;
  dataScope: string;
  permissions: Permission[];
}

interface RoleListResponse {
  items: RoleItem[];
}

interface PermissionListResponse {
  items: Permission[];
}

export default function RoleManage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleItem | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const fetchData = async () => {
    const r = await apiClient.get<unknown, RoleListResponse>('/admin/roles');
    setRoles(r.items);
    const p = await apiClient.get<unknown, PermissionListResponse>('/admin/roles/permissions');
    setPermissions(p.items);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 构建权限树
  const treeData: DataNode[] = Array.from(new Set(permissions.map((p) => p.module))).map(
    (module) => ({
      title: module,
      key: module,
      children: permissions
        .filter((p) => p.module === module)
        .map((p) => ({
          title: `${p.name} (${p.code})`,
          key: p.id,
        })),
    }),
  );

  const handleEditPermissions = (role: RoleItem) => {
    setCurrentRole(role);
    setCheckedKeys(role.permissions?.map((p) => p.id) || []);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentRole) return;
    // 过滤掉模块的 key，只保留具体权限的 id
    const permIds = checkedKeys.filter((key) => !permissions.find((p) => p.module === key));
    await apiClient.put(`/admin/roles/${currentRole.id}/permissions`, { permissionIds: permIds });
    message.success('权限已更新');
    setModalOpen(false);
    fetchData();
  };

  const columns = [
    { title: '角色名', dataIndex: 'name' },
    { title: '角色代码', dataIndex: 'code' },
    { title: '数据范围', dataIndex: 'dataScope' },
    {
      title: '操作',
      render: (_: unknown, record: RoleItem) => (
        <Button type="link" onClick={() => handleEditPermissions(record)}>
          分配权限
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Table columns={columns} dataSource={roles} rowKey="id" />
      <Modal
        title={`分配权限 - ${currentRole?.name || ''}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
      >
        <Tree
          checkable
          treeData={treeData}
          checkedKeys={checkedKeys}
          onCheck={(keys) => {
            // antd 的 onCheck 返回的 keys 可能是数组或对象，这里做下兼容处理
            setCheckedKeys(Array.isArray(keys) ? (keys as string[]) : (keys.checked as string[]));
          }}
        />
      </Modal>
    </div>
  );
}
