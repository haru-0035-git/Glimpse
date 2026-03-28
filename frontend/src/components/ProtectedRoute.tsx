import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchCurrentUser } from '../auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type AuthStatus = 'loading' | 'allowed' | 'denied';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const user = await fetchCurrentUser();
      if (!active) {
        return;
      }
      setStatus(user?.admin ? 'allowed' : 'denied');
    };

    void verify();

    return () => {
      active = false;
    };
  }, []);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'denied') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
