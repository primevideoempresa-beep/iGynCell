<?php
/**
 * iGyn Cell ERP - API de Ordens de Serviço (Service Orders)
 * Endpoints RESTful para criação, listagem, atualização e exclusão com MySQL/PDO
 */

require_once __DIR__ . '/../config.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Helper para desserializar JSON das colunas
function formatOrderRow($row) {
    if (!$row) return null;
    $row['checklist'] = !empty($row['checklist']) ? json_decode($row['checklist'], true) : [];
    $row['partsUsed'] = !empty($row['partsUsed']) ? json_decode($row['partsUsed'], true) : [];
    $row['servicesRendered'] = !empty($row['servicesRendered']) ? json_decode($row['servicesRendered'], true) : [];
    $row['laborCost'] = (float)$row['laborCost'];
    $row['partsTotal'] = (float)$row['partsTotal'];
    $row['discount'] = (float)$row['discount'];
    $row['totalAmount'] = (float)$row['totalAmount'];
    $row['warrantyDays'] = (int)$row['warrantyDays'];
    return $row;
}

switch ($method) {
    // -------------------------------------------------------------
    // GET: Listar todas as Ordens de Serviço ou buscar por ID
    // -------------------------------------------------------------
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM `service_orders` WHERE `id` = :id LIMIT 1");
            $stmt->execute(['id' => $id]);
            $order = $stmt->fetch();
            if (!$order) {
                sendError('Ordem de serviço não encontrada', 404);
            }
            sendJson(formatOrderRow($order));
        } else {
            $sql = "SELECT * FROM `service_orders` ORDER BY `createdAt` DESC";
            $stmt = $pdo->query($sql);
            $rows = $stmt->fetchAll();
            $result = array_map('formatOrderRow', $rows);
            sendJson($result);
        }
        break;

    // -------------------------------------------------------------
    // POST: Criar Nova Ordem de Serviço
    // -------------------------------------------------------------
    case 'POST':
        $data = getJsonBody();
        if (empty($data['model']) || empty($data['clientName'])) {
            sendError('Campos obrigatórios ausentes (Modelo do Aparelho ou Nome do Cliente)');
        }

        try {
            $pdo->beginTransaction();

            // Gerar próximo ID sequencial OS-XXXX
            $stmtCount = $pdo->query("SELECT COUNT(*) AS total FROM `service_orders`");
            $totalCount = (int)$stmtCount->fetchColumn();
            $nextNum = 1049 + $totalCount;
            $newId = "OS-" . $nextNum;

            // Verificar se o ID já existe para evitar colisão
            $stmtCheck = $pdo->prepare("SELECT COUNT(*) FROM `service_orders` WHERE `id` = :id");
            $stmtCheck->execute(['id' => $newId]);
            if ($stmtCheck->fetchColumn() > 0) {
                $newId = "OS-" . ($nextNum + rand(1, 999));
            }

            $now = date('Y-m-d H:i:s');
            $clientId = $data['clientId'] ?? 'cli-1';
            $clientName = $data['clientName'] ?? '';
            $clientPhone = $data['clientPhone'] ?? '';
            $clientCpf = $data['clientCpf'] ?? '';
            $deviceType = $data['deviceType'] ?? 'Smartphone';
            $brand = $data['brand'] ?? 'Apple';
            $model = $data['model'] ?? '';
            $color = $data['color'] ?? '';
            $imeiOrSerial = $data['imeiOrSerial'] ?? '';
            $passcode = $data['passcode'] ?? '';
            $physicalCondition = $data['physicalCondition'] ?? '';
            $checklist = !empty($data['checklist']) ? json_encode($data['checklist'], JSON_UNESCAPED_UNICODE) : '{}';
            $problemReported = $data['problemReported'] ?? '';
            $technicalDiagnosis = $data['technicalDiagnosis'] ?? '';
            $assignedTechnicianId = $data['assignedTechnicianId'] ?? '';
            $assignedTechnicianName = $data['assignedTechnicianName'] ?? '';
            $status = $data['status'] ?? 'open';
            $priority = $data['priority'] ?? 'normal';
            $partsUsed = !empty($data['partsUsed']) ? json_encode($data['partsUsed'], JSON_UNESCAPED_UNICODE) : '[]';
            $servicesRendered = !empty($data['servicesRendered']) ? json_encode($data['servicesRendered'], JSON_UNESCAPED_UNICODE) : '[]';
            $laborCost = (float)($data['laborCost'] ?? 0);
            $partsTotal = (float)($data['partsTotal'] ?? 0);
            $discount = (float)($data['discount'] ?? 0);
            $totalAmount = (float)($data['totalAmount'] ?? ($laborCost + $partsTotal - $discount));
            $paymentMethod = $data['paymentMethod'] ?? 'pix';
            $paymentStatus = $data['paymentStatus'] ?? 'pending';
            $warrantyDays = (int)($data['warrantyDays'] ?? 90);
            $technicalNotesInternal = $data['technicalNotesInternal'] ?? '';

            // 1. Inserir a Ordem de Serviço na tabela `service_orders`
            $sqlInsert = "INSERT INTO `service_orders` (
                `id`, `clientId`, `clientName`, `clientPhone`, `clientCpf`, `deviceType`, `brand`, `model`,
                `color`, `imeiOrSerial`, `passcode`, `physicalCondition`, `checklist`, `problemReported`,
                `technicalDiagnosis`, `assignedTechnicianId`, `assignedTechnicianName`, `status`, `priority`,
                `partsUsed`, `servicesRendered`, `laborCost`, `partsTotal`, `discount`, `totalAmount`,
                `paymentMethod`, `paymentStatus`, `warrantyDays`, `technicalNotesInternal`, `createdAt`, `updatedAt`
            ) VALUES (
                :id, :clientId, :clientName, :clientPhone, :clientCpf, :deviceType, :brand, :model,
                :color, :imeiOrSerial, :passcode, :physicalCondition, :checklist, :problemReported,
                :technicalDiagnosis, :assignedTechnicianId, :assignedTechnicianName, :status, :priority,
                :partsUsed, :servicesRendered, :laborCost, :partsTotal, :discount, :totalAmount,
                :paymentMethod, :paymentStatus, :warrantyDays, :technicalNotesInternal, :createdAt, :updatedAt
            )";

            $stmt = $pdo->prepare($sqlInsert);
            $stmt->execute([
                'id' => $newId,
                'clientId' => $clientId,
                'clientName' => $clientName,
                'clientPhone' => $clientPhone,
                'clientCpf' => $clientCpf,
                'deviceType' => $deviceType,
                'brand' => $brand,
                'model' => $model,
                'color' => $color,
                'imeiOrSerial' => $imeiOrSerial,
                'passcode' => $passcode,
                'physicalCondition' => $physicalCondition,
                'checklist' => $checklist,
                'problemReported' => $problemReported,
                'technicalDiagnosis' => $technicalDiagnosis,
                'assignedTechnicianId' => $assignedTechnicianId,
                'assignedTechnicianName' => $assignedTechnicianName,
                'status' => $status,
                'priority' => $priority,
                'partsUsed' => $partsUsed,
                'servicesRendered' => $servicesRendered,
                'laborCost' => $laborCost,
                'partsTotal' => $partsTotal,
                'discount' => $discount,
                'totalAmount' => $totalAmount,
                'paymentMethod' => $paymentMethod,
                'paymentStatus' => $paymentStatus,
                'warrantyDays' => $warrantyDays,
                'technicalNotesInternal' => $technicalNotesInternal,
                'createdAt' => $now,
                'updatedAt' => $now
            ]);

            // 2. Dar baixa no estoque de peças utilizadas (`tech_parts`)
            if (!empty($data['partsUsed']) && is_array($data['partsUsed'])) {
                $stmtStock = $pdo->prepare("UPDATE `tech_parts` SET `quantity` = GREATEST(0, `quantity` - :qty), `updatedAt` = :now WHERE `id` = :partId");
                foreach ($data['partsUsed'] as $pu) {
                    if (!empty($pu['partId']) && !empty($pu['quantity'])) {
                        $stmtStock->execute([
                            'qty' => (int)$pu['quantity'],
                            'now' => $now,
                            'partId' => $pu['partId']
                        ]);
                    }
                }
            }

            // 3. Registrar conta a receber no Financeiro (`financial_entries`)
            if ($totalAmount > 0) {
                $finCount = (int)$pdo->query("SELECT COUNT(*) FROM `financial_entries`")->fetchColumn();
                $finId = "FIN-" . (3008 + $finCount);
                $stmtFin = $pdo->prepare("INSERT INTO `financial_entries` (
                    `id`, `type`, `category`, `description`, `amount`, `dueDate`, `paymentDate`, `status`, `relatedOrderId`, `recipientOrPayer`, `createdAt`
                ) VALUES (
                    :id, 'income', 'Ordem de Serviço', :desc, :amount, :dueDate, :paymentDate, :status, :relatedOrderId, :recipientOrPayer, :createdAt
                )");
                $stmtFin->execute([
                    'id' => $finId,
                    'desc' => "OS {$newId} - {$brand} {$model} ({$clientName})",
                    'amount' => $totalAmount,
                    'dueDate' => substr($now, 0, 10),
                    'paymentDate' => ($paymentStatus === 'paid') ? substr($now, 0, 10) : null,
                    'status' => ($paymentStatus === 'paid') ? 'paid' : 'pending',
                    'relatedOrderId' => $newId,
                    'recipientOrPayer' => $clientName,
                    'createdAt' => $now
                ]);
            }

            // 4. Registrar Comissão do Técnico (`commissions`)
            if ($laborCost > 0 && !empty($assignedTechnicianId)) {
                $stmtTech = $pdo->prepare("SELECT `commissionRateTech` FROM `employees` WHERE `id` = :id");
                $stmtTech->execute(['id' => $assignedTechnicianId]);
                $techRate = (float)($stmtTech->fetchColumn() ?: 15.0);

                $commAmount = ($laborCost * $techRate) / 100.0;
                $commCount = (int)$pdo->query("SELECT COUNT(*) FROM `commissions`")->fetchColumn();
                $commId = "COM-" . (4006 + $commCount);

                $stmtComm = $pdo->prepare("INSERT INTO `commissions` (
                    `id`, `employeeId`, `employeeName`, `employeeRole`, `type`, `referenceId`, `description`, `baseAmount`, `rate`, `commissionAmount`, `status`, `createdAt`
                ) VALUES (
                    :id, :employeeId, :employeeName, 'technician', 'service_order', :refId, :desc, :baseAmount, :rate, :commissionAmount, :status, :createdAt
                )");
                $stmtComm->execute([
                    'id' => $commId,
                    'employeeId' => $assignedTechnicianId,
                    'employeeName' => $assignedTechnicianName,
                    'refId' => $newId,
                    'desc' => "Comissão Técnica {$techRate}% sobre Mão de Obra {$newId}",
                    'baseAmount' => $laborCost,
                    'rate' => $techRate,
                    'commissionAmount' => $commAmount,
                    'status' => ($paymentStatus === 'paid') ? 'paid' : 'pending',
                    'createdAt' => $now
                ]);
            }

            // 5. Atualizar Métricas do Cliente (`clients`)
            $stmtCli = $pdo->prepare("UPDATE `clients` SET `ordersCount` = `ordersCount` + 1, `totalSpent` = `totalSpent` + :total WHERE `id` = :clientId");
            $stmtCli->execute([
                'total' => $totalAmount,
                'clientId' => $clientId
            ]);

            // 6. Inserir Notificação no Sistema (`notifications`)
            $notifId = "notif-os-{$newId}-" . time();
            $stmtNotif = $pdo->prepare("INSERT INTO `notifications` (`id`, `type`, `title`, `message`, `read_status`, `linkTab`, `createdAt`) VALUES (:id, 'order_assigned', :title, :message, 0, 'orders', :now)");
            $stmtNotif->execute([
                'id' => $notifId,
                'title' => "Nova OS Criada #{$newId}",
                'message' => "{$brand} {$model} ({$clientName}) atribuído a {$assignedTechnicianName}.",
                'now' => $now
            ]);

            $pdo->commit();

            // Retornar a OS criada com formatação completa
            $stmtGet = $pdo->prepare("SELECT * FROM `service_orders` WHERE `id` = :id");
            $stmtGet->execute(['id' => $newId]);
            $createdOrder = formatOrderRow($stmtGet->fetch());

            sendJson($createdOrder, 201);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendError("Erro ao salvar Ordem de Serviço no MySQL: " . $e->getMessage(), 500);
        }
        break;

    // -------------------------------------------------------------
    // PUT: Atualizar Ordem de Serviço ou Atualizar Status
    // -------------------------------------------------------------
    case 'PUT':
        $id = $_GET['id'] ?? null;
        $action = $_GET['action'] ?? null;
        $data = getJsonBody();

        if (empty($id) && !empty($data['id'])) {
            $id = $data['id'];
        }

        if (empty($id)) {
            sendError('ID da Ordem de Serviço não informado para atualização');
        }

        $now = date('Y-m-d H:i:s');

        try {
            // Verificar se a OS existe
            $stmtExists = $pdo->prepare("SELECT * FROM `service_orders` WHERE `id` = :id LIMIT 1");
            $stmtExists->execute(['id' => $id]);
            $currentOrder = $stmtExists->fetch();
            if (!$currentOrder) {
                sendError("Ordem de serviço '{$id}' não encontrada no MySQL", 404);
            }

            // Atualização rápida de Status
            if ($action === 'status' || (isset($data['status']) && count($data) <= 3)) {
                $newStatus = $data['status'] ?? 'open';
                $completedAt = ($newStatus === 'completed') ? $now : $currentOrder['completedAt'];
                $deliveredAt = ($newStatus === 'delivered') ? $now : $currentOrder['deliveredAt'];
                $paymentStatus = ($newStatus === 'delivered') ? 'paid' : $currentOrder['paymentStatus'];

                $stmtUpdateStatus = $pdo->prepare("UPDATE `service_orders` SET
                    `status` = :status,
                    `paymentStatus` = :paymentStatus,
                    `completedAt` = :completedAt,
                    `deliveredAt` = :deliveredAt,
                    `updatedAt` = :now
                    WHERE `id` = :id");

                $stmtUpdateStatus->execute([
                    'status' => $newStatus,
                    'paymentStatus' => $paymentStatus,
                    'completedAt' => $completedAt,
                    'deliveredAt' => $deliveredAt,
                    'now' => $now,
                    'id' => $id
                ]);

                // Se entregue, quitar comissões e financeiro vinculados
                if ($newStatus === 'delivered') {
                    $pdo->prepare("UPDATE `commissions` SET `status` = 'paid', `paidAt` = :now WHERE `referenceId` = :id")->execute(['now' => $now, 'id' => $id]);
                    $pdo->prepare("UPDATE `financial_entries` SET `status` = 'paid', `paymentDate` = :pdate WHERE `relatedOrderId` = :id")->execute(['pdate' => substr($now, 0, 10), 'id' => $id]);
                }

                sendJson(['success' => true, 'id' => $id, 'status' => $newStatus]);
            }

            // Atualização completa dos dados da OS
            $checklist = isset($data['checklist']) ? json_encode($data['checklist'], JSON_UNESCAPED_UNICODE) : $currentOrder['checklist'];
            $partsUsed = isset($data['partsUsed']) ? json_encode($data['partsUsed'], JSON_UNESCAPED_UNICODE) : $currentOrder['partsUsed'];
            $servicesRendered = isset($data['servicesRendered']) ? json_encode($data['servicesRendered'], JSON_UNESCAPED_UNICODE) : $currentOrder['servicesRendered'];

            $sqlUpdate = "UPDATE `service_orders` SET
                `clientId` = :clientId,
                `clientName` = :clientName,
                `clientPhone` = :clientPhone,
                `clientCpf` = :clientCpf,
                `deviceType` = :deviceType,
                `brand` = :brand,
                `model` = :model,
                `color` = :color,
                `imeiOrSerial` = :imeiOrSerial,
                `passcode` = :passcode,
                `physicalCondition` = :physicalCondition,
                `checklist` = :checklist,
                `problemReported` = :problemReported,
                `technicalDiagnosis` = :technicalDiagnosis,
                `assignedTechnicianId` = :assignedTechnicianId,
                `assignedTechnicianName` = :assignedTechnicianName,
                `status` = :status,
                `priority` = :priority,
                `partsUsed` = :partsUsed,
                `servicesRendered` = :servicesRendered,
                `laborCost` = :laborCost,
                `partsTotal` = :partsTotal,
                `discount` = :discount,
                `totalAmount` = :totalAmount,
                `paymentMethod` = :paymentMethod,
                `paymentStatus` = :paymentStatus,
                `warrantyDays` = :warrantyDays,
                `technicalNotesInternal` = :technicalNotesInternal,
                `updatedAt` = :now
                WHERE `id` = :id";

            $stmt = $pdo->prepare($sqlUpdate);
            $stmt->execute([
                'clientId' => $data['clientId'] ?? $currentOrder['clientId'],
                'clientName' => $data['clientName'] ?? $currentOrder['clientName'],
                'clientPhone' => $data['clientPhone'] ?? $currentOrder['clientPhone'],
                'clientCpf' => $data['clientCpf'] ?? $currentOrder['clientCpf'],
                'deviceType' => $data['deviceType'] ?? $currentOrder['deviceType'],
                'brand' => $data['brand'] ?? $currentOrder['brand'],
                'model' => $data['model'] ?? $currentOrder['model'],
                'color' => $data['color'] ?? $currentOrder['color'],
                'imeiOrSerial' => $data['imeiOrSerial'] ?? $currentOrder['imeiOrSerial'],
                'passcode' => $data['passcode'] ?? $currentOrder['passcode'],
                'physicalCondition' => $data['physicalCondition'] ?? $currentOrder['physicalCondition'],
                'checklist' => $checklist,
                'problemReported' => $data['problemReported'] ?? $currentOrder['problemReported'],
                'technicalDiagnosis' => $data['technicalDiagnosis'] ?? $currentOrder['technicalDiagnosis'],
                'assignedTechnicianId' => $data['assignedTechnicianId'] ?? $currentOrder['assignedTechnicianId'],
                'assignedTechnicianName' => $data['assignedTechnicianName'] ?? $currentOrder['assignedTechnicianName'],
                'status' => $data['status'] ?? $currentOrder['status'],
                'priority' => $data['priority'] ?? $currentOrder['priority'],
                'partsUsed' => $partsUsed,
                'servicesRendered' => $servicesRendered,
                'laborCost' => isset($data['laborCost']) ? (float)$data['laborCost'] : (float)$currentOrder['laborCost'],
                'partsTotal' => isset($data['partsTotal']) ? (float)$data['partsTotal'] : (float)$currentOrder['partsTotal'],
                'discount' => isset($data['discount']) ? (float)$data['discount'] : (float)$currentOrder['discount'],
                'totalAmount' => isset($data['totalAmount']) ? (float)$data['totalAmount'] : (float)$currentOrder['totalAmount'],
                'paymentMethod' => $data['paymentMethod'] ?? $currentOrder['paymentMethod'],
                'paymentStatus' => $data['paymentStatus'] ?? $currentOrder['paymentStatus'],
                'warrantyDays' => isset($data['warrantyDays']) ? (int)$data['warrantyDays'] : (int)$currentOrder['warrantyDays'],
                'technicalNotesInternal' => $data['technicalNotesInternal'] ?? $currentOrder['technicalNotesInternal'],
                'now' => $now,
                'id' => $id
            ]);

            // Obter registro atualizado
            $stmtUpdated = $pdo->prepare("SELECT * FROM `service_orders` WHERE `id` = :id");
            $stmtUpdated->execute(['id' => $id]);
            sendJson([
                'success' => true,
                'id' => $id,
                'order' => formatOrderRow($stmtUpdated->fetch())
            ]);

        } catch (Exception $e) {
            sendError("Erro ao atualizar Ordem de Serviço no MySQL: " . $e->getMessage(), 500);
        }
        break;

    // -------------------------------------------------------------
    // DELETE: Excluir Ordem de Serviço
    // -------------------------------------------------------------
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (empty($id)) {
            sendError('ID da Ordem de Serviço não informado para exclusão');
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM `service_orders` WHERE `id` = :id");
            $stmt->execute(['id' => $id]);
            sendJson(['success' => true, 'message' => "OS {$id} excluída com sucesso"]);
        } catch (Exception $e) {
            sendError("Erro ao excluir OS no MySQL: " . $e->getMessage(), 500);
        }
        break;

    default:
        sendError('Método HTTP não suportado', 405);
        break;
}
