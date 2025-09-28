import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Calendar,
  Building,
  Package,
  Receipt,
  User,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/contexts/DatabaseContext";
import {
  Category,
  Product,
  PurchaseInvoice as DBPurchaseInvoice,
  PurchaseItem,
} from "@/lib/database";

interface InvoiceItem {
  productName: string;
  barcode: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  category: string;
  productId?: string;
}

const PurchaseInvoices = () => {
  const [selectedInvoice, setSelectedInvoice] =
    useState<DBPurchaseInvoice | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    supplier: "",
    date: "",
  });
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([
    {
      productName: "",
      barcode: "",
      quantity: 0,
      purchasePrice: 0,
      salePrice: 0,
      category: "",
    },
  ]);

  const {
    categories,
    products,
    purchaseInvoices,
    addPurchaseInvoice,
    addProduct,
    refreshData,
  } = useDatabase();
  const { toast } = useToast();

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setInvoiceData((prev) => ({ ...prev, date: today }));
  }, []);

  // Generate invoice number when dialog opens
  useEffect(() => {
    if (
      isAddDialogOpen &&
      (!invoiceData.invoiceNumber || invoiceData.invoiceNumber.trim() === "")
    ) {
      const timestamp = Date.now();
      const invoiceNumber = `PUR-${timestamp}`;
      setInvoiceData((prev) => ({
        ...prev,
        invoiceNumber: invoiceNumber,
      }));
    }
  }, [isAddDialogOpen, invoiceData.invoiceNumber]);

  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      {
        productName: "",
        barcode: "",
        quantity: 0,
        purchasePrice: 0,
        salePrice: 0,
        category: "",
      },
    ]);
  };

  const updateInvoiceItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const updatedItems = invoiceItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setInvoiceItems(updatedItems);
  };

  const removeInvoiceItem = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return invoiceItems.reduce(
      (total, item) => total + item.quantity * item.purchasePrice,
      0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (
        !invoiceData.invoiceNumber ||
        !invoiceData.supplier ||
        !invoiceData.date
      ) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى ملء جميع بيانات الفاتورة",
          variant: "destructive",
        });
        return;
      }

      // Generate invoice number if not provided or empty
      let finalInvoiceNumber = invoiceData.invoiceNumber;
      if (!finalInvoiceNumber || finalInvoiceNumber.trim() === "") {
        const timestamp = Date.now();
        finalInvoiceNumber = `PUR-${timestamp}`;
      }

      // Check if invoice number already exists and generate a new one if needed
      let checkInvoiceNumber = finalInvoiceNumber;
      let counter = 1;
      while (
        purchaseInvoices.some(
          (invoice) => invoice.invoice_number === checkInvoiceNumber
        )
      ) {
        checkInvoiceNumber = `${finalInvoiceNumber}-${counter}`;
        counter++;
      }
      finalInvoiceNumber = checkInvoiceNumber;

      const validItems = invoiceItems.filter(
        (item) =>
          item.productName && item.quantity > 0 && item.purchasePrice > 0
      );

      if (validItems.length === 0) {
        toast({
          title: "خطأ في البيانات",
          description: "يرجى إضافة منتج واحد على الأقل مع كمية وسعر صحيحين",
          variant: "destructive",
        });
        return;
      }

      // Validate that all items have required fields
      for (const item of validItems) {
        if (!item.productName.trim()) {
          toast({
            title: "خطأ في البيانات",
            description: "اسم المنتج مطلوب",
            variant: "destructive",
          });
          return;
        }
        if (item.quantity <= 0) {
          toast({
            title: "خطأ في البيانات",
            description: "الكمية يجب أن تكون أكبر من صفر",
            variant: "destructive",
          });
          return;
        }
        if (item.purchasePrice <= 0) {
          toast({
            title: "خطأ في البيانات",
            description: "سعر الشراء يجب أن يكون أكبر من صفر",
            variant: "destructive",
          });
          return;
        }

        // Check for duplicate barcodes in the same invoice
        if (item.barcode && item.barcode.trim()) {
          const duplicateBarcode = validItems.filter(
            (otherItem, index) =>
              otherItem.barcode === item.barcode &&
              validItems.indexOf(item) !== index
          );
          if (duplicateBarcode.length > 0) {
            toast({
              title: "خطأ في البيانات",
              description: `الباركود ${item.barcode} مكرر في نفس الفاتورة`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Create or find products and convert items to database format
      const purchaseItems: Omit<PurchaseItem, "id" | "purchase_id">[] = [];

      for (const item of validItems) {
        let productId = item.productId;

        // If no product ID, try to find existing product by name or create new one
        if (!productId) {
          // First try to find by barcode if provided
          let existingProduct = null;
          if (item.barcode) {
            existingProduct = products.find((p) => p.barcode === item.barcode);
          }

          // If not found by barcode, try to find by name
          if (!existingProduct) {
            existingProduct = products.find((p) => p.name === item.productName);
          }

          if (existingProduct) {
            productId = existingProduct.id;
          } else {
            // Create new product
            try {
              const category = categories.find((c) => c.name === item.category);

              // Check if barcode already exists
              if (item.barcode && item.barcode.trim()) {
                const existingBarcodeProduct = products.find(
                  (p) => p.barcode === item.barcode
                );
                if (existingBarcodeProduct) {
                  throw new Error(
                    `الباركود ${item.barcode} موجود بالفعل للمنتج: ${existingBarcodeProduct.name}`
                  );
                }
              }

              await addProduct({
                name: item.productName,
                price: item.salePrice || item.purchasePrice, // Use sale price or fallback to purchase price
                stock: 0, // Start with 0 stock, will be updated by purchase
                barcode:
                  item.barcode && item.barcode.trim()
                    ? item.barcode
                    : undefined,
                category_id: category?.id,
              });

              // Refresh data and find the created product
              await refreshData();
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Find the product after creation
              const createdProduct = products.find(
                (p) => p.name === item.productName
              );

              if (!createdProduct) {
                throw new Error(
                  `فشل في العثور على المنتج المنشأ: ${item.productName}`
                );
              }
              productId = createdProduct.id;
            } catch (productError) {
              toast({
                title: "خطأ في إنشاء المنتج",
                description: `فشل في إنشاء المنتج: ${item.productName}. ${
                  productError instanceof Error ? productError.message : ""
                }`,
                variant: "destructive",
              });
              return;
            }
          }
        }

        purchaseItems.push({
          product_id: productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: item.purchasePrice,
          total_price: item.quantity * item.purchasePrice,
        });
      }

      const newPurchase: Omit<
        DBPurchaseInvoice,
        "id" | "created_at" | "updated_at"
      > = {
        invoice_number: finalInvoiceNumber,
        supplier_name: invoiceData.supplier,
        total_amount: calculateTotal(),
        items: purchaseItems as PurchaseItem[], // Type assertion to handle the type mismatch
      };

      try {
        await addPurchaseInvoice(newPurchase);

        toast({
          title: "تم إضافة الفاتورة",
          description: `تم إضافة فاتورة الشراء ${finalInvoiceNumber} بنجاح`,
        });
      } catch (purchaseError) {
        toast({
          title: "خطأ في إضافة فاتورة الشراء",
          description:
            purchaseError instanceof Error
              ? purchaseError.message
              : "فشل في إضافة فاتورة الشراء",
          variant: "destructive",
        });
        return;
      }

      setIsAddDialogOpen(false);
      setInvoiceData({
        invoiceNumber: "",
        supplier: "",
        date: new Date().toISOString().split("T")[0],
      });
      setInvoiceItems([
        {
          productName: "",
          barcode: "",
          quantity: 0,
          purchasePrice: 0,
          salePrice: 0,
          category: "",
        },
      ]);
    } catch (error) {
      toast({
        title: "خطأ في إضافة الفاتورة",
        description:
          error instanceof Error ? error.message : "فشل في إضافة فاتورة الشراء",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.color || "#6B7280";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <FileText className="w-6 h-6" />
                فواتير الشراء
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                إجمالي الفواتير: {purchaseInvoices.length} فاتورة
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة فاتورة شراء
                </Button>
              </DialogTrigger>
              <DialogContent
                className="max-w-4xl max-h-[90vh] overflow-y-auto"
                dir="ltr"
              >
                <DialogHeader>
                  <DialogTitle>إضافة فاتورة شراء جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Invoice Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="invoiceNumber">رقم الفاتورة *</Label>
                      <Input
                        id="invoiceNumber"
                        value={invoiceData.invoiceNumber}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            invoiceNumber: e.target.value,
                          })
                        }
                        placeholder="INV-001"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier">المورد *</Label>
                      <Input
                        id="supplier"
                        value={invoiceData.supplier}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            supplier: e.target.value,
                          })
                        }
                        placeholder="اسم المورد"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">تاريخ الفاتورة *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={invoiceData.date}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            date: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Invoice Items */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-lg font-semibold">
                        بنود الفاتورة
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addInvoiceItem}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة بند
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {invoiceItems.map((item, index) => (
                        <Card
                          key={index}
                          className="p-4 bg-blue-50 border-blue-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                            <div>
                              <Label>اسم المنتج</Label>
                              <Input
                                value={item.productName}
                                onChange={(e) =>
                                  updateInvoiceItem(
                                    index,
                                    "productName",
                                    e.target.value
                                  )
                                }
                                placeholder="اسم المنتج"
                              />
                            </div>
                            <div>
                              <Label>الباركود</Label>
                              <Input
                                value={item.barcode}
                                onChange={(e) =>
                                  updateInvoiceItem(
                                    index,
                                    "barcode",
                                    e.target.value
                                  )
                                }
                                placeholder="1234567890123"
                              />
                            </div>
                            <div>
                              <Label>الفئة</Label>
                              <Select
                                value={item.category}
                                onValueChange={(value) =>
                                  updateInvoiceItem(index, "category", value)
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر الفئة" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.name}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="w-3 h-3 rounded-full"
                                          style={{
                                            backgroundColor: category.color,
                                          }}
                                        />
                                        {category.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>الكمية</Label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateInvoiceItem(
                                    index,
                                    "quantity",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <Label>سعر الشراء</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.purchasePrice}
                                onChange={(e) =>
                                  updateInvoiceItem(
                                    index,
                                    "purchasePrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <Label>سعر البيع</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.salePrice}
                                onChange={(e) =>
                                  updateInvoiceItem(
                                    index,
                                    "salePrice",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0.00"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => removeInvoiceItem(index)}
                                disabled={invoiceItems.length === 1}
                              >
                                حذف
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>إجمالي الفاتورة:</span>
                      <span className="text-blue-600">
                        {calculateTotal().toFixed(2)} درهم
                      </span>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          جاري الحفظ...
                        </>
                      ) : (
                        "حفظ الفاتورة"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي فواتير الشراء</p>
                <p className="text-2xl font-bold text-blue-600">
                  {purchaseInvoices.length}
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
                <p className="text-sm text-gray-600">إجمالي المبالغ</p>
                <p className="text-2xl font-bold text-green-600">
                  {purchaseInvoices
                    .reduce((sum, invoice) => sum + invoice.total_amount, 0)
                    .toFixed(2)}{" "}
                  درهم
                </p>
              </div>
              <Building className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-purple-600">
                  {purchaseInvoices.reduce(
                    (sum, invoice) => sum + invoice.items.length,
                    0
                  )}
                </p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Invoices List */}
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Receipt className="w-5 h-5" />
              قائمة فواتير الشراء ({purchaseInvoices.length})
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
            {/* <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (
                  confirm(
                    "هل أنت متأكد من مسح جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه."
                  )
                ) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              مسح البيانات
            </Button> */}
          </div>
        </CardHeader>
        <CardContent>
          {purchaseInvoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>لا توجد فواتير شراء حتى الآن</p>
              <p className="text-sm mt-2">
                قم بإضافة فاتورة شراء جديدة لتظهر هنا
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchaseInvoices.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="border-blue-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    setSelectedInvoice(invoice);
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
                            {invoice.items.length} منتج
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
                            <Building className="w-4 h-4" />
                            {invoice.supplier_name}
                          </div>
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-lg font-bold text-blue-600">
                          {invoice.total_amount.toFixed(2)} درهم
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
              <FileText className="w-5 h-5" />
              تفاصيل فاتورة الشراء {selectedInvoice?.invoice_number}
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
                  <span className="text-sm text-gray-600">المورد</span>
                  <p className="font-semibold">
                    {selectedInvoice.supplier_name}
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
                      <TableHead className="text-right">الباركود</TableHead>
                      <TableHead className="text-right">الفئة</TableHead>
                      <TableHead className="text-right">سعر الشراء</TableHead>
                      <TableHead className="text-right">سعر البيع</TableHead>
                      <TableHead className="text-right">الكمية</TableHead>
                      <TableHead className="text-right">الإجمالي</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedInvoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.product_name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {products.find((p) => p.id === item.product_id)
                            ?.barcode || "غير محدد"}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const product = products.find(
                              (p) => p.id === item.product_id
                            );
                            const category = product
                              ? categories.find(
                                  (c) => c.id === product.category_id
                                )
                              : null;
                            return category ? (
                              <Badge
                                className="text-white text-xs"
                                style={{ backgroundColor: category.color }}
                              >
                                {category.name}
                              </Badge>
                            ) : null;
                          })()}
                        </TableCell>
                        <TableCell>{item.unit_price.toFixed(2)} درهم</TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {products
                            .find((p) => p.id === item.product_id)
                            ?.price?.toFixed(2) || "0.00"}{" "}
                          درهم
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="font-semibold">
                          {item.total_price.toFixed(2)} درهم
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Invoice Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>المبلغ الإجمالي:</span>
                  <span className="text-blue-600">
                    {selectedInvoice.total_amount.toFixed(2)} درهم
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsInvoiceDialogOpen(false)}
                  className="flex-1"
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

export default PurchaseInvoices;
