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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const appStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = window.bayaaDesktop?.database
  ? {
      getItem: (key) => {
        const databaseValue = window.bayaaDesktop?.database.getSync<string>(key);
        if (databaseValue !== null && databaseValue !== undefined) return databaseValue;
        return window.localStorage.getItem(key);
      },
      setItem: (key, value) => {
        window.bayaaDesktop?.database.setSync(key, value);
        window.localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        window.bayaaDesktop?.database.deleteSync(key);
        window.localStorage.removeItem(key);
      },
    }
  : window.localStorage;

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
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialStoreSettings;
  });

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
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
      currentShift.openingCash +
      currentShift.totalCashSales +
      currentShift.totalDebtCollectionsCash -
      currentShift.totalRefunds -
      currentShift.totalExpenses;
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
        throw new Error(`الكمية المطلوبة من ${item.product.name} أكبر من المخزون المتاح`);
      }
    }

    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    const taxAmount = settings.enableTax ? (subtotal * settings.taxRate) / 100 : 0;
    const total = Math.max(0, subtotal + taxAmount - (discount || 0));

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
      creditPaidAmount = Math.max(0, Number(extra?.creditPaidAmount) || 0);
      creditRemainingDebt = Math.max(0, total - creditPaidAmount);
      cashPaidIntoDrawer = creditPaidAmount; // cash received upfront
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
      appName: 'Bayaa POS',
      version: '2.1.0',
      exportDate: new Date().toISOString(),
      settings,
      users,
      categories,
      products,
      customers,
      debtPayments,
      sales,
      shifts,
      expenses,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bayaa-pos-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      const collections = ['users', 'categories', 'products', 'customers', 'debtPayments', 'sales', 'shifts', 'expenses'];
      if (!data || data.appName !== 'Bayaa POS' || collections.some((key) => !Array.isArray(data[key]))) {
        throw new Error('Invalid or incomplete Bayaa POS backup');
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
        sales: data.sales,
        shifts: data.shifts,
        expenses: data.expenses,
      };
      appStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(values.users));
      appStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(values.categories));
      appStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(values.products));
      appStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(values.customers));
      appStorage.setItem(STORAGE_KEYS.DEBT_PAYMENTS, JSON.stringify(values.debtPayments));
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
