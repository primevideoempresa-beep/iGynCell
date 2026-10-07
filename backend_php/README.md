# 🚀 Backend PHP + MySQL - iGyn Cell ERP

Estrutura completa da API RESTful em **PHP (PDO)** com banco de dados relacional **MySQL** para o sistema **iGyn Cell ERP**.

---

## 📁 Estrutura de Arquivos

```
backend_php/
├── config.php                 # Configuração de Conexão PDO & CORS Headers
├── schema.sql                 # Script DDL completo de tabelas e dados iniciais (MySQL)
└── api/
    ├── test_connection.php    # Diagnóstico da conexão e checagem de tabelas
    ├── data.php               # Sincronização e carga de dados em lote
    ├── orders.php             # CRUD e transações de Ordens de Serviço (OS)
    ├── clients.php            # CRUD de Clientes
    ├── techparts.php          # Peças do Laboratório e ajuste de estoque
    ├── products.php           # Produtos de Balcão e estoque
    ├── sales.php              # Vendas, baixa de estoque e comissões
    ├── financial.php          # Contas a Pagar / Receber
    ├── commissions.php        # Controle e Pagamento de Comissões
    ├── employees.php          # Colaboradores e Acessos
    ├── settings.php           # Configurações da Loja
    └── notifications.php      # Notificações do Sistema
```

---

## 🛠️ Passo a Passo para Instalação no Servidor (XAMPP / cPanel / VPS)

### 1. Criar o Banco de Dados MySQL
1. Abra o **phpMyAdmin** (ex: `http://localhost/phpmyadmin`) ou terminal MySQL.
2. Crie a base de dados `igyn_cell_db`:
   ```sql
   CREATE DATABASE igyn_cell_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Importe o arquivo `backend_php/schema.sql`.

### 2. Configurar Credenciais em `config.php`
Abra `backend_php/config.php` e preencha suas credenciais:
```php
define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_NAME', 'igyn_cell_db');
define('DB_USER', 'root');
define('DB_PASS', '');
```

### 3. Testar a Conexão
Acesse no seu navegador:
`http://localhost/backend_php/api/test_connection.php`

Você deverá receber um JSON com status `connected`, latência em milissegundos e todas as tabelas prontas.

---

## ⚡ Conectando o Frontend React

No painel de **Configurações** da aplicação web:
1. Vá até a seção **"Integração PHP & MySQL"**.
2. Insira a URL da API PHP (ex: `http://localhost/backend_php/api`).
3. Clique em **"Testar Conexão"** para validar a integração em tempo real.
4. Salve as configurações. Todas as operações de criação, edição e avanço de status de Ordens de Serviço serão sincronizadas instantaneamente no seu MySQL.
