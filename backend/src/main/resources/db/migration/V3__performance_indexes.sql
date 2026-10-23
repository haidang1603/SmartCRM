-- SmartCRM Phase 2: Performance Indexing Migration
-- Target: Eliminate filesort, optimize multi-field filters and relationship lookups

-- 1. CUSTOMERS: Composite index for status filtering + created_at sorting
CREATE INDEX idx_customers_status_created ON customers(status, created_at);

-- 2. CUSTOMERS: Composite index for sales rep assignment + status
CREATE INDEX idx_customers_assigned_status ON customers(assigned_to_id, status);

-- 3. DEALS: Composite index for pipeline stage + created_at sorting
CREATE INDEX idx_deals_stage_created ON deals(stage, created_at);

-- 4. DEALS: Composite index for assigned rep + stage
CREATE INDEX idx_deals_assigned_stage ON deals(assigned_to_id, stage);

-- 5. CUSTOMER INTERACTIONS: Composite index for customer timeline lookups
CREATE INDEX idx_ci_customer_date ON customer_interactions(customer_id, interaction_date);

-- 6. DEAL STAGE HISTORY: Composite index for deal audit trail lookups
CREATE INDEX idx_dsh_deal_date ON deal_stage_history(deal_id, change_date);
