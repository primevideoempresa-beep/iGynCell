<?php
/**
 * iGyn Cell ERP - API de Notificações
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM `notifications` ORDER BY `createdAt` DESC LIMIT 50");
        $rows = $stmt->fetchAll();
        foreach ($rows as &$n) {
            $n['read'] = (bool)($n['read_status'] ?? 0);
            unset($n['read_status']);
        }
        sendJson($rows);
        break;

    case 'PUT':
        $action = $_GET['action'] ?? null;
        $id = $_GET['id'] ?? null;

        if ($action === 'clear-all') {
            $pdo->query("UPDATE `notifications` SET `read_status` = 1");
            sendJson(['success' => true]);
        }

        if (!empty($id)) {
            $stmt = $pdo->prepare("UPDATE `notifications` SET `read_status` = 1 WHERE `id` = :id");
            $stmt->execute(['id' => $id]);
            sendJson(['success' => true, 'id' => $id]);
        }

        sendError('Ação inválida');
        break;

    default:
        sendError('Método inválido', 405);
}
