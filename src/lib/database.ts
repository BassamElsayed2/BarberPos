// Re-export types and database manager from API-based implementation
export {
  type Category,
  type Product,
  type Sale,
  type SaleItem,
  type PurchaseInvoice,
  type PurchaseItem,
  type Employee,
  dbManager,
} from "./api-database";
