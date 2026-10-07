<?php
/**
 * iGyn Cell ERP - Database Configuration, Security & CORS Handler
 * Configuração de conexão com o banco de dados MySQL via PDO e Camada de Segurança
 */

// Headers de Segurança HTTP (Proteção contra XSS, Clickjacking, MIME-Sniffing)
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-Id, X-User-Role');
header('Content-Type: application/json; charset=UTF-8');

// Trata requisições preflight OPTIONS do navegador
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configurações do Banco de Dados MySQL
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'igyn_cell_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');
define('JWT_SECRET_KEY', getenv('JWT_SECRET_KEY') ?: 'igyn_cell_super_secure_enterprise_key_2026');

/**
 * Retorna uma instância PDO para conexão segura com o MySQL (Prepared Statements)
 */
function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => 'Falha ao conectar ao MySQL: ' . $e->getMessage(),
                'hint' => 'Verifique se o MySQL está rodando e se a base de dados "' . DB_NAME . '" foi criada utilizando o schema.sql.'
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }
    return $pdo;
}

/**
 * Lê o corpo JSON da requisição (POST / PUT)
 */
function getJsonBody() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Envia uma resposta JSON padronizada com código HTTP
 */
function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

/**
 * Envia erro padronizado em JSON
 */
function sendError($message, $statusCode = 400, $details = null) {
    http_response_code($statusCode);
    $res = ['success' => false, 'error' => $message];
    if ($details !== null) {
        $res['details'] = $details;
    }
    echo json_encode($res, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Hash seguro de senha usando BCRYPT com custo calibrado
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Verificação de senha com suporte a migração de hash
 */
function verifyPassword($password, $hashOrPlain) {
    if (empty($hashOrPlain)) return false;
    // Se for hash bcrypt
    if (strpos($hashOrPlain, '$2y$') === 0 || strpos($hashOrPlain, '$2a$') === 0) {
        return password_verify($password, $hashOrPlain);
    }
    // Fallback para senhas de teste/legado
    return hash_equals($hashOrPlain, $password);
}

/**
 * Obtém o IP real do cliente (suporte a Cloudflare e proxies reversos)
 */
function getClientIp() {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

/**
 * Grava um registro de auditoria inalterável na tabela `audit_logs`
 */
function logAudit($pdo, $userId, $userName, $userRole, $action, $entity, $entityId = null, $details = '') {
    try {
        $ip = getClientIp();
        $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 255);
        $logId = 'log_' . uniqid() . '_' . time();
        $now = date('Y-m-d H:i:s');

        $stmt = $pdo->prepare("INSERT INTO `audit_logs` (
            `id`, `userId`, `userName`, `userRole`, `action`, `entity`, `entityId`, `details`, `ipAddress`, `userAgent`, `createdAt`
        ) VALUES (
            :id, :userId, :userName, :userRole, :action, :entity, :entityId, :details, :ipAddress, :userAgent, :createdAt
        )");

        $stmt->execute([
            'id' => $logId,
            'userId' => $userId ?: 'system',
            'userName' => $userName ?: 'Sistema / Anônimo',
            'userRole' => $userRole ?: 'anonymous',
            'action' => $action,
            'entity' => $entity,
            'entityId' => $entityId,
            'details' => is_array($details) ? json_encode($details, JSON_UNESCAPED_UNICODE) : (string)$details,
            'ipAddress' => $ip,
            'userAgent' => $userAgent,
            'createdAt' => $now
        ]);
    } catch (Exception $e) {
        // Log silently to error_log without breaking the main transaction
        error_log("Falha ao registrar auditoria: " . $e->getMessage());
    }
}

/**
 * Validação de permissões de RBAC por cargo no backend
 */
function requireRole($allowedRoles) {
    if (!is_array($allowedRoles)) {
        $allowedRoles = [$allowedRoles];
    }

    $clientRole = $_SERVER['HTTP_X_USER_ROLE'] ?? null;
    $body = getJsonBody();
    if (!$clientRole && !empty($body['_userRole'])) {
        $clientRole = $body['_userRole'];
    }

    // Se nenhum cargo informado ou cargo não autorizado
    if (!$clientRole || (!in_array($clientRole, $allowedRoles) && $clientRole !== 'admin')) {
        sendError('Acesso negado: Seu cargo não possui permissão para executar esta operação no sistema.', 403);
    }
}

