<?php
/**
 * iGyn Cell ERP - API de Produtos de Balcão (Products)
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

function formatProductRow($p) {
    if (!$p) return null;
    $p['quantity'] = (int)$p['quantity'];
    $p['minQuantity'] = (int)$p['minQuantity'];
    $p['costPrice'] = (float)$p['costPrice'];
    $p['salePrice'] = (float)$p['salePrice'];
    return $p;
}

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM `products` WHERE `id` = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();
            if (!$row) sendError('Produto não encontrado', 404);
            sendJson(formatProductRow($row));
        } else {
            $rows = $pdo->query("SELECT * FROM `products` ORDER BY `name` ASC")->fetchAll();
            sendJson(array_map('formatProductRow', $rows));
        }
        break;

    case 'POST':
        $action = $_GET['action'] ?? null;
        $id = $_GET['id'] ?? null;
        $data = getJsonBody();

        if ($action === 'adjust' && !empty($id)) {
            $delta = (int)($data['delta'] ?? 0);
            $now = date('Y-m-d H:i:s');
            $stmt = $pdo->prepare("UPDATE `products` SET `quantity` = GREATEST(0, `quantity` + :delta), `updatedAt` = :now WHERE `id` = :id");
            $stmt->execute(['delta' => $delta, 'now' => $now, 'id' => $id]);
            sendJson(['success' => true, 'id' => $id]);
        }

        if (empty($data['name']) || empty($data['code'])) {
            sendError('Código e Nome do produto são obrigatórios');
        }

        $count = (int)$pdo->query("SELECT COUNT(*) FROM `products`")->fetchColumn();
        $newId = "prod-" . ($count + 1);
        $now = date('Y-m-d H:i:s');

        $stmt = $pdo->prepare("INSERT INTO `products` (
            `id`, `code`, `name`, `category`, `quantity`, `minQuantity`, `costPrice`, `salePrice`, `supplier`, `location`, `createdAt`, `updatedAt`
        ) VALUES (
            :id, :code, :name, :category, :quantity, :minQuantity, :costPrice, :salePrice, :supplier, :location, :createdAt, :updatedAt
        )");
        $stmt->execute([
            'id' => $newId,
            'code' => $data['code'],
            'name' => $data['name'],
            'category' => $data['category'] ?? 'Geral',
            'quantity' => (int)($data['quantity'] ?? 0),
            'minQuantity' => (int)($data['minQuantity'] ?? 5),
            'costPrice' => (float)($data['costPrice'] ?? 0),
            'salePrice' => (float)($data['salePrice'] ?? 0),
            'supplier' => $data['supplier'] ?? '',
            'location' => $data['location'] ?? 'Vitrine Principal',
            'createdAt' => $now,
            'updatedAt' => $now
        ]);

        $created = $pdo->prepare("SELECT * FROM `products` WHERE `id` = :id");
        $created->execute(['id' => $newId]);
        sendJson(formatProductRow($created->fetch()), 201);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        $data = getJsonBody();
        if (empty($id) && !empty($data['id'])) $id = $data['id'];
        if (empty($id)) sendError('ID do produto não informado');

        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("UPDATE `products` SET
            `code` = COALESCE(:code, `code`),
            `name` = COALESCE(:name, `name`),
            `category` = COALESCE(:category, `category`),
            `quantity` = COALESCE(:quantity, `quantity`),
            `minQuantity` = COALESCE(:minQuantity, `minQuantity`),
            `costPrice` = COALESCE(:costPrice, `costPrice`),
            `salePrice` = COALESCE(:salePrice, `salePrice`),
            `supplier` = COALESCE(:supplier, `supplier`),
            `location` = COALESCE(:location, `location`),
            `updatedAt` = :now
            WHERE `id` = :id");

        $stmt->execute([
            'code' => $data['code'] ?? null,
            'name' => $data['name'] ?? null,
            'category' => $data['category'] ?? null,
            'quantity' => isset($data['quantity']) ? (int)$data['quantity'] : null,
            'minQuantity' => isset($data['minQuantity']) ? (int)$data['minQuantity'] : null,
            'costPrice' => isset($data['costPrice']) ? (float)$data['costPrice'] : null,
            'salePrice' => isset($data['salePrice']) ? (float)$data['salePrice'] : null,
            'supplier' => $data['supplier'] ?? null,
            'location' => $data['location'] ?? null,
            'now' => $now,
            'id' => $id
        ]);
        sendJson(['success' => true, 'id' => $id]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (empty($id)) sendError('ID não informado');
        $pdo->prepare("DELETE FROM `products` WHERE `id` = :id")->execute(['id' => $id]);
        sendJson(['success' => true]);
        break;

    default:
        sendError('Método inválido', 405);
}
