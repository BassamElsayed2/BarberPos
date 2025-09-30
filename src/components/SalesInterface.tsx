import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Trash2,
  Printer,
  Receipt,
  User,
  Percent,
  Plus,
  Edit3,
  Calendar,
  FileText,
  MessageCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useAuth } from "@/hooks/useAuth";
import { Product, Sale, SaleItem, Employee } from "@/lib/database";

interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  employeeId: string;
  employeeName: string;
  commission: number;
  commissionAmount: number;
  type: "product" | "service";
}

const SalesInterface = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServicePrice, setCustomServicePrice] = useState("");
  const [customServiceCommission, setCustomServiceCommission] = useState("");
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false);
  const [isEditTotalDialogOpen, setIsEditTotalDialogOpen] = useState(false);
  const [customTotal, setCustomTotal] = useState("");
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const { toast } = useToast();
  const { products, employees, addSale } = useDatabase();
  const { user } = useAuth();

  const formatWhatsAppMessage = (sale: Sale) => {
    const date = new Date(sale.created_at).toLocaleDateString("ar-SA");
    const time = new Date(sale.created_at).toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let message = `🧾 *فاتورة البيع*\n\n`;
    message += `📋 رقم الفاتورة: ${sale.invoice_number}\n`;
    message += `📅 التاريخ: ${date}\n`;
    message += `🕐 الوقت: ${time}\n`;
    message += `👤 الموظف: ${sale.employee_name}\n`;
    message += `👨‍💼 البائع: ${sale.seller_user || "البائع الرئيسي"}\n\n`;
    message += `📦 *تفاصيل المنتجات:*\n`;

    sale.items.forEach((item, index) => {
      message += `${index + 1}. ${item.product_name}\n`;
      message += `   💰 السعر: ${item.unit_price.toFixed(2)} د.أ\n`;
      message += `   📊 الكمية: ${item.quantity}\n`;
      message += `   💵 الإجمالي: ${item.total_price.toFixed(2)} د.أ\n\n`;
    });

    message += `💰 *المبلغ الإجمالي: ${sale.total_amount.toFixed(2)} د.أ*\n\n`;
    message += `شكراً لاختياركم خدماتنا! 🙏`;

    return encodeURIComponent(message);
  };

  const sendToWhatsApp = (sale: Sale) => {
    const message = formatWhatsAppMessage(sale);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  const addToCart = (product: Product) => {
    if (!selectedEmployee) {
      toast({
        title: "يرجى اختيار موظف",
        description: "يجب اختيار موظف قبل إضافة الخدمة",
        variant: "destructive",
      });
      return;
    }

    const commissionAmount =
      (product.price * selectedEmployee.commission) / 100;
    const finalPrice = product.price + commissionAmount;

    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: finalPrice,
      originalPrice: product.price,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      commission: selectedEmployee.commission,
      commissionAmount: commissionAmount,
      type: "product",
    };

    setCart([...cart, cartItem]);

    toast({
      title: "تم إضافة الخدمة",
      description: `تم إضافة ${product.name} إلى السلة مع عمولة ${selectedEmployee.name}`,
    });
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price, 0);
  };

  const addCustomService = () => {
    if (!selectedEmployee) {
      toast({
        title: "يرجى اختيار موظف",
        description: "يجب اختيار موظف قبل إضافة الخدمة",
        variant: "destructive",
      });
      return;
    }

    if (!customServiceName.trim() || !customServicePrice.trim()) {
      toast({
        title: "يرجى ملء جميع الحقول",
        description: "يجب إدخال اسم الخدمة والسعر",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(customServicePrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "سعر غير صحيح",
        description: "يرجى إدخال سعر صحيح",
        variant: "destructive",
      });
      return;
    }

    // استخدام العمولة المخصصة إذا تم إدخالها، وإلا استخدام عمولة الموظف
    let commission = selectedEmployee.commission;
    if (customServiceCommission.trim()) {
      const customCommission = parseFloat(customServiceCommission);
      if (!isNaN(customCommission) && customCommission >= 0) {
        commission = customCommission;
      }
    }

    const commissionAmount = (price * commission) / 100;
    const finalPrice = price + commissionAmount;

    const serviceItem: CartItem = {
      id: `service_${Date.now()}`,
      name: customServiceName.trim(),
      price: finalPrice,
      originalPrice: price,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      commission: commission,
      commissionAmount: commissionAmount,
      type: "service",
    };

    setCart([...cart, serviceItem]);
    setCustomServiceName("");
    setCustomServicePrice("");
    setCustomServiceCommission("");
    setIsAddServiceDialogOpen(false);

    toast({
      title: "تم إضافة الخدمة",
      description: `تم إضافة ${customServiceName} إلى السلة`,
    });
  };

  const applyCustomTotal = () => {
    const newTotal = parseFloat(customTotal);
    if (isNaN(newTotal) || newTotal < 0) {
      toast({
        title: "مبلغ غير صحيح",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    const currentTotal = calculateTotal();
    const difference = newTotal - currentTotal;

    if (Math.abs(difference) < 0.01) {
      setIsEditTotalDialogOpen(false);
      return;
    }

    // إضافة عنصر تعديل المبلغ
    const adjustmentItem: CartItem = {
      id: `adjustment_${Date.now()}`,
      name: difference > 0 ? "إضافة مبلغ" : "خصم مبلغ",
      price: difference,
      originalPrice: difference,
      employeeId: selectedEmployee?.id || "",
      employeeName: selectedEmployee?.name || "",
      commission: 0,
      commissionAmount: 0,
      type: "service",
    };

    setCart([...cart, adjustmentItem]);
    setCustomTotal("");
    setIsEditTotalDialogOpen(false);

    toast({
      title: "تم تعديل المبلغ",
      description: `تم تعديل المبلغ إلى ${newTotal.toFixed(2)} د.أ`,
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: "السلة فارغة",
        description: "يرجى إضافة خدمات إلى السلة أولاً",
        variant: "destructive",
      });
      return;
    }

    if (!selectedEmployee) {
      toast({
        title: "يرجى اختيار موظف",
        description: "يجب اختيار موظف قبل إتمام البيع",
        variant: "destructive",
      });
      return;
    }

    try {
      const now = new Date();
      const invoiceNumber = `INV-${now
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${now.getTime().toString().slice(-4)}`;

      const saleItems: SaleItem[] = cart.map((item, index) => ({
        id: `${Date.now()}_${index}`,
        sale_id: "", // Will be set by the database
        product_id: item.type === "product" ? item.id : `custom_${item.id}`,
        product_name: item.name,
        quantity: 1,
        unit_price: item.price,
        total_price: item.price,
      }));

      const sale: Omit<Sale, "id" | "created_at" | "updated_at"> = {
        invoice_number: invoiceNumber,
        total_amount: calculateTotal(),
        employee_id: selectedEmployee?.id,
        employee_name: selectedEmployee?.name,
        seller_user: user?.username, // اسم المستخدم الذي قام بإنشاء الفاتورة
        items: saleItems,
      };

      await addSale(sale);

      // إنشاء كائن Sale للعرض في البوب أب
      const saleForDisplay: Sale = {
        id: `temp_${Date.now()}`, // معرف مؤقت
        invoice_number: invoiceNumber,
        total_amount: calculateTotal(),
        employee_id: selectedEmployee?.id,
        employee_name: selectedEmployee?.name,
        seller_user: user?.username,
        items: saleItems,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      toast({
        title: "تمت عملية البيع بنجاح",
        description: `رقم الفاتورة: ${invoiceNumber} - المبلغ: ${calculateTotal().toFixed(
          2
        )} د.أ`,
      });

      // إظهار بوب أب الفاتورة
      setCompletedSale(saleForDisplay);
      setIsInvoiceDialogOpen(true);

      setCart([]);
    } catch (error) {
      toast({
        title: "خطأ في عملية البيع",
        description: `فشل في إتمام عملية البيع: ${
          error instanceof Error ? error.message : "خطأ غير معروف"
        }`,
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* User Info Header */}
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-blue-800">
            <div className="flex items-center gap-2">
              <User className="w-6 h-6" />
              واجهة البيع
            </div>
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>مرحباً، {user.username}</span>
                <Badge variant="outline" className="text-xs">
                  {user.role === "admin"
                    ? "مدير"
                    : user.role === "manager"
                    ? "مشرف"
                    : "موظف"}
                </Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Main Sales Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Employee Selection */}
          <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <User className="w-5 h-5" />
                اختيار الموظف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Select
                  value={selectedEmployee?.id || ""}
                  onValueChange={(value) => {
                    const employee = employees.find((emp) => emp.id === value);
                    setSelectedEmployee(employee || null);
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="اختر الموظف..." />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        <div className="flex items-center gap-2">
                          <span>{employee.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {employee.commission}%
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedEmployee && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{selectedEmployee.name}</span>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-700 border-green-300"
                    >
                      <Percent className="w-3 h-3 mr-1" />
                      {selectedEmployee.commission}% عمولة
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Products Grid */}
          <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Search className="w-5 h-5" />
                الخدمات المتاحة
              </CardTitle>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث عن الخدمات..."
                className="mt-2"
              />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-blue-100 hover:border-blue-300"
                    onClick={() => addToCart(product)}
                  >
                    <CardContent className="p-4 text-center">
                      <h3 className="font-semibold text-gray-800 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-lg font-bold text-blue-600 mb-2">
                        {product.price} د.أ
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-100 sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Receipt className="w-5 h-5" />
                سلة المشتريات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">السلة فارغة</p>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-800">
                                {item.name}
                              </h4>
                              <Badge
                                variant={
                                  item.type === "service"
                                    ? "secondary"
                                    : "default"
                                }
                                className="text-xs"
                              >
                                {item.type === "service" ? "خدمة" : "خدمة"}
                              </Badge>
                            </div>
                            {item.type === "product" && (
                              <>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm text-gray-600">
                                    السعر الأصلي: {item.originalPrice} د.أ
                                  </span>
                                  <span className="text-sm text-green-600">
                                    + عمولة: {item.commissionAmount.toFixed(2)}{" "}
                                    د.أ
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <User className="w-3 h-3 text-blue-500" />
                                  <span className="text-xs text-blue-600">
                                    {item.employeeName} ({item.commission}%)
                                  </span>
                                </div>
                              </>
                            )}
                            {item.type === "service" && item.commission > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-600">
                                  السعر الأصلي: {item.originalPrice} د.أ
                                </span>
                                <span className="text-sm text-green-600">
                                  + عمولة: {item.commissionAmount.toFixed(2)}{" "}
                                  د.أ
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromCart(item.id)}
                            className="ml-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-600">
                            {item.price.toFixed(2)} د.أ
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>الإجمالي:</span>
                      <span className="text-blue-600">
                        {calculateTotal().toFixed(2)} د.أ
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Dialog
                        open={isAddServiceDialogOpen}
                        onOpenChange={setIsAddServiceDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="border-green-200 hover:bg-green-50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            إضافة خدمة
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>إضافة خدمة مخصصة</DialogTitle>
                            <DialogDescription>
                              أدخل اسم الخدمة وسعرها لإضافتها إلى السلة
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="service-name">اسم الخدمة</Label>
                              <Input
                                id="service-name"
                                value={customServiceName}
                                onChange={(e) =>
                                  setCustomServiceName(e.target.value)
                                }
                                placeholder="أدخل اسم الخدمة..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="service-price">
                                سعر الخدمة (د.أ)
                              </Label>
                              <Input
                                id="service-price"
                                type="number"
                                step="0.01"
                                value={customServicePrice}
                                onChange={(e) =>
                                  setCustomServicePrice(e.target.value)
                                }
                                placeholder="أدخل سعر الخدمة..."
                              />
                            </div>
                            <div>
                              <Label htmlFor="service-commission">
                                العمولة (%) - اختياري
                              </Label>
                              <Input
                                id="service-commission"
                                type="number"
                                step="0.1"
                                value={customServiceCommission}
                                onChange={(e) =>
                                  setCustomServiceCommission(e.target.value)
                                }
                                placeholder={`العمولة الافتراضية: ${
                                  selectedEmployee?.commission || 0
                                }%`}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                اتركه فارغاً لاستخدام عمولة الموظف الافتراضية
                              </p>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsAddServiceDialogOpen(false)}
                            >
                              إلغاء
                            </Button>
                            <Button onClick={addCustomService}>
                              إضافة الخدمة
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog
                        open={isEditTotalDialogOpen}
                        onOpenChange={setIsEditTotalDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="border-orange-200 hover:bg-orange-50"
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            تعديل المبلغ
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>تعديل المبلغ النهائي</DialogTitle>
                            <DialogDescription>
                              أدخل المبلغ النهائي المطلوب
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="custom-total">
                                المبلغ النهائي (د.أ)
                              </Label>
                              <Input
                                id="custom-total"
                                type="number"
                                step="0.01"
                                value={customTotal}
                                onChange={(e) => setCustomTotal(e.target.value)}
                                placeholder={`المبلغ الحالي: ${calculateTotal().toFixed(
                                  2
                                )} د.أ`}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsEditTotalDialogOpen(false)}
                            >
                              إلغاء
                            </Button>
                            <Button onClick={applyCustomTotal}>
                              تطبيق التعديل
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="border-blue-200 hover:bg-blue-50"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        طباعة
                      </Button>
                      <Button
                        onClick={handleCheckout}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        إتمام البيع
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invoice Details Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          dir="ltr"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              فاتورة البيع - {completedSale?.invoice_number}
            </DialogTitle>
          </DialogHeader>

          {completedSale && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg">
                <div>
                  <span className="text-sm text-gray-600">رقم الفاتورة</span>
                  <p className="font-semibold">
                    {completedSale.invoice_number}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">التاريخ</span>
                  <p className="font-semibold">
                    {new Date(completedSale.created_at).toLocaleDateString(
                      "ar-SA"
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">الوقت</span>
                  <p className="font-semibold">
                    {new Date(completedSale.created_at).toLocaleTimeString(
                      "ar-SA",
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">البائع</span>
                  <p className="font-semibold">
                    {completedSale.seller_user ||
                      completedSale.employee_name ||
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
                    {completedSale.items.map((item, index) => (
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

              {/* Employee Info */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>الموظف:</span>
                  <span className="text-blue-600">
                    {completedSale.employee_name}
                  </span>
                </div>
              </div>

              {/* Invoice Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>المبلغ الإجمالي:</span>
                  <span className="text-green-600">
                    {completedSale.total_amount.toFixed(2)} د.أ
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500">
                  <Printer className="w-4 h-4 mr-2" />
                  طباعة الفاتورة
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  onClick={() => sendToWhatsApp(completedSale)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  إرسال للواتساب
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInvoiceDialogOpen(false);
                    setCompletedSale(null);
                  }}
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

export default SalesInterface;
