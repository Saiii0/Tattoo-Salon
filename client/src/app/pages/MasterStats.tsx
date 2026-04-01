import React from 'react';
import { Card, Row, Col, Statistic, Table, Typography } from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useAppContext } from '../context/AppContext';
import type { ColumnsType } from 'antd/es/table';
import './MasterStats.css';

const { Title } = Typography;

interface ServiceStat {
  serviceName: string;
  count: number;
  revenue: number;
}

export const MasterStats: React.FC = () => {
  const { orders, currentUser } = useAppContext();

  const masterOrders = orders.filter(
    (o) => o.masterId === currentUser.id || o.status === 'completed'
  );

  const completedOrders = masterOrders.filter((o) => o.status === 'completed');
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const approvedOrders = orders.filter((o) => o.status === 'approved');

  const totalRevenue = completedOrders.reduce((sum, order) => sum + order.price, 0);
  const averageOrderValue = completedOrders.length > 0 
    ? totalRevenue / completedOrders.length 
    : 0;

  // Группировка по услугам
  const serviceStats = completedOrders.reduce((acc, order) => {
    const existing = acc.find((s) => s.serviceName === order.serviceName);
    if (existing) {
      existing.count += 1;
      existing.revenue += order.price;
    } else {
      acc.push({
        serviceName: order.serviceName,
        count: 1,
        revenue: order.price,
      });
    }
    return acc;
  }, [] as ServiceStat[]);

  const columns: ColumnsType<ServiceStat> = [
    {
      title: 'Услуга',
      dataIndex: 'serviceName',
      key: 'serviceName',
    },
    {
      title: 'Количество',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    },
    {
      title: 'Выручка',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `${revenue.toLocaleString('ru-RU')} ₽`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
  ];

  return (
    <div className="master-stats">
      <Title level={2} className="master-stats__title">
        Статистика мастера
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Выполнено заказов"
              value={completedOrders.length}
              prefix={<CheckCircleOutlined />}
              className="master-stats__stat master-stats__stat--completed"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Заработано"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              suffix="₽"
              className="master-stats__stat master-stats__stat--revenue"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="В ожидании"
              value={pendingOrders.length}
              prefix={<ClockCircleOutlined />}
              className="master-stats__stat master-stats__stat--pending"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Средний чек"
              value={averageOrderValue}
              prefix={<StarOutlined />}
              suffix="₽"
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Статистика по услугам" className="master-stats__card">
        <Table
          columns={columns}
          dataSource={serviceStats}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Row gutter={[24, 24]} className="master-stats__row">
        <Col xs={24} lg={12}>
          <Card title="Статус заявок">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Ожидают"
                  value={pendingOrders.length}
                  className="master-stats__stat master-stats__stat--pending"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="В работе"
                  value={approvedOrders.length}
                  className="master-stats__stat master-stats__stat--in-progress"
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Рейтинг">
            <Statistic
              title="Средняя оценка"
              value={currentUser.rating || 0}
              suffix="/ 5"
              precision={1}
              className="master-stats__stat master-stats__stat--rating"
            />
            <div className="master-stats__summary">
              Всего выполнено услуг: {currentUser.servicesCount}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
