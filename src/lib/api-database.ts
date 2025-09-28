// API-based database manager for SQL Server backend
const API_BASE_URL = (() => {
  // Check if we're running on the production domain
  if (
    typeof window !== "undefined" &&
    window.location.hostname === "pos1.ens.eg"
  ) {
    return "https://pos1.ens.eg/api";
  }
  // Check environment variable as fallback
  if (process.env.NODE_ENV === "production") {
    return "https://pos1.ens.eg/api";
  }
  // Default to localhost for development
  return "http://localhost:4007/api";
})();

// Types for our POS system (same as before)
export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  barcode?: string;
  category_id?: string;
  stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  total_amount: number;
  employee_id?: string;
  employee_name?: string;
  seller_user?: string;
  items: SaleItem[];
  created_at: string;
  updated_at?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_name: string;
  total_amount: number;
  items: PurchaseItem[];
  created_at: string;
  updated_at?: string;
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  salary: number;
  commission: number;
  created_at?: string;
  updated_at?: string;
}

class ApiDatabaseManager {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return this.makeRequest<Category[]>("/categories");
  }

  async addCategory(
    category: Omit<Category, "id" | "created_at" | "updated_at">
  ): Promise<Category> {
    return this.makeRequest<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  }

  async updateCategory(id: string, category: Partial<Category>): Promise<void> {
    await this.makeRequest(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.makeRequest(`/categories/${id}`, {
      method: "DELETE",
    });
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return this.makeRequest<Product[]>("/products");
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      return await this.makeRequest<Product>(`/products/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      return await this.makeRequest<Product>(`/products/barcode/${barcode}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null;
      }
      throw error;
    }
  }

  async addProduct(
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ): Promise<Product> {
    return this.makeRequest<Product>("/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    await this.makeRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.makeRequest(`/products/${id}`, {
      method: "DELETE",
    });
  }

  async updateProductStock(id: string, newStock: number): Promise<void> {
    await this.makeRequest(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify({ stock: newStock }),
    });
  }

  // Sale operations
  async addSale(
    sale: Omit<Sale, "id" | "created_at" | "updated_at">
  ): Promise<Sale> {
    return this.makeRequest<Sale>("/sales", {
      method: "POST",
      body: JSON.stringify(sale),
    });
  }

  async getSales(): Promise<Sale[]> {
    return this.makeRequest<Sale[]>("/sales");
  }

  // Purchase operations
  async addPurchaseInvoice(
    purchase: Omit<PurchaseInvoice, "id" | "created_at" | "updated_at">
  ): Promise<PurchaseInvoice> {
    return this.makeRequest<PurchaseInvoice>("/purchases", {
      method: "POST",
      body: JSON.stringify(purchase),
    });
  }

  async getPurchaseInvoices(): Promise<PurchaseInvoice[]> {
    return this.makeRequest<PurchaseInvoice[]>("/purchases");
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return this.makeRequest<Employee[]>("/employees");
  }

  async addEmployee(
    employee: Omit<Employee, "id" | "created_at" | "updated_at">
  ): Promise<Employee> {
    return this.makeRequest<Employee>("/employees", {
      method: "POST",
      body: JSON.stringify(employee),
    });
  }

  async updateEmployee(id: string, employee: Partial<Employee>): Promise<void> {
    await this.makeRequest(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(employee),
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.makeRequest(`/employees/${id}`, {
      method: "DELETE",
    });
  }

  // Export/Import functionality
  async exportToJSON(): Promise<string> {
    const data = await this.makeRequest<{
      categories: Category[];
      products: Product[];
      sales: Sale[];
      employees: Employee[];
      purchaseInvoices: PurchaseInvoice[];
    }>("/utility/export");
    return JSON.stringify(data, null, 2);
  }

  async importFromJSON(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    await this.makeRequest("/utility/import", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Backup and restore
  async backup(): Promise<void> {
    const jsonData = await this.exportToJSON();
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pos_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async restore(file: File): Promise<void> {
    const text = await file.text();
    await this.importFromJSON(text);
  }

  // Clear all data from database
  async clearDatabase(): Promise<void> {
    await this.makeRequest("/utility/clear", {
      method: "POST",
    });
  }

  // Reset database completely
  async resetDatabase(): Promise<void> {
    await this.clearDatabase();
  }

  // Force recreate employees table (not needed for SQL Server)
  async recreateEmployeesTable(): Promise<void> {
    // This method is kept for compatibility but not needed for SQL Server
    console.log("recreateEmployeesTable not needed for SQL Server");
  }
}

// Create singleton instance
export const dbManager = new ApiDatabaseManager();
