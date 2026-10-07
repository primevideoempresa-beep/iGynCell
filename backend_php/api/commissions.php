<?php
/**
 * iGyn Cell ERP - API de Comissões (Commissions)
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $rows = $pdo->query("SELECT * FROM `commissions` ORDER BY `createdAt` DESC")->fetchAll();
        foreach ($rows as &$r) {
            $r['baseAmount'] = (float)$r['baseAmount'];
            $r['rate'] = (float)$r['rate'];
            $r['commissionAmount'] = (float)$r['commissionAmount'];
        }
        sendJson($rows);
        break;

    case 'POST':
        $action = $_GET['action'] ?? null;
        $id = $_GET['id'] ?? null;
        $data = getJsonBody();

        // Pagar Comissão
        if ($action === 'pay' && !empty($id)) {
            $now = date('Y-m-d H:i:s');
            $stmt = $pdo->prepare("SELECT * FROM `commissions` WHERE `id` = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            $comm = $stmt->fetch();
            if (!$comm) sendError('Comissão não encontrada', 404);

            $pdo->prepare("UPDATE `commissions` SET `status` = 'paid', `paidAt` = :now WHERE `id` = :id")->execute(['now' => $now, 'id' => $id]);

            // Lançar despesa no financeiro
            $finCount = (int)$pdo->query("SELECT COUNT(*) FROM `financial_entries`")->fetchColumn();
            $finId = "FIN-" . (3008 + $finCount);
            $stmtFin = $pdo->prepare("INSERT INTO `financial_entries` (
                `id`, `type`, `category`, `description`, `amount`, `dueDate`, `paymentDate`, `status`, `recipientOrPayer`, `createdAt`
            ) VALUES (
                :id, 'expense', 'Comissões', :desc, :amount, :dDate, :pDate, 'paid', :payer, :createdAt
            )");
            $stmtFin->execute([
                'id' => $finId,
                'desc' => "Pagamento de " . $comm['description'] . " - " . $comm['employeeName'],
                'amount' => (float)$comm['commissionAmount'],
                'dDate' => substr($now, 0, 10),
                'pDate' => substr($now, 0, 10),
                'payer' => $comm['employeeName'],
                'createdAt' => $now
            ]);

            sendJson(['success' => true, 'id' => $id]);
        }
        sendError('Ação não suportada', 400);
        break;

    default:
        sendError('Método inválido', 405);
}
