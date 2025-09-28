import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Upload,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/contexts/DatabaseContext";

const DataManagement = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const {
    backup,
    restore,
    exportToJSON,
    importFromJSON,
    refreshData,
    clearDatabase,
    resetDatabase,
    categories,
    products,
    sales,
    purchaseInvoices,
    isLoading,
  } = useDatabase();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const jsonData = await exportToJSON();

      // Create and download file
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pos_data_export_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "تم تصدير البيانات بنجاح",
        description: "تم حفظ البيانات في ملف JSON",
      });
    } catch (error) {
      toast({
        title: "خطأ في التصدير",
        description: "فشل في تصدير البيانات",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        title: "لم يتم اختيار ملف",
        description: "يرجى اختيار ملف JSON للاستيراد",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsImporting(true);
      const text = await file.text();
      await importFromJSON(text);

      toast({
        title: "تم استيراد البيانات بنجاح",
        description: "تم تحميل البيانات من الملف",
      });
    } catch (error) {
      toast({
        title: "خطأ في الاستيراد",
        description: "فشل في استيراد البيانات. تأكد من صحة الملف",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleBackup = async () => {
    try {
      setIsBackingUp(true);
      await backup();

      toast({
        title: "تم إنشاء نسخة احتياطية",
        description: "تم تحميل ملف النسخة الاحتياطية",
      });
    } catch (error) {
      toast({
        title: "خطأ في النسخ الاحتياطي",
        description: "فشل في إنشاء النسخة الاحتياطية",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        title: "لم يتم اختيار ملف",
        description: "يرجى اختيار ملف النسخة الاحتياطية",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsRestoring(true);
      await restore(file);

      toast({
        title: "تم استعادة البيانات بنجاح",
        description: "تم استعادة البيانات من النسخة الاحتياطية",
      });
    } catch (error) {
      toast({
        title: "خطأ في الاستعادة",
        description: "فشل في استعادة البيانات. تأكد من صحة الملف",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshData();
      toast({
        title: "تم تحديث البيانات",
        description: "تم تحديث البيانات بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحديث",
        description: "فشل في تحديث البيانات",
        variant: "destructive",
      });
    }
  };

  const handleClearDatabase = async () => {
    try {
      setIsClearing(true);
      await clearDatabase();
      setShowClearConfirm(false);
      toast({
        title: "تم تفريغ قاعدة البيانات",
        description: "تم حذف جميع البيانات مع الاحتفاظ بالبيانات الافتراضية",
      });
    } catch (error) {
      toast({
        title: "خطأ في التفريغ",
        description: "فشل في تفريغ قاعدة البيانات",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleResetDatabase = async () => {
    try {
      setIsResetting(true);
      await resetDatabase();
      setShowResetConfirm(false);
      toast({
        title: "تم إعادة تعيين قاعدة البيانات",
        description:
          "تم حذف جميع البيانات وإعادة إنشاء قاعدة البيانات من الصفر",
      });
    } catch (error) {
      toast({
        title: "خطأ في إعادة التعيين",
        description: "فشل في إعادة تعيين قاعدة البيانات",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const getDataStats = () => {
    return {
      categories: categories.length,
      products: products.length,
      sales: sales.length,
      purchaseInvoices: purchaseInvoices.length,
      totalSales: sales.reduce((sum, sale) => sum + sale.total_amount, 0),
      totalPurchases: purchaseInvoices.reduce(
        (sum, purchase) => sum + purchase.total_amount,
        0
      ),
    };
  };

  const stats = getDataStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-blue-800">إدارة البيانات</h2>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          className="border-blue-200 hover:bg-blue-50"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          تحديث البيانات
        </Button>
      </div>

      {/* Data Statistics */}
      <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Database className="w-5 h-5" />
            إحصائيات البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.categories}
              </div>
              <div className="text-sm text-gray-600">الفئات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.products}
              </div>
              <div className="text-sm text-gray-600">المنتجات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.sales}
              </div>
              <div className="text-sm text-gray-600">المبيعات</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.purchaseInvoices}
              </div>
              <div className="text-sm text-gray-600">فواتير الشراء</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {stats.totalSales.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                إجمالي المبيعات (درهم)
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.totalPurchases.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">
                إجمالي المشتريات (درهم)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export/Import Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Data */}
        <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Download className="w-5 h-5" />
              تصدير البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              قم بتصدير جميع البيانات إلى ملف JSON للنسخ الاحتياطي أو النقل
            </p>

            <div className="space-y-3">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <FileText className="w-4 h-4 mr-2" />
                {isExporting ? "جاري التصدير..." : "تصدير إلى JSON"}
              </Button>

              <Button
                onClick={handleBackup}
                disabled={isBackingUp}
                variant="outline"
                className="w-full border-green-200 hover:bg-green-50"
              >
                <Download className="w-4 h-4 mr-2" />
                {isBackingUp ? "جاري النسخ..." : "نسخة احتياطية"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Data */}
        <Card className="bg-white/60 backdrop-blur-sm border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Upload className="w-5 h-5" />
              استيراد البيانات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              قم بتحميل ملف JSON لاستيراد البيانات أو استعادة النسخة الاحتياطية
            </p>

            <div className="space-y-3">
              <div>
                <Label htmlFor="file-input" className="text-sm font-medium">
                  اختر ملف JSON
                </Label>
                <Input
                  id="file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="mt-1"
                />
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleImport}
                  disabled={isImporting}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isImporting ? "جاري الاستيراد..." : "استيراد من JSON"}
                </Button>

                <Button
                  onClick={handleRestore}
                  disabled={isRestoring}
                  variant="outline"
                  className="w-full border-orange-200 hover:bg-orange-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isRestoring
                    ? "جاري الاستعادة..."
                    : "استعادة من النسخة الاحتياطية"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Management Section */}
      <Card className="bg-white/60 backdrop-blur-sm border-red-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            إدارة قاعدة البيانات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            <strong>تحذير:</strong> هذه العمليات لا يمكن التراجع عنها. تأكد من
            عمل نسخة احتياطية قبل المتابعة.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clear Database */}
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  تفريغ قاعدة البيانات
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  حذف جميع البيانات مع الاحتفاظ بالبيانات الافتراضية (الفئات
                  والمنتجات الأساسية)
                </p>
              </div>

              {!showClearConfirm ? (
                <Button
                  onClick={() => setShowClearConfirm(true)}
                  variant="outline"
                  className="w-full border-orange-200 hover:bg-orange-50 text-orange-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  تفريغ قاعدة البيانات
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 font-medium">
                    هل أنت متأكد من تفريغ قاعدة البيانات؟
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleClearDatabase}
                      disabled={isClearing}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      {isClearing ? "جاري التفريغ..." : "نعم، فرغ"}
                    </Button>
                    <Button
                      onClick={() => setShowClearConfirm(false)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Database */}
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">
                  إعادة تعيين قاعدة البيانات
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  حذف جميع البيانات وإعادة إنشاء قاعدة البيانات من الصفر
                </p>
              </div>

              {!showResetConfirm ? (
                <Button
                  onClick={() => setShowResetConfirm(true)}
                  variant="outline"
                  className="w-full border-red-200 hover:bg-red-50 text-red-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  إعادة تعيين قاعدة البيانات
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-600 font-medium">
                    هل أنت متأكد من إعادة تعيين قاعدة البيانات؟
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleResetDatabase}
                      disabled={isResetting}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                    >
                      {isResetting ? "جاري إعادة التعيين..." : "نعم، أعد تعيين"}
                    </Button>
                    <Button
                      onClick={() => setShowResetConfirm(false)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagement;
