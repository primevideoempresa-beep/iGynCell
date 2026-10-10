import {
  Employee,
  Client,
  ServiceOrder,
  Product,
  TechPart,
  Sale,
  FinancialEntry,
  CommissionRecord,
  NotificationItem,
  StoreSettings
} from '../types';

export const initialStoreSettings: StoreSettings = {
  storeName: 'iGyn Cell',
  tradeName: 'iGyn Cell Comércio e Assistência Técnica de Celulares',
  address: 'Central Park Shopping - Loja 34 - Centro',
  locationDetails: 'Central Park Shopping - Loja 34',
  cityState: 'Porto Seguro - BA',
  postalCode: '45810-000',
  phone: '(73) 99147-4434',
  cnpj: '38.924.182/0001-94',
  warrantyTerms:
    'Garantia legal de 90 (noventa) dias para serviços executados e peças substituídas, contados a partir da data de entrega, conforme Artigo 26 do Código de Defesa do Consumidor. A garantia cobre exclusivamente o defeito relatado e corrigido nesta Ordem de Serviço, perdendo a validade em caso de queda, contato com líquidos, violação do lacre de segurança ou intervenção de terceiros.',
  defaultSaleCommission: 5,
  defaultTechCommission: 10,
  whatsappGreetingTemplate:
    'Olá {cliente}, aqui é da iGyn Cell (Central Park Shopping). O status da sua Ordem de Serviço #{os} foi atualizado para: *{status}*.\nValor total: {valor}.\nDúvidas? Estamos à disposição no (73) 99147-4434!',
  require2FAForAll: false,
  twoFactorSessionDurationHours: 8,
  enforce2FABackupCodes: false
};

export const initialEmployees: Employee[] = [
  {
    id: 'emp-1',
    name: 'Rodrigo Silva',
    email: 'admin@igyncell.com.br',
    password: 'admin',
    role: 'admin',
    roleLabel: 'Administrador & Proprietário',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '(73) 99147-4434',
    status: 'active',
    commissionRateSales: 5,
    commissionRateTech: 10,
    allowedTabs: [
      'dashboard',
      'employees',
      'orders',
      'sales',
      'inventory',
      'parts',
      'clients',
      'financial',
      'commissions',
      'notifications',
      'settings'
    ],
    createdAt: new Date().toISOString(),
    twoFactorEnabled: false
  },
  {
    id: 'emp-4',
    name: 'Matheus Oliveira',
    email: 'matheus.tech@igyncell.com.br',
    password: 'tech',
    role: 'technician',
    roleLabel: 'Técnico de Laboratório',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&auto=format&fit=crop&q=80',
    phone: '(73) 99122-3344',
    status: 'active',
    commissionRateSales: 2,
    commissionRateTech: 12,
    allowedTabs: [
      'dashboard',
      'orders',
      'parts',
      'clients',
      'notifications'
    ],
    createdAt: new Date().toISOString(),
    twoFactorEnabled: false
  }
];

// Clean zero initial data as requested
export const initialClients: Client[] = [];
export const initialTechParts: TechPart[] = [];
export const initialProducts: Product[] = [];
export const initialServiceOrders: ServiceOrder[] = [];
export const initialSales: Sale[] = [];
export const initialFinancialEntries: FinancialEntry[] = [];
export const initialCommissions: CommissionRecord[] = [];
export const initialNotifications: NotificationItem[] = [];
