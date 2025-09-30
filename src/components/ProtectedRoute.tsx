import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import LoginPage from "./LoginPage";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "employee" | "manager";
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      setForceUpdate((prev) => prev + 1);
    }
  }, [isAuthenticated]);

  // Force re-render when authentication state changes
  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [isAuthenticated, user]);

  // Add key to force re-render
  const key = `protected-route-${forceUpdate}`;

  // إزالة صفحة الـ loading المنفصلة - سيتم التعامل مع الـ loading في LoginPage

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">غير مصرح لك</h1>
          <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
        </div>
      </div>
    );
  }

  return <div key={key}>{children}</div>;
};

export default ProtectedRoute;
