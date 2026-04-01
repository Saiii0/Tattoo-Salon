import React, { useState } from 'react';
import {
  Card,
  Avatar,
  Descriptions,
  Typography,
  Rate,
  Space,
  Tag,
  Button,
  Upload,
  message,
  Modal,
} from 'antd';
import { UserOutlined, StarOutlined, CheckCircleOutlined, CameraOutlined } from '@ant-design/icons';
import { useAppContext } from '../context/AppContext';
import type { UploadFile } from 'antd/es/upload/interface';
import './Profile.css';

const { Title } = Typography;

export const Profile: React.FC = () => {
  const { currentUser, updateUser } = useAppContext();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  if (!currentUser) {
    return null;
  }

  const getRoleName = () => {
    switch (currentUser.role) {
      case 'master':
        return 'Тату-мастер';
      case 'admin':
        return 'Администратор';
      default:
        return 'Пользователь';
    }
  };

  const getRoleColor = () => {
    switch (currentUser.role) {
      case 'master':
        return 'blue';
      case 'admin':
        return 'red';
      default:
        return 'default';
    }
  };

  const handleAvatarChange = (newAvatarUrl: string) => {
    updateUser(currentUser.id, { avatar: newAvatarUrl });
    message.success('Фото профиля обновлено!');
    setIsUploadModalOpen(false);
  };

  // Генерация случайного аватара
  const generateRandomAvatar = () => {
    const randomNum = Math.floor(Math.random() * 70) + 1;
    const newAvatar = `https://i.pravatar.cc/150?img=${randomNum}`;
    handleAvatarChange(newAvatar);
  };

  return (
    <div>
      <Card>
        <div className="profile__header">
          <div className="profile__avatar-panel">
            <Avatar size={160} src={currentUser.avatar} icon={<UserOutlined />} />
            <Button
              type="primary"
              icon={<CameraOutlined />}
              className="profile__change-photo"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Изменить фото
            </Button>
          </div>

          <div className="profile__info">
            <div className="profile__info-header">
              <Title level={2} className="profile__name">
                {currentUser.name}
              </Title>
              <Tag color={getRoleColor()} className="profile__role-tag">
                {getRoleName()}
              </Tag>
            </div>

            <Descriptions column={1} bordered>
              <Descriptions.Item label="Email">{currentUser.email}</Descriptions.Item>
              <Descriptions.Item label="Дата регистрации">
                {currentUser.createdAt}
              </Descriptions.Item>
              {currentUser.role === 'master' && (
                <>
                  <Descriptions.Item
                    label={
                      <Space>
                        <StarOutlined />
                        Рейтинг
                      </Space>
                    }
                  >
                    <Space>
                      <Rate disabled defaultValue={currentUser.rating} allowHalf />
                      <span>{currentUser.rating}</span>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <Space>
                        <CheckCircleOutlined />
                        Выполнено услуг
                      </Space>
                    }
                  >
                    {currentUser.servicesCount}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </div>
        </div>
      </Card>

      {/* Модальное окно для изменения фото */}
      <Modal
        title="Изменить фото профиля"
        open={isUploadModalOpen}
        onCancel={() => setIsUploadModalOpen(false)}
        footer={null}
        width={400}
      >
        <div className="profile__modal-content">
          <Avatar
            size={120}
            src={currentUser.avatar}
            icon={<UserOutlined />}
            className="profile__modal-avatar"
          />

          <div className="profile__modal-action">
            <Button
              type="primary"
              size="large"
              block
              onClick={generateRandomAvatar}
              icon={<CameraOutlined />}
            >
              Сгенерировать случайное фото
            </Button>
          </div>

          <div className="profile__modal-note">
            <p className="profile__modal-note-text">
              💡 Для демонстрации используется генерация случайных аватаров. В продакшн версии
              здесь будет загрузка собственных фотографий.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
