<?php
/**
 * iGyn Cell ERP - API de Peças de Reposição (Tech Parts)
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

function formatPartRow($p) {
    if (!$p) return null;
    $p['quantity'] = (int)$p['quantity'];
    $p['minQuantity'] = (int)$p['minQuantity'];
    $p['costPrice'] = (float)$p['costPrice'];
    $p['salePrice'] = (float)$p['salePrice'];
    $p['compatibleModels'] = !empty($p['compatibleModels']) ? json_decode($p['compatibleModels'], true) : [];
    return $p;
}

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM `tech_parts` WHERE `id` = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            $row = $stmt->fetch();
            if (!$row) sendError('Peça não encontrada', 404);
            sendJson(formatPartRow($row));
        } else {
            $rows = $pdo->query("SELECT * FROM `tech_parts` ORDER BY `name` ASC")->fetchAll();
            sendJson(array_map('formatPartRow', $rows));
        }
        break;

    case 'POST':
        $action = $_GET['action'] ?? null;
        $id = $_GET['id'] ?? null;
        $data = getJsonBody();

        // Ajuste de Estoque (+/- delta)
        if ($action === 'adjust' && !empty($id)) {
            $delta = (int)($data['delta'] ?? 0);
            $now = date('Y-m-d H:i:s');
            $stmt = $pdo->prepare("UPDATE `tech_parts` SET `quantity` = GREATEST(0, `quantity` + :delta), `updatedAt` = :now WHERE `id` = :id");
            $stmt->execute(['delta' => $delta, 'now' => $now, 'id' => $id]);
            sendJson(['success' => true, 'id' => $id]);
        }

        if (empty($data['name']) || empty($data['code'])) {
            sendError('Código e Nome da peça são obrigatórios');
        }

        $count = (int)$pdo->query("SELECT COUNT(*) FROM `tech_parts`")->fetchColumn();
        $newId = "part-" . ($count + 1);
        $now = date('Y-m-d H:i:s');
        $models = !empty($data['compatibleModels']) ? json_encode($data['compatibleModels'], JSON_UNESCAPED_UNICODE) : '[]';

        $stmt = $pdo->prepare("INSERT INTO `tech_parts` (
            `id`, `code`, `name`, `category`, `compatibleModels`, `quantity`, `minQuantity`, `costPrice`, `salePrice`, `supplier`, `shelfLocation`, `createdAt`, `updatedAt`
        ) VALUES (
            :id, :code, :name, :category, :compatibleModels, :quantity, :minQuantity, :costPrice, :salePrice, :supplier, :shelfLocation, :createdAt, :updatedAt
        )");
        $stmt->execute([
            'id' => $newId,
            'code' => $data['code'],
            'name' => $data['name'],
            'category' => $data['category'] ?? 'Geral',
            'compatibleModels' => $models,
            'quantity' => (int)($data['quantity'] ?? 0),
            'minQuantity' => (int)($data['minQuantity'] ?? 2),
            'costPrice' => (float)($data['costPrice'] ?? 0),
            'salePrice' => (float)($data['salePrice'] ?? 0),
            'supplier' => $data['supplier'] ?? '',
            'shelfLocation' => $data['shelfLocation'] ?? 'Gaveta Lab',
            'createdAt' => $now,
            'updatedAt' => $now
        ]);

        $created = $pdo->prepare("SELECT * FROM `tech_parts` WHERE `id` = :id");
        $created->execute(['id' => $newId]);
        sendJson(formatPartRow($created->fetch()), 201);
        break;

    case 'PUT':
        $id = $_GET['id'] ?? null;
        $data = getJsonBody();
        if (empty($id) && !empty($data['id'])) $id = $data['id'];
        if (empty($id)) sendError('ID da peça não informado');

        $now = date('Y-m-d H:i:s');
        $models = isset($data['compatibleModels']) ? json_encode($data['compatibleModels'], JSON_UNESCAPED_UNICODE) : null;

        $stmt = $pdo->prepare("UPDATE `tech_parts` SET
            `code` = COALESCE(:code, `code`),
            `name` = COALESCE(:name, `name`),
            `category` = COALESCE(:category, `category`),
            `compatibleModels` = COALESCE(:compatibleModels, `compatibleModels`),
            `quantity` = COALESCE(:quantity, `quantity`),
            `minQuantity` = COALESCE(:minQuantity, `minQuantity`),
            `costPrice` = COALESCE(:costPrice, `costPrice`),
            `salePrice` = COALESCE(:salePrice, `salePrice`),
            `supplier` = COALESCE(:supplier, `supplier`),
            `shelfLocation` = COALESCE(:shelfLocation, `shelfLocation`),
            `updatedAt` = :now
            WHERE `id` = :id");

        $stmt->execute([
            'code' => $data['code'] ?? null,
            'name' => $data['name'] ?? null,
            'category' => $data['category'] ?? null,
            'compatibleModels' => $models,
            'quantity' => isset($data['quantity']) ? (int)$data['quantity'] : null,
            'minQuantity' => isset($data['minQuantity']) ? (int)$data['minQuantity'] : null,
            'costPrice' => isset($data['costPrice']) ? (float)$data['costPrice'] : null,
            'salePrice' => isset($data['salePrice']) ? (float)$data['salePrice'] : null,
            'supplier' => $data['supplier'] ?? null,
            'shelfLocation' => $data['shelfLocation'] ?? null,
            'now' => $now,
            'id' => $id
        ]);
        sendJson(['success' => true, 'id' => $id]);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (empty($id)) sendError('ID não informado');
        $pdo->prepare("DELETE FROM `tech_parts` WHERE `id` = :id")->execute(['id' => $id]);
        sendJson(['success' => true]);
        break;

    default:
        sendError('Método inválido', 405);
}
