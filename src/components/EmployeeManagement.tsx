import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Employee } from "@/lib/database";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Phone,
  DollarSign,
  Percent,
  Search,
  RefreshCw,
} from "lucide-react";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    salary: "",
    commission: "",
  });
  const { toast } = useToast();
  const {
    employees: contextEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    dbManager,
  } = useDatabase();

  const loadEmployees = useCallback(async () => {
    try {
      const data = await dbManager.getEmployees();
      setEmployees(data);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الموظفين",
        variant: "destructive",
      });
    }
  }, [dbManager, toast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Use context employees when available
  useEffect(() => {
    if (contextEmployees && contextEmployees.length > 0) {
      setEmployees(contextEmployees);
    }
  }, [contextEmployees]);

  const handleAddEmployee = async () => {
    if (
      !formData.name ||
      !formData.phone ||
      !formData.salary ||
      !formData.commission
    ) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    // Validate numeric inputs
    const salary = parseFloat(formData.salary);
    const commission = parseFloat(formData.commission);

    if (isNaN(salary) || salary < 0) {
      toast({
        title: "خطأ",
        description: "الراتب يجب أن يكون رقماً صحيحاً أكبر من أو يساوي صفر",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(commission) || commission < 0 || commission > 100) {
      toast({
        title: "خطأ",
        description: "العمولة يجب أن تكون بين 0 و 100",
        variant: "destructive",
      });
      return;
    }

    try {
      await addEmployee({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        salary: salary,
        commission: commission,
      });

      toast({
        title: "نجح",
        description: "تم إضافة الموظف بنجاح",
      });

      setFormData({ name: "", phone: "", salary: "", commission: "" });
      setIsAddDialogOpen(false);
    } catch (error) {
      let errorMessage = "فشل في إضافة الموظف";

      if (error instanceof Error) {
        if (error.message.includes("UNIQUE constraint failed")) {
          errorMessage = "رقم الهاتف موجود مسبقاً";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEditEmployee = async () => {
    if (
      !editingEmployee ||
      !formData.name ||
      !formData.phone ||
      !formData.salary ||
      !formData.commission
    ) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    // Validate numeric inputs
    const salary = parseFloat(formData.salary);
    const commission = parseFloat(formData.commission);

    if (isNaN(salary) || salary < 0) {
      toast({
        title: "خطأ",
        description: "الراتب يجب أن يكون رقماً صحيحاً أكبر من أو يساوي صفر",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(commission) || commission < 0 || commission > 100) {
      toast({
        title: "خطأ",
        description: "العمولة يجب أن تكون بين 0 و 100",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateEmployee(editingEmployee.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        salary: salary,
        commission: commission,
      });

      toast({
        title: "نجح",
        description: "تم تحديث بيانات الموظف بنجاح",
      });

      setFormData({ name: "", phone: "", salary: "", commission: "" });
      setEditingEmployee(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      let errorMessage = "فشل في تحديث بيانات الموظف";

      if (error instanceof Error) {
        if (error.message.includes("UNIQUE constraint failed")) {
          errorMessage = "رقم الهاتف موجود مسبقاً";
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await deleteEmployee(id);
      toast({
        title: "نجح",
        description: "تم حذف الموظف بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الموظف",
        variant: "destructive",
      });
    }
  };

  const handleRecreateTable = async () => {
    try {
      await dbManager.recreateEmployeesTable();
      toast({
        title: "نجح",
        description: "تم إعادة إنشاء جدول الموظفين بنجاح",
      });
      loadEmployees();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إعادة إنشاء جدول الموظفين",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      phone: employee.phone,
      salary: employee.salary.toString(),
      commission: employee.commission.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">إدارة الموظفين</h2>
            <p className="text-gray-600">إضافة وتعديل وحذف بيانات الموظفين</p>
          </div>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              إضافة موظف جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة موظف جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="أدخل اسم الموظف"
                />
              </div>
              <div>
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
              <div>
                <Label htmlFor="salary">الراتب</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  placeholder="أدخل الراتب"
                />
              </div>
              <div>
                <Label htmlFor="commission">العمولة (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  value={formData.commission}
                  onChange={(e) =>
                    setFormData({ ...formData, commission: e.target.value })
                  }
                  placeholder="أدخل نسبة العمولة"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddEmployee} className="flex-1">
                  إضافة
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="البحث في الموظفين..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleRecreateTable}
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            إعادة إنشاء الجدول
          </Button>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-200">
          إجمالي الموظفين: {employees.length}
        </Badge>
      </div>

      {/* Employees Table */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <CardTitle className="flex items-center gap-3 text-green-800">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            قائمة الموظفين
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-700 border-green-200"
            >
              {filteredEmployees.length} موظف
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                <TableRow className="border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-700 py-4 px-6 ">
                    الاسم
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6 ">
                    رقم الهاتف
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6 ">
                    الراتب
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6 ">
                    العمولة
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6 text-center">
                    الإجراءات
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium">لا توجد موظفين</p>
                          <p className="text-sm">ابدأ بإضافة موظف جديد</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee, index) => (
                    <TableRow
                      key={employee.id}
                      className={`hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {employee.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {employee.name}
                            </p>
                            <p className="text-sm text-gray-500">موظف</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-4 h-4 text-green-500" />
                          <span className="font-medium">{employee.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-700">
                            {employee.salary.toLocaleString()} ريال
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Percent className="w-4 h-4 text-blue-500" />
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 font-medium"
                          >
                            {employee.commission}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(employee)}
                            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600">
                                  تأكيد الحذف
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف الموظف{" "}
                                  <span className="font-semibold">
                                    "{employee.name}"
                                  </span>
                                  ؟
                                  <br />
                                  <span className="text-red-600 font-medium">
                                    لا يمكن التراجع عن هذا الإجراء.
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDeleteEmployee(employee.id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الموظف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">الاسم</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="أدخل اسم الموظف"
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">رقم الهاتف</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="أدخل رقم الهاتف"
              />
            </div>
            <div>
              <Label htmlFor="edit-salary">الراتب</Label>
              <Input
                id="edit-salary"
                type="number"
                value={formData.salary}
                onChange={(e) =>
                  setFormData({ ...formData, salary: e.target.value })
                }
                placeholder="أدخل الراتب"
              />
            </div>
            <div>
              <Label htmlFor="edit-commission">العمولة (%)</Label>
              <Input
                id="edit-commission"
                type="number"
                value={formData.commission}
                onChange={(e) =>
                  setFormData({ ...formData, commission: e.target.value })
                }
                placeholder="أدخل نسبة العمولة"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleEditEmployee} className="flex-1">
                تحديث
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeManagement;
