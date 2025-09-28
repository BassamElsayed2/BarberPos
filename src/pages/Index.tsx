import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  Plus,
  Search,
  Calculator,
  Receipt,
  Database,
  Users,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import SalesInterface from "@/components/SalesInterface";
import ProductManagement from "@/components/ProductManagement";
import PurchaseInvoices from "@/components/PurchaseInvoices";
import ReportsSection from "@/components/ReportsSection";
import SalesInvoices from "@/components/SalesInvoices";
import DataManagement from "@/components/DataManagement";
import EmployeeManagement from "@/components/EmployeeManagement";
import OfflineIndicator from "@/components/OfflineIndicator";
import Footer from "@/components/Footer";

const Index = () => {
  const [activeTab, setActiveTab] = useState("sales");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleText = (role: string) => {
    switch (role) {
      case "admin":
        return "مدير النظام";
      case "manager":
        return "مدير الفرع";
      case "employee":
        return "موظف";
      default:
        return "مستخدم";
    }
  };

  const getInitials = (username: string) => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col"
      dir="ltr"
    >
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Smoking & Sins
                </h1>
                <p className="text-sm text-gray-600">
                  إدارة ذكية للمبيعات والمخزون
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <OfflineIndicator />
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-200"
              >
                المتجر الرئيسي
              </Badge>

              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getInitials(user?.username || "")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {getRoleText(user?.role || "")}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/add-user")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>إضافة مستخدم</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 flex-1">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {/* Navigation Tabs - الترتيب من اليمين لليسار */}
          <TabsList
            className={`grid w-full bg-white/60 backdrop-blur-sm border border-blue-100 h-16 ${
              user?.role === "employee" ? "grid-cols-2" : "grid-cols-7"
            }`}
            dir="ltr"
          >
            {/* Admin/Manager tabs */}
            {user?.role !== "employee" && (
              <>
                <TabsTrigger
                  value="employees"
                  className="flex-col gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                >
                  <Users className="w-5 h-5" />
                  <span className="text-xs">الموظفين</span>
                </TabsTrigger>
                <TabsTrigger
                  value="data"
                  className="flex-col gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Database className="w-5 h-5" />
                  <span className="text-xs">إدارة البيانات</span>
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="flex-col gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-xs">التقارير</span>
                </TabsTrigger>
                <TabsTrigger
                  value="invoices"
                  className="flex-col gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">فواتير الشراء</span>
                </TabsTrigger>
                <TabsTrigger
                  value="products"
                  className="flex-col gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Package className="w-5 h-5" />
                  <span className="text-xs">المنتجات</span>
                </TabsTrigger>
              </>
            )}

            {/* Common tabs for all users */}
            <TabsTrigger
              value="sales-invoices"
              className="flex-col gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <Receipt className="w-5 h-5" />
              <span className="text-xs">فواتير المبيعات</span>
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              className="flex-col gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-xs">نقطة البيع</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="sales" className="m-0">
            <SalesInterface />
          </TabsContent>

          <TabsContent value="sales-invoices" className="m-0">
            <SalesInvoices />
          </TabsContent>

          {/* Admin/Manager only content */}
          {user?.role !== "employee" && (
            <>
              <TabsContent value="products" className="m-0">
                <ProductManagement />
              </TabsContent>

              <TabsContent value="invoices" className="m-0">
                <PurchaseInvoices />
              </TabsContent>

              <TabsContent value="reports" className="m-0">
                <ReportsSection />
              </TabsContent>

              <TabsContent value="data" className="m-0">
                <DataManagement />
              </TabsContent>

              <TabsContent value="employees" className="m-0">
                <EmployeeManagement />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
