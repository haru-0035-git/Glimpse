import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchCurrentUser } from "../auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

type AuthStatus = "loading" | "allowed" | "denied";

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const user = await fetchCurrentUser();
      if (!active) {
        return;
      }

      if (!user) {
        setStatus("denied");
        return;
      }

      if (requireAdmin && !user.admin) {
        setStatus("denied");
        return;
      }

      setStatus("allowed");
    };

    void verify();

    return () => {
      active = false;
    };
  }, [requireAdmin]);

  if (status === "loading") {
    return <div>読み込み中...</div>;
  }

  if (status === "denied") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
