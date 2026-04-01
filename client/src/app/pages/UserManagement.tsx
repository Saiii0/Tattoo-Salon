import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  Avatar,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { useAppContext } from '../context/AppContext';
import type { ColumnsType } from 'antd/es/table';
import type { User, UserRole } from '../types';
import './UserManagement.css';

export const UserManagement: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (id === currentUser?.id) {
      message.error('Вы не можете удалить свой аккаунт');
      return;
    }
    deleteUser(id);
    message.success('Пользователь успешно удален');
  };

  const handleSubmit = async (values: any) => {
    if (editingUser) {
      updateUser(editingUser.id, {
        name: values.name,
        email: values.email,
        role: values.role,
      });
      message.success('Пользователь успешно обновлен');
    } else {
      const newUser: User = {
        id: Date.now().toString(),
        name: values.name,
        email: values.email,
        password: values.password || 'default123',
        role: values.role,
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        createdAt: new Date().toISOString().split('T')[0],
        ...(values.role === 'master' && { rating: 0, servicesCount: 0 }),
      };

      // Проверка на существование email
      if (users.some((u) => u.email === values.email)) {
        message.error('Пользователь с таким email уже существует');
        return;
      }

      addUser(newUser);
      message.success('Пользователь успешно добавлен');
    }
    setIsModalOpen(false);
    form.resetFields();
  };

  const getRoleTag = (role: UserRole) => {
    const roleConfig = {
      user: { color: 'default', text: 'Пользователь' },
      master: { color: 'blue', text: 'Мастер' },
      admin: { color: 'red', text: 'Администратор' },
    };
    const config = roleConfig[role];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Аватар',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string) => <Avatar src={avatar} icon={<UserOutlined />} />,
    },
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: getRoleTag,
      filters: [
        { text: 'Пользователь', value: 'user' },
        { text: 'Мастер', value: 'master' },
        { text: 'Администратор', value: 'admin' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Дата регистрации',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Изменить
          </Button>
          <Popconfirm
            title="Удалить пользователя?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
            disabled={record.id === currentUser?.id}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.id === currentUser?.id}
            >
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="user-management">
      <Card
        title="Управление пользователями"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Добавить пользователя
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Имя"
            rules={[{ required: true, message: 'Введите имя пользователя' }]}
          >
            <Input placeholder="Иван Иванов" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' },
            ]}
          >
            <Input placeholder="user@example.com" disabled={!!editingUser} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="Пароль"
              rules={[
                { required: true, message: 'Введите пароль' },
                { min: 6, message: 'Минимум 6 символов' },
              ]}
            >
              <Input.Password placeholder="Минимум 6 символов" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: 'Выберите роль' }]}
          >
            <Select placeholder="Выберите роль">
              <Select.Option value="user">Пользователь</Select.Option>
              <Select.Option value="master">Мастер</Select.Option>
              <Select.Option value="admin">Администратор</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Сохранить' : 'Добавить'}
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
