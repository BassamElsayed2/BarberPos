import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Lock } from "lucide-react";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // التحقق من صحة البيانات
    if (!username.trim()) {
      setError("⚠️ يرجى إدخال اسم المستخدم");
      return;
    }

    if (!password.trim()) {
      setError("⚠️ يرجى إدخال كلمة المرور");
      return;
    }

    if (password.length < 6) {
      setError("⚠️ كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await login(username.trim(), password);
      if (!success) {
        setError("❌ اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("❌ حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <User className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            نظام إدارة الحلاقة
          </CardTitle>
          <CardDescription>يرجى تسجيل الدخول للوصول إلى النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(""); // مسح رسالة الخطأ عند البدء بالكتابة
                  }}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(""); // مسح رسالة الخطأ عند البدء بالكتابة
                  }}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="border-red-500 bg-red-50 text-red-700 animate-in slide-in-from-top-2 duration-300"
              >
                <AlertDescription className="font-medium flex items-center gap-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className={`w-full transition-all duration-200 ${
                isSubmitting
                  ? "opacity-75 cursor-not-allowed"
                  : "hover:bg-blue-700 hover:shadow-lg"
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
