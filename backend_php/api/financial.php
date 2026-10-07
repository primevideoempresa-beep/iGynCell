<?php
/**
 * iGyn Cell ERP - API do Módulo Financeiro (Financial)
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $rows = $pdo->query("SELECT * FROM `financial_entries` ORDER BY `createdAt` DESC")->fetchAll();
        foreach ($rows as &$r) $r['amount'] = (float)$r['amount'];
        sendJson($rows);
        break;

    case 'POST':
        $data = getJsonBody();
        $count = (int)$pdo->query("SELECT COUNT(*) FROM `financial_entries`")->fetchColumn();
        $newId = "FIN-" . (3008 + $count);
        $now = date('Y-m-d H:i:s');

        $stmt = $pdo->prepare("INSERT INTO `financial_entries` (
            `id`, `type`, `category`, `description`, `amount`, `dueDate`, `paymentDate`, `status`, `relatedSaleId`, `relatedOrderId`, `recipientOrPayer`, `createdAt`
        ) VALUES (
            :id, :type, :category, :description, :amount, :dueDate, :paymentDate, :status, :relatedSaleId, :relatedOrderId, :recipientOrPayer, :createdAt
        )");
        $stmt->execute([
            'id' => $newId,
            'type' => $data['type'] ?? 'income',
            'category' => $data['category'] ?? 'Geral',
            'description' => $data['description'] ?? '',
            'amount' => (float)($data['amount'] ?? 0),
            'dueDate' => $data['dueDate'] ?? substr($now, 0, 10),
            'paymentDate' => $data['paymentDate'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'relatedSaleId' => $data['relatedSaleId'] ?? null,
            'relatedOrderId' => $data['relatedOrderId'] ?? null,
            'recipientOrPayer' => $data['recipientOrPayer'] ?? '',
            'createdAt' => $now
        ]);

        $created = $pdo->prepare("SELECT * FROM `financial_entries` WHERE `id` = :id");
        $created->execute(['id' => $newId]);
        $row = $created->fetch();
        $row['amount'] = (float)$row['amount'];
        sendJson($row, 201);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        $data = getJsonBody();
        if (empty($id) && !empty($data['id'])) $id = $data['id'];
        if (empty($id)) sendError('ID não informado');

        $status = $data['status'] ?? 'paid';
        $now = date('Y-m-d');
        $paymentDate = ($status === 'paid') ? $now : null;

        $stmt = $pdo->prepare("UPDATE `financial_entries` SET `status` = :status, `paymentDate` = :paymentDate WHERE `id` = :id");
        $stmt->execute(['status' => $status, 'paymentDate' => $paymentDate, 'id' => $id]);
        sendJson(['success' => true, 'id' => $id]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (empty($id)) sendError('ID não informado');
        $pdo->prepare("DELETE FROM `financial_entries` WHERE `id` = :id")->execute(['id' => $id]);
        sendJson(['success' => true]);
        break;

    default:
        sendError('Método inválido', 405);
}
