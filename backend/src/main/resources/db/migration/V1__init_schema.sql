-- SmartCRM Database Schema Initialization (MySQL 8 / Compatible DDL)
-- Version: V1__init_schema.sql

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(150)
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(60) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone_number VARCHAR(30),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- 3. USER_ROLES JOIN TABLE
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone_number VARCHAR(30),
    company_name VARCHAR(150),
    status VARCHAR(30) NOT NULL DEFAULT 'LEAD',
    assigned_to_id BIGINT,
    notes VARCHAR(2000),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone_number);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_full_name ON customers(full_name);
CREATE INDEX idx_customers_assigned_to ON customers(assigned_to_id);

-- 5. CUSTOMER_INTERACTIONS TABLE
CREATE TABLE IF NOT EXISTS customer_interactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    interaction_type VARCHAR(30) NOT NULL,
    summary VARCHAR(200) NOT NULL,
    details TEXT,
    performed_by_id BIGINT,
    interaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interaction_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_interaction_user FOREIGN KEY (performed_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_ci_customer_id ON customer_interactions(customer_id);
CREATE INDEX idx_ci_interaction_date ON customer_interactions(interaction_date);

-- 6. DEALS TABLE
CREATE TABLE IF NOT EXISTS deals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    deal_value DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    stage VARCHAR(30) NOT NULL DEFAULT 'NEW',
    probability INT NOT NULL DEFAULT 10,
    customer_id BIGINT NOT NULL,
    assigned_to_id BIGINT,
    expected_close_date DATE,
    actual_close_date DATE,
    notes VARCHAR(2000),
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deals_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_deals_assigned_to FOREIGN KEY (assigned_to_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_customer_id ON deals(customer_id);
CREATE INDEX idx_deals_assigned_to_id ON deals(assigned_to_id);
CREATE INDEX idx_deals_expected_close ON deals(expected_close_date);

-- 7. DEAL_STAGE_HISTORY TABLE
CREATE TABLE IF NOT EXISTS deal_stage_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    deal_id BIGINT NOT NULL,
    previous_stage VARCHAR(30),
    new_stage VARCHAR(30) NOT NULL,
    changed_by_id BIGINT,
    change_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comment VARCHAR(500),
    CONSTRAINT fk_dsh_deal FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
    CONSTRAINT fk_dsh_user FOREIGN KEY (changed_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_dsh_deal_id ON deal_stage_history(deal_id);
CREATE INDEX idx_dsh_change_date ON deal_stage_history(change_date);

-- 8. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(60) NOT NULL,
    entity_name VARCHAR(60) NOT NULL,
    entity_id BIGINT,
    performed_by VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(60)
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_performed_by ON audit_logs(performed_by);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
