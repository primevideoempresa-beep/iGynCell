<?php
/**
 * iGyn Cell ERP - API de Auditoria & Registro de Atividades (Audit Logs)
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    // ------------------------------------------------------------------------
    // GET: Listar registros de auditoria (Apenas Admin e Gerente)
    // ------------------------------------------------------------------------
    case 'GET':
        requireRole(['admin', 'manager']);

        $limit = isset($_GET['limit']) ? min(200, (int)$_GET['limit']) : 50;
        $action = $_GET['action'] ?? null;
        $entity = $_GET['entity'] ?? null;
        $userId = $_GET['userId'] ?? null;

        $sql = "SELECT * FROM `audit_logs` WHERE 1=1";
        $params = [];

        if (!empty($action) && $action !== 'all') {
            $sql .= " AND `action` = :action";
            $params['action'] = $action;
        }

        if (!empty($entity) && $entity !== 'all') {
            $sql .= " AND `entity` = :entity";
            $params['entity'] = $entity;
        }

        if (!empty($userId) && $userId !== 'all') {
            $sql .= " AND `userId` = :userId";
            $params['userId'] = $userId;
        }

        $sql .= " ORDER BY `createdAt` DESC LIMIT " . $limit;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $logs = $stmt->fetchAll();

        sendJson($logs);
        break;

    // ------------------------------------------------------------------------
    // POST: Inserir novo registro de auditoria manual/customizado
    // ------------------------------------------------------------------------
    case 'POST':
        $data = getJsonBody();
        $userId = $data['userId'] ?? $_SERVER['HTTP_X_USER_ID'] ?? 'system';
        $userName = $data['userName'] ?? 'Colaborador';
        $userRole = $data['userRole'] ?? 'seller';
        $action = $data['action'] ?? 'UPDATE';
        $entity = $data['entity'] ?? 'General';
        $entityId = $data['entityId'] ?? null;
        $details = $data['details'] ?? '';

        logAudit($pdo, $userId, $userName, $userRole, $action, $entity, $entityId, $details);
        sendJson(['success' => true]);
        break;

    default:
        sendError('Método inválido', 405);
}
