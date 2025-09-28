import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = "outline",
  size = "default",
  className = "",
}) => {
  const { logout } = useAuth();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={logout}
      className={className}
    >
      <LogOut className="mr-2 h-4 w-4" />
      تسجيل الخروج
    </Button>
  );
};

export default LogoutButton;
