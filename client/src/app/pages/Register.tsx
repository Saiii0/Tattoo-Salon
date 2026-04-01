import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router';
import { useAppContext } from '../context/AppContext';
import './Register.css';

const { Title, Text, Link } = Typography;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAppContext();
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleRegister = async (values: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    setLoading(true);
    const result = await register(values.name, values.email, values.password);
    setLoading(false);

    if (result.ok) {
      message.success('Регистрация успешна! Добро пожаловать!');
      navigate('/');
    } else {
      if (result.reason === 'exists') {
        message.error('Пользователь с таким email уже существует');
      } else {
        message.error('Ошибка регистрации. Проверьте соединение с сервером');
      }
    }
  };

  return (
    <div className="register">
      <Card className="register__card">
        <div className="register__header">
          <Title level={2} className="register__title">
            🎨 Тату Салон
          </Title>
          <Text type="secondary">Создайте новый аккаунт</Text>
        </div>

        <Form onFinish={handleRegister} layout="vertical" size="large">
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Введите ваше имя' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Имя" />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Введите корректный email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Пароль должен быть не менее 6 символов' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Пароль" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Подтвердите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Пароли не совпадают'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Подтвердите пароль" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Зарегистрироваться
            </Button>
          </Form.Item>
        </Form>

        <div className="register__footer">
          <Text>
            Уже есть аккаунт? <Link onClick={() => navigate('/login')}>Войти</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};
