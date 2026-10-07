<?php
/**
 * iGyn Cell ERP - API de Colaboradores e Configurações
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $rows = $pdo->query("SELECT * FROM `employees` ORDER BY `name` ASC")->fetchAll();
        foreach ($rows as &$emp) {
            $emp['commissionRateSales'] = (float)$emp['commissionRateSales'];
            $emp['commissionRateTech'] = (float)$emp['commissionRateTech'];
            $emp['allowedTabs'] = !empty($emp['allowedTabs']) ? json_decode($emp['allowedTabs'], true) : [];
        }
        sendJson($rows);
        break;

    case 'POST':
        $data = getJsonBody();
        $count = (int)$pdo->query("SELECT COUNT(*) FROM `employees`")->fetchColumn();
        $newId = "emp-" . ($count + 1);
        $now = date('Y-m-d H:i:s');
        $tabs = !empty($data['allowedTabs']) ? json_encode($data['allowedTabs'], JSON_UNESCAPED_UNICODE) : '["dashboard","orders","sales"]';

        $stmt = $pdo->prepare("INSERT INTO `employees` (
            `id`, `name`, `email`, `password`, `role`, `roleLabel`, `avatar`, `phone`, `status`, `commissionRateSales`, `commissionRateTech`, `allowedTabs`, `createdAt`
        ) VALUES (
            :id, :name, :email, :password, :role, :roleLabel, :avatar, :phone, :status, :commissionRateSales, :commissionRateTech, :allowedTabs, :createdAt
        )");
        $stmt->execute([
            'id' => $newId,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'] ?? '123456',
            'role' => $data['role'] ?? 'technician',
            'roleLabel' => $data['roleLabel'] ?? 'Técnico',
            'avatar' => $data['avatar'] ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            'phone' => $data['phone'] ?? '',
            'status' => $data['status'] ?? 'active',
            'commissionRateSales' => (float)($data['commissionRateSales'] ?? 0),
            'commissionRateTech' => (float)($data['commissionRateTech'] ?? 0),
            'allowedTabs' => $tabs,
            'createdAt' => $now
        ]);

        $created = $pdo->prepare("SELECT * FROM `employees` WHERE `id` = :id");
        $created->execute(['id' => $newId]);
        $row = $created->fetch();
        $row['allowedTabs'] = json_decode($row['allowedTabs'], true);
        sendJson($row, 201);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        $data = getJsonBody();
        if (empty($id) && !empty($data['id'])) $id = $data['id'];
        if (empty($id)) sendError('ID do colaborador não informado');

        $tabs = isset($data['allowedTabs']) ? json_encode($data['allowedTabs'], JSON_UNESCAPED_UNICODE) : null;

        $stmt = $pdo->prepare("UPDATE `employees` SET
            `name` = COALESCE(:name, `name`),
            `email` = COALESCE(:email, `email`),
            `role` = COALESCE(:role, `role`),
            `roleLabel` = COALESCE(:roleLabel, `roleLabel`),
            `phone` = COALESCE(:phone, `phone`),
            `status` = COALESCE(:status, `status`),
            `commissionRateSales` = COALESCE(:commissionRateSales, `commissionRateSales`),
            `commissionRateTech` = COALESCE(:commissionRateTech, `commissionRateTech`),
            `allowedTabs` = COALESCE(:allowedTabs, `allowedTabs`)
            WHERE `id` = :id");

        $stmt->execute([
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
            'role' => $data['role'] ?? null,
            'roleLabel' => $data['roleLabel'] ?? null,
            'phone' => $data['phone'] ?? null,
            'status' => $data['status'] ?? null,
            'commissionRateSales' => isset($data['commissionRateSales']) ? (float)$data['commissionRateSales'] : null,
            'commissionRateTech' => isset($data['commissionRateTech']) ? (float)$data['commissionRateTech'] : null,
            'allowedTabs' => $tabs,
            'id' => $id
        ]);
        sendJson(['success' => true, 'id' => $id]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (empty($id)) sendError('ID não informado');
        $pdo->prepare("DELETE FROM `employees` WHERE `id` = :id")->execute(['id' => $id]);
        sendJson(['success' => true]);
        break;

    default:
        sendError('Método inválido', 405);
}
