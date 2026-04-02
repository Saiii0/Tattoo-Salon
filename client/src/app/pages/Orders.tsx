import React from 'react';
import { Card, Table, Tag, Button, Space, Avatar, message, Modal, Typography } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useAppContext } from '../context/AppContext';
import type { ColumnsType } from 'antd/es/table';
import type { Order } from '../types';
import './Orders.css';

const { Text } = Typography;

export const Orders: React.FC = () => {
  const { orders, updateOrderStatus, currentUser } = useAppContext();

  const handleApprove = async (orderId: string) => {
    if (!currentUser) return;
    await updateOrderStatus(orderId, 'approved');
    message.success('Заявка одобрена');
  };

  const handleReject = (orderId: string) => {
    Modal.confirm({
      title: 'Отклонить заявку?',
      content: 'Вы уверены, что хотите отклонить эту заявку?',
      okText: 'Да',
      cancelText: 'Нет',
      onOk: async () => {
        await updateOrderStatus(orderId, 'rejected');
        message.success('Заявка отклонена');
      },
    });
  };

  const handleComplete = (orderId: string) => {
    Modal.confirm({
      title: 'Завершить заказ?',
      content: 'Подтвердите, что работа выполнена',
      okText: 'Да',
      cancelText: 'Нет',
      onOk: async () => {
        await updateOrderStatus(orderId, 'completed');
        message.success('Заказ завершён');
      },
    });
  };

  const getStatusTag = (status: Order['status']) => {
    const statusConfig = {
      pending: { color: 'orange', text: 'Ожидает' },
      approved: { color: 'blue', text: 'Одобрено' },
      completed: { color: 'green', text: 'Завершено' },
      rejected: { color: 'red', text: 'Отклонено' },
      cancelled: { color: 'default', text: 'Отменено' },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
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
      title: 'Клиент',
      key: 'client',
      render: (_, record) => (
        <Space>
          <Avatar src={record.userAvatar} />
          {record.userName}
        </Space>
      ),
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
      render: (name: string) => name || <Text type="secondary">Не назначен</Text>,
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
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                Одобрить
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                Отклонить
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleComplete(record.id)}
            >
              Завершить
            </Button>
          )}
          {(record.status === 'completed' || record.status === 'rejected') && (
            <Tag>{record.status === 'completed' ? 'Завершено' : 'Отклонено'}</Tag>
          )}
        </Space>
      ),
    },
  ];

  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const approvedOrders = orders.filter((o) => o.status === 'approved');

  return (
    <div>
      <Card
        title="Заявки на услуги"
        extra={
          <Space wrap className="orders__summary">
            <Tag color="orange">Ожидает: {pendingOrders.length}</Tag>
            <Tag color="blue">В работе: {approvedOrders.length}</Tag>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};
