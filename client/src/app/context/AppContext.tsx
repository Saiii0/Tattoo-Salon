import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Service, Review, Order, User } from '../types';
import {
  authApi,
  usersApi,
  servicesApi,
  reviewsApi,
  ordersApi,
  favoritesApi,
  scheduleApi,
  tokenStore,
} from '../api';

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
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  uploadAvatar: (id: string, file: File) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  services: Service[];
  addService: (service: Service) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  reviews: Review[];
  addReview: (review: Review) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  likeReview: (id: string) => Promise<void>;
  dislikeReview: (id: string) => Promise<void>;
  orders: Order[];
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (id: string, updatedData: Partial<Order>) => Promise<void>;
  updateOrderStatus: (
    id: string,
    status: Order['status']
  ) => Promise<void>;
  favorites: string[];
  toggleFavorite: (serviceId: string) => Promise<void>;
  getAvailableTimeSlots: (
    date: string,
    serviceId: string
  ) => Promise<{ time: string; available: boolean }[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadServices = async () => {
    const data = await servicesApi.list();
    setServices(data);
  };

  const loadReviews = async () => {
    const data = await reviewsApi.list();
    setReviews(data);
  };

  const loadOrders = async () => {
    const data = await ordersApi.list();
    setOrders(data);
  };

  const loadUsers = async () => {
    const data = await usersApi.list();
    setUsers(data);
  };

  const loadFavorites = async () => {
    const data = await favoritesApi.list();
    setFavorites(data);
  };

  const bootstrap = async () => {
    await loadServices();
    await loadReviews();

    const token = tokenStore.get();
    if (!token) return;

    try {
      const me = await authApi.me();
      setCurrentUser(me);

      await loadOrders();
      if (me.role === 'admin') {
        await loadUsers();
      }
      if (me.role === 'user') {
        await loadFavorites();
      }
    } catch {
      tokenStore.clear();
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    bootstrap();
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; reason?: 'invalid' | 'error' }> => {
    try {
      const response = await authApi.login(email, password);
      tokenStore.set(response.access_token);
      setCurrentUser(response.user);
      await loadServices();
      await loadReviews();
      await loadOrders();
      if (response.user.role === 'admin') {
        await loadUsers();
      }
      if (response.user.role === 'user') {
        await loadFavorites();
      }
      return { ok: true };
    } catch (err: any) {
      if (err?.status === 401) {
        return { ok: false, reason: 'invalid' };
      }
      return { ok: false, reason: 'error' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    tokenStore.clear();
    setOrders([]);
    setFavorites([]);
  };

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ ok: boolean; reason?: 'exists' | 'error' }> => {
    try {
      const response = await authApi.register(name, email, password);
      tokenStore.set(response.access_token);
      setCurrentUser(response.user);
      await loadServices();
      await loadReviews();
      await loadOrders();
      await loadFavorites();
      return { ok: true };
    } catch (err: any) {
      if (err?.status === 409) {
        return { ok: false, reason: 'exists' };
      }
      return { ok: false, reason: 'error' };
    }
  };

  const addUser = async (user: User) => {
    const created = await usersApi.create({
      name: user.name,
      email: user.email,
      password: user.password || 'default123',
      role: user.role,
      avatar: user.avatar,
    });
    setUsers((prev) => [created, ...prev]);
  };

  const updateUser = async (id: string, updatedData: Partial<User>) => {
    const updated = await usersApi.update(id, {
      name: updatedData.name,
      email: updatedData.email,
      role: updatedData.role,
      avatar: updatedData.avatar,
      rating: updatedData.rating,
      servicesCount: updatedData.servicesCount,
    });
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    if (currentUser?.id === id) {
      setCurrentUser(updated);
    }
  };

  const uploadAvatar = async (id: string, file: File) => {
    const updated = await usersApi.uploadAvatar(id, file);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    if (currentUser?.id === id) {
      setCurrentUser(updated);
    }
  };

  const deleteUser = async (id: string) => {
    await usersApi.remove(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const addService = async (service: Service) => {
    const created = await servicesApi.create({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      imageUrl: service.imageUrl,
    });
    setServices((prev) => [created, ...prev]);
  };

  const updateService = async (id: string, updatedData: Partial<Service>) => {
    const updated = await servicesApi.update(id, updatedData);
    setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const deleteService = async (id: string) => {
    await servicesApi.remove(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const addReview = async (review: Review) => {
    await reviewsApi.create({
      serviceId: review.serviceId,
      rating: review.rating,
      comment: review.comment,
    });
    await loadReviews();
    await loadServices();
    await loadOrders();
  };

  const deleteReview = async (id: string) => {
    await reviewsApi.remove(id);
    await loadReviews();
    await loadServices();
  };

  const likeReview = async (id: string) => {
    await reviewsApi.like(id);
    await loadReviews();
  };

  const dislikeReview = async (id: string) => {
    await reviewsApi.dislike(id);
    await loadReviews();
  };

  const addOrder = async (order: Order) => {
    await ordersApi.create({
      serviceId: order.serviceId,
      date: order.date,
      timeSlot: order.timeSlot,
    });
    await loadOrders();
  };

  const updateOrder = async (id: string, updatedData: Partial<Order>) => {
    if (updatedData.status) {
      await ordersApi.update(id, { status: updatedData.status });
      await loadOrders();
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    await ordersApi.updateStatus(id, status);
    await loadOrders();
  };

  const toggleFavorite = async (serviceId: string) => {
    if (favorites.includes(serviceId)) {
      await favoritesApi.remove(serviceId);
      setFavorites((prev) => prev.filter((id) => id !== serviceId));
    } else {
      await favoritesApi.add(serviceId);
      setFavorites((prev) => [...prev, serviceId]);
    }
  };

  const getAvailableTimeSlots = async (date: string, serviceId: string) => {
    return scheduleApi.get(date, serviceId);
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
        uploadAvatar,
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
