import React from 'react';
import { UserRole } from '../types';
import { useAppContext } from '../context/AppContext';
import { Unauthorized } from '../pages/Unauthorized';
import { Forbidden } from '../pages/Forbidden';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, currentUser } = useAppContext();

  if (!isAuthenticated) {
    return <Unauthorized />;
  }

  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Forbidden />;
  }

  return <>{children}</>;
};
