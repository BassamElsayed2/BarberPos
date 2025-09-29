import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  dbManager,
  Category,
  Product,
  Sale,
  PurchaseInvoice,
  Employee,
} from "@/lib/database";

interface DatabaseContextType {
  // State
  categories: Category[];
  products: Product[];
  sales: Sale[];
  purchaseInvoices: PurchaseInvoice[];
  employees: Employee[];
  isLoading: boolean;
  error: string | null;

  // Database manager
  dbManager: typeof dbManager;

  // Category operations
  addCategory: (
    category: Omit<Category, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Product operations
  addProduct: (
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Sale operations
  addSale: (
    sale: Omit<Sale, "id" | "created_at" | "updated_at">
  ) => Promise<void>;

  // Purchase operations
  addPurchaseInvoice: (
    purchase: Omit<PurchaseInvoice, "id" | "created_at" | "updated_at">
  ) => Promise<void>;

  // Employee operations
  addEmployee: (
    employee: Omit<Employee, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  // Utility operations
  exportToJSON: () => Promise<string>;
  importFromJSON: (jsonData: string) => Promise<void>;
  backup: () => Promise<void>;
  restore: (file: File) => Promise<void>;
  refreshData: () => Promise<void>;
  clearDatabase: () => Promise<void>;
  resetDatabase: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(
  undefined
);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({
  children,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(
    []
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        categoriesData,
        productsData,
        salesData,
        purchaseInvoicesData,
        employeesData,
      ] = await Promise.all([
        dbManager.getCategories(),
        dbManager.getProducts(),
        dbManager.getSales(),
        dbManager.getPurchaseInvoices(),
        dbManager.getEmployees(),
      ]);

      setCategories(categoriesData);
      setProducts(productsData);
      setSales(salesData);
      setPurchaseInvoices(purchaseInvoicesData);
      setEmployees(employeesData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while loading data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Category operations
  const addCategory = async (
    category: Omit<Category, "id" | "created_at" | "updated_at">
  ) => {
    try {
      await dbManager.addCategory(category);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add category");
      throw err;
    }
  };

  const updateCategory = async (id: string, category: Partial<Category>) => {
    try {
      await dbManager.updateCategory(id, category);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update category"
      );
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await dbManager.deleteCategory(id);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete category"
      );
      throw err;
    }
  };

  // Product operations
  const addProduct = async (
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ) => {
    try {
      await dbManager.addProduct(product);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add product");
      throw err;
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    try {
      await dbManager.updateProduct(id, product);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await dbManager.deleteProduct(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      throw err;
    }
  };

  // Sale operations
  const addSale = async (
    sale: Omit<Sale, "id" | "created_at" | "updated_at">
  ) => {
    try {
      await dbManager.addSale(sale);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add sale");
      throw err;
    }
  };

  // Purchase operations
  const addPurchaseInvoice = async (
    purchase: Omit<PurchaseInvoice, "id" | "created_at" | "updated_at">
  ) => {
    try {
      await dbManager.addPurchaseInvoice(purchase);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add purchase invoice"
      );
      throw err;
    }
  };

  // Employee operations
  const addEmployee = async (
    employee: Omit<Employee, "id" | "created_at" | "updated_at">
  ) => {
    try {
      await dbManager.addEmployee(employee);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add employee");
      throw err;
    }
  };

  const updateEmployee = async (id: string, employee: Partial<Employee>) => {
    try {
      await dbManager.updateEmployee(id, employee);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update employee"
      );
      throw err;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      await dbManager.deleteEmployee(id);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete employee"
      );
      throw err;
    }
  };

  // Utility operations
  const exportToJSON = async (): Promise<string> => {
    try {
      return await dbManager.exportToJSON();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export data");
      throw err;
    }
  };

  const importFromJSON = async (jsonData: string) => {
    try {
      await dbManager.importFromJSON(jsonData);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import data");
      throw err;
    }
  };

  const backup = async () => {
    try {
      await dbManager.backup();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to backup data");
      throw err;
    }
  };

  const restore = async (file: File) => {
    try {
      await dbManager.restore(file);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore data");
      throw err;
    }
  };

  const refreshData = async () => {
    await loadData();
  };

  const clearDatabase = async () => {
    try {
      await dbManager.clearDatabase();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear database");
      throw err;
    }
  };

  const resetDatabase = async () => {
    try {
      await dbManager.resetDatabase();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset database");
      throw err;
    }
  };

  const value: DatabaseContextType = {
    // State
    categories,
    products,
    sales,
    purchaseInvoices,
    employees,
    isLoading,
    error,

    // Database manager
    dbManager,

    // Category operations
    addCategory,
    updateCategory,
    deleteCategory,

    // Product operations
    addProduct,
    updateProduct,
    deleteProduct,

    // Sale operations
    addSale,

    // Purchase operations
    addPurchaseInvoice,

    // Employee operations
    addEmployee,
    updateEmployee,
    deleteEmployee,

    // Utility operations
    exportToJSON,
    importFromJSON,
    backup,
    restore,
    refreshData,
    clearDatabase,
    resetDatabase,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};
