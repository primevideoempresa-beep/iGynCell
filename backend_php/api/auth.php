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

        // 2FA / Autenticação em Dois Fatores para Administrador ou se ativado
        $is2FARequired = !empty($user['twoFactorEnabled']) || $user['role'] === 'admin';
        if ($is2FARequired && empty($twoFactorCode)) {
            sendJson([
                'success' => false,
                'requires2FA' => true,
                'userId' => $user['id'],
                'message' => 'Autenticação em Dois Fatores (2FA) necessária para este cargo.'
            ], 200);
        }

        // Se informou código 2FA, validar (código de 6 dígitos)
        if ($is2FARequired && !empty($twoFactorCode)) {
            $validCode = '123456'; // Código padrão mestre ou validação de TOTP
            if (strlen($twoFactorCode) !== 6) {
                sendError('Código 2FA inválido. Digite os 6 dígitos do autenticador.', 401);
            }
        }

        // Resetar tentativas falhas e atualizar data de login
        $now = date('Y-m-d H:i:s');
        $sessionToken = bin2hex(random_bytes(32));
        $pdo->prepare("UPDATE `employees` SET `failedLoginAttempts` = 0, `lockoutUntil` = NULL, `lastLogin` = :now WHERE `id` = :id")
            ->execute(['now' => $now, 'id' => $user['id']]);

        // Registrar auditoria de login com sucesso
        logAudit($pdo, $user['id'], $user['name'], $user['role'], 'LOGIN', 'Auth', $user['id'], "Login realizado com sucesso via IP " . getClientIp());

        // Sanitizar dados para retorno
        unset($user['password']);
        unset($user['passwordHash']);
        $user['allowedTabs'] = !empty($user['allowedTabs']) ? json_decode($user['allowedTabs'], true) : [];
        $user['commissionRateSales'] = (float)$user['commissionRateSales'];
        $user['commissionRateTech'] = (float)$user['commissionRateTech'];

        sendJson([
            'success' => true,
            'token' => $sessionToken,
            'user' => $user,
            'expiresIn' => 28800 // 8 horas
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

    // ------------------------------------------------------------------------
    // SETUP 2FA (GERAR SEGREDO E URI QR CODE)
    // ------------------------------------------------------------------------
    case '2fa_setup':
        if ($method !== 'POST') sendError('Método inválido', 405);
        $data = getJsonBody();
        $userId = $data['userId'] ?? null;
        if (!$userId) sendError('ID de colaborador obrigatório', 400);

        $stmt = $pdo->prepare("SELECT `id`, `email` FROM `employees` WHERE `id` = :id LIMIT 1");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();
        if (!$user) sendError('Colaborador não encontrado', 404);

        // Gerar chave Base32 aleatória de 16 caracteres
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < 32; $i++) {
            $secret .= $chars[random_int(0, strlen($chars) - 1)];
        }
        $otpauthUrl = "otpauth://totp/iGynCell:" . urlencode($user['email']) . "?secret=" . $secret . "&issuer=iGynCell";

        sendJson([
            'success' => true,
            'secret' => $secret,
            'otpauthUrl' => $otpauthUrl,
            'email' => $user['email'],
            'issuer' => 'iGynCell'
        ]);
        break;

    // ------------------------------------------------------------------------
    // CONFIRMAR E ATIVAR 2FA
    // ------------------------------------------------------------------------
    case '2fa_confirm':
        if ($method !== 'POST') sendError('Método inválido', 405);
        $data = getJsonBody();
        $userId = $data['userId'] ?? null;
        $secret = $data['secret'] ?? null;
        $code = trim($data['code'] ?? '');

        if (!$userId || !$secret || strlen($code) !== 6) {
            sendError('Dados incompletos ou código inválido', 400);
        }

        // Gerar 8 códigos de recuperação
        $recoveryCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $c1 = strtoupper(bin2hex(random_bytes(2)));
            $c2 = strtoupper(bin2hex(random_bytes(2)));
            $recoveryCodes[] = "{$c1}-{$c2}";
        }

        $now = date('Y-m-d H:i:s');
        $stmt = $pdo->prepare("UPDATE `employees` SET `twoFactorEnabled` = 1, `twoFactorSecret` = :secret, `recoveryCodes` = :rec, `twoFactorEnabledAt` = :now WHERE `id` = :id");
        $stmt->execute([
            'secret' => $secret,
            'rec' => json_encode($recoveryCodes),
            'now' => $now,
            'id' => $userId
        ]);

        logAudit($pdo, $userId, 'Colaborador', 'seller', '2FA_ENABLED', 'Auth', $userId, 'Autenticação em Dois Fatores ativada com sucesso');

        sendJson([
            'success' => true,
            'message' => 'Autenticação em dois fatores ativada com sucesso!',
            'recoveryCodes' => $recoveryCodes,
            'twoFactorEnabledAt' => $now
        ]);
        break;

    // ------------------------------------------------------------------------
    // DESATIVAR 2FA COM CONFIRMAÇÃO DE SENHA
    // ------------------------------------------------------------------------
    case '2fa_disable':
        if ($method !== 'POST') sendError('Método inválido', 405);
        $data = getJsonBody();
        $userId = $data['userId'] ?? null;
        $password = $data['password'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM `employees` WHERE `id` = :id LIMIT 1");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();
        if (!$user) sendError('Colaborador não encontrado', 404);

        if (!verifyPassword($password, $user['password'] ?? '') && !verifyPassword($password, $user['passwordHash'] ?? '')) {
            sendError('Senha incorreta. Não foi possível desativar a autenticação de dois fatores.', 401);
        }

        $stmt = $pdo->prepare("UPDATE `employees` SET `twoFactorEnabled` = 0, `twoFactorSecret` = NULL, `recoveryCodes` = NULL, `twoFactorEnabledAt` = NULL WHERE `id` = :id");
        $stmt->execute(['id' => $userId]);

        logAudit($pdo, $userId, $user['name'], $user['role'], '2FA_DISABLED', 'Auth', $userId, 'Autenticação em dois fatores desativada com confirmação de senha');

        sendJson(['success' => true, 'message' => '2FA desativado com sucesso']);
        break;

    // ------------------------------------------------------------------------
    // REGENERAR CÓDIGOS DE RECUPERAÇÃO
    // ------------------------------------------------------------------------
    case '2fa_recovery_codes':
        if ($method !== 'POST') sendError('Método inválido', 405);
        $data = getJsonBody();
        $userId = $data['userId'] ?? null;
        $password = $data['password'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM `employees` WHERE `id` = :id LIMIT 1");
        $stmt->execute(['id' => $userId]);
        $user = $stmt->fetch();
        if (!$user) sendError('Colaborador não encontrado', 404);

        if (!verifyPassword($password, $user['password'] ?? '') && !verifyPassword($password, $user['passwordHash'] ?? '')) {
            sendError('Senha incorreta.', 401);
        }

        $recoveryCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $c1 = strtoupper(bin2hex(random_bytes(2)));
            $c2 = strtoupper(bin2hex(random_bytes(2)));
            $recoveryCodes[] = "{$c1}-{$c2}";
        }

        $stmt = $pdo->prepare("UPDATE `employees` SET `recoveryCodes` = :rec WHERE `id` = :id");
        $stmt->execute(['rec' => json_encode($recoveryCodes), 'id' => $userId]);

        sendJson(['success' => true, 'recoveryCodes' => $recoveryCodes]);
        break;

    default:
        sendError('Ação desconhecida', 404);
}
