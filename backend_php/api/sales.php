<?php
/**
 * iGyn Cell ERP - API de Vendas de Balcão (Sales)
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

function formatSaleRow($s) {
    if (!$s) return null;
    $s['items'] = !empty($s['items']) ? json_decode($s['items'], true) : [];
    $s['subtotal'] = (float)$s['subtotal'];
    $s['discount'] = (float)$s['discount'];
    $s['totalAmount'] = (float)$s['totalAmount'];
    $s['commissionRate'] = (float)$s['commissionRate'];
    $s['commissionAmount'] = (float)$s['commissionAmount'];
    $s['installments'] = (int)($s['installments'] ?? 1);
    return $s;
}

switch ($method) {
    case 'GET':
        $rows = $pdo->query("SELECT * FROM `sales` ORDER BY `createdAt` DESC")->fetchAll();
        sendJson(array_map('formatSaleRow', $rows));
        break;

    case 'POST':
        $data = getJsonBody();
        if (empty($data['items']) || !is_array($data['items'])) {
            sendError('Itens da venda são obrigatórios');
        }

        try {
            $pdo->beginTransaction();
            $count = (int)$pdo->query("SELECT COUNT(*) FROM `sales`")->fetchColumn();
            $newId = "VD-" . (2090 + $count);
            $now = date('Y-m-d H:i:s');

            $itemsJson = json_encode($data['items'], JSON_UNESCAPED_UNICODE);
            $subtotal = (float)($data['subtotal'] ?? 0);
            $discount = (float)($data['discount'] ?? 0);
            $totalAmount = (float)($data['totalAmount'] ?? ($subtotal - $discount));
            $commRate = (float)($data['commissionRate'] ?? 5.0);
            $commAmount = ($totalAmount * $commRate) / 100.0;

            $stmt = $pdo->prepare("INSERT INTO `sales` (
                `id`, `clientId`, `clientName`, `clientPhone`, `sellerId`, `sellerName`, `items`, `subtotal`, `discount`, `totalAmount`, `paymentMethod`, `installments`, `commissionRate`, `commissionAmount`, `status`, `createdAt`
            ) VALUES (
                :id, :clientId, :clientName, :clientPhone, :sellerId, :sellerName, :items, :subtotal, :discount, :totalAmount, :paymentMethod, :installments, :commissionRate, :commissionAmount, 'completed', :createdAt
            )");
            $stmt->execute([
                'id' => $newId,
                'clientId' => $data['clientId'] ?? null,
                'clientName' => $data['clientName'] ?? 'Cliente Balcão',
                'clientPhone' => $data['clientPhone'] ?? '',
                'sellerId' => $data['sellerId'] ?? 'emp-4',
                'sellerName' => $data['sellerName'] ?? 'Beatriz Lima',
                'items' => $itemsJson,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'totalAmount' => $totalAmount,
                'paymentMethod' => $data['paymentMethod'] ?? 'pix',
                'installments' => (int)($data['installments'] ?? 1),
                'commissionRate' => $commRate,
                'commissionAmount' => $commAmount,
                'createdAt' => $now
            ]);

            // Baixa de estoque de produtos
            $stmtProd = $pdo->prepare("UPDATE `products` SET `quantity` = GREATEST(0, `quantity` - :qty), `updatedAt` = :now WHERE `id` = :prodId");
            foreach ($data['items'] as $item) {
                if (!empty($item['productId']) && !empty($item['quantity'])) {
                    $stmtProd->execute(['qty' => (int)$item['quantity'], 'now' => $now, 'prodId' => $item['productId']]);
                }
            }

            // Lançamento Financeiro
            $finCount = (int)$pdo->query("SELECT COUNT(*) FROM `financial_entries`")->fetchColumn();
            $finId = "FIN-" . (3008 + $finCount);
            $stmtFin = $pdo->prepare("INSERT INTO `financial_entries` (
                `id`, `type`, `category`, `description`, `amount`, `dueDate`, `paymentDate`, `status`, `relatedSaleId`, `recipientOrPayer`, `createdAt`
            ) VALUES (
                :id, 'income', 'Venda de Balcão', :desc, :amount, :dDate, :pDate, 'paid', :saleId, :payer, :createdAt
            )");
            $stmtFin->execute([
                'id' => $finId,
                'desc' => "Venda {$newId} - {$data['clientName']}",
                'amount' => $totalAmount,
                'dDate' => substr($now, 0, 10),
                'pDate' => substr($now, 0, 10),
                'saleId' => $newId,
                'payer' => $data['clientName'] ?? 'Cliente Balcão',
                'createdAt' => $now
            ]);

            // Registro de Comissão
            if (!empty($data['sellerId']) && $commAmount > 0) {
                $commCount = (int)$pdo->query("SELECT COUNT(*) FROM `commissions`")->fetchColumn();
                $commId = "COM-" . (4006 + $commCount);
                $stmtComm = $pdo->prepare("INSERT INTO `commissions` (
                    `id`, `employeeId`, `employeeName`, `employeeRole`, `type`, `referenceId`, `description`, `baseAmount`, `rate`, `commissionAmount`, `status`, `createdAt`
                ) VALUES (
                    :id, :empId, :empName, 'seller', 'sale', :refId, :desc, :base, :rate, :comm, 'pending', :createdAt
                )");
                $stmtComm->execute([
                    'id' => $commId,
                    'empId' => $data['sellerId'],
                    'empName' => $data['sellerName'] ?? 'Beatriz Lima',
                    'refId' => $newId,
                    'desc' => "Comissão {$commRate}% sobre Venda {$newId}",
                    'base' => $totalAmount,
                    'rate' => $commRate,
                    'comm' => $commAmount,
                    'createdAt' => $now
                ]);
            }

            // Atualiza cliente
            if (!empty($data['clientId'])) {
                $pdo->prepare("UPDATE `clients` SET `totalSpent` = `totalSpent` + :tot WHERE `id` = :cid")->execute(['tot' => $totalAmount, 'cid' => $data['clientId']]);
            }

            $pdo->commit();

            $created = $pdo->prepare("SELECT * FROM `sales` WHERE `id` = :id");
            $created->execute(['id' => $newId]);
            sendJson(formatSaleRow($created->fetch()), 201);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendError("Erro ao registrar venda: " . $e->getMessage(), 500);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (empty($id)) sendError('ID não informado');
        $pdo->prepare("UPDATE `sales` SET `status` = 'cancelled' WHERE `id` = :id")->execute(['id' => $id]);
        sendJson(['success' => true]);
        break;

    default:
        sendError('Método inválido', 405);
}
