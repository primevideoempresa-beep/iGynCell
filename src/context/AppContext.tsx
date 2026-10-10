import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ViewTab,
  ServiceOrder,
  Client,
  Product,
  TechPart,
  Sale,
  FinancialEntry,
  CommissionRecord,
  NotificationItem,
  StoreSettings,
  OSStatus,
  Employee
} from '../types';
import {
  initialStoreSettings,
  initialEmployees,
  initialClients,
  initialTechParts,
  initialProducts,
  initialServiceOrders,
  initialSales,
  initialFinancialEntries,
  initialCommissions,
  initialNotifications
} from '../data/initialData';
import { useAuth } from './AuthContext';
import {
  getApiBaseUrl,
  setCustomPhpApiUrl,
  testBackendConnection,
  fetchAllDatabase,
  apiCreateOrder,
  apiUpdateOrder,
  apiUpdateOrderStatus,
  apiDeleteOrder,
  apiDeleteClient,
  apiDeleteEmployee,
  apiDeleteProduct,
  apiDeleteTechPart,
  BackendConnectionTestResult
} from '../services/api';

interface AppContextType {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;

  // Backend / Database Connection Status
  phpApiUrl: string;
  setPhpApiUrl: (url: string) => void;
  isDatabaseConnected: boolean;
  backendStatusInfo: BackendConnectionTestResult | null;
  refreshDatabaseConnection: () => Promise<BackendConnectionTestResult>;
  syncWithDatabase: () => Promise<void>;
  isSyncing: boolean;

  // Entities
  settings: StoreSettings;
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetToDemoData: () => void;

  orders: ServiceOrder[];
  addOrder: (order: Omit<ServiceOrder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ServiceOrder>;
  updateOrder: (id: string, updates: Partial<ServiceOrder>) => Promise<void>;
  updateOrderStatus: (id: string, status: OSStatus) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'totalSpent' | 'ordersCount'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  adjustProductStock: (id: string, delta: number) => void;
  deleteProduct: (id: string) => void;

  techParts: TechPart[];
  addTechPart: (part: Omit<TechPart, 'id' | 'createdAt' | 'updatedAt'>) => TechPart;
  updateTechPart: (id: string, updates: Partial<TechPart>) => void;
  adjustTechPartStock: (id: string, delta: number) => void;
  deleteTechPart: (id: string) => void;

  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'createdAt' | 'commissionAmount'>) => Sale;
  cancelSale: (id: string) => void;

  financialEntries: FinancialEntry[];
  addFinancialEntry: (entry: Omit<FinancialEntry, 'id' | 'createdAt'>) => FinancialEntry;
  updateFinancialStatus: (id: string, status: 'paid' | 'pending' | 'overdue' | 'cancelled') => void;
  deleteFinancialEntry: (id: string) => void;

  commissions: CommissionRecord[];
  markCommissionPaid: (id: string) => void;

  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => Promise<Employee>;
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  unreadNotificationsCount: number;

  // Realtime & Metrics
  lastSyncTime: Date;
  isRealtimeActive: boolean;
  activeOrderToPrint: ServiceOrder | null;
  setActiveOrderToPrint: (order: ServiceOrder | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const BROADCAST_CHANNEL_NAME = 'igyn_cell_realtime_sync_channel';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, updateEmployeeList } = useAuth();
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [activeOrderToPrint, setActiveOrderToPrint] = useState<ServiceOrder | null>(null);

  // Backend connection state
  const [phpApiUrl, setPhpApiUrlState] = useState<string>(() => getApiBaseUrl());
  const [isDatabaseConnected, setIsDatabaseConnected] = useState<boolean>(true);
  const [backendStatusInfo, setBackendStatusInfo] = useState<BackendConnectionTestResult | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Ensure outdated mock data in localStorage is cleared
  const CLEAN_DATA_VERSION = 'v3_clear_all_data';
  try {
    if (typeof window !== 'undefined') {
      const currentVer = localStorage.getItem('igyn_cell_clean_version');
      if (currentVer !== CLEAN_DATA_VERSION) {
        localStorage.clear();
        localStorage.setItem('igyn_cell_clean_version', CLEAN_DATA_VERSION);
      }
    }
  } catch {}

  // Load state from localStorage or initial seed
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('igyn_cell_settings');
      return saved ? JSON.parse(saved) : initialStoreSettings;
    } catch {
      return initialStoreSettings;
    }
  });

  const [orders, setOrders] = useState<ServiceOrder[]>(() => {
    try {
      const saved = localStorage.getItem('igyn_cell_orders');
      return saved ? JSON.parse(saved) : initialServiceOrders;
    } catch {
      return initialServiceOrders;
    }
  });

  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const saved = localStorage.getItem('igyn_cell_clients');
      return saved ? JSON.parse(saved) : initialClients;
    } catch {
      return initialClients;
    }
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('igyn_cell_products');
      return saved ? JSON.parse(saved) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const [techParts, setTechParts] = useState<TechPart[]>(() => {
    try {
      const saved = localStorage.getItem('igyn_cell_techparts');
      return saved ? JSON.parse(saved) : initialTechParts;
    } catch {
      return initialTechParts;
    }
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem('igyn_cell_sales');
      return saved ? JSON.parse(saved) : initialSales;
    } catch {
      return initialSales;
    }
  });

  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(() => {
    try {
      const saved = localStorage.getItem('igyn_cell_financial');
      return saved ? JSON.parse(saved) : initialFinancialEntries;
    } catch {
      return initialFinancialEntries;
    }
  });

  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('igyn_cell_commissions');
      return saved ? JSON.parse(saved) : initialCommissions;
    } catch {
      return initialCommissions;
    }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('igyn_cell_notifications');
      return saved ? JSON.parse(saved) : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  // Cross-tab Real-time Broadcast Channel
  const broadcastChannel = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      }
    } catch {
      // fallback
    }
    return null;
  }, []);

  const notifyBroadcast = useCallback((actionType: string, payload?: any) => {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: actionType, payload, timestamp: Date.now() });
    }
    setLastSyncTime(new Date());
  }, [broadcastChannel]);

  // Handler to change custom PHP API URL
  const setPhpApiUrl = useCallback((url: string) => {
    setCustomPhpApiUrl(url);
    setPhpApiUrlState(getApiBaseUrl());
  }, []);

  // Handler to refresh and test DB connection
  const refreshDatabaseConnection = useCallback(async (): Promise<BackendConnectionTestResult> => {
    const result = await testBackendConnection();
    setIsDatabaseConnected(result.success);
    setBackendStatusInfo(result);
    return result;
  }, []);

  // Handler to pull full database from PHP / MySQL backend
  const syncWithDatabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const data = await fetchAllDatabase();
      if (data) {
        if (data.settings) setSettings(data.settings);
        if (data.orders) setOrders(data.orders);
        if (data.clients) setClients(data.clients);
        if (data.products) setProducts(data.products);
        if (data.techParts) setTechParts(data.techParts);
        if (data.sales) setSales(data.sales);
        if (data.financialEntries) setFinancialEntries(data.financialEntries);
        if (data.commissions) setCommissions(data.commissions);
        if (data.employees) {
          updateEmployeeList(data.employees);
        }
        if (data.notifications) setNotifications(data.notifications);
        setLastSyncTime(new Date());
        setIsDatabaseConnected(true);
      }
    } catch (err) {
      console.error('Erro ao sincronizar com banco de dados:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [updateEmployeeList]);

  // Initial DB check and load on startup
  useEffect(() => {
    refreshDatabaseConnection().catch(() => {});
    syncWithDatabase().catch(() => {});
  }, [refreshDatabaseConnection, syncWithDatabase]);

  // Initial Fetch from backend database API & Live Server-Sent Events (SSE) Stream
  useEffect(() => {
    // 2. Connect to Server-Sent Events stream for live real-time sync across all windows
    let eventSource: EventSource | null = null;
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        eventSource = new EventSource('/api/events');
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastSyncTime(new Date());
            if (data.type === 'SYNC_ALL_DATA' && data.payload) {
              const p = data.payload;
              if (p.settings) setSettings(p.settings);
              if (p.orders) setOrders(p.orders);
              if (p.clients) setClients(p.clients);
              if (p.products) setProducts(p.products);
              if (p.techParts) setTechParts(p.techParts);
              if (p.sales) setSales(p.sales);
              if (p.financialEntries) setFinancialEntries(p.financialEntries);
              if (p.commissions) setCommissions(p.commissions);
              if (p.employees) {
                updateEmployeeList(p.employees);
              }
              if (p.notifications) setNotifications(p.notifications);
            }
          } catch (e) {
            console.error('Error handling live SSE event', e);
          }
        };
      }
    } catch (e) {
      console.warn('SSE not supported or failed to connect', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [updateEmployeeList]);

  // Listen to remote tab Broadcast Channel changes
  useEffect(() => {
    if (!broadcastChannel) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      setLastSyncTime(new Date());

      if (type === 'SYNC_ALL_DATA') {
        if (payload.settings) setSettings(payload.settings);
        if (payload.orders) setOrders(payload.orders);
        if (payload.clients) setClients(payload.clients);
        if (payload.products) setProducts(payload.products);
        if (payload.techParts) setTechParts(payload.techParts);
        if (payload.sales) setSales(payload.sales);
        if (payload.financialEntries) setFinancialEntries(payload.financialEntries);
        if (payload.commissions) setCommissions(payload.commissions);
        if (payload.employees) {
          updateEmployeeList(payload.employees);
        }
        if (payload.notifications) setNotifications(payload.notifications);
      }
    };

    broadcastChannel.addEventListener('message', handleMessage);
    return () => {
      broadcastChannel.removeEventListener('message', handleMessage);
    };
  }, [broadcastChannel, updateEmployeeList]);

  // Persist states to localStorage for instant local caching
  useEffect(() => {
    try {
      localStorage.setItem('igyn_cell_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('igyn_cell_orders', JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('igyn_cell_clients', JSON.stringify(clients));
    } catch {}
  }, [clients]);

  useEffect(() => {
    try {
      localStorage.setItem('igyn_cell_products', JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('igyn_cell_techparts', JSON.stringify(techParts));
    } catch {}
  }, [techParts]);

  useEffect(() => {
    try {
      localStorage.setItem('igyn_cell_sales', JSON.stringify(sales));
    } catch {}
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem('igyn_cell_financial', JSON.stringify(financialEntries));
    } catch {}
  }, [financialEntries]);

  useEffect(() => {
    try {
      localStorage.setItem('igyn_cell_commissions', JSON.stringify(commissions));
    } catch {}
  }, [commissions]);

  useEffect(() => {
    try {
      localStorage.setItem('igyn_cell_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Store Settings
  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      notifyBroadcast('SETTINGS_UPDATED', { settings: updated });
      
      const baseUrl = getApiBaseUrl();
      const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
        ? `${baseUrl}/settings.php`
        : `${baseUrl}/settings`;

      fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      }).catch(() => {});
      return updated;
    });
  };

  const resetToDemoData = () => {
    setSettings(initialStoreSettings);
    setOrders(initialServiceOrders);
    setClients(initialClients);
    setProducts(initialProducts);
    setTechParts(initialTechParts);
    setSales(initialSales);
    setFinancialEntries(initialFinancialEntries);
    setCommissions(initialCommissions);
    setNotifications(initialNotifications);
    updateEmployeeList(initialEmployees);

    try {
      localStorage.clear();
      localStorage.setItem('igyn_cell_settings', JSON.stringify(initialStoreSettings));
      localStorage.setItem('igyn_cell_orders', JSON.stringify(initialServiceOrders));
      localStorage.setItem('igyn_cell_clients', JSON.stringify(initialClients));
      localStorage.setItem('igyn_cell_products', JSON.stringify(initialProducts));
      localStorage.setItem('igyn_cell_techparts', JSON.stringify(initialTechParts));
      localStorage.setItem('igyn_cell_sales', JSON.stringify(initialSales));
      localStorage.setItem('igyn_cell_financial', JSON.stringify(initialFinancialEntries));
      localStorage.setItem('igyn_cell_commissions', JSON.stringify(initialCommissions));
      localStorage.setItem('igyn_cell_employees', JSON.stringify(initialEmployees));
      localStorage.setItem('igyn_cell_notifications', JSON.stringify(initialNotifications));
    } catch {}

    fetch('/api/reset-demo', { method: 'POST' }).catch(() => {});

    notifyBroadcast('SYNC_ALL_DATA', {
      settings: initialStoreSettings,
      orders: initialServiceOrders,
      clients: initialClients,
      products: initialProducts,
      techParts: initialTechParts,
      sales: initialSales,
      financialEntries: initialFinancialEntries,
      commissions: initialCommissions,
      employees: initialEmployees,
      notifications: initialNotifications
    });
  };

  // Service Orders CRUD
  const addOrder = async (orderData: Omit<ServiceOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceOrder> => {
    const nextNum = 1049 + orders.length;
    const optimisticId = `OS-${nextNum}`;
    const now = new Date().toISOString();

    const newOrder: ServiceOrder = {
      ...orderData,
      id: optimisticId,
      createdAt: now,
      updatedAt: now
    };

    // Deduct stock for parts used
    if (newOrder.partsUsed && newOrder.partsUsed.length > 0) {
      setTechParts(prevParts =>
        prevParts.map(part => {
          const used = newOrder.partsUsed.find(p => p.partId === part.id);
          if (used) {
            return {
              ...part,
              quantity: Math.max(0, part.quantity - used.quantity),
              updatedAt: now
            };
          }
          return part;
        })
      );
    }

    // Add receivable financial entry if not zero
    if (newOrder.totalAmount > 0) {
      const finEntry: FinancialEntry = {
        id: `FIN-${3008 + financialEntries.length}`,
        type: 'income',
        category: 'Ordem de Serviço',
        description: `OS ${newOrder.id} - ${newOrder.brand} ${newOrder.model} (${newOrder.clientName})`,
        amount: newOrder.totalAmount,
        dueDate: now.slice(0, 10),
        paymentDate: newOrder.paymentStatus === 'paid' ? now.slice(0, 10) : undefined,
        status: newOrder.paymentStatus === 'paid' ? 'paid' : 'pending',
        relatedOrderId: newOrder.id,
        recipientOrPayer: newOrder.clientName,
        createdAt: now
      };
      setFinancialEntries(prev => [finEntry, ...prev]);
    }

    // Create commission for technician if labor cost exists
    if (newOrder.laborCost > 0 && newOrder.assignedTechnicianId) {
      const tech = employees.find(e => e.id === newOrder.assignedTechnicianId);
      const rate = tech ? tech.commissionRateTech : settings.defaultTechCommission;
      const commissionAmount = (newOrder.laborCost * rate) / 100;

      const commRecord: CommissionRecord = {
        id: `COM-${4006 + commissions.length}`,
        employeeId: newOrder.assignedTechnicianId,
        employeeName: newOrder.assignedTechnicianName,
        employeeRole: 'technician',
        type: 'service_order',
        referenceId: newOrder.id,
        description: `Comissão Técnica ${rate}% sobre Mão de Obra ${newOrder.id}`,
        baseAmount: newOrder.laborCost,
        rate,
        commissionAmount,
        status: newOrder.paymentStatus === 'paid' ? 'paid' : 'pending',
        createdAt: now
      };
      setCommissions(prev => [commRecord, ...prev]);
    }

    // Update Client metrics
    setClients(prev =>
      prev.map(c => {
        if (c.id === newOrder.clientId || c.name.toLowerCase() === newOrder.clientName.toLowerCase()) {
          return {
            ...c,
            ordersCount: c.ordersCount + 1,
            totalSpent: c.totalSpent + newOrder.totalAmount
          };
        }
        return c;
      })
    );

    // Notification
    const newNotif: NotificationItem = {
      id: `notif-os-${optimisticId}-${Date.now()}`,
      type: 'order_assigned',
      title: `Nova OS Criada #${optimisticId}`,
      message: `${newOrder.brand} ${newOrder.model} (${newOrder.clientName}) atribuído a ${newOrder.assignedTechnicianName}.`,
      read: false,
      createdAt: now,
      linkTab: 'orders'
    };
    setNotifications(prev => [newNotif, ...prev]);

    setOrders(prev => [newOrder, ...prev]);
    notifyBroadcast('ORDER_ADDED', { order: newOrder });

    // Send to PHP/MySQL or backend server API
    try {
      const result = await apiCreateOrder(orderData);
      if (result.success && result.order) {
        const confirmedOrder = result.order;
        // Replace optimistic order if id or server values changed
        setOrders(prev => prev.map(o => o.id === optimisticId ? confirmedOrder : o));
        notifyBroadcast('ORDER_UPDATED', { id: confirmedOrder.id, updates: confirmedOrder });
        return confirmedOrder;
      }
    } catch (e) {
      console.warn('Erro ao persistir OS remotamente:', e);
    }

    return newOrder;
  };

  const updateOrder = async (id: string, updates: Partial<ServiceOrder>) => {
    const now = new Date().toISOString();
    setOrders(prev =>
      prev.map(order => {
        if (order.id === id) {
          return { ...order, ...updates, updatedAt: now };
        }
        return order;
      })
    );
    notifyBroadcast('ORDER_UPDATED', { id, updates });

    try {
      await apiUpdateOrder(id, updates);
    } catch (e) {
      console.warn('Erro ao atualizar OS no backend:', e);
    }
  };

  const updateOrderStatus = async (id: string, status: OSStatus) => {
    const now = new Date().toISOString();
    setOrders(prev =>
      prev.map(order => {
        if (order.id === id) {
          const updated: ServiceOrder = {
            ...order,
            status,
            updatedAt: now,
            completedAt: status === 'completed' ? now : order.completedAt,
            deliveredAt: status === 'delivered' ? now : order.deliveredAt,
            paymentStatus: status === 'delivered' ? 'paid' : order.paymentStatus
          };

          if (status === 'delivered') {
            setCommissions(cList =>
              cList.map(c => {
                if (c.referenceId === id) {
                  return { ...c, status: 'paid', paidAt: now };
                }
                return c;
              })
            );
            setFinancialEntries(fList =>
              fList.map(f => {
                if (f.relatedOrderId === id) {
                  return { ...f, status: 'paid', paymentDate: now.slice(0, 10) };
                }
                return f;
              })
            );
          }

          return updated;
        }
        return order;
      })
    );
    notifyBroadcast('ORDER_STATUS_CHANGED', { id, status });

    try {
      await apiUpdateOrderStatus(id, status);
    } catch (e) {
      console.warn('Erro ao atualizar status da OS no backend:', e);
    }
  };

  const deleteOrder = async (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    notifyBroadcast('ORDER_DELETED', { id });

    try {
      await apiDeleteOrder(id);
    } catch (e) {
      console.warn('Erro ao excluir OS no backend:', e);
    }
  };

  // Clients CRUD
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'totalSpent' | 'ordersCount'>): Client => {
    const newId = `cli-${clients.length + 1}`;
    const newClient: Client = {
      ...clientData,
      id: newId,
      totalSpent: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString()
    };
    setClients(prev => [newClient, ...prev]);
    notifyBroadcast('CLIENT_ADDED', { client: newClient });
    
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/clients.php`
      : `${baseUrl}/clients`;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData)
    }).catch(() => {});
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
    notifyBroadcast('CLIENT_UPDATED', { id, updates });
    
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/clients.php?id=${encodeURIComponent(id)}`
      : `${baseUrl}/clients/${id}`;

    fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {});
  };

  const deleteClient = async (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
    notifyBroadcast('CLIENT_DELETED', { id });
    try {
      await apiDeleteClient(id);
    } catch (e) {
      console.warn('Erro ao excluir cliente no backend:', e);
    }
  };

  // Products CRUD
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newId = `prod-${products.length + 1}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...prodData,
      id: newId,
      createdAt: now,
      updatedAt: now
    };
    setProducts(prev => [newProduct, ...prev]);
    notifyBroadcast('PRODUCT_ADDED', { product: newProduct });
    
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/products.php`
      : `${baseUrl}/products`;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prodData)
    }).catch(() => {});
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString();
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: now } : p))
    );
    notifyBroadcast('PRODUCT_UPDATED', { id, updates });
    
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/products.php?id=${encodeURIComponent(id)}`
      : `${baseUrl}/products/${id}`;

    fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {});
  };

  const adjustProductStock = (id: string, delta: number) => {
    const now = new Date().toISOString();
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newQ = Math.max(0, p.quantity + delta);
          return { ...p, quantity: newQ, updatedAt: now };
        }
        return p;
      })
    );
    fetch(`/api/products/${id}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta })
    }).catch(() => {});
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    notifyBroadcast('PRODUCT_DELETED', { id });
    try {
      await apiDeleteProduct(id);
    } catch (e) {
      console.warn('Erro ao excluir produto no backend:', e);
    }
  };

  // Tech Parts CRUD
  const addTechPart = (partData: Omit<TechPart, 'id' | 'createdAt' | 'updatedAt'>): TechPart => {
    const newId = `part-${techParts.length + 1}`;
    const now = new Date().toISOString();
    const newPart: TechPart = {
      ...partData,
      id: newId,
      createdAt: now,
      updatedAt: now
    };
    setTechParts(prev => [newPart, ...prev]);
    notifyBroadcast('PART_ADDED', { part: newPart });
    
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/techparts.php`
      : `${baseUrl}/techparts`;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partData)
    }).catch(() => {});
    return newPart;
  };

  const updateTechPart = (id: string, updates: Partial<TechPart>) => {
    const now = new Date().toISOString();
    setTechParts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates, updatedAt: now } : p))
    );
    notifyBroadcast('PART_UPDATED', { id, updates });
    
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/techparts.php?id=${encodeURIComponent(id)}`
      : `${baseUrl}/techparts/${id}`;

    fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(() => {});
  };

  const adjustTechPartStock = (id: string, delta: number) => {
    const now = new Date().toISOString();
    setTechParts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newQ = Math.max(0, p.quantity + delta);
          return { ...p, quantity: newQ, updatedAt: now };
        }
        return p;
      })
    );
    fetch(`/api/techparts/${id}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta })
    }).catch(() => {});
  };

  const deleteTechPart = async (id: string) => {
    setTechParts(prev => prev.filter(p => p.id !== id));
    notifyBroadcast('PART_DELETED', { id });
    try {
      await apiDeleteTechPart(id);
    } catch (e) {
      console.warn('Erro ao excluir peça no backend:', e);
    }
  };

  // Sales
  const addSale = (saleData: Omit<Sale, 'id' | 'createdAt' | 'commissionAmount'>): Sale => {
    const nextNum = 2090 + sales.length;
    const newId = `VD-${nextNum}`;
    const now = new Date().toISOString();

    const commissionAmount = (saleData.totalAmount * saleData.commissionRate) / 100;

    const newSale: Sale = {
      ...saleData,
      id: newId,
      commissionAmount,
      createdAt: now
    };

    // Deduct stock for products sold
    setProducts(prevProds =>
      prevProds.map(prod => {
        const itemSold = newSale.items.find(i => i.productId === prod.id);
        if (itemSold) {
          return {
            ...prod,
            quantity: Math.max(0, prod.quantity - itemSold.quantity),
            updatedAt: now
          };
        }
        return prod;
      })
    );

    // Register financial entry
    const finEntry: FinancialEntry = {
      id: `FIN-${3008 + financialEntries.length}`,
      type: 'income',
      category: 'Venda de Balcão',
      description: `Venda ${newSale.id} - ${newSale.items.map(i => i.name).join(', ')} (${newSale.paymentMethod.toUpperCase()})`,
      amount: newSale.totalAmount,
      dueDate: now.slice(0, 10),
      paymentDate: now.slice(0, 10),
      status: 'paid',
      relatedSaleId: newSale.id,
      recipientOrPayer: newSale.clientName,
      createdAt: now
    };
    setFinancialEntries(prev => [finEntry, ...prev]);

    // Register Commission
    if (newSale.sellerId && commissionAmount > 0) {
      const commRecord: CommissionRecord = {
        id: `COM-${4006 + commissions.length}`,
        employeeId: newSale.sellerId,
        employeeName: newSale.sellerName,
        employeeRole: 'seller',
        type: 'sale',
        referenceId: newSale.id,
        description: `Comissão ${newSale.commissionRate}% sobre Venda ${newSale.id}`,
        baseAmount: newSale.totalAmount,
        rate: newSale.commissionRate,
        commissionAmount,
        status: 'pending',
        createdAt: now
      };
      setCommissions(prev => [commRecord, ...prev]);
    }

    // Update Client if exists
    if (newSale.clientId) {
      setClients(prev =>
        prev.map(c => {
          if (c.id === newSale.clientId) {
            return {
              ...c,
              totalSpent: c.totalSpent + newSale.totalAmount
            };
          }
          return c;
        })
      );
    }

    // Add notification
    const newNotif: NotificationItem = {
      id: `notif-sale-${newId}-${Date.now()}`,
      type: 'sale_target',
      title: `Venda Registrada #${newId}`,
      message: `Venda de R$ ${newSale.totalAmount.toFixed(2)} realizada por ${newSale.sellerName}.`,
      read: false,
      createdAt: now,
      linkTab: 'sales'
    };
    setNotifications(prev => [newNotif, ...prev]);

    setSales(prev => [newSale, ...prev]);
    notifyBroadcast('SALE_ADDED', { sale: newSale });

    // Call backend API
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/sales.php`
      : `${baseUrl}/sales`;

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData)
    }).catch(() => {});

    return newSale;
  };

  const cancelSale = (id: string) => {
    setSales(prev =>
      prev.map(s => (s.id === id ? { ...s, status: 'cancelled' } : s))
    );
    notifyBroadcast('SALE_CANCELLED', { id });
    
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/sales.php?id=${encodeURIComponent(id)}`
      : `${baseUrl}/sales/${id}`;

    fetch(endpoint, { method: 'DELETE' }).catch(() => {});
  };

  // Financial Entries
  const addFinancialEntry = (entryData: Omit<FinancialEntry, 'id' | 'createdAt'>): FinancialEntry => {
    const newId = `FIN-${3008 + financialEntries.length}`;
    const now = new Date().toISOString();
    const newEntry: FinancialEntry = {
      ...entryData,
      id: newId,
      createdAt: now
    };
    setFinancialEntries(prev => [newEntry, ...prev]);
    notifyBroadcast('FINANCIAL_ADDED', { entry: newEntry });
    fetch('/api/financial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryData)
    }).catch(() => {});
    return newEntry;
  };

  const updateFinancialStatus = (id: string, status: 'paid' | 'pending' | 'overdue' | 'cancelled') => {
    const now = new Date().toISOString();
    setFinancialEntries(prev =>
      prev.map(f =>
        f.id === id
          ? {
              ...f,
              status,
              paymentDate: status === 'paid' ? now.slice(0, 10) : f.paymentDate
            }
          : f
      )
    );
    notifyBroadcast('FINANCIAL_STATUS_CHANGED', { id, status });
    fetch(`/api/financial/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(() => {});
  };

  const deleteFinancialEntry = (id: string) => {
    setFinancialEntries(prev => prev.filter(f => f.id !== id));
    notifyBroadcast('FINANCIAL_DELETED', { id });
    fetch(`/api/financial/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  // Commissions
  const markCommissionPaid = (id: string) => {
    const now = new Date().toISOString();
    setCommissions(prev =>
      prev.map(c => {
        if (c.id === id) {
          // Also launch an expense entry in Financial
          const expEntry: FinancialEntry = {
            id: `FIN-${3008 + financialEntries.length + 1}`,
            type: 'expense',
            category: 'Comissões',
            description: `Pagamento de ${c.description} - ${c.employeeName}`,
            amount: c.commissionAmount,
            dueDate: now.slice(0, 10),
            paymentDate: now.slice(0, 10),
            status: 'paid',
            recipientOrPayer: c.employeeName,
            createdAt: now
          };
          setFinancialEntries(fPrev => [expEntry, ...fPrev]);

          return { ...c, status: 'paid', paidAt: now };
        }
        return c;
      })
    );
    notifyBroadcast('COMMISSION_PAID', { id });
    
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/commissions.php?action=pay&id=${encodeURIComponent(id)}`
      : `${baseUrl}/commissions/${id}/pay`;

    fetch(endpoint, { method: 'POST' }).catch(() => {});
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/notifications.php?action=read&id=${encodeURIComponent(id)}`
      : `${baseUrl}/notifications/${id}/read`;

    fetch(endpoint, { method: 'PUT' }).catch(() => {});
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    const baseUrl = getApiBaseUrl();
    const endpoint = baseUrl.startsWith('http') || baseUrl.includes('php')
      ? `${baseUrl}/notifications.php?action=clear-all`
      : `${baseUrl}/notifications/clear-all`;

    fetch(endpoint, { method: 'PUT' }).catch(() => {});
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        searchTerm,
        setSearchTerm,
        phpApiUrl,
        setPhpApiUrl,
        isDatabaseConnected,
        backendStatusInfo,
        refreshDatabaseConnection,
        syncWithDatabase,
        isSyncing,
        settings,
        updateSettings,
        resetToDemoData,
        orders,
        addOrder,
        updateOrder,
        updateOrderStatus,
        deleteOrder,
        clients,
        addClient,
        updateClient,
        deleteClient,
        products,
        addProduct,
        updateProduct,
        adjustProductStock,
        deleteProduct,
        techParts,
        addTechPart,
        updateTechPart,
        adjustTechPartStock,
        deleteTechPart,
        sales,
        addSale,
        cancelSale,
        financialEntries,
        addFinancialEntry,
        updateFinancialStatus,
        deleteFinancialEntry,
        commissions,
        markCommissionPaid,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        notifications,
        markNotificationRead,
        clearAllNotifications,
        unreadNotificationsCount,
        lastSyncTime,
        isRealtimeActive,
        activeOrderToPrint,
        setActiveOrderToPrint
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
