import React, { useState } from 'react';
import { Card, Table, Tag, Button, Space, Avatar, Modal, message } from 'antd';
import { EyeOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router';
import type { ColumnsType } from 'antd/es/table';
import type { Order } from '../types';
import './MyOrders.css';

export const MyOrders: React.FC = () => {
  const { orders, currentUser, updateOrder } = useAppContext();
  const navigate = useNavigate();

  // Фильтруем заказы только текущего пользователя
  const myOrders = orders.filter((order) => order.userId === currentUser?.id);

  const getStatusTag = (status: Order['status']) => {
    const statusConfig = {
      pending: { color: 'orange', text: 'Ожидает подтверждения' },
      approved: { color: 'blue', text: 'Одобрено' },
      completed: { color: 'green', text: 'Завершено' },
      rejected: { color: 'red', text: 'Отклонено' },
      cancelled: { color: 'default', text: 'Отменено' },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const handleCancelOrder = (order: Order) => {
    Modal.confirm({
      title: 'Отменить заказ?',
      content: 'Вы уверены, что хотите отменить этот заказ?',
      okText: 'Да, отменить',
      cancelText: 'Нет',
      okType: 'danger',
      onOk: async () => {
        await updateOrder(order.id, { status: 'cancelled' });
        message.success('Заказ успешно отменен');
      },
    });
  };

  const columns: ColumnsType<Order> = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Время',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
      render: (time: string) => <Tag>{time}</Tag>,
    },
    {
      title: 'Услуга',
      dataIndex: 'serviceName',
      key: 'serviceName',
    },
    {
      title: 'Стоимость',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price.toLocaleString('ru-RU')} ₽`,
    },
    {
      title: 'Мастер',
      dataIndex: 'masterName',
      key: 'masterName',
      render: (name: string, record) =>
        name ? (
          <Space>
            <Avatar src={record.masterAvatar} />
            {name}
          </Space>
        ) : (
          <Tag color="default">Не назначен</Tag>
        ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
      filters: [
        { text: 'Ожидает', value: 'pending' },
        { text: 'Одобрено', value: 'approved' },
        { text: 'Завершено', value: 'completed' },
        { text: 'Отклонено', value: 'rejected' },
        { text: 'Отменено', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/service/${record.serviceId}`)}
          >
            Посмотреть услугу
          </Button>
          {record.status === 'pending' && (
            <Button
              type="primary"
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleCancelOrder(record)}
            >
              Отменить заказ
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const pendingCount = myOrders.filter((o) => o.status === 'pending').length;
  const approvedCount = myOrders.filter((o) => o.status === 'approved').length;
  const completedCount = myOrders.filter((o) => o.status === 'completed').length;
  const cancelledCount = myOrders.filter((o) => o.status === 'cancelled').length;

  return (
    <div>
      <Card
        title="Мои заказы"
        extra={
          <Space wrap className="my-orders__summary">
            <Tag color="orange">Ожидает: {pendingCount}</Tag>
            <Tag color="blue">Одобрено: {approvedCount}</Tag>
            <Tag color="green">Завершено: {completedCount}</Tag>
            <Tag color="default">Отменено: {cancelledCount}</Tag>
          </Space>
        }
      >
        {myOrders.length === 0 ? (
          <div className="my-orders__empty">
            <p>У вас пока нет заказов</p>
            <Button type="primary" onClick={() => navigate('/')}>
              Посмотреть услуги
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={myOrders}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>
    </div>
  );
};
