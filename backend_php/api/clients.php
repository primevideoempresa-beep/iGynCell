<?php
/**
 * iGyn Cell ERP - API de Clientes (Clients)
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM `clients` WHERE `id` = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            $client = $stmt->fetch();
            if (!$client) sendError('Cliente não encontrado', 404);
            $client['totalSpent'] = (float)$client['totalSpent'];
            $client['ordersCount'] = (int)$client['ordersCount'];
            sendJson($client);
        } else {
            $stmt = $pdo->query("SELECT * FROM `clients` ORDER BY `name` ASC");
            $clients = $stmt->fetchAll();
            foreach ($clients as &$c) {
                $c['totalSpent'] = (float)$c['totalSpent'];
                $c['ordersCount'] = (int)$c['ordersCount'];
            }
            sendJson($clients);
        }
        break;

    case 'POST':
        $data = getJsonBody();
        if (empty($data['name']) || empty($data['phone'])) {
            sendError('Nome e Telefone são obrigatórios para cadastro');
        }
        $count = (int)$pdo->query("SELECT COUNT(*) FROM `clients`")->fetchColumn();
        $newId = "cli-" . ($count + 1);
        $now = date('Y-m-d H:i:s');

        $stmt = $pdo->prepare("INSERT INTO `clients` (
            `id`, `name`, `phone`, `whatsapp`, `email`, `cpfCnpj`, `address`, `city`, `notes`, `totalSpent`, `ordersCount`, `createdAt`
        ) VALUES (
            :id, :name, :phone, :whatsapp, :email, :cpfCnpj, :address, :city, :notes, 0.00, 0, :createdAt
        )");
        $stmt->execute([
            'id' => $newId,
            'name' => $data['name'],
            'phone' => $data['phone'],
            'whatsapp' => $data['whatsapp'] ?? $data['phone'],
            'email' => $data['email'] ?? null,
            'cpfCnpj' => $data['cpfCnpj'] ?? null,
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? 'Porto Seguro - BA',
            'notes' => $data['notes'] ?? null,
            'createdAt' => $now
        ]);

        $created = $pdo->prepare("SELECT * FROM `clients` WHERE `id` = :id");
        $created->execute(['id' => $newId]);
        $row = $created->fetch();
        $row['totalSpent'] = 0.00;
        $row['ordersCount'] = 0;
        sendJson($row, 201);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        $data = getJsonBody();
        if (empty($id) && !empty($data['id'])) $id = $data['id'];
        if (empty($id)) sendError('ID do cliente não informado');

        $stmt = $pdo->prepare("UPDATE `clients` SET
            `name` = COALESCE(:name, `name`),
            `phone` = COALESCE(:phone, `phone`),
            `whatsapp` = COALESCE(:whatsapp, `whatsapp`),
            `email` = COALESCE(:email, `email`),
            `cpfCnpj` = COALESCE(:cpfCnpj, `cpfCnpj`),
            `address` = COALESCE(:address, `address`),
            `city` = COALESCE(:city, `city`),
            `notes` = COALESCE(:notes, `notes`)
            WHERE `id` = :id");
        $stmt->execute([
            'name' => $data['name'] ?? null,
            'phone' => $data['phone'] ?? null,
            'whatsapp' => $data['whatsapp'] ?? null,
            'email' => $data['email'] ?? null,
            'cpfCnpj' => $data['cpfCnpj'] ?? null,
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'notes' => $data['notes'] ?? null,
            'id' => $id
        ]);
        sendJson(['success' => true, 'id' => $id]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (empty($id)) sendError('ID não informado');
        $pdo->prepare("DELETE FROM `clients` WHERE `id` = :id")->execute(['id' => $id]);
        sendJson(['success' => true]);
        break;

    default:
        sendError('Método inválido', 405);
}
