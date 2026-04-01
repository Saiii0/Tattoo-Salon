import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Badge, Button, Drawer } from 'antd';
import {
  HomeOutlined,
  HeartOutlined,
  UserOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LogoutOutlined,
  TeamOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAppContext } from '../context/AppContext';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = AntLayout;

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAppContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Мой профиль',
      icon: <UserOutlined />,
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      label: 'Выйти',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: 'Главная',
      },
      {
        key: '/favorites',
        icon: <HeartOutlined />,
        label: 'Избранное',
      },
    ];

    // Добавляем "Мои заказы" для обычных пользователей
    if (currentUser?.role === 'user') {
      baseItems.push({
        key: '/my-orders',
        icon: <FileTextOutlined />,
        label: 'Мои заказы',
      });
    }

    if (currentUser?.role === 'admin') {
      baseItems.push(
        {
          key: '/manage-services',
          icon: <AppstoreOutlined />,
          label: 'Управление услугами',
        },
        {
          key: '/user-management',
          icon: <TeamOutlined />,
          label: 'Управление пользователями',
        },
        {
          key: '/admin-stats',
          icon: <BarChartOutlined />,
          label: 'Статистика',
        }
      );
    }

    if (currentUser?.role === 'master') {
      baseItems.push(
        {
          key: '/orders',
          icon: <FileTextOutlined />,
          label: 'Заявки',
        },
        {
          key: '/master-stats',
          icon: <BarChartOutlined />,
          label: 'Статистика',
        }
      );
    }

    return baseItems;
  };

  const getRoleBadge = () => {
    if (currentUser?.role === 'master') return { text: 'Мастер', color: '#1890ff' };
    if (currentUser?.role === 'admin') return { text: 'Администратор', color: '#f5222d' };
    return null;
  };

  const roleBadge = getRoleBadge();

  const menuContent = (
    <>
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          fontSize: '20px',
          fontWeight: 'bold',
        }}
      >
        🎨 Тату Салон
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={getMenuItems()}
        onClick={({ key }) => {
          navigate(key);
          setMobileMenuOpen(false);
        }}
        style={{ borderRight: 0, paddingTop: '16px' }}
      />
    </>
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider width={280} style={{ background: '#fff', borderRight: '1px solid #f0f0f0' }}>
          {menuContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          styles={{ body: { padding: 0 } }}
          size="default"
        >
          {menuContent}
        </Drawer>
      )}

      <AntLayout>
        <Header
          style={{
            padding: isMobile ? '0 16px' : '0 24px',
            background: '#fff',
            display: 'flex',
            justifyContent: isMobile ? 'space-between' : 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
            height: '64px',
          }}
        >
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              style={{ fontSize: '20px' }}
            />
          )}

          {/* Mobile Logo */}
          {isMobile && (
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              🎨 Тату
            </div>
          )}

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: isMobile ? '8px' : '12px',
                height: '100%',
              }}
            >
              {!isMobile && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, lineHeight: '20px' }}>
                    {currentUser?.name}
                  </div>
                  {roleBadge && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: roleBadge.color,
                        fontWeight: 500,
                        lineHeight: '16px',
                      }}
                    >
                      {roleBadge.text}
                    </div>
                  )}
                </div>
              )}
              <Avatar size={40} src={currentUser?.avatar} icon={<UserOutlined />} />
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            padding: isMobile ? '16px' : '24px',
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
