import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FileText,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  RefreshCw,
  Receipt,
  Users,
} from "lucide-react";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useToast } from "@/hooks/use-toast";

const ReportsSection = () => {
  const [selectedReport, setSelectedReport] = useState("sales");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { sales, purchaseInvoices, products, employees, refreshData } =
    useDatabase();
  const { toast } = useToast();

  // Set default date range to last 30 days
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateFrom(thirtyDaysAgo.toISOString().split("T")[0]);
    setDateTo(today.toISOString().split("T")[0]);
  }, []);

  // Filter data based on date range
  const filteredSales = useMemo(() => {
    if (!dateFrom || !dateTo) return sales;
    return sales.filter((sale) => {
      const saleDate = new Date(sale.created_at);
      const fromDate = new Date(dateFrom + "T00:00:00");
      const toDate = new Date(dateTo + "T23:59:59");
      return saleDate >= fromDate && saleDate <= toDate;
    });
  }, [sales, dateFrom, dateTo]);

  const filteredPurchases = useMemo(() => {
    if (!dateFrom || !dateTo) return purchaseInvoices;
    return purchaseInvoices.filter((purchase) => {
      const purchaseDate = new Date(purchase.created_at);
      const fromDate = new Date(dateFrom + "T00:00:00");
      const toDate = new Date(dateTo + "T23:59:59");
      return purchaseDate >= fromDate && purchaseDate <= toDate;
    });
  }, [purchaseInvoices, dateFrom, dateTo]);

  // Generate dynamic sales report data
  const salesReportData = useMemo(() => {
    const salesByDate = new Map<string, { invoices: number; total: number }>();

    filteredSales.forEach((sale) => {
      const date = sale.created_at.split("T")[0];
      const existing = salesByDate.get(date) || { invoices: 0, total: 0 };
      salesByDate.set(date, {
        invoices: existing.invoices + 1,
        total: existing.total + sale.total_amount,
      });
    });

    return Array.from(salesByDate.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales]);

  // Generate dynamic purchase report data
  const purchaseReportData = useMemo(() => {
    const purchasesByDate = new Map<
      string,
      { invoices: number; total: number; items: number }
    >();

    filteredPurchases.forEach((purchase) => {
      const date = purchase.created_at.split("T")[0];
      const existing = purchasesByDate.get(date) || {
        invoices: 0,
        total: 0,
        items: 0,
      };
      const totalItems = purchase.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      purchasesByDate.set(date, {
        invoices: existing.invoices + 1,
        total: existing.total + purchase.total_amount,
        items: existing.items + totalItems,
      });
    });

    return Array.from(purchasesByDate.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredPurchases]);

  // Generate dynamic profit report data
  const profitReportData = useMemo(() => {
    const profitByDate = new Map<
      string,
      { sales: number; purchases: number; salaries: number; profit: number }
    >();

    // Calculate total salaries for all employees
    const totalSalaries = employees.reduce(
      (sum, employee) => sum + employee.salary,
      0
    );

    // Add sales data
    filteredSales.forEach((sale) => {
      const date = sale.created_at.split("T")[0];
      const existing = profitByDate.get(date) || {
        sales: 0,
        purchases: 0,
        salaries: 0,
        profit: 0,
      };
      profitByDate.set(date, {
        ...existing,
        sales: existing.sales + sale.total_amount,
      });
    });

    // Add purchase data
    filteredPurchases.forEach((purchase) => {
      const date = purchase.created_at.split("T")[0];
      const existing = profitByDate.get(date) || {
        sales: 0,
        purchases: 0,
        salaries: 0,
        profit: 0,
      };
      profitByDate.set(date, {
        ...existing,
        purchases: existing.purchases + purchase.total_amount,
      });
    });

    // Calculate profit (sales - purchases - salaries)
    return Array.from(profitByDate.entries())
      .map(([date, data]) => ({
        date,
        sales: data.sales,
        purchases: data.purchases,
        salaries: totalSalaries,
        profit: data.sales - data.purchases - totalSalaries,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales, filteredPurchases, employees]);

  // Generate top selling products
  const topSellingProducts = useMemo(() => {
    const productSales = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productSales.get(item.product_id) || {
          name: item.product_name,
          quantity: 0,
          revenue: 0,
        };
        productSales.set(item.product_id, {
          name: item.product_name,
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.total_price,
        });
      });
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredSales]);

  // Generate purchased items report
  const purchasedItems = useMemo(() => {
    const productPurchases = new Map<
      string,
      { name: string; quantity: number; cost: number }
    >();

    filteredPurchases.forEach((purchase) => {
      purchase.items.forEach((item) => {
        const existing = productPurchases.get(item.product_id) || {
          name: item.product_name,
          quantity: 0,
          cost: 0,
        };
        productPurchases.set(item.product_id, {
          name: item.product_name,
          quantity: existing.quantity + item.quantity,
          cost: existing.cost + item.total_price,
        });
      });
    });

    return Array.from(productPurchases.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredPurchases]);

  // Generate sold items with remaining stock
  const soldItems = useMemo(() => {
    const productSales = new Map<string, { name: string; quantity: number }>();

    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productSales.get(item.product_id) || {
          name: item.product_name,
          quantity: 0,
        };
        productSales.set(item.product_id, {
          name: item.product_name,
          quantity: existing.quantity + item.quantity,
        });
      });
    });

    return Array.from(productSales.entries())
      .map(([productId, data]) => {
        const product = products.find((p) => p.id === productId);
        return {
          name: data.name,
          quantity: data.quantity,
          remaining: 0, // Stock tracking not implemented in current Product interface
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [filteredSales, products]);

  const generateReport = async () => {
    setIsLoading(true);
    try {
      await refreshData();
      toast({
        title: "تم تحديث التقرير",
        description: `تم تحديث ${
          selectedReport === "sales"
            ? "تقرير المبيعات"
            : selectedReport === "purchases"
            ? "تقرير المشتريات"
            : selectedReport === "profits"
            ? "تقرير الأرباح"
            : selectedReport === "top-selling"
            ? "المنتجات الأكثر مبيعاً"
            : selectedReport === "purchased-items"
            ? "المنتجات المشتراة"
            : selectedReport === "sold-items"
            ? "المنتجات المباعة"
            : selectedReport === "employees"
            ? "تقرير الموظفين"
            : "التقرير"
        } بنجاح`,
      });
    } catch (error) {
      toast({
        title: "خطأ في تحديث التقرير",
        description: "فشل في تحديث بيانات التقرير",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case "sales":
        return (
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <TrendingUp className="w-5 h-5" />
                  تقرير المبيعات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesReportData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>لا توجد بيانات مبيعات في الفترة المحددة</p>
                    <p className="text-sm mt-2">
                      قم بعمليات بيع من واجهة المبيعات لتظهر البيانات هنا
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="">التاريخ</TableHead>
                            <TableHead className="">عدد الفواتير</TableHead>
                            <TableHead className="">إجمالي المبيعات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesReportData.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.date}</TableCell>
                              <TableCell>{item.invoices}</TableCell>
                              <TableCell className="font-semibold text-blue-600">
                                {item.total.toFixed(2)} د.أ
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesReportData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`${value} د.أ`, "المبيعات"]}
                          />
                          <Bar dataKey="total" fill="#3B82F6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "purchases":
        return (
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <ShoppingCart className="w-5 h-5" />
                تقرير المشتريات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseReportData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد بيانات مشتريات في الفترة المحددة</p>
                  <p className="text-sm mt-2">
                    قم بإضافة فواتير شراء من صفحة فواتير الشراء لتظهر البيانات
                    هنا
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">عدد الفواتير</TableHead>
                      <TableHead className="text-right">عدد الأصناف</TableHead>
                      <TableHead className="text-right">
                        إجمالي المشتريات
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseReportData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.invoices}</TableCell>
                        <TableCell>{item.items}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {item.total.toFixed(2)} د.أ
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );

      case "profits":
        return (
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <DollarSign className="w-5 h-5" />
                تقرير الأرباح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">المبيعات</TableHead>
                    <TableHead className="text-right">المشتريات</TableHead>
                    <TableHead className="text-right">الرواتب</TableHead>
                    <TableHead className="text-right">صافي الربح</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitReportData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell className="text-blue-600">
                        {item.sales.toFixed(2)} د.أ
                      </TableCell>
                      <TableCell className="text-red-600">
                        {item.purchases.toFixed(2)} د.أ
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {item.salaries.toFixed(2)} د.أ
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {item.profit.toFixed(2)} د.أ
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case "top-selling":
        return (
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <TrendingUp className="w-5 h-5" />
                المنتجات الأكثر مبيعاً
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topSellingProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد بيانات مبيعات للمنتجات</p>
                  <p className="text-sm mt-2">
                    قم بعمليات بيع من واجهة المبيعات لتظهر البيانات هنا
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right">
                        الكمية المباعة
                      </TableHead>
                      <TableHead className="text-right">
                        إجمالي الإيرادات
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSellingProducts.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.name}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          {item.revenue.toFixed(2)} د.أ
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );

      case "purchased-items":
        return (
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Package className="w-5 h-5" />
                المنتجات التي تم شراؤها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">
                      الكمية المشتراة
                    </TableHead>
                    <TableHead className="text-right">إجمالي التكلفة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchasedItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {item.cost.toFixed(2)} د.أ
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case "sold-items":
        return (
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Package className="w-5 h-5" />
                المنتجات التي تم بيعها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">المنتج</TableHead>
                    <TableHead className="text-right">الكمية المباعة</TableHead>
                    <TableHead className="text-right">
                      الكمية المتبقية
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soldItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-blue-600">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="font-semibold text-orange-600">
                        {item.remaining}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case "employees":
        return (
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Users className="w-5 h-5" />
                تقرير الموظفين
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>لا توجد بيانات موظفين</p>
                  <p className="text-sm mt-2">
                    قم بإضافة موظفين من صفحة إدارة الموظفين لتظهر البيانات هنا
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">رقم الهاتف</TableHead>
                      <TableHead className="text-right">الراتب</TableHead>
                      <TableHead className="text-right">العمولة (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee, index) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.name}
                        </TableCell>
                        <TableCell>{employee.phone}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {employee.salary.toFixed(2)} د.أ
                        </TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          {employee.commission}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-800">
          التقارير والإحصائيات
        </h2>
      </div>

      {/* Report Selection and Filters */}
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="w-6 h-6" />
            إعدادات التقرير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>نوع التقرير</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">تقرير المبيعات</SelectItem>
                  <SelectItem value="purchases">تقرير المشتريات</SelectItem>
                  <SelectItem value="profits">تقرير الأرباح</SelectItem>
                  <SelectItem value="top-selling">
                    المنتجات الأكثر مبيعاً
                  </SelectItem>
                  <SelectItem value="purchased-items">
                    المنتجات المشتراة
                  </SelectItem>
                  <SelectItem value="sold-items">المنتجات المباعة</SelectItem>
                  <SelectItem value="employees">تقرير الموظفين</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>من تاريخ</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo}
              />
            </div>

            <div className="space-y-2">
              <Label>إلى تاريخ</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                min={dateFrom}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="space-y-2">
              <Label className="invisible">إجراءات</Label>
              <div className="space-y-2">
                <Button
                  onClick={generateReport}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? "جاري التحديث..." : "تحديث التقرير"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المبيعات</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredSales
                    .reduce((sum, sale) => sum + sale.total_amount, 0)
                    .toFixed(2)}{" "}
                  د.أ
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">عدد الفواتير</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredSales.length}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المشتريات</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredPurchases
                    .reduce((sum, purchase) => sum + purchase.total_amount, 0)
                    .toFixed(2)}{" "}
                  د.أ
                </p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">صافي الربح</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(
                    filteredSales.reduce(
                      (sum, sale) => sum + sale.total_amount,
                      0
                    ) -
                    filteredPurchases.reduce(
                      (sum, purchase) => sum + purchase.total_amount,
                      0
                    ) -
                    employees.reduce(
                      (sum, employee) => sum + employee.salary,
                      0
                    )
                  ).toFixed(2)}{" "}
                  د.أ
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">عدد الموظفين</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {employees.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-cyan-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي الرواتب</p>
                <p className="text-2xl font-bold text-cyan-600">
                  {employees
                    .reduce((sum, employee) => sum + employee.salary, 0)
                    .toFixed(2)}{" "}
                  د.أ
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      {sales.length === 0 && purchaseInvoices.length === 0 ? (
        <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              لا توجد بيانات للعرض
            </h3>
            <p className="text-gray-500 mb-4">
              لم يتم العثور على أي مبيعات أو مشتريات في النظام
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• قم بإضافة منتجات جديدة من صفحة إدارة المنتجات</p>
              <p>• أضف فواتير شراء من صفحة فواتير الشراء</p>
              <p>• قم بعمليات بيع من صفحة واجهة المبيعات</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        renderReportContent()
      )}
    </div>
  );
};

export default ReportsSection;
