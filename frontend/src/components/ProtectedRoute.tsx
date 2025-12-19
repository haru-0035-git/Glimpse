import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type Decoded = { exp?: number; roles?: string };

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('jwtToken');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decodedToken: Decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    if (!decodedToken.exp || decodedToken.exp < currentTime) {
      localStorage.removeItem('jwtToken');
      return <Navigate to="/login" replace />;
    }

    const roles = decodedToken.roles || '';
    const isAdmin = roles.split(',').includes('ROLE_ADMIN');
    if (!isAdmin) {
      localStorage.removeItem('jwtToken');
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    localStorage.removeItem('jwtToken');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
