<?php
/**
 * iGyn Cell ERP - Endpoint de Diagnóstico e Teste de Conexão MySQL
 */

require_once __DIR__ . '/../config.php';

$startTime = microtime(true);

try {
    $pdo = getDbConnection();

    // Consultar versão do MySQL e estatísticas das tabelas
    $stmtVersion = $pdo->query("SELECT VERSION() AS mysql_version");
    $mysqlVersion = $stmtVersion->fetchColumn();

    $tables = [
        'service_orders',
        'clients',
        'products',
        'tech_parts',
        'sales',
        'financial_entries',
        'commissions',
        'employees',
        'store_settings',
        'notifications'
    ];

    $tableStats = [];
    $allTablesExist = true;

    foreach ($tables as $tbl) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) FROM `{$tbl}`");
            $count = (int)$stmt->fetchColumn();
            $tableStats[$tbl] = [
                'exists' => true,
                'rowCount' => $count
            ];
        } catch (Exception $e) {
            $allTablesExist = false;
            $tableStats[$tbl] = [
                'exists' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    $durationMs = round((microtime(true) - $startTime) * 1000, 2);

    sendJson([
        'success' => true,
        'status' => 'connected',
        'message' => 'Conexão com o banco de dados MySQL realizada com sucesso!',
        'database' => [
            'name' => DB_NAME,
            'host' => DB_HOST,
            'port' => DB_PORT,
            'user' => DB_USER,
            'version' => $mysqlVersion,
            'charset' => DB_CHARSET
        ],
        'latencyMs' => $durationMs,
        'tablesStatus' => $tableStats,
        'allTablesReady' => $allTablesExist,
        'serverTime' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    $durationMs = round((microtime(true) - $startTime) * 1000, 2);
    sendError("Falha na conexão com o banco de dados MySQL: " . $e->getMessage(), 500, [
        'host' => DB_HOST,
        'database' => DB_NAME,
        'latencyMs' => $durationMs
    ]);
}
