-- =========================================================
-- iGyn Cell ERP - Estrutura do Banco de Dados MySQL
-- Schema completo e dados iniciais de demonstração
-- =========================================================

CREATE DATABASE IF NOT EXISTS `igyn_cell_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `igyn_cell_db`;

-- ---------------------------------------------------------
-- Tabela: Configurações da Loja
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `store_settings`;
CREATE TABLE `store_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `storeName` VARCHAR(255) NOT NULL DEFAULT 'iGyn Cell Assistência & Acessórios',
  `tradeName` VARCHAR(255) NOT NULL DEFAULT 'iGyn Cell Tecnologia e Serviços LTDA',
  `address` VARCHAR(255) NOT NULL DEFAULT 'Av. dos Navegantes, 1024 - Centro',
  `locationDetails` VARCHAR(255) DEFAULT 'Galeria Porto Sul, Loja 04',
  `cityState` VARCHAR(100) DEFAULT 'Porto Seguro - BA',
  `postalCode` VARCHAR(20) DEFAULT '45810-000',
  `phone` VARCHAR(30) DEFAULT '(73) 99876-5432',
  `cnpj` VARCHAR(30) DEFAULT '34.567.890/0001-12',
  `warrantyTerms` TEXT,
  `defaultSaleCommission` DECIMAL(5,2) DEFAULT 5.00,
  `defaultTechCommission` DECIMAL(5,2) DEFAULT 15.00,
  `whatsappGreetingTemplate` TEXT,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `store_settings` (`id`, `storeName`, `tradeName`, `address`, `locationDetails`, `cityState`, `postalCode`, `phone`, `cnpj`, `warrantyTerms`, `defaultSaleCommission`, `defaultTechCommission`, `whatsappGreetingTemplate`)
VALUES (
  1,
  'iGyn Cell Assistência & Acessórios',
  'iGyn Cell Tecnologia e Serviços LTDA',
  'Av. dos Navegantes, 1024 - Centro',
  'Galeria Porto Sul, Loja 04',
  'Porto Seguro - BA',
  '45810-000',
  '(73) 99876-5432',
  '34.567.890/0001-12',
  'Garantia legal de 90 dias conforme Artigo 26 do Código de Defesa do Consumidor (CDC) exclusivamente para a peça e serviço discriminados nesta O.S. A garantia fica automaticamente invalidada em casos de danos por queda, trincos no vidro/display, contato com líquidos, oxidação, selo de garantia rompido ou intervenção de terceiros.',
  5.00,
  15.00,
  'Olá {cliente}! Aqui é da iGyn Cell Informamos que sua Ordem de Serviço #{os} está com o status: *{status}*. Valor: {valor}. Dúvidas? Estamos à disposição!'
);

-- ---------------------------------------------------------
-- Tabela: Colaboradores / Usuários (Employees)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` VARCHAR(32) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) DEFAULT '123456',
  `passwordHash` VARCHAR(255) DEFAULT '$2y$12$e8w.R6aBf2XqVlm0uDsmG.L2Ece9F8y5zV.nKqvj9i2m9cE0uYqGy',
  `role` ENUM('admin', 'manager', 'seller', 'technician') NOT NULL,
  `roleLabel` VARCHAR(100) NOT NULL,
  `avatar` VARCHAR(500) DEFAULT '',
  `phone` VARCHAR(30) DEFAULT '',
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `commissionRateSales` DECIMAL(5,2) DEFAULT 0.00,
  `commissionRateTech` DECIMAL(5,2) DEFAULT 0.00,
  `allowedTabs` JSON,
  `twoFactorEnabled` TINYINT(1) DEFAULT 0,
  `twoFactorSecret` VARCHAR(64) DEFAULT NULL,
  `failedLoginAttempts` INT DEFAULT 0,
  `lockoutUntil` DATETIME DEFAULT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lastLogin` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `employees` (`id`, `name`, `email`, `password`, `passwordHash`, `role`, `roleLabel`, `avatar`, `phone`, `status`, `commissionRateSales`, `commissionRateTech`, `allowedTabs`, `twoFactorEnabled`, `createdAt`)
VALUES
('emp-1', 'Rodrigo Silva (Admin)', 'admin@igyncell.com', 'admin', '$2y$12$e8w.R6aBf2XqVlm0uDsmG.L2Ece9F8y5zV.nKqvj9i2m9cE0uYqGy', 'admin', 'Administrador Geral', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', '(73) 99911-2233', 'active', 5.00, 15.00, '["dashboard","employees","orders","sales","inventory","parts","clients","financial","commissions","notifications","audit","settings"]', 1, NOW()),
('emp-2', 'Mariana Oliveira', 'mariana@igyncell.com', '123456', '$2y$12$e8w.R6aBf2XqVlm0uDsmG.L2Ece9F8y5zV.nKqvj9i2m9cE0uYqGy', 'manager', 'Gerente de Loja', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', '(73) 99922-3344', 'active', 6.00, 0.00, '["dashboard","orders","sales","inventory","parts","clients","financial","commissions","notifications","audit"]', 0, NOW()),
('emp-3', 'Lucas Santos', 'lucas@igyncell.com', '123456', '$2y$12$e8w.R6aBf2XqVlm0uDsmG.L2Ece9F8y5zV.nKqvj9i2m9cE0uYqGy', 'technician', 'Técnico Especialista Apple/Android', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', '(73) 99933-4455', 'active', 0.00, 15.00, '["dashboard","orders","parts","clients","notifications"]', 0, NOW()),
('emp-4', 'Beatriz Lima', 'beatriz@igyncell.com', '123456', '$2y$12$e8w.R6aBf2XqVlm0uDsmG.L2Ece9F8y5zV.nKqvj9i2m9cE0uYqGy', 'seller', 'Vendedora & Atendimento', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', '(73) 99944-5566', 'active', 5.00, 0.00, '["dashboard","sales","inventory","clients","notifications"]', 0, NOW());

-- ---------------------------------------------------------
-- Tabela: Clientes (Clients)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `clients`;
CREATE TABLE `clients` (
  `id` VARCHAR(32) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `whatsapp` VARCHAR(30) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `cpfCnpj` VARCHAR(30) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(100) DEFAULT 'Porto Seguro - BA',
  `notes` TEXT DEFAULT NULL,
  `totalSpent` DECIMAL(12,2) DEFAULT 0.00,
  `ordersCount` INT DEFAULT 0,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `clients` (`id`, `name`, `phone`, `whatsapp`, `email`, `cpfCnpj`, `address`, `city`, `notes`, `totalSpent`, `ordersCount`, `createdAt`)
VALUES
('cli-1', 'Carlos Eduardo Mendes', '(73) 99123-4567', '(73) 99123-4567', 'carlos.mendes@gmail.com', '023.456.789-10', 'Rua das Palmeiras, 142 - Centro', 'Porto Seguro - BA', 'Cliente antigo, sempre faz manutenção de iPhone.', 1450.00, 3, NOW()),
('cli-2', 'Fernanda Souza', '(73) 98845-6789', '(73) 98845-6789', 'fernanda.souza@hotmail.com', '987.654.321-00', 'Av. Beira Mar, 880 - Praia do Mutá', 'Porto Seguro - BA', 'Indicação da Pousada Sol & Mar.', 890.00, 2, NOW()),
('cli-3', 'Julio Cesar Alcantara', '(73) 99988-7766', '(73) 99988-7766', 'julio.cesar@empresa.com.br', '12.345.678/0001-90', 'Rua do Telégrafo, 45 - Trancoso', 'Porto Seguro - BA', 'Conta jurídica - Faturamento mensal.', 3200.00, 5, NOW()),
('cli-4', 'Patrícia Rocha', '(73) 98112-3344', '(73) 98112-3344', 'patricia.rocha@yahoo.com.br', '456.789.123-44', 'Praça da Matriz, 12 - Arraial dAjuda', 'Porto Seguro - BA', 'Prefere contato pelo WhatsApp.', 420.00, 1, NOW());

-- ---------------------------------------------------------
-- Tabela: Produtos para Venda de Balcão (Products)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` VARCHAR(32) PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `minQuantity` INT NOT NULL DEFAULT 5,
  `costPrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `salePrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `supplier` VARCHAR(255) DEFAULT '',
  `location` VARCHAR(100) DEFAULT 'Vitrine Principal',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `products` (`id`, `code`, `name`, `category`, `quantity`, `minQuantity`, `costPrice`, `salePrice`, `supplier`, `location`, `createdAt`)
VALUES
('prod-1', 'CAB-USB-C-20W', 'Cabo USB-C para Lightning 20W Original Foxconn 1m', 'Cabos & Conectores', 28, 10, 18.00, 65.00, 'Distribuidora TechBahia', 'Gôndola A1', NOW()),
('prod-2', 'CAR-FAST-30W', 'Carregador Turbo USB-C 30W Power Delivery GaN', 'Carregadores', 15, 8, 32.00, 95.00, 'AllExpress Brasil Imp.', 'Gôndola A2', NOW()),
('prod-3', 'PEL-3D-IP14', 'Película de Vidro 3D Cerâmica iPhone 13/14/15', 'Películas', 45, 15, 4.50, 35.00, 'Gyn Películas Atacado', 'Gaveteiro P1', NOW()),
('prod-4', 'FON-BLU-AIR', 'Fone Bluetooth TWS Gamer Ultra Low Latency', 'Áudio & Fones', 8, 5, 48.00, 140.00, 'SunTech Eletrônicos', 'Vitrine Central', NOW());

-- ---------------------------------------------------------
-- Tabela: Peças de Laboratório / Assistência (Tech Parts)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `tech_parts`;
CREATE TABLE `tech_parts` (
  `id` VARCHAR(32) PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `compatibleModels` JSON DEFAULT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `minQuantity` INT NOT NULL DEFAULT 3,
  `costPrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `salePrice` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `supplier` VARCHAR(255) DEFAULT '',
  `shelfLocation` VARCHAR(100) DEFAULT 'Gaveta Lab 1',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tech_parts` (`id`, `code`, `name`, `category`, `compatibleModels`, `quantity`, `minQuantity`, `costPrice`, `salePrice`, `supplier`, `shelfLocation`, `createdAt`)
VALUES
('part-1', 'SCR-IP13-OLED', 'Tela Frontal Display OLED iPhone 13 Original Nacional', 'Telas & Displays', '["iPhone 13", "iPhone 13 mini"]', 6, 2, 280.00, 580.00, 'Master Peças Apple SP', 'Gaveta Telas 03', NOW()),
('part-2', 'BAT-IP11-ORIG', 'Bateria Original iPhone 11 com Chip TI de Saúde', 'Baterias', '["iPhone 11"]', 9, 3, 75.00, 210.00, 'Gyn Peças Import', 'Armário Baterias A', NOW()),
('part-3', 'SCR-S22-AMOLED', 'Frontal Completa Samsung Galaxy S22 5G com Aro', 'Telas & Displays', '["Galaxy S22", "SM-S901B"]', 3, 2, 410.00, 780.00, 'Distribuidora Samsung BR', 'Gaveta Telas 08', NOW()),
('part-4', 'CON-IP12-DOCK', 'Conector de Carga Flex Dock Lightning iPhone 12', 'Conectores de Carga', '["iPhone 12", "iPhone 12 Pro"]', 8, 3, 35.00, 150.00, 'Master Peças Apple SP', 'Gaveta Conectores 01', NOW());

-- ---------------------------------------------------------
-- Tabela: Ordens de Serviço (Service Orders)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `service_orders`;
CREATE TABLE `service_orders` (
  `id` VARCHAR(32) PRIMARY KEY,
  `clientId` VARCHAR(32) NOT NULL,
  `clientName` VARCHAR(255) NOT NULL,
  `clientPhone` VARCHAR(30) NOT NULL,
  `clientCpf` VARCHAR(30) DEFAULT NULL,
  `deviceType` VARCHAR(50) DEFAULT 'Smartphone',
  `brand` VARCHAR(50) DEFAULT 'Apple',
  `model` VARCHAR(255) NOT NULL,
  `color` VARCHAR(100) DEFAULT '',
  `imeiOrSerial` VARCHAR(100) DEFAULT '',
  `passcode` VARCHAR(50) DEFAULT '',
  `physicalCondition` VARCHAR(255) DEFAULT '',
  `checklist` JSON DEFAULT NULL,
  `problemReported` TEXT NOT NULL,
  `technicalDiagnosis` TEXT DEFAULT NULL,
  `assignedTechnicianId` VARCHAR(32) DEFAULT '',
  `assignedTechnicianName` VARCHAR(255) DEFAULT '',
  `status` ENUM('open', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled') NOT NULL DEFAULT 'open',
  `priority` ENUM('normal', 'urgent', 'warranty') NOT NULL DEFAULT 'normal',
  `partsUsed` JSON DEFAULT NULL,
  `servicesRendered` JSON DEFAULT NULL,
  `laborCost` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `partsTotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `totalAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `paymentMethod` VARCHAR(50) DEFAULT 'pix',
  `paymentStatus` ENUM('paid', 'pending', 'cancelled') NOT NULL DEFAULT 'pending',
  `warrantyDays` INT DEFAULT 90,
  `technicalNotesInternal` TEXT DEFAULT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completedAt` DATETIME DEFAULT NULL,
  `deliveredAt` DATETIME DEFAULT NULL,
  INDEX `idx_os_client` (`clientId`),
  INDEX `idx_os_status` (`status`),
  INDEX `idx_os_tech` (`assignedTechnicianId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `service_orders` (`id`, `clientId`, `clientName`, `clientPhone`, `clientCpf`, `deviceType`, `brand`, `model`, `color`, `imeiOrSerial`, `passcode`, `physicalCondition`, `checklist`, `problemReported`, `technicalDiagnosis`, `assignedTechnicianId`, `assignedTechnicianName`, `status`, `priority`, `partsUsed`, `servicesRendered`, `laborCost`, `partsTotal`, `discount`, `totalAmount`, `paymentMethod`, `paymentStatus`, `warrantyDays`, `technicalNotesInternal`, `createdAt`, `updatedAt`)
VALUES
('OS-1048', 'cli-1', 'Carlos Eduardo Mendes', '(73) 99123-4567', '023.456.789-10', 'Smartphone', 'Apple', 'iPhone 13 128GB', 'Azul Meia-Noite', '358912093847123', '140892', 'Trincado no canto superior direito, marcas leves na carcaça.', '{"powersOn": true, "touchWorks": false, "displayOk": false, "chargingOk": true, "cameraFrontOk": true, "cameraRearOk": true, "microphoneOk": true, "speakerOk": true, "wifiOk": true, "biometricsOk": true, "frameDented": false, "waterDamage": false}', 'Aparelho caiu no chão, display com listras verdes e toque não responde.', 'Substituição completa do módulo frontal OLED com restauração do sensor TrueTone.', 'emp-3', 'Lucas Santos', 'in_progress', 'urgent', '[{"partId": "part-1", "code": "SCR-IP13-OLED", "name": "Tela Frontal Display OLED iPhone 13", "quantity": 1, "unitCost": 280.00, "unitPrice": 580.00, "subtotal": 580.00}]', '[{"id": "srv-1", "name": "Troca de Módulo Frontal e Calibração TrueTone", "price": 120.00}]', 120.00, 580.00, 0.00, 700.00, 'pix', 'pending', 90, 'Cliente precisa do aparelho com urgência para trabalho.', NOW(), NOW()),
('OS-1047', 'cli-2', 'Fernanda Souza', '(73) 98845-6789', '987.654.321-00', 'Smartphone', 'Apple', 'iPhone 11 64GB', 'Preto', '354890123456789', 'Sem Senha', 'Bom estado geral, apenas bateria degradada com aviso no iOS.', '{"powersOn": true, "touchWorks": true, "displayOk": true, "chargingOk": true, "cameraFrontOk": true, "cameraRearOk": true, "microphoneOk": true, "speakerOk": true, "wifiOk": true, "biometricsOk": true, "frameDented": false, "waterDamage": false}', 'Bateria descarrega muito rápido e aparelho desliga com 20%.', 'Troca de bateria com transplante de chip de proteção e reprogramação do ciclo de saúde 100%.', 'emp-3', 'Lucas Santos', 'completed', 'normal', '[{"partId": "part-2", "code": "BAT-IP11-ORIG", "name": "Bateria Original iPhone 11 com Chip TI", "quantity": 1, "unitCost": 75.00, "unitPrice": 210.00, "subtotal": 210.00}]', '[{"id": "srv-2", "name": "Troca de Bateria e Vedação Anti-Poeira", "price": 80.00}]', 80.00, 210.00, 10.00, 280.00, 'credit', 'pending', 90, 'Pronto para entrega. Mensagem de WhatsApp enviada.', NOW(), NOW());

-- ---------------------------------------------------------
-- Tabela: Vendas de Balcão (Sales)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `sales`;
CREATE TABLE `sales` (
  `id` VARCHAR(32) PRIMARY KEY,
  `clientId` VARCHAR(32) DEFAULT NULL,
  `clientName` VARCHAR(255) NOT NULL,
  `clientPhone` VARCHAR(30) DEFAULT NULL,
  `sellerId` VARCHAR(32) NOT NULL,
  `sellerName` VARCHAR(255) NOT NULL,
  `items` JSON NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `totalAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `paymentMethod` VARCHAR(50) NOT NULL DEFAULT 'pix',
  `installments` INT DEFAULT 1,
  `commissionRate` DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  `commissionAmount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('completed', 'pending', 'cancelled') NOT NULL DEFAULT 'completed',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `sales` (`id`, `clientId`, `clientName`, `clientPhone`, `sellerId`, `sellerName`, `items`, `subtotal`, `discount`, `totalAmount`, `paymentMethod`, `installments`, `commissionRate`, `commissionAmount`, `status`, `createdAt`)
VALUES
('VD-2089', 'cli-4', 'Patrícia Rocha', '(73) 98112-3344', 'emp-4', 'Beatriz Lima', '[{"productId": "prod-1", "code": "CAB-USB-C-20W", "name": "Cabo USB-C para Lightning 20W Original Foxconn 1m", "quantity": 1, "unitPrice": 65.00, "unitCost": 18.00, "subtotal": 65.00}, {"productId": "prod-3", "code": "PEL-3D-IP14", "name": "Película de Vidro 3D Cerâmica iPhone 13/14/15", "quantity": 1, "unitPrice": 35.00, "unitCost": 4.50, "subtotal": 35.00}]', 100.00, 5.00, 95.00, 'pix', 1, 5.00, 4.75, 'completed', NOW());

-- ---------------------------------------------------------
-- Tabela: Lançamentos Financeiros (Financial Entries)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `financial_entries`;
CREATE TABLE `financial_entries` (
  `id` VARCHAR(32) PRIMARY KEY,
  `type` ENUM('income', 'expense') NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `dueDate` DATE NOT NULL,
  `paymentDate` DATE DEFAULT NULL,
  `status` ENUM('paid', 'pending', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
  `relatedSaleId` VARCHAR(32) DEFAULT NULL,
  `relatedOrderId` VARCHAR(32) DEFAULT NULL,
  `recipientOrPayer` VARCHAR(255) NOT NULL,
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `financial_entries` (`id`, `type`, `category`, `description`, `amount`, `dueDate`, `paymentDate`, `status`, `relatedSaleId`, `relatedOrderId`, `recipientOrPayer`, `createdAt`)
VALUES
('FIN-3001', 'income', 'Ordem de Serviço', 'OS OS-1048 - Apple iPhone 13 128GB (Carlos Eduardo Mendes)', 700.00, CURDATE(), NULL, 'pending', NULL, 'OS-1048', 'Carlos Eduardo Mendes', NOW()),
('FIN-3002', 'income', 'Ordem de Serviço', 'OS OS-1047 - Apple iPhone 11 64GB (Fernanda Souza)', 280.00, CURDATE(), NULL, 'pending', NULL, 'OS-1047', 'Fernanda Souza', NOW()),
('FIN-3003', 'income', 'Venda de Balcão', 'Venda VD-2089 - Cabo USB-C, Película 3D (PIX)', 95.00, CURDATE(), CURDATE(), 'paid', 'VD-2089', NULL, 'Patrícia Rocha', NOW()),
('FIN-3004', 'expense', 'Aluguel do Ponto', 'Aluguel Galeria Porto Sul - Sala 04', 1850.00, CURDATE(), CURDATE(), 'paid', NULL, NULL, 'Administradora Porto Sul Imóveis', NOW());

-- ---------------------------------------------------------
-- Tabela: Comissões dos Colaboradores (Commissions)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `commissions`;
CREATE TABLE `commissions` (
  `id` VARCHAR(32) PRIMARY KEY,
  `employeeId` VARCHAR(32) NOT NULL,
  `employeeName` VARCHAR(255) NOT NULL,
  `employeeRole` VARCHAR(50) NOT NULL,
  `type` ENUM('sale', 'service_order') NOT NULL,
  `referenceId` VARCHAR(32) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `baseAmount` DECIMAL(10,2) NOT NULL,
  `rate` DECIMAL(5,2) NOT NULL,
  `commissionAmount` DECIMAL(10,2) NOT NULL,
  `status` ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `paidAt` DATETIME DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `commissions` (`id`, `employeeId`, `employeeName`, `employeeRole`, `type`, `referenceId`, `description`, `baseAmount`, `rate`, `commissionAmount`, `status`, `createdAt`)
VALUES
('COM-4001', 'emp-3', 'Lucas Santos', 'technician', 'service_order', 'OS-1048', 'Comissão Técnica 15% sobre Mão de Obra OS-1048', 120.00, 15.00, 18.00, 'pending', NOW()),
('COM-4002', 'emp-3', 'Lucas Santos', 'technician', 'service_order', 'OS-1047', 'Comissão Técnica 15% sobre Mão de Obra OS-1047', 80.00, 15.00, 12.00, 'pending', NOW()),
('COM-4003', 'emp-4', 'Beatriz Lima', 'seller', 'sale', 'VD-2089', 'Comissão 5% sobre Venda VD-2089', 95.00, 5.00, 4.75, 'pending', NOW());

-- ---------------------------------------------------------
-- Tabela: Notificações do Sistema (Notifications)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` VARCHAR(64) PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `read_status` TINYINT(1) DEFAULT 0,
  `linkTab` VARCHAR(50) DEFAULT 'orders',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `notifications` (`id`, `type`, `title`, `message`, `read_status`, `linkTab`, `createdAt`)
VALUES
('notif-1', 'order_assigned', 'Nova OS Criada #OS-1048', 'Apple iPhone 13 128GB (Carlos Eduardo Mendes) atribuído a Lucas Santos.', 0, 'orders', NOW()),
('notif-2', 'stock_alert', 'Estoque Baixo: Frontal S22 5G', 'Apenas 3 unidades restantes no laboratório. Mínimo recomendado: 2 un.', 0, 'parts', NOW());

-- ---------------------------------------------------------
-- Tabela: Logs de Auditoria e Segurança (Audit Logs)
-- ---------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` VARCHAR(64) PRIMARY KEY,
  `userId` VARCHAR(32) DEFAULT 'system',
  `userName` VARCHAR(255) NOT NULL,
  `userRole` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `entity` VARCHAR(50) NOT NULL,
  `entityId` VARCHAR(64) DEFAULT NULL,
  `details` TEXT NOT NULL,
  `ipAddress` VARCHAR(45) DEFAULT '127.0.0.1',
  `userAgent` VARCHAR(255) DEFAULT '',
  `createdAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_user` (`userId`),
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_entity` (`entity`),
  INDEX `idx_audit_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `audit_logs` (`id`, `userId`, `userName`, `userRole`, `action`, `entity`, `entityId`, `details`, `ipAddress`, `userAgent`, `createdAt`)
VALUES
('log-1', 'emp-1', 'Rodrigo Silva (Admin)', 'admin', 'LOGIN', 'Auth', 'emp-1', 'Login seguro realizado com sucesso (Autenticação 2FA verificada)', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW()),
('log-2', 'emp-3', 'Lucas Santos', 'technician', 'CREATE', 'ServiceOrder', 'OS-1048', 'Criou Ordem de Serviço #OS-1048 para Carlos Eduardo Mendes (iPhone 13)', '192.168.1.105', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', NOW()),
('log-3', 'emp-4', 'Beatriz Lima', 'seller', 'CREATE', 'Sale', 'VD-2089', 'Registrou venda de balcão #VD-2089 no valor de R$ 95,00 (PIX)', '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW()),
('log-4', 'emp-1', 'Rodrigo Silva (Admin)', 'admin', 'UPDATE', 'Settings', '1', 'Alterou termos de garantia e políticas de comissão', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NOW());

