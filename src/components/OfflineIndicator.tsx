import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <Badge
      variant={isOnline ? "secondary" : "destructive"}
      className={`flex items-center gap-1 ${
        isOnline
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-red-100 text-red-800 border-red-200"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3" />
          متصل
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          غير متصل
        </>
      )}
    </Badge>
  );
};

export default OfflineIndicator;
