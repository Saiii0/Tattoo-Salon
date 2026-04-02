import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
  message,
  Popconfirm,
  Image,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppContext } from '../context/AppContext';
import type { ColumnsType } from 'antd/es/table';
import type { Service } from '../types';
import './ManageServices.css';

const { TextArea } = Input;

export const ManageServices: React.FC = () => {
  const { services, addService, updateService, deleteService } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    setEditingService(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    form.setFieldsValue(service);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteService(id);
    message.success('Услуга успешно удалена');
  };

  const handleSubmit = async (values: any) => {
    if (editingService) {
      await updateService(editingService.id, values);
      message.success('Услуга успешно обновлена');
    } else {
      const newService: Service = {
        ...values,
        id: Date.now().toString(),
        rating: 0,
        reviewsCount: 0,
      };
      await addService(newService);
      message.success('Услуга успешно добавлена');
    }
    setIsModalOpen(false);
    form.resetFields();
  };

  const columns: ColumnsType<Service> = [
    {
      title: 'Изображение',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (url: string) => (
        <Image
          src={url}
          alt="Service"
          width={60}
          height={60}
          className="manage-services__image"
          preview={false}
        />
      ),
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Цена (₽)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => price.toLocaleString('ru-RU'),
    },
    {
      title: 'Длительность (мин)',
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: 'Рейтинг',
      dataIndex: 'rating',
      key: 'rating',
    },
    {
      title: 'Отзывов',
      dataIndex: 'reviewsCount',
      key: 'reviewsCount',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Изменить
          </Button>
          <Popconfirm
            title="Удалить услугу?"
            description="Это действие нельзя отменить"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Управление услугами"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Добавить услугу
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={services}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingService ? 'Редактировать услугу' : 'Добавить услугу'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название услуги' }]}
          >
            <Input placeholder="Например: Чёрно-белая тату" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание"
            rules={[{ required: true, message: 'Введите описание услуги' }]}
          >
            <TextArea rows={4} placeholder="Подробное описание услуги..." />
          </Form.Item>

          <Form.Item
            name="price"
            label="Цена (₽)"
            rules={[{ required: true, message: 'Введите цену' }]}
          >
            <InputNumber
              min={0}
              className="manage-services__input-number"
              placeholder="5000"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
            />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Длительность (минут)"
            rules={[{ required: true, message: 'Введите длительность' }]}
          >
            <InputNumber min={0} className="manage-services__input-number" placeholder="120" />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="URL изображения"
            rules={[
              { required: true, message: 'Введите URL изображения' },
              { type: 'url', message: 'Введите корректный URL' },
            ]}
          >
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingService ? 'Сохранить' : 'Добавить'}
              </Button>
              <Button onClick={() => setIsModalOpen(false)}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
