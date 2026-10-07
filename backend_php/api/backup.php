<?php
/**
 * iGyn Cell ERP - API de Backup Automatizado do Banco de Dados
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Apenas administradores podem acionar backup manual
requireRole(['admin']);

try {
    $tables = [
        'store_settings',
        'employees',
        'clients',
        'products',
        'tech_parts',
        'service_orders',
        'sales',
        'financial_entries',
        'commissions',
        'notifications',
        'audit_logs'
    ];

    $sqlDump = "-- =========================================================\n";
    $sqlDump .= "-- iGyn Cell ERP - Backup Automatizado do MySQL\n";
    $sqlDump .= "-- Gerado em: " . date('Y-m-d H:i:s') . "\n";
    $sqlDump .= "-- Host: " . DB_HOST . " | Banco: " . DB_NAME . "\n";
    $sqlDump .= "-- =========================================================\n\n";
    $sqlDump .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

    foreach ($tables as $table) {
        try {
            // Obter DDL CREATE TABLE
            $stmt = $pdo->query("SHOW CREATE TABLE `{$table}`");
            $row = $stmt->fetch();
            if ($row) {
                $sqlDump .= "DROP TABLE IF EXISTS `{$table}`;\n";
                $sqlDump .= $row['Create Table'] . ";\n\n";
            }

            // Obter Dados
            $stmtData = $pdo->query("SELECT * FROM `{$table}`");
            $rows = $stmtData->fetchAll();

            if (!empty($rows)) {
                $cols = array_keys($rows[0]);
                $colList = implode('`, `', $cols);

                foreach ($rows as $r) {
                    $vals = array_map(function($v) use ($pdo) {
                        if ($v === null) return 'NULL';
                        return $pdo->quote($v);
                    }, array_values($r));

                    $sqlDump .= "INSERT INTO `{$table}` (`{$colList}`) VALUES (" . implode(', ', $vals) . ");\n";
                }
                $sqlDump .= "\n";
            }
        } catch (Exception $e) {
            // Ignore if table does not exist
        }
    }

    $sqlDump .= "SET FOREIGN_KEY_CHECKS=1;\n";

    $userId = $_SERVER['HTTP_X_USER_ID'] ?? 'admin';
    logAudit($pdo, $userId, 'Administrador', 'admin', 'BACKUP', 'Backup', null, 'Backup completo do banco de dados MySQL exportado com sucesso.');

    header('Content-Type: application/sql');
    header('Content-Disposition: attachment; filename="igyn_cell_backup_' . date('Y_m_d_His') . '.sql"');
    echo $sqlDump;
    exit();

} catch (Exception $e) {
    sendError("Falha ao gerar backup do MySQL: " . $e->getMessage(), 500);
}
