export type UserRole = 'user' | 'master' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  rating?: number;
  servicesCount?: number;
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // в минутах
  imageUrl: string;
  rating: number;
  reviewsCount: number;
}

export interface Review {
  id: string;
  serviceId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  likes: number;
  dislikes: number;
  date: string;
  deleted?: boolean;
}

export interface Order {
  id: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userName: string;
  userAvatar: string;
  masterId?: string;
  masterName?: string;
  masterAvatar?: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled';
  date: string;
  timeSlot?: string; // Новое поле для времени записи
  price: number;
  hasReview?: boolean; // Флаг, что пользователь оставил отзыв
}

export interface ClientHistory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  serviceId: string;
  date: string;
  rating: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  orderId?: string;
}

export interface DaySchedule {
  date: string;
  slots: TimeSlot[];
  totalHours: number;
}
