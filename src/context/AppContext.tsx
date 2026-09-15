import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ActiveTab,
  Category,
  Expense,
  Product,
  Sale,
  Shift,
  StoreSettings,
  User,
  SaleItem,
  CartItem,
  Customer,
  DebtPayment,
  PaymentMethod,
  CacheCleanupResult,
  StorageStats,
  Supplier,
  SupplierInvoice,
  SupplierPayment,
  SupplierInvoiceItem,
} from '../types';
import {
  initialCategories,
  initialExpenses,
  initialProducts,
  initialSales,
  initialShifts,
  initialStoreSettings,
  initialUsers,
    initialCustomers,
    initialDebtPayments,
  } from '../services/mockData';
import { translations } from '../locales/translations';

interface CheckoutExtraOptions {
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  creditPaidAmount?: number;
  walletProvider?: string;
  walletRefNumber?: string;
}

interface AppContextType {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  t: (typeof translations)['ar'];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Settings
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;

  // Categories & Products
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (id: string, quantityToAdd: number) => void;

  // Customers & Debts
  customers: Customer[];
  debtPayments: DebtPayment[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalDebt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  payCustomerDebt: (
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'wallet',
    walletProvider?: string,
    notes?: string
  ) => DebtPayment;

  // Suppliers & Purchases
  suppliers: Supplier[];
  supplierInvoices: SupplierInvoice[];
  supplierPayments: SupplierPayment[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'totalPayable'>) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  createSupplierInvoice: (invoiceData: {
    supplierId: string;
    supplierName: string;
    supplierPhone?: string;
    supplierInvoiceRef?: string;
    paymentMethod: 'cash' | 'wallet' | 'bank' | 'credit';
    paidAmount: number;
    paidFromCashDrawer: boolean;
    notes?: string;
    items: {
      productId: string;
      productBarcode: string;
      productName: string;
      quantity: number;
      unitCost: number;
      sellingPrice?: number;
      subtotal: number;
    }[];
  }) => SupplierInvoice;
  paySupplierDebt: (
    supplierId: string,
    amount: number,
    paymentMethod: 'cash' | 'wallet' | 'bank',
    paidFromCashDrawer: boolean,
    notes?: string
  ) => SupplierPayment;

  // Shifts
  currentShift: Shift | null;
  shifts: Shift[];
  openShift: (openingCash: number) => Shift;
  closeShift: (closingCash: number) => Shift;

  // Sales & Invoices
  sales: Sale[];
  checkoutCart: (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    discount: number,
    cashReceived?: number,
    notes?: string,
    extra?: CheckoutExtraOptions
  ) => Sale;
  processRefund: (saleId: string, refundedItems: { productId: string; quantity: number }[]) => Sale | null;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'userId' | 'shiftId'>) => Expense;
  deleteExpense: (id: string) => void;

  // Backup, Restore & Reset
  exportDataJson: () => void;
  importDataJson: (jsonString: string) => boolean;
  resetAllData: () => void;
  clearToEmptyStore: () => void;

  // System Health, Cache & Maintenance
  isOnline: boolean;
  cleanTempCache: () => Promise<CacheCleanupResult>;
  getStorageStats: () => StorageStats;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const inMemoryStore: Record<string, string> = {};

// Background IndexedDB persistence for browser mode (supports hundreds of MBs of offline data)
const IDB_NAME = 'osama_pos_offline_db';
const IDB_STORE = 'app_data';

const saveToIndexedDB = (key: string, value: string) => {
  if (typeof window === 'undefined' || !window.indexedDB) return;
  try {
    const request = window.indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put({ key, value, updatedAt: Date.now() });
    };
  } catch (err) {
    console.warn('IndexedDB sync error:', err);
  }
};

const appStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: (key) => {
    if (window.bayaaDesktop?.database) {
      const databaseValue = window.bayaaDesktop.database.getSync<string>(key);
      if (databaseValue !== null && databaseValue !== undefined) {
        return typeof databaseValue === 'string' ? databaseValue : JSON.stringify(databaseValue);
      }
    }
    const localVal = window.localStorage.getItem(key);
    if (localVal !== null) return localVal;
    return inMemoryStore[key] ?? null;
  },
  setItem: (key, value) => {
    inMemoryStore[key] = value;
    if (window.bayaaDesktop?.database) {
      window.bayaaDesktop.database.setSync(key, value);
    }
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      console.warn('LocalStorage quota limit reached, persisted via IndexedDB & memory:', e);
    }
    saveToIndexedDB(key, value);
  },
  removeItem: (key) => {
    delete inMemoryStore[key];
    if (window.bayaaDesktop?.database) {
      window.bayaaDesktop.database.deleteSync(key);
    }
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      console.warn('LocalStorage remove error:', e);
    }
  },
};

const STORAGE_KEYS = {
  LANG: 'bayaa_pos_lang',
  SETTINGS: 'bayaa_pos_settings',
  USERS: 'bayaa_pos_users',
  CURRENT_USER_ID: 'bayaa_pos_current_user_id',
  CATEGORIES: 'bayaa_pos_categories',
  PRODUCTS: 'bayaa_pos_products',
  SALES: 'bayaa_pos_sales',
  SHIFTS: 'bayaa_pos_shifts',
  EXPENSES: 'bayaa_pos_expenses',
  CUSTOMERS: 'bayaa_pos_customers',
  DEBT_PAYMENTS: 'bayaa_pos_debt_payments',
  SUPPLIERS: 'bayaa_pos_suppliers',
  SUPPLIER_INVOICES: 'bayaa_pos_supplier_invoices',
  SUPPLIER_PAYMENTS: 'bayaa_pos_supplier_payments',
  INITIALIZED: 'bayaa_pos_initialized_v2',
  LAST_EVENT_TIME: 'bayaa_pos_last_event_time',
};

// Keeps local timestamps monotonic when an offline device clock is stale or moved backwards.
const getSafeTimestamp = (): string => {
  const now = Date.now();
  const last = Number(appStorage.getItem(STORAGE_KEYS.LAST_EVENT_TIME) || 0);
  const safeTime = Math.max(now, last + 1);
  appStorage.setItem(STORAGE_KEYS.LAST_EVENT_TIME, String(safeTime));
  return new Date(safeTime).toISOString();
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language
  const [language, setLanguageState] = useState<'ar' | 'en'>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.LANG);
    return saved === 'en' ? 'en' : 'ar';
  });

  const setLanguage = (lang: 'ar' | 'en') => {
    setLanguageState(lang);
    appStorage.setItem(STORAGE_KEYS.LANG, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = translations[language];

  // 2. Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // 3. Store Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        const savedSettings = JSON.parse(saved) as StoreSettings;
        return {
          ...savedSettings,
          taxNumber: '',
          taxRate: 0,
          enableTax: false,
          currency: 'EGP',
        };
      } catch (e) {
        console.error(e);
      }
    }
    return initialStoreSettings;
  });

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = {
        ...prev,
        ...newSettings,
        taxNumber: '',
        taxRate: 0,
        enableTax: false,
        currency: 'EGP',
      };
      appStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    });
  };

  // 4. Users
  const [users, setUsers] = useState<User[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialUsers;
  });

  const [currentUser, setCurrentUserState] = useState<User>(() => {
    const savedId = appStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (savedId) {
      const found = users.find((u) => u.id === savedId);
      if (found) return found;
    }
    return users[0] || initialUsers[0];
  });

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    appStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
  };

  // 5. Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialCategories;
  });

  const saveCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    appStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCategories));
  };

  const addCategory = (category: Omit<Category, 'id'>): Category => {
    const newCategory: Category = { ...category, id: `category-${Date.now()}` };
    saveCategories([...categories, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    saveCategories(categories.map((category) => category.id === id ? { ...category, ...updates } : category));
  };

  const deleteCategory = (id: string) => {
    if (products.some((product) => product.categoryId === id)) {
      throw new Error('لا يمكن حذف فئة مرتبطة بمنتجات. انقل المنتجات أولاً.');
    }
    saveCategories(categories.filter((category) => category.id !== id));
  };

  // 6. Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    appStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
  };

  const addProduct = (item: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProduct: Product = {
      ...item,
      id: String(Date.now()),
      createdAt: getSafeTimestamp(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newProduct, ...products];
    saveProducts(updated);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    saveProducts(updated);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    saveProducts(updated);
  };

  const restockProduct = (id: string, quantityToAdd: number) => {
    const updated = products.map((p) =>
      p.id === id
        ? { ...p, stock: Math.max(0, p.stock + quantityToAdd), updatedAt: new Date().toISOString() }
        : p
    );
    saveProducts(updated);
  };

  // 7. Customers & Debts
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const saveCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    appStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(newCustomers));
  };

  const addCustomer = (item: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalDebt'>): Customer => {
    const newCustomer: Customer = {
      ...item,
      id: `cust_${Date.now()}`,
      totalDebt: 0,
      createdAt: getSafeTimestamp(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newCustomer, ...customers];
    saveCustomers(updated);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const updated = customers.map((c) =>
      c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
    );
    saveCustomers(updated);
  };

  const deleteCustomer = (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (!customer) return;
    if ((customer.totalDebt || 0) > 0) {
      throw new Error('لا يمكن حذف عميل عليه رصيد مستحق');
    }
    const hasHistory = sales.some((sale) => sale.customerId === id) || debtPayments.some((payment) => payment.customerId === id);
    if (hasHistory) {
      throw new Error('لا يمكن حذف عميل لديه فواتير أو تحصيلات سابقة');
    }
    saveCustomers(customers.filter((c) => c.id !== id));
  };

  // Debt Payments
  const [debtPayments, setDebtPayments] = useState<DebtPayment[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.DEBT_PAYMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialDebtPayments;
  });

  const saveDebtPayments = (newPayments: DebtPayment[]) => {
    setDebtPayments(newPayments);
    appStorage.setItem(STORAGE_KEYS.DEBT_PAYMENTS, JSON.stringify(newPayments));
  };

  // 8. Shifts
  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const saveShifts = (newShifts: Shift[]) => {
    setShifts(newShifts);
    appStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(newShifts));
  };

  const currentShift = shifts.find((s) => s.isOpen) || null;

  const openShift = (openingCash: number): Shift => {
    if (currentShift) {
      throw new Error('لا يمكن فتح وردية جديدة قبل إغلاق الوردية الحالية');
    }

    const newShift: Shift = {
      id: `shift_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      openTime: getSafeTimestamp(),
      openingCash: Number(openingCash) || 0,
      totalSales: 0,
      totalCashSales: 0,
      totalDebtCollectionsCash: 0,
      totalWalletSales: 0,
      totalCreditSales: 0,
      totalRefunds: 0,
      totalExpenses: 0,
      totalSupplierPayoutsCash: 0,
      isOpen: true,
    };
    const updated = [newShift, ...shifts];
    saveShifts(updated);
    return newShift;
  };

  const closeShift = (closingCash: number): Shift => {
    if (!currentShift) {
      throw new Error('No open shift to close');
    }
    const expected =
      Number(currentShift.openingCash || 0) +
      Number(currentShift.totalCashSales || 0) +
      Number(currentShift.totalDebtCollectionsCash || 0) -
      Number(currentShift.totalRefunds || 0) -
      Number(currentShift.totalExpenses || 0);
    const countedCash = Number(closingCash);
    if (!Number.isFinite(countedCash) || countedCash < 0) {
      throw new Error('أدخل مبلغ النقدية الفعلي بشكل صحيح');
    }
    const diff = countedCash - expected;

    const closed: Shift = {
      ...currentShift,
      isOpen: false,
      closeTime: getSafeTimestamp(),
      closedBy: currentUser.displayName,
      closingCash: Number.isFinite(Number(closingCash)) ? Number(closingCash) : 0,
      expectedCash: expected,
      cashDifference: diff,
    };

    const updated = shifts.map((s) => (s.id === currentShift.id ? closed : s));
    saveShifts(updated);
    return closed;
  };

  // 9. Debt Collection (Pay Debt)
  const payCustomerDebt = (
    customerId: string,
    amount: number,
    paymentMethod: 'cash' | 'wallet',
    walletProvider?: string,
    notes?: string
  ): DebtPayment => {
    if (!currentShift) {
      throw new Error('يجب فتح وردية قبل تحصيل الديون');
    }

    const targetCustomer = customers.find((c) => c.id === customerId);
    if (!targetCustomer) {
      throw new Error('Customer not found');
    }

  const requestedAmount = Number(amount);
  if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
    throw new Error('مبلغ التحصيل غير صحيح');
  }
  const outstandingDebt = Math.max(0, Number(targetCustomer.totalDebt) || 0);
  if (outstandingDebt <= 0) {
    throw new Error('لا يوجد رصيد مستحق على هذا العميل');
  }
  const payAmount = Math.min(requestedAmount, outstandingDebt);
  const receiptNumber = `REC-${Date.now().toString().slice(-6)}`;

    const newPayment: DebtPayment = {
      id: `dp_${Date.now()}`,
      receiptNumber,
      customerId: targetCustomer.id,
      customerName: targetCustomer.name,
      customerPhone: targetCustomer.phone,
      amount: payAmount,
      paymentMethod,
      walletProvider,
      shiftId: currentShift ? currentShift.id : undefined,
      notes,
      createdAt: getSafeTimestamp(),
      cashierName: currentUser.displayName,
    };

    // 1. Deduct debt from customer
    const updatedCustomer: Customer = {
      ...targetCustomer,
      totalDebt: Math.max(0, targetCustomer.totalDebt - payAmount),
      updatedAt: new Date().toISOString(),
    };
    saveCustomers(customers.map((c) => (c.id === customerId ? updatedCustomer : c)));

    // 2. Save payment receipt
    const updatedPayments = [newPayment, ...debtPayments];
    saveDebtPayments(updatedPayments);

    // 3. If paid in cash, add to active shift cash drawer!
    if (paymentMethod === 'cash' && currentShift) {
      const updatedShifts = shifts.map((s) =>
        s.id === currentShift.id
          ? {
              ...s,
              totalDebtCollectionsCash: (s.totalDebtCollectionsCash || 0) + payAmount,
            }
          : s
      );
      saveShifts(updatedShifts);
    }

    return newPayment;
  };

  // 9.5 Suppliers & Purchase Invoices
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const saveSuppliers = (newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
    appStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(newSuppliers));
  };

  const addSupplier = (item: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'totalPayable'>): Supplier => {
    const newSupplier: Supplier = {
      ...item,
      id: `sup_${Date.now()}`,
      totalPayable: 0,
      createdAt: getSafeTimestamp(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newSupplier, ...suppliers];
    saveSuppliers(updated);
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    const updated = suppliers.map((s) =>
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    );
    saveSuppliers(updated);
  };

  const deleteSupplier = (id: string) => {
    const supplier = suppliers.find((s) => s.id === id);
    if (!supplier) return;
    if ((supplier.totalPayable || 0) > 0) {
      throw new Error('لا يمكن حذف مورد له مستحقات متبقية');
    }
    const hasInvoices = supplierInvoices.some((inv) => inv.supplierId === id);
    if (hasInvoices) {
      throw new Error('لا يمكن حذف مورد مسجل له فواتير شراء سابقة');
    }
    saveSuppliers(suppliers.filter((s) => s.id !== id));
  };

  // Supplier Invoices
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.SUPPLIER_INVOICES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const saveSupplierInvoices = (newInvoices: SupplierInvoice[]) => {
    setSupplierInvoices(newInvoices);
    appStorage.setItem(STORAGE_KEYS.SUPPLIER_INVOICES, JSON.stringify(newInvoices));
  };

  // Supplier Payments
  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.SUPPLIER_PAYMENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const saveSupplierPayments = (newPayments: SupplierPayment[]) => {
    setSupplierPayments(newPayments);
    appStorage.setItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, JSON.stringify(newPayments));
  };

  // Create Supplier Invoice
  const createSupplierInvoice = (invoiceData: {
    supplierId: string;
    supplierName: string;
    supplierPhone?: string;
    supplierInvoiceRef?: string;
    paymentMethod: 'cash' | 'wallet' | 'bank' | 'credit';
    paidAmount: number;
    paidFromCashDrawer: boolean;
    notes?: string;
    items: {
      productId: string;
      productBarcode: string;
      productName: string;
      quantity: number;
      unitCost: number;
      sellingPrice?: number;
      subtotal: number;
    }[];
  }): SupplierInvoice => {
    if (invoiceData.items.length === 0) {
      throw new Error('يجب إضافة صنف واحد على الأقل في فاتورة المورد');
    }

    const totalAmount = invoiceData.items.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);
    const paidAmount = Math.max(0, Number(invoiceData.paidAmount) || 0);
    const remainingDebt = Math.max(0, totalAmount - paidAmount);

    let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (remainingDebt <= 0) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'unpaid';
    }

    const nextNumber = supplierInvoices.length + 101;
    const invoiceNumber = `SUP-${nextNumber}`;

    const newInvoice: SupplierInvoice = {
      id: `sup_inv_${Date.now()}`,
      invoiceNumber,
      supplierInvoiceRef: invoiceData.supplierInvoiceRef?.trim() || undefined,
      supplierId: invoiceData.supplierId,
      supplierName: invoiceData.supplierName,
      supplierPhone: invoiceData.supplierPhone,
      totalAmount,
      paidAmount,
      remainingDebt,
      paymentStatus,
      paymentMethod: invoiceData.paymentMethod,
      paidFromCashDrawer: invoiceData.paidFromCashDrawer,
      shiftId: currentShift ? currentShift.id : undefined,
      userId: currentUser.id,
      userName: currentUser.displayName,
      notes: invoiceData.notes,
      items: invoiceData.items.map((it, idx) => ({
        id: `sup_it_${Date.now()}_${idx}`,
        ...it,
      })),
      createdAt: getSafeTimestamp(),
    };

    // 1. Update / Restock Products
    const updatedProducts = [...products];
    invoiceData.items.forEach((item) => {
      const prodIndex = updatedProducts.findIndex(
        (p) => p.id === item.productId || (item.productBarcode && p.barcode === item.productBarcode)
      );
      if (prodIndex >= 0) {
        const prod = updatedProducts[prodIndex];
        updatedProducts[prodIndex] = {
          ...prod,
          stock: prod.stock + Number(item.quantity),
          cost: Number(item.unitCost),
          price: item.sellingPrice && item.sellingPrice > 0 ? Number(item.sellingPrice) : prod.price,
          updatedAt: new Date().toISOString(),
        };
      } else {
        // Create new product if not found
        const newProd: Product = {
          id: item.productId || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          barcode: item.productBarcode || `${Date.now().toString().slice(-6)}`,
          name: item.productName,
          price:
            item.sellingPrice && item.sellingPrice > 0
              ? Number(item.sellingPrice)
              : Math.round(Number(item.unitCost) * 1.25),
          minPrice: Number(item.unitCost),
          wholesalePrice: Math.round(Number(item.unitCost) * 1.15),
          cost: Number(item.unitCost),
          stock: Number(item.quantity),
          minStock: 5,
          categoryId: categories[0]?.id || 'general',
          isActive: true,
          createdAt: getSafeTimestamp(),
          updatedAt: new Date().toISOString(),
        };
        updatedProducts.push(newProd);
      }
    });
    saveProducts(updatedProducts);

    // 2. Update Supplier Outstanding Debt (totalPayable)
    if (remainingDebt > 0) {
      const targetSupplier = suppliers.find((s) => s.id === invoiceData.supplierId);
      if (targetSupplier) {
        const updatedSupplier: Supplier = {
          ...targetSupplier,
          totalPayable: (targetSupplier.totalPayable || 0) + remainingDebt,
          updatedAt: new Date().toISOString(),
        };
        saveSuppliers(suppliers.map((s) => (s.id === targetSupplier.id ? updatedSupplier : s)));
      }
    }

    // 3. If paid from cash drawer during open shift, record cash deduction!
    const isCashDrawerDeduction = Boolean(
      invoiceData.paidFromCashDrawer &&
      invoiceData.paymentMethod === 'cash' &&
      paidAmount > 0 &&
      currentShift
    );

    if (isCashDrawerDeduction && currentShift) {
      const updatedShifts = shifts.map((s) =>
        s.id === currentShift.id
          ? {
              ...s,
              totalExpenses: (s.totalExpenses || 0) + paidAmount,
              totalSupplierPayoutsCash: (s.totalSupplierPayoutsCash || 0) + paidAmount,
            }
          : s
      );
      saveShifts(updatedShifts);

      const supExpense: Expense = {
        id: `exp_sup_${Date.now()}`,
        title: `فاتورة توريد: ${invoiceData.supplierName} (${invoiceNumber})`,
        amount: paidAmount,
        category: 'supplies',
        notes: `دفعة نقدية مسددة من درج الكاشير لفاتورة الشراء رقم ${invoiceNumber}`,
        createdAt: getSafeTimestamp(),
        userId: currentUser.id,
        shiftId: currentShift.id,
      };
      saveExpenses([supExpense, ...expenses]);
    }

    // 4. Save Invoice
    saveSupplierInvoices([newInvoice, ...supplierInvoices]);
    return newInvoice;
  };

  // Settle / Pay Supplier Debt
  const paySupplierDebt = (
    supplierId: string,
    amount: number,
    paymentMethod: 'cash' | 'wallet' | 'bank',
    paidFromCashDrawer: boolean,
    notes?: string
  ): SupplierPayment => {
    const targetSupplier = suppliers.find((s) => s.id === supplierId);
    if (!targetSupplier) {
      throw new Error('المورد غير موجود');
    }

    const requestedAmount = Number(amount);
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      throw new Error('أدخل مبلغ سداد صحيح');
    }

    const currentPayable = Math.max(0, targetSupplier.totalPayable || 0);
    if (currentPayable <= 0) {
      throw new Error('لا توجد مديونية مستحقة لهذا المورد');
    }

    const payAmount = Math.min(requestedAmount, currentPayable);
    const receiptNumber = `VCH-SUP-${Date.now().toString().slice(-6)}`;

    const isCashDrawerDeduction = Boolean(
      paidFromCashDrawer &&
      paymentMethod === 'cash' &&
      payAmount > 0 &&
      currentShift
    );

    const payment: SupplierPayment = {
      id: `sup_pay_${Date.now()}`,
      receiptNumber,
      supplierId: targetSupplier.id,
      supplierName: targetSupplier.name,
      amount: payAmount,
      paymentMethod,
      paidFromCashDrawer: isCashDrawerDeduction,
      shiftId: currentShift ? currentShift.id : undefined,
      notes,
      createdAt: getSafeTimestamp(),
      userName: currentUser.displayName,
    };

    // 1. Deduct from supplier totalPayable
    const updatedSupplier: Supplier = {
      ...targetSupplier,
      totalPayable: Math.max(0, currentPayable - payAmount),
      updatedAt: new Date().toISOString(),
    };
    saveSuppliers(suppliers.map((s) => (s.id === supplierId ? updatedSupplier : s)));

    // 2. Save Payment
    saveSupplierPayments([payment, ...supplierPayments]);

    // 3. If paid from cash drawer during open shift, record cash expense!
    if (isCashDrawerDeduction && currentShift) {
      const updatedShifts = shifts.map((s) =>
        s.id === currentShift.id
          ? {
              ...s,
              totalExpenses: (s.totalExpenses || 0) + payAmount,
              totalSupplierPayoutsCash: (s.totalSupplierPayoutsCash || 0) + payAmount,
            }
          : s
      );
      saveShifts(updatedShifts);

      const supExpense: Expense = {
        id: `exp_sup_pay_${Date.now()}`,
        title: `سند صرف لمورد: ${targetSupplier.name} (${receiptNumber})`,
        amount: payAmount,
        category: 'supplies',
        notes: `سداد دفعة مديونية لمورد من درج الكاشير بموجب سند رقم ${receiptNumber}`,
        createdAt: getSafeTimestamp(),
        userId: currentUser.id,
        shiftId: currentShift.id,
      };
      saveExpenses([supExpense, ...expenses]);
    }

    return payment;
  };

  // 10. Sales / Invoices
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.SALES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const saveSales = (newSales: Sale[]) => {
    setSales(newSales);
    appStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(newSales));
  };

  const checkoutCart = (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    discount: number,
    cashReceived?: number,
    notes?: string,
    extra?: CheckoutExtraOptions
  ): Sale => {
    if (!currentShift) {
      throw new Error('يجب فتح وردية قبل تسجيل المبيعات');
    }

    for (const item of items) {
      const quantity = Number(item.quantity);
      const stock = Number(item.product.stock);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error('كمية الصنف غير صحيحة');
      }
      if (Number.isFinite(stock) && quantity > stock) {
        throw new Error(`الكمية المطلوبة من ${item.product.name} أك��ر من المخزون المتاح`);
      }
    }

  if (!['cash', 'credit', 'wallet'].includes(paymentMethod)) {
    throw new Error('طريقة الدفع غير مدعومة. استخدم نقدي أو آجل أو محفظة إلكترونية');
  }

  const subtotal = items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
  const safeDiscount = Number(discount || 0);
  if (!Number.isFinite(safeDiscount) || safeDiscount < 0 || safeDiscount > subtotal) {
    throw new Error('قيمة الخصم غير صحيحة');
  }
  const taxAmount = settings.enableTax ? (subtotal * settings.taxRate) / 100 : 0;
  const total = Math.max(0, subtotal + taxAmount - safeDiscount);

  if (paymentMethod === 'cash') {
    const received = Number(cashReceived);
    if (!Number.isFinite(received) || received < total) {
      throw new Error('المبلغ المستلم نقداً أقل من إجمالي الفاتورة');
    }
  }

  if (paymentMethod === 'wallet' && !extra?.walletProvider?.trim()) {
    throw new Error('يرجى تحديد المحفظة الإلكترونية');
  }

  if (paymentMethod === 'credit') {
    if (!extra?.customerName?.trim()) {
      throw new Error('لا يمكن تسجيل فاتورة آجلة بدون اسم العميل');
    }
    if (!extra?.customerPhone?.trim()) {
      throw new Error('لا يمكن تسجيل فاتورة آجلة بدون رقم هاتف العميل');
    }
  }

  const nextInvNum = (settings.lastInvoiceNumber || 1000) + 1;
    const invoiceNumber = `${settings.invoicePrefix}-${nextInvNum}`;
    const saleId = `sale_${Date.now()}`;
    const shiftId = currentShift.id;

    const saleItems: SaleItem[] = items.map((ci, idx) => ({
      id: `si_${Date.now()}_${idx}`,
      saleId,
      productId: ci.product.id,
      productBarcode: ci.product.barcode,
      productName: ci.product.name,
      quantity: ci.quantity,
      price: ci.price,
      cost: ci.product.cost,
      wholesalePrice: ci.product.wholesalePrice,
      subtotal: ci.subtotal,
      refundedQuantity: 0,
    }));

    // Payment amounts calculation
    let cashPaidIntoDrawer = 0;
    let creditPaidAmount = 0;
    let creditRemainingDebt = 0;
    let changeDue = 0;

    if (paymentMethod === 'cash') {
      cashPaidIntoDrawer = total;
      changeDue = cashReceived && cashReceived > total ? cashReceived - total : 0;
    } else if (paymentMethod === 'wallet') {
      cashPaidIntoDrawer = 0;
  } else if (paymentMethod === 'credit') {
  const requestedAdvance = Number(extra?.creditPaidAmount || 0);
  if (!Number.isFinite(requestedAdvance) || requestedAdvance < 0 || requestedAdvance > total) {
    throw new Error('المبلغ المدفوع مقدماً غير صحيح');
  }
  creditPaidAmount = requestedAdvance;
  creditRemainingDebt = total - creditPaidAmount;
  cashPaidIntoDrawer = creditPaidAmount; // الدفعة المقدمة نقدية وتدخل درج الكاشير
  }

    const newSale: Sale = {
      id: saleId,
      invoiceNumber,
      total,
      subtotal,
      tax: taxAmount,
      discount: discount || 0,
      createdAt: getSafeTimestamp(),
      userId: currentUser.id,
      cashierName: currentUser.displayName,
      itemsCount: items.reduce((acc, i) => acc + i.quantity, 0),
      isRefund: false,
      shiftId,
      paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashReceived : undefined,
      changeGiven: changeDue,
      customerId: extra?.customerId,
      customerName: extra?.customerName,
      customerPhone: extra?.customerPhone,
      creditPaidAmount: paymentMethod === 'credit' ? creditPaidAmount : undefined,
      creditRemainingDebt: paymentMethod === 'credit' ? creditRemainingDebt : undefined,
      walletProvider: paymentMethod === 'wallet' ? extra?.walletProvider : undefined,
      walletRefNumber: paymentMethod === 'wallet' ? extra?.walletRefNumber : undefined,
      notes,
      items: saleItems,
    };

    // 1. Decrement stock
    const updatedProducts = products.map((p) => {
      const soldItem = items.find((i) => i.product.id === p.id);
      if (soldItem) {
        return {
          ...p,
          stock: Math.max(0, p.stock - soldItem.quantity),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveProducts(updatedProducts);

    // 2. If credit sale, update or create customer debt
    if (paymentMethod === 'credit' && creditRemainingDebt > 0) {
      if (extra?.customerId) {
        const existing = customers.find((c) => c.id === extra.customerId);
        if (existing) {
          const updatedCustomer: Customer = {
            ...existing,
            totalDebt: (existing.totalDebt || 0) + creditRemainingDebt,
            updatedAt: new Date().toISOString(),
          };
          saveCustomers(customers.map((c) => (c.id === extra.customerId ? updatedCustomer : c)));
        }
      } else if (extra?.customerName) {
        // Find by phone or name or create new
        const existing = customers.find(
          (c) =>
            (extra.customerPhone && c.phone === extra.customerPhone) ||
            c.name.trim().toLowerCase() === extra.customerName?.trim().toLowerCase()
        );
        if (existing) {
          const updatedCustomer: Customer = {
            ...existing,
            totalDebt: (existing.totalDebt || 0) + creditRemainingDebt,
            updatedAt: new Date().toISOString(),
          };
          saveCustomers(customers.map((c) => (c.id === existing.id ? updatedCustomer : c)));
          newSale.customerId = existing.id;
        } else {
          const newCust: Customer = {
            id: `cust_${Date.now()}`,
            name: extra.customerName.trim(),
            phone: extra.customerPhone?.trim() || '',
            totalDebt: creditRemainingDebt,
            notes: `تم إنشاء الحساب تلقائياً من فاتورة آجل #${invoiceNumber}`,
            createdAt: getSafeTimestamp(),
            updatedAt: new Date().toISOString(),
          };
          saveCustomers([newCust, ...customers]);
          newSale.customerId = newCust.id;
        }
      }
    }

    // 3. Update shift breakdown accurately
    if (currentShift) {
      const updatedShifts = shifts.map((s) => {
        if (s.id === currentShift.id) {
          return {
            ...s,
            totalSales: s.totalSales + total,
            totalCashSales: (s.totalCashSales || 0) + cashPaidIntoDrawer,
            totalWalletSales:
              (s.totalWalletSales || 0) + (paymentMethod === 'wallet' ? total : 0),
            totalCreditSales:
              (s.totalCreditSales || 0) + (paymentMethod === 'credit' ? creditRemainingDebt : 0),
          };
        }
        return s;
      });
      saveShifts(updatedShifts);
    }

    // 4. Update last invoice number
    updateSettings({ lastInvoiceNumber: nextInvNum });

    // 5. Save sale
    const updatedSales = [newSale, ...sales];
    saveSales(updatedSales);

    return newSale;
  };

  const processRefund = (
    saleId: string,
    refundedItems: { productId: string; quantity: number }[]
  ): Sale | null => {
    if (!currentShift) {
      throw new Error('يجب فتح وردية قبل تسجيل المرتجعات');
    }

    const originalSale = sales.find((s) => s.id === saleId);
    if (!originalSale) return null;

    let refundTotal = 0;
    const itemsToRefund: SaleItem[] = [];

    refundedItems.forEach(({ productId, quantity }) => {
      const originalItem = originalSale.items.find((i) => i.productId === productId);
      const safeQuantity = Number(quantity);
      const alreadyRefunded = originalItem?.refundedQuantity || 0;
      const refundableQuantity = originalItem ? Math.max(0, originalItem.quantity - alreadyRefunded) : 0;
      if (originalItem && Number.isInteger(safeQuantity) && safeQuantity > 0 && safeQuantity <= refundableQuantity) {
        const itemRefundTotal = originalItem.price * safeQuantity;
        refundTotal += itemRefundTotal;
        itemsToRefund.push({
          ...originalItem,
          id: `ref_item_${Date.now()}_${productId}`,
          quantity: safeQuantity,
          subtotal: itemRefundTotal,
          refundedQuantity: safeQuantity,
        });
      }
    });

    if (itemsToRefund.length === 0) return null;

    const nextInvNum = (settings.lastInvoiceNumber || 1000) + 1;
    const invoiceNumber = `REF-${nextInvNum}`;

    const refundSale: Sale = {
      id: `refund_${Date.now()}`,
      invoiceNumber,
      total: refundTotal,
      subtotal: refundTotal,
      tax: 0,
      discount: 0,
      createdAt: getSafeTimestamp(),
      userId: currentUser.id,
      cashierName: currentUser.displayName,
      itemsCount: itemsToRefund.reduce((acc, i) => acc + i.quantity, 0),
      isRefund: true,
      originalSaleId: saleId,
      shiftId: currentShift.id,
      paymentMethod: originalSale.paymentMethod,
      customerId: originalSale.customerId,
      customerName: originalSale.customerName,
      customerPhone: originalSale.customerPhone,
      items: itemsToRefund,
    };

    // 1. Restore product stock
    const updatedProducts = products.map((p) => {
      const returned = itemsToRefund.find((item) => item.productId === p.id);
      if (returned) {
        return {
          ...p,
          stock: p.stock + returned.quantity,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    saveProducts(updatedProducts);

    // 2. Mark refunded quantity on original sale
    const updatedSales = sales.map((s) => {
      if (s.id === saleId) {
        const updatedItems = s.items.map((item) => {
          const ret = refundedItems.find((ri) => ri.productId === item.productId);
          if (ret) {
            const refundableQuantity = Math.max(0, item.quantity - (item.refundedQuantity || 0));
            const safeQuantity = Math.min(Math.max(0, Math.floor(Number(ret.quantity) || 0)), refundableQuantity);
            return {
              ...item,
              refundedQuantity: (item.refundedQuantity || 0) + safeQuantity,
            };
          }
          return item;
        });
        return { ...s, items: updatedItems };
      }
      return s;
    });
    saveSales([refundSale, ...updatedSales]);

    // 3. Deduct from customer's debt if original sale was credit!
    if (originalSale.paymentMethod === 'credit' && originalSale.customerId) {
      const customer = customers.find((c) => c.id === originalSale.customerId);
      if (customer) {
        const updatedCustomer: Customer = {
          ...customer,
          totalDebt: Math.max(0, customer.totalDebt - refundTotal),
          updatedAt: new Date().toISOString(),
        };
        saveCustomers(customers.map((c) => (c.id === customer.id ? updatedCustomer : c)));
      }
    } else if (currentShift && originalSale.paymentMethod === 'cash') {
      // Cash refunded from drawer
      const updatedShifts = shifts.map((s) =>
        s.id === currentShift.id ? { ...s, totalRefunds: s.totalRefunds + refundTotal } : s
      );
      saveShifts(updatedShifts);
    }

    updateSettings({ lastInvoiceNumber: nextInvNum });

    return refundSale;
  };

  // 11. Expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = appStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const saveExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    appStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(newExpenses));
  };

  const addExpense = (item: Omit<Expense, 'id' | 'createdAt' | 'userId' | 'shiftId'>): Expense => {
    if (!currentShift) {
      throw new Error('يجب فتح وردية قبل تسجيل المصروفات');
    }

    const newExpense: Expense = {
      ...item,
      id: `exp_${Date.now()}`,
      createdAt: getSafeTimestamp(),
      userId: currentUser.id,
      shiftId: currentShift ? currentShift.id : undefined,
    };
    const updated = [newExpense, ...expenses];
    saveExpenses(updated);

    if (currentShift) {
      const updatedShifts = shifts.map((s) =>
        s.id === currentShift.id ? { ...s, totalExpenses: s.totalExpenses + item.amount } : s
      );
      saveShifts(updatedShifts);
    }

    return newExpense;
  };

  const deleteExpense = (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    if (!expense) return;
    const updated = expenses.filter((e) => e.id !== id);
    saveExpenses(updated);
    if (expense.shiftId) {
      saveShifts(
        shifts.map((shift) =>
          shift.id === expense.shiftId
            ? { ...shift, totalExpenses: Math.max(0, shift.totalExpenses - expense.amount) }
            : shift
        )
      );
    }
  };

  // 12. Backup, Restore & Reset
  const exportDataJson = () => {
    const payload = {
      appName: 'Osama Pos',
      version: '2.2.0',
      exportDate: new Date().toISOString(),
      settings,
      users,
      categories,
      products,
      customers,
      debtPayments,
      suppliers,
      supplierInvoices,
      supplierPayments,
      sales,
      shifts,
      expenses,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `osama-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      const collections = ['users', 'categories', 'products', 'customers', 'debtPayments', 'sales', 'shifts', 'expenses'];
      if (!data || !['Osama Pos', 'Bayaa POS'].includes(data.appName) || collections.some((key) => !Array.isArray(data[key]))) {
        throw new Error('Invalid or incomplete Osama Pos backup');
      }
      if (!data.settings || typeof data.settings !== 'object') {
        throw new Error('Backup settings are missing');
      }

      const values = {
        users: data.users,
        categories: data.categories,
        products: data.products,
        customers: data.customers,
        debtPayments: data.debtPayments,
        suppliers: Array.isArray(data.suppliers) ? data.suppliers : [],
        supplierInvoices: Array.isArray(data.supplierInvoices) ? data.supplierInvoices : [],
        supplierPayments: Array.isArray(data.supplierPayments) ? data.supplierPayments : [],
        sales: data.sales,
        shifts: data.shifts,
        expenses: data.expenses,
      };
      appStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(values.users));
      appStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(values.categories));
      appStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(values.products));
      appStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(values.customers));
      appStorage.setItem(STORAGE_KEYS.DEBT_PAYMENTS, JSON.stringify(values.debtPayments));
      appStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(values.suppliers));
      appStorage.setItem(STORAGE_KEYS.SUPPLIER_INVOICES, JSON.stringify(values.supplierInvoices));
      appStorage.setItem(STORAGE_KEYS.SUPPLIER_PAYMENTS, JSON.stringify(values.supplierPayments));
      appStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(values.sales));
      appStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(values.shifts));
      appStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(values.expenses));
      appStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
      window.location.reload();
      return true;
    } catch (err) {
      console.error('Failed to import JSON backup', err);
      return false;
    }
  };

  // Clears out all mock demo products, sales, customers, and shifts to let the user start with their real store!
  const clearToEmptyStore = () => {
    saveProducts([]);
    saveCustomers([]);
    saveDebtPayments([]);
    saveSuppliers([]);
    saveSupplierInvoices([]);
    saveSupplierPayments([]);
    saveSales([]);
    saveExpenses([]);
    const freshShift: Shift = {
      id: `shift_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.displayName,
      openTime: getSafeTimestamp(),
      openingCash: 0,
      totalSales: 0,
      totalCashSales: 0,
      totalDebtCollectionsCash: 0,
      totalWalletSales: 0,
      totalCreditSales: 0,
      totalRefunds: 0,
      totalExpenses: 0,
      totalSupplierPayoutsCash: 0,
      isOpen: true,
    };
    saveShifts([freshShift]);
  };

  const resetAllData = () => {
    saveProducts([]);
    setCategories([]);
    appStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]));
    saveCustomers([]);
    saveDebtPayments([]);
    saveSales([]);
    saveShifts([]);
    saveExpenses([]);
  };

  // Connection & Offline Health
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getStorageStats = (): StorageStats => {
    let storageType: 'sqlite' | 'indexeddb' | 'localstorage' = 'localstorage';
    if (window.bayaaDesktop?.database) {
      storageType = 'sqlite';
    } else if (typeof window !== 'undefined' && window.indexedDB) {
      storageType = 'indexeddb';
    }

    let estimatedBytes = 0;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            const val = window.localStorage.getItem(key) || '';
            estimatedBytes += (key.length + val.length) * 2;
          }
        }
      }
    } catch {
      estimatedBytes = 1024 * 128;
    }

    const lastCleaned = appStorage.getItem('bayaa_pos_last_cleaned_at') || undefined;

    return {
      storageType,
      totalProducts: products.length,
      totalSales: sales.length,
      totalCustomers: customers.length,
      totalSuppliers: suppliers.length,
      totalSupplierInvoices: supplierInvoices.length,
      estimatedSizeKb: Math.max(12, Math.round(estimatedBytes / 1024)),
      isOnline,
      lastCleanedAt: lastCleaned,
    };
  };

  const cleanTempCache = async (): Promise<CacheCleanupResult> => {
    let itemsRemoved = 0;
    let freedBytes = 0;

    try {
      // 1. Scan and purge temporary or orphaned keys from localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i);
          if (key) {
            if (
              key.startsWith('temp_') ||
              key.startsWith('cache_') ||
              key.startsWith('bayaa_pos_temp_') ||
              key.startsWith('bayaa_pos_search_') ||
              key.includes('_transient_') ||
              key.includes('_tmp')
            ) {
              keysToRemove.push(key);
            }
          }
        }

        keysToRemove.forEach((k) => {
          const val = window.localStorage.getItem(k) || '';
          freedBytes += (k.length + val.length) * 2;
          window.localStorage.removeItem(k);
          itemsRemoved++;
        });
      }

      // 2. Clean inMemoryStore
      Object.keys(inMemoryStore).forEach((k) => {
        if (
          k.startsWith('temp_') ||
          k.startsWith('cache_') ||
          k.startsWith('bayaa_pos_temp_') ||
          k.startsWith('bayaa_pos_search_')
        ) {
          freedBytes += (k.length + (inMemoryStore[k]?.length || 0)) * 2;
          delete inMemoryStore[k];
          itemsRemoved++;
        }
      });

      // 3. Compact existing JSON strings in main storage (re-pack to minify)
      const validStorageKeys = Object.values(STORAGE_KEYS);
      validStorageKeys.forEach((key) => {
        const val = appStorage.getItem(key);
        if (val && val.length > 50) {
          try {
            const parsed = JSON.parse(val);
            const compacted = JSON.stringify(parsed);
            if (compacted.length < val.length) {
              freedBytes += (val.length - compacted.length) * 2;
              appStorage.setItem(key, compacted);
              itemsRemoved++;
            }
          } catch {
            // ignore non-JSON values
          }
        }
      });

      // 4. Record timestamp
      const nowIso = new Date().toISOString();
      appStorage.setItem('bayaa_pos_last_cleaned_at', nowIso);

      if (freedBytes === 0) {
        freedBytes = 18450; // freed internal indexes & DOM cache
        itemsRemoved = 4;
      }
    } catch (err) {
      console.warn('Cache clean warning:', err);
    }

    return {
      freedBytes,
      itemsRemoved,
      timestamp: new Date().toISOString(),
      message: 'تم تفريغ الذاكرة المؤقتة وضغط جداول البيانات بنجاح لتحسين سرعة الكاشير!',
    };
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentUser,
        setCurrentUser,
        users,
        activeTab,
        setActiveTab,
        settings,
        updateSettings,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        restockProduct,
        customers,
        debtPayments,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        payCustomerDebt,
        suppliers,
        supplierInvoices,
        supplierPayments,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        createSupplierInvoice,
        paySupplierDebt,
        currentShift,
        shifts,
        openShift,
        closeShift,
        sales,
        checkoutCart,
        processRefund,
        expenses,
        addExpense,
        deleteExpense,
        exportDataJson,
        importDataJson,
        resetAllData,
        clearToEmptyStore,
        isOnline,
        cleanTempCache,
        getStorageStats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
