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
    'Olá {cliente}, aqui é da iGyn Cell (Central Park Shopping). O status da sua Ordem de Serviço #{os} foi atualizado para: *{status}*.\nValor total: {valor}.\nDúvidas? Estamos à disposição no (73) 99147-4434!'
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
    createdAt: '2025-01-10T08:00:00.000Z',
    lastLogin: '2026-10-05T15:30:00.000Z'
  },
  {
    id: 'emp-2',
    name: 'Camila Duarte',
    email: 'gerente@igyncell.com.br',
    password: 'gerente',
    role: 'manager',
    roleLabel: 'Gerente Geral',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    phone: '(73) 99888-1234',
    status: 'active',
    commissionRateSales: 4,
    commissionRateTech: 8,
    allowedTabs: [
      'dashboard',
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
    createdAt: '2025-02-01T08:00:00.000Z',
    lastLogin: '2026-10-05T14:45:00.000Z'
  },
  {
    id: 'emp-3',
    name: 'Lucas Santos',
    email: 'lucas.tech@igyncell.com.br',
    password: 'tech',
    role: 'technician',
    roleLabel: 'Técnico Especialista Apple & Android',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '(73) 99123-4567',
    status: 'active',
    commissionRateSales: 3,
    commissionRateTech: 12,
    allowedTabs: [
      'dashboard',
      'orders',
      'parts',
      'clients',
      'commissions',
      'notifications'
    ],
    createdAt: '2025-03-15T08:00:00.000Z',
    lastLogin: '2026-10-05T16:00:00.000Z'
  },
  {
    id: 'emp-4',
    name: 'Matheus Oliveira',
    email: 'matheus.tech@igyncell.com.br',
    password: 'tech',
    role: 'technician',
    roleLabel: 'Técnico de Laboratório Nível 3',
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
    createdAt: '2025-04-01T08:00:00.000Z'
  },
  {
    id: 'emp-5',
    name: 'Beatriz Lima',
    email: 'beatriz.vendas@igyncell.com.br',
    password: 'vendas',
    role: 'seller',
    roleLabel: 'Consultora de Vendas',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    phone: '(73) 99345-6789',
    status: 'active',
    commissionRateSales: 5,
    commissionRateTech: 0,
    allowedTabs: [
      'dashboard',
      'sales',
      'clients',
      'commissions',
      'notifications'
    ],
    createdAt: '2025-05-10T08:00:00.000Z',
    lastLogin: '2026-10-05T15:55:00.000Z'
  },
  {
    id: 'emp-6',
    name: 'Gabriel Costa',
    email: 'gabriel.vendas@igyncell.com.br',
    password: 'vendas',
    role: 'seller',
    roleLabel: 'Vendedor Balcão & Acessórios',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    phone: '(73) 99456-7890',
    status: 'active',
    commissionRateSales: 5,
    commissionRateTech: 0,
    allowedTabs: [
      'dashboard',
      'sales',
      'clients',
      'commissions',
      'notifications'
    ],
    createdAt: '2025-06-01T08:00:00.000Z',
    lastLogin: '2026-10-04T18:00:00.000Z'
  }
];

export const initialClients: Client[] = [
  {
    id: 'cli-1',
    name: 'Mariana Azevedo',
    phone: '(73) 99912-3344',
    whatsapp: '5573999123344',
    email: 'mariana.azevedo@gmail.com',
    cpfCnpj: '458.912.304-12',
    address: 'Av. Navegantes, 450, Centro',
    city: 'Porto Seguro - BA',
    notes: 'Cliente frequente. Prefere peças originais Apple.',
    totalSpent: 2850.0,
    ordersCount: 3,
    createdAt: '2025-06-12T10:00:00.000Z'
  },
  {
    id: 'cli-2',
    name: 'Felipe Santana Rocha',
    phone: '(73) 98845-6677',
    whatsapp: '5573988456677',
    email: 'felipe.rocha77@outlook.com',
    cpfCnpj: '689.412.875-90',
    address: 'Rua do Mucugê, 120, Arraial d\'Ajuda',
    city: 'Porto Seguro - BA',
    notes: 'Proprietário de pousada. Sempre traz aparelhos da equipe.',
    totalSpent: 4200.0,
    ordersCount: 4,
    createdAt: '2025-07-03T14:20:00.000Z'
  },
  {
    id: 'cli-4',
    name: 'Carlos Eduardo Nogueira',
    phone: '(73) 99823-1100',
    whatsapp: '5573998231100',
    email: 'cadu.nogueira@gmail.com',
    cpfCnpj: '112.443.998-01',
    address: 'Rua Pedro Álvares Cabral, 310, Centro',
    city: 'Porto Seguro - BA',
    notes: 'Comprou iPhone 13 seminovo + seguro de película.',
    totalSpent: 3600.0,
    ordersCount: 2,
    createdAt: '2025-09-02T16:40:00.000Z'
  },
  {
    id: 'cli-5',
    name: 'Ana Paula Guimarães',
    phone: '(73) 99177-4488',
    whatsapp: '5573991774488',
    email: 'anapaula.guima@hotmail.com',
    cpfCnpj: '781.332.905-65',
    address: 'Rua 22 de Abril, 95, Centro',
    city: 'Porto Seguro - BA',
    notes: 'Trocou conector de carga e comprou carregador turbo.',
    totalSpent: 390.0,
    ordersCount: 1,
    createdAt: '2025-09-25T11:00:00.000Z'
  }
];

export const initialTechParts: TechPart[] = [
  {
    id: 'part-1',
    code: 'TEL-IP13-OLED',
    name: 'Tela Display iPhone 13 OLED Premium',
    category: 'Telas / Displays',
    compatibleModels: ['iPhone 13', 'iPhone 13 Pro (Adapt.)'],
    quantity: 6,
    minQuantity: 3,
    costPrice: 280.0,
    salePrice: 580.0,
    supplier: 'Distribuidora iFix Tech SP',
    shelfLocation: 'Gaveta A-01',
    createdAt: '2025-05-01T08:00:00.000Z',
    updatedAt: '2026-09-30T10:00:00.000Z'
  },
  {
    id: 'part-2',
    code: 'TEL-IP11-INC',
    name: 'Tela Display iPhone 11 Incell FHD',
    category: 'Telas / Displays',
    compatibleModels: ['iPhone 11'],
    quantity: 2, // Low stock alert!
    minQuantity: 4,
    costPrice: 110.0,
    salePrice: 280.0,
    supplier: 'Distribuidora iFix Tech SP',
    shelfLocation: 'Gaveta A-02',
    createdAt: '2025-05-01T08:00:00.000Z',
    updatedAt: '2026-10-01T11:30:00.000Z'
  },
  {
    id: 'part-3',
    code: 'BAT-IP12-ORIG',
    name: 'Bateria iPhone 12 / 12 Pro Original Grade A+',
    category: 'Baterias',
    compatibleModels: ['iPhone 12', 'iPhone 12 Pro'],
    quantity: 5,
    minQuantity: 3,
    costPrice: 95.0,
    salePrice: 240.0,
    supplier: 'PowerCell Brasil',
    shelfLocation: 'Gaveta B-01',
    createdAt: '2025-05-15T08:00:00.000Z',
    updatedAt: '2026-09-28T14:00:00.000Z'
  },
  {
    id: 'part-4',
    code: 'BAT-IP11-ORIG',
    name: 'Bateria iPhone 11 Alta Capacidade 3110mAh',
    category: 'Baterias',
    compatibleModels: ['iPhone 11'],
    quantity: 1, // Low stock alert!
    minQuantity: 3,
    costPrice: 85.0,
    salePrice: 220.0,
    supplier: 'PowerCell Brasil',
    shelfLocation: 'Gaveta B-02',
    createdAt: '2025-05-15T08:00:00.000Z',
    updatedAt: '2026-10-03T16:00:00.000Z'
  },
  {
    id: 'part-5',
    code: 'DCK-IP11-BL',
    name: 'Conector de Carga / Dock iPhone 11 Preto',
    category: 'Conectores Carga / Dock',
    compatibleModels: ['iPhone 11'],
    quantity: 8,
    minQuantity: 2,
    costPrice: 38.0,
    salePrice: 160.0,
    supplier: 'MegaPeças Importadora',
    shelfLocation: 'Gaveta C-03',
    createdAt: '2025-06-01T08:00:00.000Z',
    updatedAt: '2026-09-20T09:00:00.000Z'
  },
  {
    id: 'part-6',
    code: 'TEL-SAMS21-AMO',
    name: 'Display Samsung Galaxy S21 5G Dynamic AMOLED c/ Aro',
    category: 'Telas / Displays',
    compatibleModels: ['Samsung Galaxy S21', 'SM-G991B'],
    quantity: 3,
    minQuantity: 2,
    costPrice: 390.0,
    salePrice: 750.0,
    supplier: 'Samsung Parts Oficial',
    shelfLocation: 'Gaveta A-05',
    createdAt: '2025-06-10T08:00:00.000Z',
    updatedAt: '2026-09-25T17:00:00.000Z'
  },
  {
    id: 'part-7',
    code: 'CAM-IP13-TRA',
    name: 'Módulo Câmera Traseira Dupla iPhone 13',
    category: 'Câmeras',
    compatibleModels: ['iPhone 13'],
    quantity: 2,
    minQuantity: 1,
    costPrice: 195.0,
    salePrice: 420.0,
    supplier: 'Distribuidora iFix Tech SP',
    shelfLocation: 'Gaveta D-01',
    createdAt: '2025-07-01T08:00:00.000Z',
    updatedAt: '2026-09-15T10:00:00.000Z'
  },
  {
    id: 'part-8',
    code: 'VID-IP12-TRA',
    name: 'Tampa Traseira Vidro iPhone 12 Grande Furo Azul',
    category: 'Tampas Traseiras',
    compatibleModels: ['iPhone 12'],
    quantity: 4,
    minQuantity: 2,
    costPrice: 35.0,
    salePrice: 180.0,
    supplier: 'MegaPeças Importadora',
    shelfLocation: 'Gaveta E-02',
    createdAt: '2025-07-15T08:00:00.000Z',
    updatedAt: '2026-09-10T12:00:00.000Z'
  },
  {
    id: 'part-9',
    code: 'TEL-MOTO-G60',
    name: 'Tela Display Moto G60 / G60s Original Nacional',
    category: 'Telas / Displays',
    compatibleModels: ['Motorola Moto G60', 'Moto G60s'],
    quantity: 1, // Low stock
    minQuantity: 3,
    costPrice: 90.0,
    salePrice: 250.0,
    supplier: 'MegaPeças Importadora',
    shelfLocation: 'Gaveta A-08',
    createdAt: '2025-08-01T08:00:00.000Z',
    updatedAt: '2026-10-02T15:00:00.000Z'
  },
  {
    id: 'part-10',
    code: 'CI-HYDRA-IP11',
    name: 'C.I. de Carga Hydra / Tristar iPhone 11',
    category: 'Componentes de Placa',
    compatibleModels: ['iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max'],
    quantity: 7,
    minQuantity: 3,
    costPrice: 45.0,
    salePrice: 350.0,
    supplier: 'MicroSolda Brasil',
    shelfLocation: 'Organizador SMD 04',
    createdAt: '2025-08-20T08:00:00.000Z',
    updatedAt: '2026-09-18T14:30:00.000Z'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    code: 'IP13-128-SEMI',
    name: 'iPhone 13 128GB Meia-Noite Seminovo Impecável Saúde 91%',
    category: 'Seminovos',
    quantity: 3,
    minQuantity: 1,
    costPrice: 2200.0,
    salePrice: 2950.0,
    supplier: 'Trade-in Balcão & Import',
    location: 'Vitrine Principal A',
    createdAt: '2025-08-01T08:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'prod-2',
    code: 'IP14-128-SEMI',
    name: 'iPhone 14 128GB Estelar Seminovo Caixa Completa Saúde 94%',
    category: 'Seminovos',
    quantity: 2,
    minQuantity: 1,
    costPrice: 2750.0,
    salePrice: 3590.0,
    supplier: 'Trade-in Balcão & Import',
    location: 'Vitrine Principal A',
    createdAt: '2025-08-15T08:00:00.000Z',
    updatedAt: '2026-10-02T09:00:00.000Z'
  },
  {
    id: 'prod-3',
    code: 'CAR-USB-C-20W',
    name: 'Carregador Rápido 20W USB-C Homologado Anatel',
    category: 'Carregadores & Cabos',
    quantity: 18,
    minQuantity: 10,
    costPrice: 28.0,
    salePrice: 89.9,
    supplier: 'Hrebos / Kaidi Brasil',
    location: 'Gôndola Acessórios 01',
    createdAt: '2025-06-01T08:00:00.000Z',
    updatedAt: '2026-10-04T11:00:00.000Z'
  },
  {
    id: 'prod-4',
    code: 'CAB-LIG-TYPC',
    name: 'Cabo USB-C para Lightning 1.2m Reforçado Nylon',
    category: 'Carregadores & Cabos',
    quantity: 4, // Low stock
    minQuantity: 8,
    costPrice: 14.0,
    salePrice: 49.9,
    supplier: 'Hrebos / Kaidi Brasil',
    location: 'Gôndola Acessórios 01',
    createdAt: '2025-06-01T08:00:00.000Z',
    updatedAt: '2026-10-04T16:00:00.000Z'
  },
  {
    id: 'prod-5',
    code: 'PEL-3D-IP13',
    name: 'Película de Vidro 3D / 9D Privacidade iPhone 13 / 14',
    category: 'Películas',
    quantity: 25,
    minQuantity: 15,
    costPrice: 6.5,
    salePrice: 40.0,
    supplier: 'Atacado Películas SP',
    location: 'Gaveteiro Películas 02',
    createdAt: '2025-06-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'prod-6',
    code: 'CAP-MAG-IP13',
    name: 'Capa MagSafe Transparente Anti-Impacto iPhone 13',
    category: 'Capas & Proteção',
    quantity: 14,
    minQuantity: 6,
    costPrice: 18.0,
    salePrice: 65.0,
    supplier: 'CasePro Distribuidora',
    location: 'Painel Expositor 01',
    createdAt: '2025-07-01T08:00:00.000Z',
    updatedAt: '2026-09-29T14:00:00.000Z'
  },
  {
    id: 'prod-7',
    code: 'FON-BLU-ANC',
    name: 'Fone Bluetooth TWS com Cancelamento de Ruído ANC Pro',
    category: 'Áudio & Fones',
    quantity: 7,
    minQuantity: 4,
    costPrice: 65.0,
    salePrice: 169.0,
    supplier: 'Som & Cia Import',
    location: 'Vitrine B',
    createdAt: '2025-07-10T08:00:00.000Z',
    updatedAt: '2026-09-30T17:00:00.000Z'
  },
  {
    id: 'prod-8',
    code: 'POW-10000-IND',
    name: 'Power Bank 10.000mAh por Indução Magnética MagSafe',
    category: 'Carregadores & Cabos',
    quantity: 2, // Low stock
    minQuantity: 5,
    costPrice: 55.0,
    salePrice: 149.9,
    supplier: 'Hrebos / Kaidi Brasil',
    location: 'Vitrine B',
    createdAt: '2025-08-01T08:00:00.000Z',
    updatedAt: '2026-10-03T11:00:00.000Z'
  }
];

export const initialServiceOrders: ServiceOrder[] = [
  {
    id: 'OS-1048',
    clientId: 'cli-1',
    clientName: 'Mariana Azevedo',
    clientPhone: '(73) 99912-3344',
    clientCpf: '458.912.304-12',
    deviceType: 'Smartphone',
    brand: 'Apple',
    model: 'iPhone 13 128GB',
    color: 'Azul Meia-Noite',
    imeiOrSerial: '358912048591024',
    passcode: '198422',
    physicalCondition: 'Traseira íntegra, frontal com vidro estilhaçado no canto inferior direito. Pequeno amassado na quina.',
    checklist: {
      powersOn: true,
      touchWorks: false,
      displayOk: false,
      cameraFrontOk: true,
      cameraRearOk: true,
      microphoneOk: true,
      speakerOk: true,
      wifiOk: true,
      chargingOk: true,
      biometricsOk: true,
      frameDented: true,
      waterDamage: false
    },
    problemReported: 'Caiu no piso da piscina, vidro quebrou e apareceram listras verdes verticais. O touch parou de responder.',
    technicalDiagnosis: 'Display OLED quebrado internamente. Módulo FaceID intacto. Troca de tela OLED de alta qualidade e alinhamento do chassi.',
    assignedTechnicianId: 'emp-3',
    assignedTechnicianName: 'Lucas Santos',
    status: 'in_progress',
    priority: 'urgent',
    partsUsed: [
      {
        partId: 'part-1',
        code: 'TEL-IP13-OLED',
        name: 'Tela Display iPhone 13 OLED Premium',
        quantity: 1,
        unitCost: 280.0,
        unitPrice: 580.0,
        subtotal: 580.0
      }
    ],
    servicesRendered: [
      {
        id: 'srv-1',
        name: 'Mão de Obra Especializada Apple & Calibração TrueTone',
        price: 150.0
      }
    ],
    laborCost: 150.0,
    partsTotal: 580.0,
    discount: 30.0,
    totalAmount: 700.0,
    paymentMethod: 'pix',
    paymentStatus: 'pending',
    warrantyDays: 90,
    technicalNotesInternal: 'Transferido IC True Tone do display original com programadora iCopy Plus.',
    createdAt: '2026-10-05T09:30:00.000Z',
    updatedAt: '2026-10-05T11:20:00.000Z'
  },
  {
    id: 'OS-1047',
    clientId: 'cli-2',
    clientName: 'Felipe Santana Rocha',
    clientPhone: '(73) 98845-6677',
    clientCpf: '689.412.875-90',
    deviceType: 'Smartphone',
    brand: 'Samsung',
    model: 'Galaxy S21 5G',
    color: 'Cinza Phantom',
    imeiOrSerial: '354499100234581',
    passcode: 'Padrão L inverso',
    physicalCondition: 'Aparelho bem conservado, película fosca antiga com marcas de uso.',
    checklist: {
      powersOn: true,
      touchWorks: true,
      displayOk: true,
      cameraFrontOk: true,
      cameraRearOk: true,
      microphoneOk: true,
      speakerOk: true,
      wifiOk: true,
      chargingOk: false,
      biometricsOk: true,
      frameDented: false,
      waterDamage: false
    },
    problemReported: 'Não carrega no cabo comum, só na indução. Cabo fica frouxo no conector.',
    technicalDiagnosis: 'Conector de carga tipo-C oxidado e com pinos rompidos. Substituição do sub-board de carga e limpeza ultrassônica do alto-falante.',
    assignedTechnicianId: 'emp-4',
    assignedTechnicianName: 'Matheus Oliveira',
    status: 'waiting_parts',
    priority: 'normal',
    partsUsed: [
      {
        partId: 'part-5',
        code: 'DCK-IP11-BL',
        name: 'Conector de Carga / Sub Placa S21',
        quantity: 1,
        unitCost: 45.0,
        unitPrice: 160.0,
        subtotal: 160.0
      }
    ],
    servicesRendered: [
      {
        id: 'srv-2',
        name: 'Serviço de Desoxidação e Solda Conector',
        price: 90.0
      }
    ],
    laborCost: 90.0,
    partsTotal: 160.0,
    discount: 0.0,
    totalAmount: 250.0,
    paymentMethod: 'credit',
    paymentStatus: 'pending',
    warrantyDays: 90,
    technicalNotesInternal: 'Aguardando chegada do fornecedor na remessa da tarde.',
    createdAt: '2026-10-04T14:10:00.000Z',
    updatedAt: '2026-10-05T08:00:00.000Z'
  },
  {
    id: 'OS-1046',
    clientId: 'cli-3',
    clientName: 'Juliana Mendes Barbosa',
    clientPhone: '(73) 99118-9922',
    clientCpf: '234.876.105-43',
    deviceType: 'Smartphone',
    brand: 'Apple',
    model: 'iPhone 11 64GB',
    color: 'Branco',
    imeiOrSerial: '357889102934812',
    passcode: '051288',
    physicalCondition: 'Bateria estufada pressionando a tela para fora. Tampa traseira sem arranhões.',
    checklist: {
      powersOn: true,
      touchWorks: true,
      displayOk: true,
      cameraFrontOk: true,
      cameraRearOk: true,
      microphoneOk: true,
      speakerOk: true,
      wifiOk: true,
      chargingOk: true,
      biometricsOk: true,
      frameDented: false,
      waterDamage: false
    },
    problemReported: 'Bateria dura apenas 2 horas, desliga com 30% e a tela está se descolando.',
    technicalDiagnosis: 'Bateria com 71% de saúde e estufamento severo. Substituição imediata por bateria de alta capacidade com reprogramação de ciclos e colagem do display.',
    assignedTechnicianId: 'emp-3',
    assignedTechnicianName: 'Lucas Santos',
    status: 'completed',
    priority: 'normal',
    partsUsed: [
      {
        partId: 'part-4',
        code: 'BAT-IP11-ORIG',
        name: 'Bateria iPhone 11 Alta Capacidade 3110mAh',
        quantity: 1,
        unitCost: 85.0,
        unitPrice: 220.0,
        subtotal: 220.0
      }
    ],
    servicesRendered: [
      {
        id: 'srv-3',
        name: 'Troca de Bateria + Reprogramação de BMS + Vedação IP68',
        price: 80.0
      }
    ],
    laborCost: 80.0,
    partsTotal: 220.0,
    discount: 20.0,
    totalAmount: 280.0,
    paymentMethod: 'pix',
    paymentStatus: 'paid',
    warrantyDays: 90,
    technicalNotesInternal: 'Ciclos zerados, saúde mostrando 100% no sistema. Vedação adesiva substituída com sucesso.',
    createdAt: '2026-10-03T11:00:00.000Z',
    updatedAt: '2026-10-04T17:30:00.000Z',
    completedAt: '2026-10-04T17:30:00.000Z'
  },
  {
    id: 'OS-1045',
    clientId: 'cli-4',
    clientName: 'Carlos Eduardo Nogueira',
    clientPhone: '(73) 99823-1100',
    clientCpf: '112.443.998-01',
    deviceType: 'Smartphone',
    brand: 'Motorola',
    model: 'Moto G60',
    color: 'Cinza Cósmico',
    imeiOrSerial: '352994018239012',
    passcode: '7744',
    physicalCondition: 'Frontal com trincas em teia de aranha. Sensor biométrico traseiro funcionando.',
    checklist: {
      powersOn: true,
      touchWorks: true,
      displayOk: true,
      cameraFrontOk: true,
      cameraRearOk: true,
      microphoneOk: true,
      speakerOk: true,
      wifiOk: true,
      chargingOk: true,
      biometricsOk: true,
      frameDented: false,
      waterDamage: false
    },
    problemReported: 'Troca de frontal completa após queda da moto.',
    technicalDiagnosis: 'Substituição do módulo frontal completo nacional com aro.',
    assignedTechnicianId: 'emp-4',
    assignedTechnicianName: 'Matheus Oliveira',
    status: 'delivered',
    priority: 'normal',
    partsUsed: [
      {
        partId: 'part-9',
        code: 'TEL-MOTO-G60',
        name: 'Tela Display Moto G60 / G60s Original Nacional',
        quantity: 1,
        unitCost: 90.0,
        unitPrice: 250.0,
        subtotal: 250.0
      }
    ],
    servicesRendered: [
      {
        id: 'srv-4',
        name: 'Mão de Obra e Aplicação de Película Cortesia',
        price: 70.0
      }
    ],
    laborCost: 70.0,
    partsTotal: 250.0,
    discount: 0.0,
    totalAmount: 320.0,
    paymentMethod: 'debit',
    paymentStatus: 'paid',
    warrantyDays: 90,
    createdAt: '2026-10-02T10:00:00.000Z',
    updatedAt: '2026-10-03T15:00:00.000Z',
    completedAt: '2026-10-03T12:00:00.000Z',
    deliveredAt: '2026-10-03T15:00:00.000Z'
  },
  {
    id: 'OS-1049',
    clientId: 'cli-5',
    clientName: 'Ana Paula Guimarães',
    clientPhone: '(73) 99177-4488',
    clientCpf: '781.332.905-65',
    deviceType: 'Smartphone',
    brand: 'Apple',
    model: 'iPhone 12 128GB',
    color: 'Azul',
    imeiOrSerial: '359901827364512',
    passcode: '250911',
    physicalCondition: 'Traseira em vidro completamente estilhaçada. Câmeras funcionando normalmente.',
    checklist: {
      powersOn: true,
      touchWorks: true,
      displayOk: true,
      cameraFrontOk: true,
      cameraRearOk: true,
      microphoneOk: true,
      speakerOk: true,
      wifiOk: true,
      chargingOk: true,
      biometricsOk: true,
      frameDented: false,
      waterDamage: false
    },
    problemReported: 'Troca de tampa de vidro traseira laser.',
    technicalDiagnosis: 'Remoção de vidro traseiro na máquina a laser e colagem de nova tampa original.',
    assignedTechnicianId: 'emp-3',
    assignedTechnicianName: 'Lucas Santos',
    status: 'open',
    priority: 'normal',
    partsUsed: [
      {
        partId: 'part-8',
        code: 'VID-IP12-TRA',
        name: 'Tampa Traseira Vidro iPhone 12 Grande Furo Azul',
        quantity: 1,
        unitCost: 35.0,
        unitPrice: 180.0,
        subtotal: 180.0
      }
    ],
    servicesRendered: [
      {
        id: 'srv-5',
        name: 'Serviço de Separação a Laser e Colagem Epóxi UV',
        price: 100.0
      }
    ],
    laborCost: 100.0,
    partsTotal: 180.0,
    discount: 0.0,
    totalAmount: 280.0,
    paymentMethod: 'pix',
    paymentStatus: 'pending',
    warrantyDays: 90,
    createdAt: '2026-10-05T14:15:00.000Z',
    updatedAt: '2026-10-05T14:15:00.000Z'
  }
];

export const initialSales: Sale[] = [
  {
    id: 'VD-2089',
    clientId: 'cli-4',
    clientName: 'Carlos Eduardo Nogueira',
    clientPhone: '(73) 99823-1100',
    sellerId: 'emp-5',
    sellerName: 'Beatriz Lima',
    items: [
      {
        productId: 'prod-1',
        code: 'IP13-128-SEMI',
        name: 'iPhone 13 128GB Meia-Noite Seminovo Impecável Saúde 91%',
        quantity: 1,
        unitPrice: 2950.0,
        unitCost: 2200.0,
        subtotal: 2950.0
      },
      {
        productId: 'prod-5',
        code: 'PEL-3D-IP13',
        name: 'Película de Vidro 3D / 9D Privacidade iPhone 13 / 14',
        quantity: 1,
        unitPrice: 40.0,
        unitCost: 6.5,
        subtotal: 40.0
      },
      {
        productId: 'prod-6',
        code: 'CAP-MAG-IP13',
        name: 'Capa MagSafe Transparente Anti-Impacto iPhone 13',
        quantity: 1,
        unitPrice: 65.0,
        unitCost: 18.0,
        subtotal: 65.0
      }
    ],
    subtotal: 3055.0,
    discount: 55.0,
    totalAmount: 3000.0,
    paymentMethod: 'pix',
    commissionRate: 5,
    commissionAmount: 150.0,
    status: 'completed',
    createdAt: '2026-10-04T16:20:00.000Z'
  },
  {
    id: 'VD-2088',
    clientId: 'cli-5',
    clientName: 'Ana Paula Guimarães',
    clientPhone: '(73) 99177-4488',
    sellerId: 'emp-6',
    sellerName: 'Gabriel Costa',
    items: [
      {
        productId: 'prod-3',
        code: 'CAR-USB-C-20W',
        name: 'Carregador Rápido 20W USB-C Homologado Anatel',
        quantity: 1,
        unitPrice: 89.9,
        unitCost: 28.0,
        subtotal: 89.9
      },
      {
        productId: 'prod-4',
        code: 'CAB-LIG-TYPC',
        name: 'Cabo USB-C para Lightning 1.2m Reforçado Nylon',
        quantity: 1,
        unitPrice: 49.9,
        unitCost: 14.0,
        subtotal: 49.9
      }
    ],
    subtotal: 139.8,
    discount: 9.8,
    totalAmount: 130.0,
    paymentMethod: 'credit',
    installments: 1,
    commissionRate: 5,
    commissionAmount: 6.5,
    status: 'completed',
    createdAt: '2026-10-05T10:45:00.000Z'
  },
  {
    id: 'VD-2087',
    clientName: 'Cliente Balcão (Avulso)',
    sellerId: 'emp-5',
    sellerName: 'Beatriz Lima',
    items: [
      {
        productId: 'prod-7',
        code: 'FON-BLU-ANC',
        name: 'Fone Bluetooth TWS com Cancelamento de Ruído ANC Pro',
        quantity: 1,
        unitPrice: 169.0,
        unitCost: 65.0,
        subtotal: 169.0
      }
    ],
    subtotal: 169.0,
    discount: 0.0,
    totalAmount: 169.0,
    paymentMethod: 'pix',
    commissionRate: 5,
    commissionAmount: 8.45,
    status: 'completed',
    createdAt: '2026-10-05T11:15:00.000Z'
  }
];

export const initialFinancialEntries: FinancialEntry[] = [
  {
    id: 'FIN-3001',
    type: 'income',
    category: 'Venda de Balcão',
    description: 'Venda VD-2089 - iPhone 13 + Película + Capa MagSafe (PIX)',
    amount: 3000.0,
    dueDate: '2026-10-04',
    paymentDate: '2026-10-04',
    status: 'paid',
    relatedSaleId: 'VD-2089',
    recipientOrPayer: 'Carlos Eduardo Nogueira',
    createdAt: '2026-10-04T16:20:00.000Z'
  },
  {
    id: 'FIN-3002',
    type: 'income',
    category: 'Ordem de Serviço',
    description: 'OS-1046 - Troca de Bateria iPhone 11 (PIX)',
    amount: 280.0,
    dueDate: '2026-10-04',
    paymentDate: '2026-10-04',
    status: 'paid',
    relatedOrderId: 'OS-1046',
    recipientOrPayer: 'Juliana Mendes Barbosa',
    createdAt: '2026-10-04T17:30:00.000Z'
  },
  {
    id: 'FIN-3003',
    type: 'income',
    category: 'Ordem de Serviço',
    description: 'OS-1045 - Troca Frontal Moto G60 (Débito)',
    amount: 320.0,
    dueDate: '2026-10-03',
    paymentDate: '2026-10-03',
    status: 'paid',
    relatedOrderId: 'OS-1045',
    recipientOrPayer: 'Carlos Eduardo Nogueira',
    createdAt: '2026-10-03T15:00:00.000Z'
  },
  {
    id: 'FIN-3004',
    type: 'income',
    category: 'Ordem de Serviço',
    description: 'OS-1048 - Troca Display OLED iPhone 13 (Pendente de Entrega)',
    amount: 700.0,
    dueDate: '2026-10-06',
    status: 'pending',
    relatedOrderId: 'OS-1048',
    recipientOrPayer: 'Mariana Azevedo',
    createdAt: '2026-10-05T09:30:00.000Z'
  },
  {
    id: 'FIN-3005',
    type: 'expense',
    category: 'Aluguel Central Park',
    description: 'Aluguel Comercial Loja 34 - Central Park Shopping Outubro/2026',
    amount: 3200.0,
    dueDate: '2026-10-10',
    status: 'pending',
    recipientOrPayer: 'Administração Central Park Shopping',
    createdAt: '2026-10-01T08:00:00.000Z'
  },
  {
    id: 'FIN-3006',
    type: 'expense',
    category: 'Fornecedor de Peças',
    description: 'Fatura NF 84920 - Lote de Telas OLED e Baterias iFix Tech SP',
    amount: 1850.0,
    dueDate: '2026-10-08',
    status: 'pending',
    recipientOrPayer: 'Distribuidora iFix Tech SP',
    createdAt: '2026-10-01T09:00:00.000Z'
  },
  {
    id: 'FIN-3007',
    type: 'expense',
    category: 'Energia / Internet',
    description: 'Conta Coelba Energia Elétrica Loja 34',
    amount: 480.0,
    dueDate: '2026-10-15',
    status: 'pending',
    recipientOrPayer: 'Neoenergia Coelba',
    createdAt: '2026-10-02T10:00:00.000Z'
  }
];

export const initialCommissions: CommissionRecord[] = [
  {
    id: 'COM-4001',
    employeeId: 'emp-5',
    employeeName: 'Beatriz Lima',
    employeeRole: 'seller',
    type: 'sale',
    referenceId: 'VD-2089',
    description: 'Comissão 5% sobre Venda VD-2089 (iPhone 13 + Acessórios)',
    baseAmount: 3000.0,
    rate: 5,
    commissionAmount: 150.0,
    status: 'pending',
    createdAt: '2026-10-04T16:20:00.000Z'
  },
  {
    id: 'COM-4002',
    employeeId: 'emp-6',
    employeeName: 'Gabriel Costa',
    employeeRole: 'seller',
    type: 'sale',
    referenceId: 'VD-2088',
    description: 'Comissão 5% sobre Venda VD-2088 (Carregador + Cabo)',
    baseAmount: 130.0,
    rate: 5,
    commissionAmount: 6.5,
    status: 'pending',
    createdAt: '2026-10-05T10:45:00.000Z'
  },
  {
    id: 'COM-4003',
    employeeId: 'emp-5',
    employeeName: 'Beatriz Lima',
    employeeRole: 'seller',
    type: 'sale',
    referenceId: 'VD-2087',
    description: 'Comissão 5% sobre Venda VD-2087 (Fone TWS)',
    baseAmount: 169.0,
    rate: 5,
    commissionAmount: 8.45,
    status: 'pending',
    createdAt: '2026-10-05T11:15:00.000Z'
  },
  {
    id: 'COM-4004',
    employeeId: 'emp-3',
    employeeName: 'Lucas Santos',
    employeeRole: 'technician',
    type: 'service_order',
    referenceId: 'OS-1046',
    description: 'Comissão Técnica 12% sobre Mão de Obra OS-1046 (Bateria IP11)',
    baseAmount: 80.0,
    rate: 12,
    commissionAmount: 9.6,
    status: 'paid',
    createdAt: '2026-10-04T17:30:00.000Z',
    paidAt: '2026-10-04T18:00:00.000Z'
  },
  {
    id: 'COM-4005',
    employeeId: 'emp-4',
    employeeName: 'Matheus Oliveira',
    employeeRole: 'technician',
    type: 'service_order',
    referenceId: 'OS-1045',
    description: 'Comissão Técnica 12% sobre Mão de Obra OS-1045 (Frontal Moto G60)',
    baseAmount: 70.0,
    rate: 12,
    commissionAmount: 8.4,
    status: 'paid',
    createdAt: '2026-10-03T15:00:00.000Z',
    paidAt: '2026-10-03T18:00:00.000Z'
  }
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'stock_alert',
    title: 'Estoque Baixo: Peça Técnica',
    message: 'A peça "Tela Display iPhone 11 Incell" está com apenas 2 unidades (mínimo: 4).',
    read: false,
    createdAt: '2026-10-05T08:15:00.000Z',
    linkTab: 'parts'
  },
  {
    id: 'notif-2',
    type: 'stock_alert',
    title: 'Estoque Baixo: Acessórios',
    message: 'O produto "Cabo USB-C para Lightning 1.2m" atingiu 4 unidades (mínimo: 8).',
    read: false,
    createdAt: '2026-10-05T09:00:00.000Z',
    linkTab: 'inventory'
  },
  {
    id: 'notif-3',
    type: 'order_assigned',
    title: 'Nova OS Aberta #OS-1048',
    message: 'Ordem de serviço urgente atribuída para Lucas Santos (iPhone 13 OLED).',
    read: false,
    createdAt: '2026-10-05T09:30:00.000Z',
    linkTab: 'orders'
  },
  {
    id: 'notif-4',
    type: 'financial_due',
    title: 'Contas a Pagar Próximas',
    message: 'Fatura de Fornecedor iFix Tech SP (R$ 1.850,00) vence em 3 dias.',
    read: true,
    createdAt: '2026-10-04T10:00:00.000Z',
    linkTab: 'financial'
  }
];
