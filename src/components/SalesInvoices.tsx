import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt,
  FileText,
  Calendar,
  User,
  Printer,
  RefreshCw,
  TrendingUp,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useAuth } from "@/hooks/useAuth";
import { Sale, SaleItem } from "@/lib/database";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const SalesInvoices = () => {
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { sales, refreshData } = useDatabase();
  const { user } = useAuth();

  const formatWhatsAppMessage = (sale: Sale) => {
    const date = new Date(sale.created_at).toLocaleDateString("ar-SA");
    const time = new Date(sale.created_at).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let message = `🧾 *فاتورة Masrawy*\n\n`;
    message += `📋 رقم الفاتورة: ${sale.invoice_number}\n`;
    message += `📅 التاريخ: ${date}\n`;
    message += `🕐 الوقت: ${time}\n`;
    message += `👤 الموظف: ${sale.employee_name}\n`;
    message += `👨‍💼 البائع: ${sale.seller_user || "البائع الرئيسي"}\n\n`;
    message += `📦 *تفاصيل :*\n`;

    sale.items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`;
      message += `   💰 السعر: ${item.unit_price.toFixed(2)} د.أ\n`;
      message += `   💵 الإجمالي: ${item.total_price.toFixed(2)} د.أ\n\n`;
    });

    message += `💰 *المبلغ الإجمالي: ${sale.total_amount.toFixed(2)} د.أ*\n\n`;
    message += `شكراً لاختياركم خدماتنا في مصراوي! 🙏`;

    return encodeURIComponent(message);
  };

  const sendToWhatsApp = (sale: Sale) => {
    const message = formatWhatsAppMessage(sale);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  // Convert database sales to display format
  const salesInvoices = useMemo(() => {
    // Filter sales based on user role
    let filteredSales = sales;

    // If user is employee, only show their own sales
    if (user?.role === "employee") {
      filteredSales = sales.filter(
        (sale) =>
          sale.seller_user === user.username ||
          sale.employee_name === user.username
      );
    }

    return filteredSales.map((sale) => ({
      ...sale,
      displayItems: sale.items.map((item) => ({
        id: item.id,
        name: item.product_name,
        price: item.unit_price,
        quantity: item.quantity,
      })),
    }));
  }, [sales, user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <FileText className="w-6 h-6" />
            فواتير المبيعات
          </CardTitle>
          <p className="text-sm text-gray-600">
            {user?.role === "employee"
              ? `فواتيرك: ${salesInvoices.length} فاتورة`
              : `إجمالي الفواتير: ${salesInvoices.length} فاتورة`}
          </p>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {user?.role === "employee"
                    ? "فواتيرك"
                    : "إجمالي فواتير المبيعات"}
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {salesInvoices.length}
                </p>
              </div>
              <Receipt className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {user?.role === "employee" ? "مبيعاتك" : "إجمالي المبيعات"}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {salesInvoices
                    .reduce((sum, invoice) => sum + invoice.total_amount, 0)
                    .toFixed(2)}{" "}
                  د.أ
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {user?.role === "employee"
                    ? "متوسط فاتورتك"
                    : "متوسط قيمة الفاتورة"}
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {salesInvoices.length > 0
                    ? (
                        salesInvoices.reduce(
                          (sum, invoice) => sum + invoice.total_amount,
                          0
                        ) / salesInvoices.length
                      ).toFixed(2)
                    : "0.00"}{" "}
                  د.أ
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Invoices List */}
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Receipt className="w-5 h-5" />
              {user?.role === "employee" ? "فواتيرك" : "قائمة الفواتير"} (
              {salesInvoices.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {salesInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                {user?.role === "employee"
                  ? "لا توجد فواتير مبيعات لك حتى الآن"
                  : "لا توجد فواتير مبيعات حتى الآن"}
              </p>
              <p className="text-sm mt-2">
                {user?.role === "employee"
                  ? "ستظهر فواتيرك هنا بعد إتمام عمليات البيع"
                  : "ستظهر الفواتير هنا بعد إتمام عمليات البيع"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {salesInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setSelectedInvoice(
                      sales.find((s) => s.id === invoice.id) || null
                    );
                    setIsInvoiceDialogOpen(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-blue-600 border-blue-300"
                          >
                            {invoice.invoice_number}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {invoice.displayItems.length} منتج
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(invoice.created_at).toLocaleDateString(
                              "ar-SA"
                            )}{" "}
                            -{" "}
                            {new Date(invoice.created_at).toLocaleTimeString(
                              "ar-SA",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {invoice.seller_user ||
                              invoice.employee_name ||
                              "البائع الرئيسي"}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-blue-600">
                          {invoice.total_amount.toFixed(2)} د.أ
                        </div>
                        <Button variant="ghost" size="sm" className="mt-1">
                          عرض التفاصيل
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Details Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          dir="ltr"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              تفاصيل الفاتورة {selectedInvoice?.invoice_number}
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">رقم الفاتورة</span>
                  <p className="font-semibold">
                    {selectedInvoice.invoice_number}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">التاريخ</span>
                  <p className="font-semibold">
                    {new Date(selectedInvoice.created_at).toLocaleDateString(
                      "ar-SA"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">الوقت</span>
                  <p className="font-semibold">
                    {new Date(selectedInvoice.created_at).toLocaleTimeString(
                      "ar-SA",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">البائع</span>
                  <p className="font-semibold">
                    {selectedInvoice.seller_user ||
                      selectedInvoice.employee_name ||
                      "البائع الرئيسي"}
                  </p>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">تفاصيل المنتجات</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">المنتج</TableHead>
                      <TableHead className="text-right">السعر</TableHead>

                      <TableHead className="text-right">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium text-right">
                          {item.product_name}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.unit_price.toFixed(2)} د.أ
                        </TableCell>

                        <TableCell className="font-semibold text-right">
                          {item.total_price.toFixed(2)} د.أ
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* employee_name */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>الموظف:</span>
                  <span className="text-blue-600">
                    {selectedInvoice.employee_name}
                  </span>
                </div>
              </div>

              {/* Invoice Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>المبلغ الإجمالي:</span>
                  <span className="text-blue-600">
                    {selectedInvoice.total_amount.toFixed(2)} د.أ
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500">
                  <Printer className="w-4 h-4 mr-2" />
                  طباعة الفاتورة
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  onClick={() => sendToWhatsApp(selectedInvoice)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  إرسال للواتساب
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsInvoiceDialogOpen(false)}
                >
                  إغلاق
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesInvoices;
