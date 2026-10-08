export type UserRole = 'admin' | 'manager' | 'seller' | 'technician';

export type ViewTab =
  | 'dashboard'
  | 'employees'
  | 'orders'
  | 'sales'
  | 'inventory'
  | 'parts'
  | 'clients'
  | 'financial'
  | 'commissions'
  | 'notifications'
  | 'audit'
  | 'settings';

export interface Employee {
  id: string;
  name: string;
  email: string;
  password?: string;
  passwordHash?: string;
  role: UserRole;
  roleLabel: string;
  avatar: string;
  phone: string;
  status: 'active' | 'inactive';
  commissionRateSales: number; // percentage, e.g. 5
  commissionRateTech: number; // percentage, e.g. 10
  allowedTabs: ViewTab[];
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorActivatedAt?: string;
  twoFactorLastVerifiedAt?: string;
  twoFactorSessionExpiresAt?: string;
  twoFactorBackupCodes?: string[];
  failedLoginAttempts?: number;
  lockoutUntil?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'PAYMENT' | 'STOCK_ADJUST' | 'BACKUP' | 'PERMISSION_CHANGE';
  entity: 'Auth' | 'ServiceOrder' | 'Sale' | 'Client' | 'Product' | 'TechPart' | 'Financial' | 'Commission' | 'Employee' | 'Settings' | 'Backup';
  entityId?: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  cpfCnpj?: string;
  address?: string;
  city?: string;
  notes?: string;
  totalSpent: number;
  ordersCount: number;
  createdAt: string;
}

export type OSStatus =
  | 'open' // Aberta
  | 'in_progress' // Em andamento
  | 'waiting_parts' // Aguardando peça
  | 'completed' // Concluída
  | 'delivered' // Entregue
  | 'cancelled'; // Cancelada

export type OSPriority = 'normal' | 'urgent' | 'warranty';

export interface DeviceChecklist {
  powersOn: boolean;
  touchWorks: boolean;
  displayOk: boolean;
  cameraFrontOk: boolean;
  cameraRearOk: boolean;
  microphoneOk: boolean;
  speakerOk: boolean;
  wifiOk: boolean;
  chargingOk: boolean;
  biometricsOk: boolean;
  frameDented: boolean;
  waterDamage: boolean;
}

export interface PartUsage {
  partId: string;
  code: string;
  name: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  subtotal: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
}

export interface ServiceOrder {
  id: string; // e.g. OS-1048
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientCpf?: string;
  deviceType: 'Smartphone' | 'Tablet' | 'Smartwatch' | 'Notebook' | 'Outro';
  brand: 'Apple' | 'Samsung' | 'Xiaomi' | 'Motorola' | 'LG' | 'Outro';
  model: string;
  color: string;
  imeiOrSerial: string;
  passcode: string;
  physicalCondition: string;
  checklist: DeviceChecklist;
  problemReported: string;
  technicalDiagnosis: string;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  status: OSStatus;
  priority: OSPriority;
  partsUsed: PartUsage[];
  servicesRendered: ServiceItem[];
  laborCost: number;
  partsTotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod?: 'pix' | 'credit' | 'debit' | 'cash' | 'unpaid';
  paymentStatus: 'paid' | 'pending' | 'cancelled';
  warrantyDays: number;
  technicalNotesInternal?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deliveredAt?: string;
}

export interface Product {
  id: string;
  code: string; // SKU
  name: string;
  category: string;
  quantity: number;
  minQuantity: number;
  costPrice: number;
  salePrice: number;
  supplier: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface TechPart {
  id: string;
  code: string;
  name: string;
  category: string;
  compatibleModels: string[];
  quantity: number;
  minQuantity: number;
  costPrice: number;
  salePrice: number;
  supplier: string;
  shelfLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
}

export interface Sale {
  id: string; // e.g. VD-2089
  clientId?: string;
  clientName: string;
  clientPhone?: string;
  sellerId: string;
  sellerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: 'pix' | 'credit' | 'debit' | 'cash' | 'installments';
  installments?: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'completed' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface FinancialEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  relatedSaleId?: string;
  relatedOrderId?: string;
  recipientOrPayer: string;
  createdAt: string;
}

export interface CommissionRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: UserRole;
  type: 'sale' | 'service_order';
  referenceId: string;
  description: string;
  baseAmount: number;
  rate: number;
  commissionAmount: number;
  status: 'pending' | 'paid';
  createdAt: string;
  paidAt?: string;
}

export interface NotificationItem {
  id: string;
  type: 'stock_alert' | 'order_assigned' | 'order_completed' | 'financial_due' | 'sale_target' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  linkTab?: ViewTab;
}

export interface StoreSettings {
  storeName: string;
  tradeName: string;
  address: string;
  locationDetails: string;
  cityState: string;
  postalCode: string;
  phone: string;
  cnpj: string;
  warrantyTerms: string;
  defaultSaleCommission: number;
  defaultTechCommission: number;
  whatsappGreetingTemplate: string;
  require2FAForAll: boolean;
  twoFactorSessionDurationHours: number;
  enforce2FABackupCodes?: boolean;
}
