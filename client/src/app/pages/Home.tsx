import React from 'react';
import { Card, Row, Col, Rate, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import './Home.css';

const { Title, Text } = Typography;
const { Meta } = Card;

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { services } = useAppContext();

  return (
    <div className="home">
      <Title level={2} className="home__title">
        Наши услуги
      </Title>
      <Row gutter={[24, 24]}>
        {services.map((service) => (
          <Col key={service.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              cover={
                <img
                  alt={service.name}
                  src={service.imageUrl}
                  className="home__service-image"
                />
              }
              onClick={() => navigate(`/service/${service.id}`)}
            >
              <Meta
                title={service.name}
                description={
                  <div className="home__service-meta">
                    <Rate
                      disabled
                      defaultValue={service.rating}
                      allowHalf
                      className="home__rating"
                    />
                    <div className="home__price">
                      <Text strong className="home__price-text">
                        {service.price.toLocaleString('ru-RU')} ₽
                      </Text>
                    </div>
                    <Text type="secondary" className="home__reviews-text">
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
