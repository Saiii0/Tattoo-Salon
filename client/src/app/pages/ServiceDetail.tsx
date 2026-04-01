import React, { useState } from 'react';
import {
  Card,
  Typography,
  Rate,
  Button,
  Descriptions,
  List,
  Avatar,
  Space,
  Modal,
  Form,
  Input,
  message,
  Divider,
  Tag,
  DatePicker,
  Radio,
  Alert,
} from 'antd';
import {
  HeartOutlined,
  HeartFilled,
  LikeOutlined,
  DislikeOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import { clientHistory } from '../data/mockData';
import dayjs, { Dayjs } from 'dayjs';
import './ServiceDetail.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    services,
    reviews,
    favorites,
    toggleFavorite,
    addReview,
    deleteReview,
    likeReview,
    dislikeReview,
    currentUser,
    addOrder,
    getAvailableTimeSlots,
  } = useAppContext();

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reviewForm] = Form.useForm();

  const service = services.find((s) => s.id === id);
  const serviceReviews = reviews.filter((r) => r.serviceId === id);
  const serviceHistory = clientHistory.filter((h) => h.serviceId === id);
  const isFavorite = favorites.includes(id || '');

  // Проверяем, есть ли у пользователя завершенный заказ этой услуги без отзыва
  const canLeaveReview = () => {
    if (!currentUser || currentUser.role !== 'user') return false;

    const userCompletedOrders = orders.filter(
      (o) => o.userId === currentUser.id && o.serviceId === id && o.status === 'completed'
    );

    // Пользователь может оставить отзыв, если есть хотя бы один завершенный заказ без отзыва
    return userCompletedOrders.some((o) => !o.hasReview);
  };

  if (!service) {
    return (
      <Card>
        <Title level={3}>Услуга не найдена</Title>
        <Button onClick={() => navigate('/')}>Вернуться на главную</Button>
      </Card>
    );
  }

  const handleAddReview = async (values: any) => {
    if (!currentUser) return;

    const newReview = {
      id: Date.now().toString(),
      serviceId: service.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      rating: values.rating,
      comment: values.comment,
      likes: 0,
      dislikes: 0,
      date: new Date().toISOString().split('T')[0],
    };

    addReview(newReview);
    message.success('Отзыв успешно добавлен!');
    setIsReviewModalOpen(false);
    reviewForm.resetFields();
  };

  const handleOrder = () => {
    if (!currentUser || !selectedDate || !selectedTime) {
      message.error('Выберите дату и время записи');
      return;
    }

    const newOrder = {
      id: Date.now().toString(),
      serviceId: service.id,
      serviceName: service.name,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      status: 'pending' as const,
      date: selectedDate.format('YYYY-MM-DD'),
      timeSlot: selectedTime,
      price: service.price,
    };

    addOrder(newOrder);
    message.success('Заявка успешно отправлена! Мастер свяжется с вами в ближайшее время.');
    setIsOrderModalOpen(false);
    setSelectedDate(null);
    setSelectedTime('');
  };

  const timeSlots = selectedDate
    ? getAvailableTimeSlots(selectedDate.format('YYYY-MM-DD'), service.duration)
    : [];

  const disabledDate = (current: Dayjs) => {
    // Запрет на выбор прошлых дат
    return current && current < dayjs().startOf('day');
  };

  return (
    <div className="service-detail">
      <Button onClick={() => navigate(-1)} className="service-detail__back">
        ← Назад
      </Button>

      <Card className="service-detail__card">
        <div className="service-detail__hero">
          <div className="service-detail__image-wrap">
            <img
              src={service.imageUrl}
              alt={service.name}
              className="service-detail__image"
            />
          </div>

          <div className="service-detail__info">
            <div className="service-detail__header">
              <Title level={2} className="service-detail__title">{service.name}</Title>
              <Button
                type={isFavorite ? 'primary' : 'default'}
                icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
                onClick={() => toggleFavorite(service.id)}
              >
                {isFavorite ? 'В избранном' : 'В избранное'}
              </Button>
            </div>

            <div className="service-detail__rating">
              <Rate disabled defaultValue={service.rating} allowHalf />
              <Text type="secondary" className="service-detail__rating-text">
                {service.rating} ({service.reviewsCount} отзывов)
              </Text>
            </div>

            <Paragraph>{service.description}</Paragraph>

            <Descriptions column={1} className="service-detail__description-list">
              <Descriptions.Item
                label={
                  <span>
                    <DollarOutlined /> Цена
                  </span>
                }
              >
                <Text strong className="service-detail__price">
                  {service.price.toLocaleString('ru-RU')} ₽
                </Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span>
                    <ClockCircleOutlined /> Длительность
                  </span>
                }
              >
                {service.duration} минут ({(service.duration / 60).toFixed(1)} часа)
              </Descriptions.Item>
            </Descriptions>

            <Button
              type="primary"
              size="large"
              block
              className="service-detail__order-button"
              onClick={() => setIsOrderModalOpen(true)}
              disabled={currentUser?.role === 'master' || currentUser?.role === 'admin'}
            >
              {currentUser?.role === 'master' || currentUser?.role === 'admin'
                ? 'Недоступно для вашей роли'
                : 'Записаться'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="service-detail__card service-detail__card--spaced" title="История клиентов">
        {serviceHistory.length === 0 ? (
          <Text type="secondary">Пока нет истории клиентов</Text>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={serviceHistory}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar src={item.userAvatar} />}
                  title={item.userName}
                  description={
                    <Space>
                      <Text type="secondary">{item.date}</Text>
                      <Rate
                        disabled
                        defaultValue={item.rating}
                        className="service-detail__rating-small"
                      />
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Card
        className="service-detail__card service-detail__card--spaced"
        title="Отзывы"
        extra={
          <Button type="primary" onClick={() => setIsReviewModalOpen(true)}>
            Оставить отзыв
          </Button>
        }
      >
        {serviceReviews.length === 0 ? (
          <Text type="secondary">Пока нет отзывов. Будьте первым!</Text>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={serviceReviews}
            renderItem={(review) => (
              <List.Item
                actions={
                  review.deleted
                    ? []
                    : [
                        <Space key="like">
                          <Button
                            type="text"
                            icon={<LikeOutlined />}
                            onClick={() => likeReview(review.id)}
                          >
                            {review.likes}
                          </Button>
                        </Space>,
                        <Space key="dislike">
                          <Button
                            type="text"
                            icon={<DislikeOutlined />}
                            onClick={() => dislikeReview(review.id)}
                          >
                            {review.dislikes}
                          </Button>
                        </Space>,
                        currentUser?.role === 'admin' ? (
                          <Button
                            key="delete"
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              Modal.confirm({
                                title: 'Удалить отзыв?',
                                content: 'Это действие нельзя отменить',
                                okText: 'Удалить',
                                cancelText: 'Отмена',
                                onOk: () => deleteReview(review.id),
                              });
                            }}
                          >
                            Удалить
                          </Button>
                        ) : null,
                      ]
                }
              >
                <List.Item.Meta
                  avatar={<Avatar src={review.userAvatar} />}
                  title={
                    <Space>
                      {review.deleted ? 'Удалённый пользователь' : review.userName}
                      {review.deleted && <Tag color="red">Удалено</Tag>}
                    </Space>
                  }
                  description={
                    <Space>
                      <Rate
                        disabled
                        defaultValue={review.rating}
                        className="service-detail__rating-small"
                      />
                      <Text type="secondary">{review.date}</Text>
                    </Space>
                  }
                />
                <div className="service-detail__review-comment">
                  <Text type={review.deleted ? 'secondary' : undefined} italic={review.deleted}>
                    {review.comment}
                  </Text>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Модальное окно для добавления отзыва */}
      <Modal
        title="Оставить отзыв"
        open={isReviewModalOpen}
        onCancel={() => {
          setIsReviewModalOpen(false);
          reviewForm.resetFields();
        }}
        footer={null}
      >
        <Form form={reviewForm} onFinish={handleAddReview} layout="vertical">
          <Form.Item
            name="rating"
            label="Оценка"
            rules={[{ required: true, message: 'Пожалуйста, поставьте оценку' }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="comment"
            label="Комментарий"
            rules={[{ required: true, message: 'Пожалуйста, напишите комментарий' }]}
          >
            <TextArea rows={4} placeholder="Поделитесь своими впечатлениями..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Отправить
              </Button>
              <Button onClick={() => setIsReviewModalOpen(false)}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Модальное окно для записи с выбором времени */}
      <Modal
        title="Записаться на услугу"
        open={isOrderModalOpen}
        onOk={handleOrder}
        onCancel={() => {
          setIsOrderModalOpen(false);
          setSelectedDate(null);
          setSelectedTime('');
        }}
        okText="Подтвердить запись"
        cancelText="Отмена"
        okButtonProps={{ disabled: !selectedDate || !selectedTime }}
        width="min(600px, 90vw)"
      >
        <Divider />
        <Descriptions column={1}>
          <Descriptions.Item label="Услуга">{service.name}</Descriptions.Item>
          <Descriptions.Item label="Цена">
            {service.price.toLocaleString('ru-RU')} ₽
          </Descriptions.Item>
          <Descriptions.Item label="Длительность">
            {service.duration} минут ({(service.duration / 60).toFixed(1)} часа)
          </Descriptions.Item>
        </Descriptions>
        <Divider />

        <Form layout="vertical">
          <Form.Item label="Выберите дату" required>
            <DatePicker
              className="service-detail__date-picker"
              format="DD.MM.YYYY"
              placeholder="Выберите дату"
              disabledDate={disabledDate}
              value={selectedDate}
              onChange={(date) => {
                setSelectedDate(date);
                setSelectedTime(''); // Сбрасываем время при смене даты
              }}
            />
          </Form.Item>

          {selectedDate && (
            <Form.Item label="Выберите время" required>
              <Alert
                title="Доступные временные слоты"
                description="Свободные слоты отображаются синим цветом, занятые — серым. Один мастер может принимать заказы на максимум 10 часов в день."
                type="info"
                showIcon
                className="service-detail__time-alert"
              />
              <Radio.Group
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="service-detail__time-group"
              >
                <Space orientation="vertical" className="service-detail__time-list">
                  <div className="service-detail__time-grid">
                    {timeSlots.map((slot) => (
                      <Radio.Button
                        key={slot.time}
                        value={slot.time}
                        disabled={!slot.available}
                        className={
                          slot.available
                            ? 'service-detail__time-slot'
                            : 'service-detail__time-slot service-detail__time-slot--unavailable'
                        }
                      >
                        {slot.time}
                      </Radio.Button>
                    ))}
                  </div>
                </Space>
              </Radio.Group>
            </Form.Item>
          )}
        </Form>

        {selectedDate && selectedTime && (
          <>
            <Divider />
            <Alert
              title={`Вы выбрали: ${selectedDate.format('DD.MM.YYYY')} в ${selectedTime}`}
              type="success"
              showIcon
            />
          </>
        )}
      </Modal>
    </div>
  );
};
