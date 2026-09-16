import { Category, Product, StoreSettings, User, Shift, Sale, Expense, Customer, DebtPayment, Supplier, SupplierInvoice, SupplierPayment } from '../types';

export const initialCustomers: Customer[] = [];

export const initialDebtPayments: DebtPayment[] = [];

export const initialStoreSettings: StoreSettings = {
  id: 'store_settings_singleton',
  storeName: 'نقطة البيع وإدارة المتجر',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  logoPath: '',
  taxNumber: '',
  taxRate: 14,
  currency: 'EGP',
  invoicePrefix: 'INV',
  receiptFooter: 'شكراً لتعاملكم معنا',
  enableTax: false,
  lastInvoiceNumber: 1000,
};

export const initialUsers: User[] = [
  {
    id: 'admin',
    username: 'admin',
    password: '123',
    displayName: 'مدير النظام (Admin)',
    role: 'manager',
    phone: '',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cashier',
    username: 'cashier',
    password: '123',
    displayName: 'الكاشير',
    role: 'cashier',
    phone: '',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const initialCategories: Category[] = [
  { id: 'cat_general', name: 'عام', nameEn: 'General', color: '#2563eb', sortOrder: 1 },
];

export const initialProducts: Product[] = [];

export const initialExpenses: Expense[] = [];

export const initialShifts: Shift[] = [];

export const initialSales: Sale[] = [];

export const initialSuppliers: Supplier[] = [];

export const initialSupplierInvoices: SupplierInvoice[] = [];

export const initialSupplierPayments: SupplierPayment[] = [];
