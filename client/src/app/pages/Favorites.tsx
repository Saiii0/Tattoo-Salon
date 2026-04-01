import React from 'react';
import { Card, Row, Col, Rate, Typography, Empty } from 'antd';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import './Favorites.css';

const { Title, Text } = Typography;
const { Meta } = Card;

export const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { services, favorites } = useAppContext();

  const favoriteServices = services.filter((s) => favorites.includes(s.id));

  if (favoriteServices.length === 0) {
    return (
      <div className="favorites">
        <Title level={2} className="favorites__title">
          Избранное
        </Title>
        <Card>
          <Empty description="У вас пока нет избранных услуг" />
        </Card>
      </div>
    );
  }

  return (
    <div className="favorites">
      <Title level={2} className="favorites__title">
        Избранное
      </Title>
      <Row gutter={[24, 24]}>
        {favoriteServices.map((service) => (
          <Col key={service.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              cover={
                <img
                  alt={service.name}
                  src={service.imageUrl}
                  className="favorites__service-image"
                />
              }
              onClick={() => navigate(`/service/${service.id}`)}
            >
              <Meta
                title={service.name}
                description={
                  <div className="favorites__service-meta">
                    <Rate
                      disabled
                      defaultValue={service.rating}
                      allowHalf
                      className="favorites__rating"
                    />
                    <div className="favorites__price">
                      <Text strong className="favorites__price-text">
                        {service.price.toLocaleString('ru-RU')} ₽
                      </Text>
                    </div>
                    <Text type="secondary" className="favorites__reviews-text">
                      {service.reviewsCount} отзывов
                    </Text>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};
