 import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { UserRole, Service, Review, Order, User } from '../types';
import {
  users as initialUsers,
  services as initialServices,
  reviews as initialReviews,
  orders as initialOrders,
  favoriteServices as initialFavorites,
} from '../data/mockData';

interface AppContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; reason?: 'invalid' | 'error' }>;
  logout: () => void;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ ok: boolean; reason?: 'exists' | 'error' }>;
  users: User[];
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  services: Service[];
  addService: (service: Service) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  reviews: Review[];
  addReview: (review: Review) => void;
  deleteReview: (id: string) => void;
  likeReview: (id: string) => void;
  dislikeReview: (id: string) => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updatedData: Partial<Order>) => void;
  updateOrderStatus: (id: string, status: Order['status'], masterId?: string, masterName?: string, masterAvatar?: string) => void;
  favorites: string[];
  toggleFavorite: (serviceId: string) => void;
  getAvailableTimeSlots: (date: string, serviceDuration: number) => { time: string; available: boolean }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);

  // Проверка сохраненной сессии при загрузке
  useEffect(() => {
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId) {
      const user = users.find((u) => u.id === savedUserId);
      if (user) {
        setCurrentUser(user);
      }
    }
  }, [users]);

  const login = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; reason?: 'invalid' | 'error' }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 401) {
        return { ok: false, reason: 'invalid' };
      }

      if (!response.ok) {
        return { ok: false, reason: 'error' };
      }

      const dbUser = await response.json();

      const existing = users.find((u) => u.email === email);
      const mergedUser: User = existing
        ? { ...existing, role: dbUser.role }
        : {
            id: String(dbUser.id ?? Date.now()),
            name: email.split('@')[0],
            email,
            password,
            role: dbUser.role || 'user',
            avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
            createdAt:
              typeof dbUser.created_at === 'string'
                ? dbUser.created_at.split('T')[0]
                : new Date().toISOString().split('T')[0],
          };

      if (!existing) {
        setUsers((prev) => [...prev, mergedUser]);
      }

      setCurrentUser(mergedUser);
      localStorage.setItem('currentUserId', mergedUser.id);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'error' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUserId');
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ ok: boolean; reason?: 'exists' | 'error' }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password_hash: password }),
      });

      if (response.status === 409) {
        return { ok: false, reason: 'exists' };
      }

      if (!response.ok) {
        return { ok: false, reason: 'error' };
      }

      const created = await response.json();
      const newUser: User = {
        id: String(created.id ?? Date.now()),
        name,
        email,
        password,
        role: 'user', // По умолчанию роль пользователя
        avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        createdAt:
          typeof created.created_at === 'string'
            ? created.created_at.split('T')[0]
            : new Date().toISOString().split('T')[0],
      };

      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      localStorage.setItem('currentUserId', newUser.id);
      return { ok: true };
    } catch {
      return { ok: false, reason: 'error' };
    }
  };

  const addUser = (user: User) => {
    setUsers([...users, user]);
  };

  const updateUser = (id: string, updatedData: Partial<User>) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, ...updatedData } : u)));
    if (currentUser?.id === id) {
      setCurrentUser({ ...currentUser, ...updatedData });
      // Обновляем также localStorage для сохранения изменений
      localStorage.setItem('currentUserId', id);
    }
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const addService = (service: Service) => {
    setServices([...services, service]);
  };

  const updateService = (id: string, updatedData: Partial<Service>) => {
    setServices(services.map((s) => (s.id === id ? { ...s, ...updatedData } : s)));
  };

  const deleteService = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  const addReview = (review: Review) => {
    setReviews([review, ...reviews]);
    
    // Обновляем рейтинг и количество отзывов услуги
    const serviceReviews = [...reviews, review].filter(
      (r) => r.serviceId === review.serviceId && !r.deleted
    );
    const avgRating =
      serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length;
    updateService(review.serviceId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewsCount: serviceReviews.length,
    });
  };

  const deleteReview = (id: string) => {
    setReviews(
      reviews.map((r) =>
        r.id === id
          ? {
              ...r,
              deleted: true,
              comment: 'Отзыв удалён администратором',
            }
          : r
      )
    );
  };

  const likeReview = (id: string) => {
    setReviews(reviews.map((r) => (r.id === id ? { ...r, likes: r.likes + 1 } : r)));
  };

  const dislikeReview = (id: string) => {
    setReviews(reviews.map((r) => (r.id === id ? { ...r, dislikes: r.dislikes + 1 } : r)));
  };

  const addOrder = (order: Order) => {
    setOrders([...orders, order]);
  };

  const updateOrder = (id: string, updatedData: Partial<Order>) => {
    setOrders(orders.map((o) => (o.id === id ? { ...o, ...updatedData } : o)));
  };

  const updateOrderStatus = (
    id: string,
    status: Order['status'],
    masterId?: string,
    masterName?: string,
    masterAvatar?: string
  ) => {
    setOrders(
      orders.map((o) =>
        o.id === id ? { ...o, status, ...(masterId && { masterId, masterName, masterAvatar }) } : o
      )
    );
  };

  const toggleFavorite = (serviceId: string) => {
    if (favorites.includes(serviceId)) {
      setFavorites(favorites.filter((id) => id !== serviceId));
    } else {
      setFavorites([...favorites, serviceId]);
    }
  };

  // Генерация временных слотов с учетом ограничения 10 часов в день
  const getAvailableTimeSlots = (
    date: string,
    serviceDuration: number
  ): { time: string; available: boolean }[] => {
    const slots: { time: string; available: boolean }[] = [];
    const workStart = 9; // Начало рабочего дня
    const workEnd = 21; // Конец рабочего дня

    // Получаем все заказы на выбранную дату
    const dayOrders = orders.filter((o) => o.date === date && o.status !== 'rejected');

    // Вычисляем занятое время у мастеров
    const masterSchedule: { [masterId: string]: number } = {};
    dayOrders.forEach((order) => {
      if (order.masterId && order.status !== 'rejected') {
        const service = services.find((s) => s.id === order.serviceId);
        if (service) {
          masterSchedule[order.masterId] =
            (masterSchedule[order.masterId] || 0) + service.duration;
        }
      }
    });

    // Генерируем слоты с шагом в 1 час
    for (let hour = workStart; hour < workEnd; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      const isOccupied = dayOrders.some((o) => o.timeSlot === time);

      // Проверяем, есть ли свободный мастер (у которого меньше 10 часов занято)
      const availableMaster = users
        .filter((u) => u.role === 'master')
        .find((master) => {
          const busyMinutes = masterSchedule[master.id] || 0;
          return busyMinutes + serviceDuration <= 600; // 10 часов = 600 минут
        });

      slots.push({
        time,
        available: !isOccupied && !!availableMaster,
      });
    }

    return slots;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        register,
        users,
        addUser,
        updateUser,
        deleteUser,
        services,
        addService,
        updateService,
        deleteService,
        reviews,
        addReview,
        deleteReview,
        likeReview,
        dislikeReview,
        orders,
        addOrder,
        updateOrder,
        updateOrderStatus,
        favorites,
        toggleFavorite,
        getAvailableTimeSlots,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
