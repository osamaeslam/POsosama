export type UserRole = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  username: string;
  displayName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  logoPath?: string;
  taxNumber: string;
  taxRate: number; // e.g. 14 for 14% or 0
  currency: string; // 'EGP', 'SAR', 'USD', etc.
  invoicePrefix: string; // 'INV'
  receiptFooter: string;
  enableTax: boolean;
  lastInvoiceNumber: number;
}

export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  color: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  barcode: string;
  name: string;
  price: number;
  minPrice: number;
  wholesalePrice: number;
  cost: number;
  stock: number;
  minStock: number;
  categoryId: string;
  imagePath?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number; // can be adjusted within minPrice
  discount: number; // per item discount
  subtotal: number;
}

export type PaymentMethod = 'cash' | 'credit' | 'wallet' | 'card' | 'split';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalDebt: number; // Current outstanding debt
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  receiptNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  amount: number;
  paymentMethod: 'cash' | 'wallet';
  walletProvider?: string;
  shiftId?: string;
  notes?: string;
  createdAt: string;
  cashierName: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productBarcode: string;
  productName: string;
  quantity: number;
  price: number;
  cost: number;
  wholesalePrice: number;
  subtotal: number;
  refundedQuantity: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  createdAt: string;
  userId: string;
  cashierName: string;
  itemsCount: number;
  isRefund: boolean;
  originalSaleId?: string;
  shiftId: string;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeGiven?: number;
  cardAmount?: number;
  // Debt / Credit Customer Fields
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  creditPaidAmount?: number; // Cash or wallet paid upfront in a credit sale
  creditRemainingDebt?: number; // Outstanding amount added to customer's debt
  // E-Wallet fields
  walletProvider?: string; // 'فودافون كاش', 'إنستاباي', 'أورانج كاش', 'وي باي', 'محفظة بنكية'
  walletRefNumber?: string;
  notes?: string;
  items: SaleItem[];
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  openTime: string;
  closeTime?: string;
  closedBy?: string;
  openingCash: number;
  closingCash?: number;
  totalSales: number; // Grand total sales value
  totalCashSales: number; // Actual cash added to drawer from cash sales
  totalDebtCollectionsCash: number; // Cash collected from customers repaying debt
  totalWalletSales: number; // Sales via E-Wallet (not in drawer)
  totalCreditSales: number; // Sales on debt/credit (not in drawer)
  totalRefunds: number; // Cash refunded
  totalExpenses: number; // Cash expenses taken from drawer
  expectedCash?: number; // openingCash + totalCashSales + totalDebtCollectionsCash - totalRefunds - totalExpenses
  cashDifference?: number;
  isOpen: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'rent' | 'utilities' | 'operations' | 'maintenance' | 'supplies' | 'other';
  notes?: string;
  createdAt: string;
  userId: string;
  shiftId?: string;
}

export interface ActivityLog {
  id: string;
  sessionId?: string;
  timestamp: string;
  type: 'sale' | 'refund' | 'product_created' | 'stock_adjusted' | 'shift_opened' | 'shift_closed' | 'expense' | 'debt_payment';
  description: string;
  userName: string;
  details?: string;
}

export interface NotificationAlert {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'session_warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  productId?: string;
}

// Supplier & Purchases Management
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  companyName?: string;
  address?: string;
  totalPayable: number; // مستحقات المورد (مديونية المحل للمورد)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoiceItem {
  id: string;
  productId: string;
  productBarcode: string;
  productName: string;
  quantity: number;
  unitCost: number; // سعر الشراء للقطعة
  sellingPrice?: number; // سعر البيع الجديد المقترح (اختياري)
  subtotal: number;
}

export interface SupplierInvoice {
  id: string;
  invoiceNumber: string; // كود الفاتورة في النظام e.g. SUP-1001
  supplierInvoiceRef?: string; // رقم الفاتورة الورقية الخاصة بالمورد
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  totalAmount: number; // إجمالي قيمة البضاعة المشتراة
  paidAmount: number; // المدفوع كاش أو بنك
  remainingDebt: number; // المتبقي آجل على المحل لصالح المورد
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'cash' | 'wallet' | 'bank' | 'credit';
  paidFromCashDrawer: boolean; // هل تم الدفع من درج الكاشير في الوردية الحالية
  shiftId?: string;
  userId: string;
  userName: string;
  notes?: string;
  items: SupplierInvoiceItem[];
  createdAt: string;
}

export interface SupplierPayment {
  id: string;
  receiptNumber: string; // سند صرف نقدية لمورد e.g. VCH-SUP-101
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentMethod: 'cash' | 'wallet' | 'bank';
  paidFromCashDrawer: boolean;
  shiftId?: string;
  notes?: string;
  createdAt: string;
  userName: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'debts'
  | 'invoices'
  | 'suppliers'
  | 'products'
  | 'stock-alerts'
  | 'expenses'
  | 'sessions'
  | 'reports'
  | 'settings';

export interface CacheCleanupResult {
  freedBytes: number;
  itemsRemoved: number;
  timestamp: string;
  message: string;
}

export interface StorageStats {
  storageType: 'sqlite' | 'indexeddb' | 'localstorage';
  totalProducts: number;
  totalSales: number;
  totalCustomers: number;
  totalSuppliers?: number;
  totalSupplierInvoices?: number;
  estimatedSizeKb: number;
  isOnline: boolean;
  lastCleanedAt?: string;
}
