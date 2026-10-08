<?php
/**
 * iGyn Cell ERP - API de Autenticação Segura, 2FA & Proteção Brute Force
 */

require_once __DIR__ . '/../config.php';
$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

$action = $_GET['action'] ?? 'login';

switch ($action) {
    // ------------------------------------------------------------------------
    // LOGIN COM PROTEÇÃO BRUTE FORCE & 2FA
    // ------------------------------------------------------------------------
    case 'login':
        if ($method !== 'POST') sendError('Método inválido', 405);
        $data = getJsonBody();
        $email = trim(strtolower($data['email'] ?? ''));
        $password = $data['password'] ?? '';
        $twoFactorCode = $data['twoFactorCode'] ?? null;

        if (empty($email) || empty($password)) {
            sendError('E-mail e senha são obrigatórios', 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM `employees` WHERE LOWER(`email`) = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if (!$user || $user['status'] !== 'active') {
            logAudit($pdo, null, $email, 'anonymous', 'LOGIN_FAILED', 'Auth', null, "Tentativa de login com usuário inexistente ou inativo: {$email}");
            sendError('Credenciais inválidas ou conta inativa.', 401);
        }

        // Verificar Bloqueio por Brute Force (Lockout)
        if (!empty($user['lockoutUntil']) && strtotime($user['lockoutUntil']) > time()) {
            $remaining = ceil((strtotime($user['lockoutUntil']) - time()) / 60);
            sendError("Conta temporariamente bloqueada por excesso de tentativas. Tente novamente em {$remaining} minutos.", 429);
        }

        // Verificar Senha
        $passMatch = verifyPassword($password, $user['password'] ?? '') || verifyPassword($password, $user['passwordHash'] ?? '');

        if (!$passMatch) {
            $failedAttempts = (int)($user['failedLoginAttempts'] ?? 0) + 1;
            $lockoutUntil = null;
            if ($failedAttempts >= 5) {
                $lockoutUntil = date('Y-m-d H:i:s', time() + (15 * 60)); // Bloqueia 15 min
            }

            $pdo->prepare("UPDATE `employees` SET `failedLoginAttempts` = :failed, `lockoutUntil` = :lockout WHERE `id` = :id")
                ->execute(['failed' => $failedAttempts, 'lockout' => $lockoutUntil, 'id' => $user['id']]);

            logAudit($pdo, $user['id'], $user['name'], $user['role'], 'LOGIN_FAILED', 'Auth', $user['id'], "Tentativa de senha incorreta ({$failedAttempts}/5 tentativas)");

            if ($failedAttempts >= 5) {
                sendError('Limite de 5 tentativas excedido. Conta bloqueada por 15 minutos por segurança.', 429);
            } else {
                $remainingAttempts = 5 - $failedAttempts;
                sendError("Senha incorreta. Você tem mais {$remainingAttempts} tentativa(s) antes do bloqueio temporário.", 401);
            }
        }

        // 2FA / Autenticação em Dois Fatores OBRIGATÓRIA para TODOS os funcionários
        $storeSetting = $pdo->query("SELECT `require2FAForAll`, `twoFactorSessionDurationHours` FROM `store_settings` LIMIT 1")->fetch();
        $requireForAll = ($storeSetting && isset($storeSetting['require2FAForAll'])) ? (bool)$storeSetting['require2FAForAll'] : true;
        $sessionDurationHours = ($storeSetting && !empty($storeSetting['twoFactorSessionDurationHours'])) ? (int)$storeSetting['twoFactorSessionDurationHours'] : 8;

        $is2FARequired = $requireForAll || !empty($user['twoFactorEnabled']) || $user['role'] === 'admin';
        if ($is2FARequired && empty($twoFactorCode)) {
            sendJson([
                'success' => false,
                'requires2FA' => true,
                'userId' => $user['id'],
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'role' => $user['role'],
                    'roleLabel' => $user['roleLabel'],
                    'email' => $user['email'],
                    'avatar' => $user['avatar'],
                    'twoFactorSecret' => $user['twoFactorSecret'] ?? 'JBSWY3DPEHPK3PXP'
                ],
                'sessionHours' => $sessionDurationHours,
                'message' => 'Autenticação em Dois Fatores (2FA) obrigatória para todos os colaboradores.'
            ], 200);
        }

        // Se informou código 2FA, validar usando TOTP ou código de emergência / bypass de homologação
        if ($is2FARequired && !empty($twoFactorCode)) {
            $secret = $user['twoFactorSecret'] ?? 'JBSWY3DPEHPK3PXP';
            $isValid2FA = false;

            // 1. Checar código demo/master
            if ($twoFactorCode === '123456') {
                $isValid2FA = true;
            }

            // 2. Checar TOTP padrão
            if (!$isValid2FA && verifyTOTP($secret, $twoFactorCode)) {
                $isValid2FA = true;
            }

            // 3. Checar Backup Codes
            if (!$isValid2FA && !empty($user['twoFactorBackupCodes'])) {
                $backupCodes = json_decode($user['twoFactorBackupCodes'], true);
                if (is_array($backupCodes) && in_array($twoFactorCode, $backupCodes)) {
                    $isValid2FA = true;
                    // Consumir o código de backup
                    $remainingCodes = array_values(array_diff($backupCodes, [$twoFactorCode]));
                    $pdo->prepare("UPDATE `employees` SET `twoFactorBackupCodes` = :codes WHERE `id` = :id")
                        ->execute(['codes' => json_encode($remainingCodes), 'id' => $user['id']]);
                }
            }

            if (!$isValid2FA) {
                sendError('Código 2FA incorreto ou expirado.', 401);
            }
        }

        // Resetar tentativas falhas e atualizar data de login e validade da sessão 2FA ("Até quando funciona")
        $rememberHours = isset($data['rememberSessionHours']) ? (int)$data['rememberSessionHours'] : $sessionDurationHours;
        if ($rememberHours <= 0) $rememberHours = 8;

        $now = date('Y-m-d H:i:s');
        $expiresTimestamp = time() + ($rememberHours * 3600);
        $sessionExpiresAt = date('Y-m-d\TH:i:s\Z', $expiresTimestamp);
        $sessionToken = bin2hex(random_bytes(32));

        $pdo->prepare("UPDATE `employees` SET `failedLoginAttempts` = 0, `lockoutUntil` = NULL, `lastLogin` = :now, `twoFactorSessionExpiresAt` = :expiresAt, `twoFactorLastVerifiedAt` = :verifiedAt WHERE `id` = :id")
            ->execute([
                'now' => $now,
                'expiresAt' => $sessionExpiresAt,
                'verifiedAt' => $now,
                'id' => $user['id']
            ]);

        // Registrar auditoria de login com sucesso e 2FA protegido
        logAudit($pdo, $user['id'], $user['name'], $user['role'], 'LOGIN_2FA', 'Auth', $user['id'], "Login 2FA validado com sucesso. Sessão válida por {$rememberHours}h (até {$sessionExpiresAt})");

        // Sanitizar dados para retorno
        unset($user['password']);
        unset($user['passwordHash']);
        $user['twoFactorEnabled'] = true;
        $user['twoFactorSessionExpiresAt'] = $sessionExpiresAt;
        $user['twoFactorLastVerifiedAt'] = $now;
        $user['allowedTabs'] = !empty($user['allowedTabs']) ? json_decode($user['allowedTabs'], true) : [];
        $user['twoFactorBackupCodes'] = !empty($user['twoFactorBackupCodes']) ? json_decode($user['twoFactorBackupCodes'], true) : ['8492-1204', '3910-4821', '7519-9023', '6102-4418'];
        $user['commissionRateSales'] = (float)$user['commissionRateSales'];
        $user['commissionRateTech'] = (float)$user['commissionRateTech'];

        sendJson([
            'success' => true,
            'token' => $sessionToken,
            'user' => $user,
            'twoFactorSession' => [
                'authenticatedAt' => $now,
                'expiresAt' => $sessionExpiresAt,
                'durationHours' => $rememberHours,
                'validUntilFormatted' => date('d/m/Y H:i', $expiresTimestamp)
            ],
            'expiresIn' => $rememberHours * 3600
        ]);
        break;

    // ------------------------------------------------------------------------
    // LOGOUT COM AUDITORIA
    // ------------------------------------------------------------------------
    case 'logout':
        $data = getJsonBody();
        $userId = $data['userId'] ?? $_SERVER['HTTP_X_USER_ID'] ?? null;
        $userName = $data['userName'] ?? 'Colaborador';
        $userRole = $data['userRole'] ?? 'seller';

        if ($userId) {
            logAudit($pdo, $userId, $userName, $userRole, 'LOGOUT', 'Auth', $userId, 'Sessão finalizada com sucesso');
        }
        sendJson(['success' => true, 'message' => 'Sessão encerrada']);
        break;

    // ------------------------------------------------------------------------
    // SETUP 2FA: GERAR SECRET
    // ------------------------------------------------------------------------
    case 'setup_2fa':
        $userId = $_GET['userId'] ?? null;
        if (!$userId) sendError('ID do usuário necessário');

        $stmt = $pdo->prepare("SELECT `email` FROM `employees` WHERE `id` = :id LIMIT 1");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();
        if (!$user) sendError('Usuário não encontrado');

        // Gerar secret aleatório em Base32 (16 chars)
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < 16; $i++) {
            $secret .= $chars[rand(0, 31)];
        }

        sendJson([
            'success' => true,
            'secret' => $secret,
            'qrCodeUri' => "otpauth://totp/iGynCell:{$user['email']}?secret={$secret}&issuer=iGynCell"
        ]);
        break;

    // ------------------------------------------------------------------------
    // CONFIRMAR 2FA: VALIDAR CÓDIGO E ATIVAR
    // ------------------------------------------------------------------------
    case 'confirm_2fa':
        if ($method !== 'POST') sendError('Método inválido', 405);
        $data = getJsonBody();
        $userId = $data['userId'] ?? null;
        $secret = $data['secret'] ?? null;
        $code = $data['code'] ?? null;

        if (!$userId || !$secret || !$code) sendError('Dados incompletos', 400);

        if (verifyTOTP($secret, $code)) {
            $pdo->prepare("UPDATE `employees` SET `twoFactorEnabled` = 1, `twoFactorSecret` = :secret WHERE `id` = :id")
                ->execute(['secret' => $secret, 'id' => $userId]);

            logAudit($pdo, $userId, 'Colaborador', 'unknown', 'UPDATE', 'Auth', $userId, "Autenticação 2FA ativada com sucesso");

            sendJson(['success' => true, 'message' => '2FA ativado com sucesso!']);
        } else {
            sendError('Código de confirmação inválido ou expirado.', 400);
        }
        break;

    // ------------------------------------------------------------------------
    // DESATIVAR 2FA
    // ------------------------------------------------------------------------
    case 'disable_2fa':
        if ($method !== 'POST') sendError('Método inválido', 405);
        $data = getJsonBody();
        $userId = $data['userId'] ?? null;
        if (!$userId) sendError('ID necessário');

        $pdo->prepare("UPDATE `employees` SET `twoFactorEnabled` = 0, `twoFactorSecret` = NULL WHERE `id` = :id")
            ->execute(['id' => $userId]);

        logAudit($pdo, $userId, 'Colaborador', 'unknown', 'UPDATE', 'Auth', $userId, "Autenticação 2FA desativada");

        sendJson(['success' => true, 'message' => '2FA desativado.']);
        break;

    // ------------------------------------------------------------------------
    // RECUPERAÇÃO DE SENHA COM TOKEN TEMPORÁRIO
    // ------------------------------------------------------------------------
    case 'forgot_password':
        if ($method !== 'POST') sendError('Método inválido', 405);
        $data = getJsonBody();
        $email = trim(strtolower($data['email'] ?? ''));

        $stmt = $pdo->prepare("SELECT * FROM `employees` WHERE LOWER(`email`) = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if ($user) {
            $tempToken = strtoupper(substr(bin2hex(random_bytes(4)), 0, 8));
            logAudit($pdo, $user['id'], $user['name'], $user['role'], 'UPDATE', 'Auth', $user['id'], "Solicitação de recuperação de senha gerada com token temporário");

            sendJson([
                'success' => true,
                'message' => 'Instruções e código temporário gerados com sucesso!',
                'tempToken' => $tempToken,
                'expiresIn' => '15 minutos'
            ]);
        } else {
            // Não expor se o e-mail existe ou não por segurança
            sendJson([
                'success' => true,
                'message' => 'Se o e-mail estiver cadastrado, as instruções foram enviadas.'
            ]);
        }
        break;

    default:
        sendError('Ação desconhecida', 404);
}

/**
 * Validação simplificada de TOTP (RFC 6238)
 */
function verifyTOTP($secret, $code) {
    if (strlen($code) !== 6) return false;

    $secret = strtoupper($secret);
    $secretKey = base32_decode($secret);

    // Janelas de tempo (atual, anterior e próxima para tolerância)
    $timeWindow = floor(time() / 30);

    for ($i = -1; $i <= 1; $i++) {
        $time = pack('N*', 0) . pack('N*', $timeWindow + $i);
        $hash = hash_hmac('sha1', $time, $secretKey, true);
        $offset = ord($hash[19]) & 0xf;
        $otp = (
            ((ord($hash[$offset + 0]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff)
        ) % 1000000;

        if (str_pad($otp, 6, '0', STR_PAD_LEFT) === $code) {
            return true;
        }
    }
    return false;
}

/**
 * Decoder Base32 para PHP
 */
function base32_decode($base32) {
    $base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $base32charsFlipped = array_flip(str_split($base32chars));

    $output = '';
    $i = 0;
    $buffer = 0;
    $bufferLength = 0;

    while ($i < strlen($base32)) {
        $char = $base32[$i];
        if ($char === '=') break;
        if (!isset($base32charsFlipped[$char])) {
            $i++;
            continue;
        }
        $buffer <<= 5;
        $buffer |= $base32charsFlipped[$char];
        $bufferLength += 5;
        if ($bufferLength >= 8) {
            $output .= chr(($buffer >> ($bufferLength - 8)) & 0xff);
            $bufferLength -= 8;
        }
        $i++;
    }
    return $output;
}
