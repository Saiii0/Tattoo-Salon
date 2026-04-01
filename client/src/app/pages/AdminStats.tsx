import React from 'react';
import { Card, Row, Col, Statistic, Table, Typography } from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  AppstoreOutlined,
  StarOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useAppContext } from '../context/AppContext';
import type { ColumnsType } from 'antd/es/table';
import './AdminStats.css';

const { Title } = Typography;

interface ServiceStat {
  id: string;
  name: string;
  ordersCount: number;
  revenue: number;
  rating: number;
  reviewsCount: number;
}

export const AdminStats: React.FC = () => {
  const { services, orders, reviews } = useAppContext();

  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, order) => sum + order.price, 0);

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;

  const averageRating =
    services.reduce((sum, s) => sum + s.rating, 0) / services.length;

  const totalReviews = reviews.filter((r) => !r.deleted).length;

  // Статистика по услугам
  const serviceStats: ServiceStat[] = services.map((service) => {
    const serviceOrders = orders.filter(
      (o) => o.serviceId === service.id && o.status === 'completed'
    );
    return {
      id: service.id,
      name: service.name,
      ordersCount: serviceOrders.length,
      revenue: serviceOrders.reduce((sum, o) => sum + o.price, 0),
      rating: service.rating,
      reviewsCount: service.reviewsCount,
    };
  });

  const columns: ColumnsType<ServiceStat> = [
    {
      title: 'Услуга',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Заказов',
      dataIndex: 'ordersCount',
      key: 'ordersCount',
      sorter: (a, b) => a.ordersCount - b.ordersCount,
    },
    {
      title: 'Выручка',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `${revenue.toLocaleString('ru-RU')} ₽`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
    {
      title: 'Рейтинг',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => rating.toFixed(1),
      sorter: (a, b) => a.rating - b.rating,
    },
    {
      title: 'Отзывов',
      dataIndex: 'reviewsCount',
      key: 'reviewsCount',
      sorter: (a, b) => a.reviewsCount - b.reviewsCount,
    },
  ];

  return (
    <div className="admin-stats">
      <Title level={2} className="admin-stats__title">
        Общая статистика
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Общая выручка"
              value={totalRevenue}
              prefix={<DollarOutlined />}
              suffix="₽"
              className="admin-stats__stat admin-stats__stat--revenue"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Всего услуг"
              value={services.length}
              prefix={<AppstoreOutlined />}
              className="admin-stats__stat admin-stats__stat--services"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Средний рейтинг"
              value={averageRating}
              prefix={<StarOutlined />}
              precision={1}
              suffix="/ 5"
              className="admin-stats__stat admin-stats__stat--rating"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className="admin-stats__row">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Всего заказов"
              value={totalOrders}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Выполнено"
              value={completedOrders}
              className="admin-stats__stat admin-stats__stat--completed"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="В ожидании"
              value={pendingOrders}
              className="admin-stats__stat admin-stats__stat--pending"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Отзывов"
              value={totalReviews}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Детальная статистика по услугам" className="admin-stats__card">
        <Table
          columns={columns}
          dataSource={serviceStats}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Row gutter={[24, 24]} className="admin-stats__row">
        <Col xs={24} lg={12}>
          <Card title="Топ-3 услуги по выручке">
            <Table
              columns={[
                { title: 'Услуга', dataIndex: 'name', key: 'name' },
                {
                  title: 'Выручка',
                  dataIndex: 'revenue',
                  key: 'revenue',
                  render: (revenue: number) => `${revenue.toLocaleString('ru-RU')} ₽`,
                },
              ]}
              dataSource={[...serviceStats].sort((a, b) => b.revenue - a.revenue).slice(0, 3)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Топ-3 услуги по рейтингу">
            <Table
              columns={[
                { title: 'Услуга', dataIndex: 'name', key: 'name' },
                {
                  title: 'Рейтинг',
                  dataIndex: 'rating',
                  key: 'rating',
                  render: (rating: number) => rating.toFixed(1),
                },
              ]}
              dataSource={[...serviceStats].sort((a, b) => b.rating - a.rating).slice(0, 3)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
