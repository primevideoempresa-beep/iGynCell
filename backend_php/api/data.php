<?php
/**
 * iGyn Cell ERP - API Completa de Sincronização (Full Data Sync)
 * Retorna todos os dados para hidratação inicial do App React
 */

require_once __DIR__ . '/../config.php';

$pdo = getDbConnection();

try {
    // 1. Settings
    $stmt = $pdo->query("SELECT * FROM `store_settings` LIMIT 1");
    $settings = $stmt->fetch() ?: [];
    if (!empty($settings['defaultSaleCommission'])) $settings['defaultSaleCommission'] = (float)$settings['defaultSaleCommission'];
    if (!empty($settings['defaultTechCommission'])) $settings['defaultTechCommission'] = (float)$settings['defaultTechCommission'];

    // 2. Employees
    $stmt = $pdo->query("SELECT * FROM `employees` ORDER BY `name` ASC");
    $employees = $stmt->fetchAll();
    foreach ($employees as &$emp) {
        $emp['commissionRateSales'] = (float)$emp['commissionRateSales'];
        $emp['commissionRateTech'] = (float)$emp['commissionRateTech'];
        $emp['allowedTabs'] = !empty($emp['allowedTabs']) ? json_decode($emp['allowedTabs'], true) : [];
    }

    // 3. Clients
    $stmt = $pdo->query("SELECT * FROM `clients` ORDER BY `name` ASC");
    $clients = $stmt->fetchAll();
    foreach ($clients as &$cli) {
        $cli['totalSpent'] = (float)$cli['totalSpent'];
        $cli['ordersCount'] = (int)$cli['ordersCount'];
    }

    // 4. Products
    $stmt = $pdo->query("SELECT * FROM `products` ORDER BY `name` ASC");
    $products = $stmt->fetchAll();
    foreach ($products as &$prod) {
        $prod['quantity'] = (int)$prod['quantity'];
        $prod['minQuantity'] = (int)$prod['minQuantity'];
        $prod['costPrice'] = (float)$prod['costPrice'];
        $prod['salePrice'] = (float)$prod['salePrice'];
    }

    // 5. Tech Parts
    $stmt = $pdo->query("SELECT * FROM `tech_parts` ORDER BY `name` ASC");
    $techParts = $stmt->fetchAll();
    foreach ($techParts as &$part) {
        $part['quantity'] = (int)$part['quantity'];
        $part['minQuantity'] = (int)$part['minQuantity'];
        $part['costPrice'] = (float)$part['costPrice'];
        $part['salePrice'] = (float)$part['salePrice'];
        $part['compatibleModels'] = !empty($part['compatibleModels']) ? json_decode($part['compatibleModels'], true) : [];
    }

    // 6. Service Orders
    $stmt = $pdo->query("SELECT * FROM `service_orders` ORDER BY `createdAt` DESC");
    $orders = $stmt->fetchAll();
    foreach ($orders as &$ord) {
        $ord['checklist'] = !empty($ord['checklist']) ? json_decode($ord['checklist'], true) : [];
        $ord['partsUsed'] = !empty($ord['partsUsed']) ? json_decode($ord['partsUsed'], true) : [];
        $ord['servicesRendered'] = !empty($ord['servicesRendered']) ? json_decode($ord['servicesRendered'], true) : [];
        $ord['laborCost'] = (float)$ord['laborCost'];
        $ord['partsTotal'] = (float)$ord['partsTotal'];
        $ord['discount'] = (float)$ord['discount'];
        $ord['totalAmount'] = (float)$ord['totalAmount'];
        $ord['warrantyDays'] = (int)$ord['warrantyDays'];
    }

    // 7. Sales
    $stmt = $pdo->query("SELECT * FROM `sales` ORDER BY `createdAt` DESC");
    $sales = $stmt->fetchAll();
    foreach ($sales as &$sale) {
        $sale['items'] = !empty($sale['items']) ? json_decode($sale['items'], true) : [];
        $sale['subtotal'] = (float)$sale['subtotal'];
        $sale['discount'] = (float)$sale['discount'];
        $sale['totalAmount'] = (float)$sale['totalAmount'];
        $sale['commissionRate'] = (float)$sale['commissionRate'];
        $sale['commissionAmount'] = (float)$sale['commissionAmount'];
        $sale['installments'] = (int)($sale['installments'] ?? 1);
    }

    // 8. Financial Entries
    $stmt = $pdo->query("SELECT * FROM `financial_entries` ORDER BY `createdAt` DESC");
    $financialEntries = $stmt->fetchAll();
    foreach ($financialEntries as &$fin) {
        $fin['amount'] = (float)$fin['amount'];
    }

    // 9. Commissions
    $stmt = $pdo->query("SELECT * FROM `commissions` ORDER BY `createdAt` DESC");
    $commissions = $stmt->fetchAll();
    foreach ($commissions as &$com) {
        $com['baseAmount'] = (float)$com['baseAmount'];
        $com['rate'] = (float)$com['rate'];
        $com['commissionAmount'] = (float)$com['commissionAmount'];
    }

    // 10. Notifications
    $stmt = $pdo->query("SELECT * FROM `notifications` ORDER BY `createdAt` DESC LIMIT 50");
    $notifications = $stmt->fetchAll();
    foreach ($notifications as &$notif) {
        $notif['read'] = (bool)($notif['read_status'] ?? 0);
        unset($notif['read_status']);
    }

    sendJson([
        'settings' => $settings,
        'employees' => $employees,
        'clients' => $clients,
        'products' => $products,
        'techParts' => $techParts,
        'orders' => $orders,
        'sales' => $sales,
        'financialEntries' => $financialEntries,
        'commissions' => $commissions,
        'notifications' => $notifications,
        'syncedAt' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    sendError("Erro ao recuperar banco de dados MySQL: " . $e->getMessage(), 500);
}
