<?php
/**
 * iGyn Cell ERP - API de Configurações da Loja (Settings)
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $stmt = $pdo->query("SELECT * FROM `store_settings` LIMIT 1");
        $res = $stmt->fetch() ?: [];
        if (!empty($res['defaultSaleCommission'])) $res['defaultSaleCommission'] = (float)$res['defaultSaleCommission'];
        if (!empty($res['defaultTechCommission'])) $res['defaultTechCommission'] = (float)$res['defaultTechCommission'];
        sendJson($res);
        break;

    case 'PUT':
        $data = getJsonBody();
        $stmt = $pdo->prepare("UPDATE `store_settings` SET
            `storeName` = COALESCE(:storeName, `storeName`),
            `tradeName` = COALESCE(:tradeName, `tradeName`),
            `address` = COALESCE(:address, `address`),
            `locationDetails` = COALESCE(:locationDetails, `locationDetails`),
            `cityState` = COALESCE(:cityState, `cityState`),
            `postalCode` = COALESCE(:postalCode, `postalCode`),
            `phone` = COALESCE(:phone, `phone`),
            `cnpj` = COALESCE(:cnpj, `cnpj`),
            `warrantyTerms` = COALESCE(:warrantyTerms, `warrantyTerms`),
            `defaultSaleCommission` = COALESCE(:defaultSaleCommission, `defaultSaleCommission`),
            `defaultTechCommission` = COALESCE(:defaultTechCommission, `defaultTechCommission`),
            `whatsappGreetingTemplate` = COALESCE(:whatsappGreetingTemplate, `whatsappGreetingTemplate`)
            WHERE `id` = 1");

        $stmt->execute([
            'storeName' => $data['storeName'] ?? null,
            'tradeName' => $data['tradeName'] ?? null,
            'address' => $data['address'] ?? null,
            'locationDetails' => $data['locationDetails'] ?? null,
            'cityState' => $data['cityState'] ?? null,
            'postalCode' => $data['postalCode'] ?? null,
            'phone' => $data['phone'] ?? null,
            'cnpj' => $data['cnpj'] ?? null,
            'warrantyTerms' => $data['warrantyTerms'] ?? null,
            'defaultSaleCommission' => isset($data['defaultSaleCommission']) ? (float)$data['defaultSaleCommission'] : null,
            'defaultTechCommission' => isset($data['defaultTechCommission']) ? (float)$data['defaultTechCommission'] : null,
            'whatsappGreetingTemplate' => $data['whatsappGreetingTemplate'] ?? null
        ]);

        $stmtGet = $pdo->query("SELECT * FROM `store_settings` LIMIT 1");
        sendJson($stmtGet->fetch());
        break;

    default:
        sendError('Método inválido', 405);
}
