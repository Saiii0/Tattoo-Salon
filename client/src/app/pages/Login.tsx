import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import './Login.css';

const { Title, Text, Link } = Typography;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAppContext();
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    const result = await login(values.email, values.password);
    setLoading(false);

    if (result.ok) {
      message.success('Вход выполнен успешно!');
      navigate('/');
    } else {
      if (result.reason === 'invalid') {
        message.error('Неверный email или пароль');
      } else {
        message.error('Ошибка входа. Проверьте соединение с сервером');
      }
    }
  };

  return (
    <div className="login">
      <Card className="login__card">
        <div className="login__header">
          <Title level={2} className="login__title">
            🎨 Тату Салон
          </Title>
          <Text type="secondary">Войдите в свой аккаунт</Text>
        </div>

        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Войти
            </Button>
          </Form.Item>
        </Form>

        <div className="login__footer">
          <Text>
            Нет аккаунта?{' '}
            <Link onClick={() => navigate('/register')}>Зарегистрироваться</Link>
          </Text>
        </div>

        <div className="login__test-accounts">
          <Text strong className="login__test-accounts-title">
            Тестовые аккаунты:
          </Text>
          <Space orientation="vertical" size="small" className="login__test-accounts-list">
            <Text className="login__test-accounts-item">
              <strong>Пользователь:</strong> user@example.com / user123
            </Text>
            <Text className="login__test-accounts-item">
              <strong>Мастер:</strong> master@example.com / master123
            </Text>
            <Text className="login__test-accounts-item">
              <strong>Админ:</strong> admin@example.com / admin123
            </Text>
          </Space>
        </div>
      </Card>
    </div>
  );
};
