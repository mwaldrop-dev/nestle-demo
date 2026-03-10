-- ============================================================================
-- NESTLÉ SUPPLY CHAIN OPERATIONS — ENTITY RELATIONSHIP MODEL
-- 100 tables across 10 domains
-- Import into Lucidchart: File → Import Data → Entity Relationship (SQL)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN 1: MASTER DATA & REFERENCE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE region (
    region_id          INT PRIMARY KEY,
    region_name        VARCHAR(100) NOT NULL,
    region_code        VARCHAR(10) NOT NULL,
    parent_region_id   INT REFERENCES region(region_id),
    is_active          BOOLEAN DEFAULT TRUE
);

CREATE TABLE country (
    country_id    INT PRIMARY KEY,
    country_name  VARCHAR(100) NOT NULL,
    iso_code_2    CHAR(2) NOT NULL,
    iso_code_3    CHAR(3) NOT NULL,
    region_id     INT NOT NULL REFERENCES region(region_id),
    currency_code VARCHAR(3) NOT NULL
);

CREATE TABLE currency (
    currency_id   INT PRIMARY KEY,
    currency_code CHAR(3) NOT NULL,
    currency_name VARCHAR(50) NOT NULL,
    symbol        VARCHAR(5),
    exchange_rate DECIMAL(12,6),
    rate_date     DATE
);

CREATE TABLE unit_of_measure (
    uom_id      INT PRIMARY KEY,
    uom_code    VARCHAR(10) NOT NULL,
    uom_name    VARCHAR(50) NOT NULL,
    uom_type    VARCHAR(20) NOT NULL, -- weight, volume, count, temperature
    base_factor DECIMAL(12,6) DEFAULT 1.0
);

CREATE TABLE fiscal_period (
    period_id    INT PRIMARY KEY,
    period_name  VARCHAR(20) NOT NULL,
    fiscal_year  INT NOT NULL,
    quarter      INT NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    is_closed    BOOLEAN DEFAULT FALSE
);

CREATE TABLE brand (
    brand_id       INT PRIMARY KEY,
    brand_name     VARCHAR(100) NOT NULL,
    brand_code     VARCHAR(20) NOT NULL,
    parent_brand_id INT REFERENCES brand(brand_id),
    market_segment VARCHAR(50)
);

CREATE TABLE product_category (
    category_id      INT PRIMARY KEY,
    category_name    VARCHAR(100) NOT NULL,
    category_code    VARCHAR(20) NOT NULL,
    parent_category_id INT REFERENCES product_category(category_id),
    level            INT NOT NULL DEFAULT 1
);

CREATE TABLE product (
    product_id       INT PRIMARY KEY,
    product_name     VARCHAR(200) NOT NULL,
    sku              VARCHAR(50) NOT NULL,
    brand_id         INT NOT NULL REFERENCES brand(brand_id),
    category_id      INT NOT NULL REFERENCES product_category(category_id),
    base_uom_id      INT NOT NULL REFERENCES unit_of_measure(uom_id),
    shelf_life_days  INT,
    is_cold_chain    BOOLEAN DEFAULT FALSE,
    min_temp_celsius DECIMAL(4,1),
    max_temp_celsius DECIMAL(4,1),
    status           VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE product_variant (
    variant_id    INT PRIMARY KEY,
    product_id    INT NOT NULL REFERENCES product(product_id),
    variant_name  VARCHAR(100) NOT NULL,
    variant_sku   VARCHAR(50) NOT NULL,
    net_weight    DECIMAL(10,3),
    gross_weight  DECIMAL(10,3),
    weight_uom_id INT REFERENCES unit_of_measure(uom_id),
    barcode       VARCHAR(50)
);

CREATE TABLE ingredient (
    ingredient_id     INT PRIMARY KEY,
    ingredient_name   VARCHAR(100) NOT NULL,
    ingredient_code   VARCHAR(20) NOT NULL,
    category          VARCHAR(50), -- cocoa, dairy, sugar, oil, grain, nut
    is_allergen       BOOLEAN DEFAULT FALSE,
    allergen_type     VARCHAR(50),
    country_of_origin INT REFERENCES country(country_id),
    is_organic        BOOLEAN DEFAULT FALSE,
    shelf_life_days   INT
);

CREATE TABLE product_ingredient (
    product_ingredient_id INT PRIMARY KEY,
    product_id            INT NOT NULL REFERENCES product(product_id),
    ingredient_id         INT NOT NULL REFERENCES ingredient(ingredient_id),
    percentage            DECIMAL(5,2),
    is_primary            BOOLEAN DEFAULT FALSE,
    sequence_order        INT
);

CREATE TABLE packaging_type (
    packaging_type_id INT PRIMARY KEY,
    type_name         VARCHAR(50) NOT NULL,
    material          VARCHAR(50),
    is_recyclable     BOOLEAN DEFAULT FALSE,
    weight_grams      DECIMAL(8,2)
);

CREATE TABLE regulatory_standard (
    standard_id   INT PRIMARY KEY,
    standard_name VARCHAR(100) NOT NULL,
    standard_code VARCHAR(20) NOT NULL,
    issuing_body  VARCHAR(100),
    country_id    INT REFERENCES country(country_id),
    category      VARCHAR(50) -- food_safety, environmental, labor, trade
);

CREATE TABLE certification_type (
    cert_type_id   INT PRIMARY KEY,
    cert_name      VARCHAR(100) NOT NULL,
    cert_code      VARCHAR(20) NOT NULL,
    issuing_body   VARCHAR(100),
    validity_months INT,
    standard_id    INT REFERENCES regulatory_standard(standard_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN 2: ORGANIZATION & PERSONNEL
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE business_unit (
    bu_id        INT PRIMARY KEY,
    bu_name      VARCHAR(100) NOT NULL,
    bu_code      VARCHAR(20) NOT NULL,
    region_id    INT REFERENCES region(region_id),
    parent_bu_id INT REFERENCES business_unit(bu_id)
);

CREATE TABLE site (
    site_id      INT PRIMARY KEY,
    site_name    VARCHAR(100) NOT NULL,
    site_code    VARCHAR(20) NOT NULL,
    site_type    VARCHAR(30) NOT NULL, -- factory, warehouse, distribution_center, office
    bu_id        INT NOT NULL REFERENCES business_unit(bu_id),
    country_id   INT NOT NULL REFERENCES country(country_id),
    city         VARCHAR(100),
    address      VARCHAR(200),
    latitude     DECIMAL(9,6),
    longitude    DECIMAL(9,6),
    is_active    BOOLEAN DEFAULT TRUE
);

CREATE TABLE department (
    department_id   INT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(20) NOT NULL,
    site_id         INT NOT NULL REFERENCES site(site_id),
    parent_dept_id  INT REFERENCES department(department_id)
);

CREATE TABLE role (
    role_id    INT PRIMARY KEY,
    role_name  VARCHAR(100) NOT NULL,
    role_code  VARCHAR(20) NOT NULL,
    role_level VARCHAR(20) -- executive, manager, lead, analyst, operator
);

CREATE TABLE employee (
    employee_id    INT PRIMARY KEY,
    employee_code  VARCHAR(20) NOT NULL,
    first_name     VARCHAR(50) NOT NULL,
    last_name      VARCHAR(50) NOT NULL,
    email          VARCHAR(100),
    department_id  INT NOT NULL REFERENCES department(department_id),
    role_id        INT NOT NULL REFERENCES role(role_id),
    manager_id     INT REFERENCES employee(employee_id),
    hire_date      DATE NOT NULL,
    is_active      BOOLEAN DEFAULT TRUE
);

CREATE TABLE team (
    team_id      INT PRIMARY KEY,
    team_name    VARCHAR(100) NOT NULL,
    team_type    VARCHAR(30), -- operations, logistics, quality, procurement
    lead_id      INT REFERENCES employee(employee_id),
    site_id      INT REFERENCES site(site_id)
);

CREATE TABLE team_member (
    team_member_id INT PRIMARY KEY,
    team_id        INT NOT NULL REFERENCES team(team_id),
    employee_id    INT NOT NULL REFERENCES employee(employee_id),
    role_in_team   VARCHAR(50),
    joined_date    DATE NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN 3: SUPPLIER MANAGEMENT
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE supplier_tier (
    tier_id   INT PRIMARY KEY,
    tier_name VARCHAR(20) NOT NULL, -- tier_1, tier_2, tier_3
    tier_level INT NOT NULL,
    description VARCHAR(200)
);

CREATE TABLE supplier (
    supplier_id      INT PRIMARY KEY,
    supplier_name    VARCHAR(200) NOT NULL,
    supplier_code    VARCHAR(20) NOT NULL,
    tier_id          INT NOT NULL REFERENCES supplier_tier(tier_id),
    country_id       INT NOT NULL REFERENCES country(country_id),
    city             VARCHAR(100),
    primary_contact  VARCHAR(100),
    email            VARCHAR(100),
    phone            VARCHAR(30),
    onboarded_date   DATE,
    status           VARCHAR(20) DEFAULT 'active',
    risk_score       DECIMAL(5,2),
    strategic_flag   BOOLEAN DEFAULT FALSE
);

CREATE TABLE supplier_contact (
    contact_id   INT PRIMARY KEY,
    supplier_id  INT NOT NULL REFERENCES supplier(supplier_id),
    contact_name VARCHAR(100) NOT NULL,
    title        VARCHAR(100),
    email        VARCHAR(100),
    phone        VARCHAR(30),
    is_primary   BOOLEAN DEFAULT FALSE
);

CREATE TABLE supplier_material (
    supplier_material_id INT PRIMARY KEY,
    supplier_id          INT NOT NULL REFERENCES supplier(supplier_id),
    ingredient_id        INT NOT NULL REFERENCES ingredient(ingredient_id),
    lead_time_days       INT,
    min_order_qty        DECIMAL(12,2),
    unit_price           DECIMAL(12,4),
    currency_id          INT REFERENCES currency(currency_id),
    is_preferred         BOOLEAN DEFAULT FALSE
);

CREATE TABLE supplier_contract (
    contract_id    INT PRIMARY KEY,
    supplier_id    INT NOT NULL REFERENCES supplier(supplier_id),
    contract_ref   VARCHAR(50) NOT NULL,
    start_date     DATE NOT NULL,
    end_date       DATE NOT NULL,
    total_value    DECIMAL(15,2),
    currency_id    INT REFERENCES currency(currency_id),
    payment_terms  VARCHAR(50),
    incoterm       VARCHAR(10),
    status         VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE contract_line_item (
    line_id         INT PRIMARY KEY,
    contract_id     INT NOT NULL REFERENCES supplier_contract(contract_id),
    ingredient_id   INT NOT NULL REFERENCES ingredient(ingredient_id),
    agreed_qty      DECIMAL(12,2),
    unit_price      DECIMAL(12,4),
    uom_id          INT REFERENCES unit_of_measure(uom_id),
    delivery_schedule VARCHAR(50)
);

CREATE TABLE supplier_certification (
    supplier_cert_id INT PRIMARY KEY,
    supplier_id      INT NOT NULL REFERENCES supplier(supplier_id),
    cert_type_id     INT NOT NULL REFERENCES certification_type(cert_type_id),
    cert_number      VARCHAR(50),
    issued_date      DATE NOT NULL,
    expiry_date      DATE NOT NULL,
    status           VARCHAR(20) DEFAULT 'valid'
);

CREATE TABLE supplier_audit (
    audit_id       INT PRIMARY KEY,
    supplier_id    INT NOT NULL REFERENCES supplier(supplier_id),
    audit_date     DATE NOT NULL,
    auditor_id     INT REFERENCES employee(employee_id),
    audit_type     VARCHAR(50), -- initial, periodic, triggered
    overall_score  DECIMAL(5,2),
    findings_count INT DEFAULT 0,
    status         VARCHAR(20),
    next_audit_date DATE
);

CREATE TABLE supplier_risk_assessment (
    assessment_id    INT PRIMARY KEY,
    supplier_id      INT NOT NULL REFERENCES supplier(supplier_id),
    assessment_date  DATE NOT NULL,
    assessor_id      INT REFERENCES employee(employee_id),
    financial_risk   DECIMAL(5,2),
    operational_risk DECIMAL(5,2),
    geopolitical_risk DECIMAL(5,2),
    quality_risk     DECIMAL(5,2),
    overall_risk     DECIMAL(5,2),
    risk_category    VARCHAR(20) -- low, medium, high, critical
);

CREATE TABLE supplier_performance (
    performance_id   INT PRIMARY KEY,
    supplier_id      INT NOT NULL REFERENCES supplier(supplier_id),
    period_id        INT NOT NULL REFERENCES fiscal_period(period_id),
    otd_percentage   DECIMAL(5,2),
    quality_score    DECIMAL(5,2),
    responsiveness   DECIMAL(5,2),
    cost_competitiveness DECIMAL(5,2),
    overall_rating   DECIMAL(5,2),
    total_shipments  INT,
    on_time_shipments INT,
    rejected_shipments INT
);

CREATE TABLE approved_supplier_list (
    asl_id         INT PRIMARY KEY,
    supplier_id    INT NOT NULL REFERENCES supplier(supplier_id),
    ingredient_id  INT NOT NULL REFERENCES ingredient(ingredient_id),
    site_id        INT NOT NULL REFERENCES site(site_id),
    approved_date  DATE NOT NULL,
    approved_by    INT REFERENCES employee(employee_id),
    status         VARCHAR(20) DEFAULT 'approved'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN 4: PROCUREMENT
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE purchase_requisition (
    requisition_id INT PRIMARY KEY,
    requisition_no VARCHAR(20) NOT NULL,
    requester_id   INT NOT NULL REFERENCES employee(employee_id),
    site_id        INT NOT NULL REFERENCES site(site_id),
    created_date   TIMESTAMP NOT NULL,
    required_date  DATE,
    priority       VARCHAR(10),
    status         VARCHAR(20) DEFAULT 'draft'
);

CREATE TABLE purchase_requisition_line (
    req_line_id    INT PRIMARY KEY,
    requisition_id INT NOT NULL REFERENCES purchase_requisition(requisition_id),
    ingredient_id  INT NOT NULL REFERENCES ingredient(ingredient_id),
    quantity       DECIMAL(12,2) NOT NULL,
    uom_id         INT NOT NULL REFERENCES unit_of_measure(uom_id),
    estimated_cost DECIMAL(12,2),
    line_number    INT NOT NULL
);

CREATE TABLE purchase_order (
    po_id          INT PRIMARY KEY,
    po_number      VARCHAR(20) NOT NULL,
    supplier_id    INT NOT NULL REFERENCES supplier(supplier_id),
    contract_id    INT REFERENCES supplier_contract(contract_id),
    site_id        INT NOT NULL REFERENCES site(site_id),
    buyer_id       INT NOT NULL REFERENCES employee(employee_id),
    order_date     TIMESTAMP NOT NULL,
    expected_delivery DATE,
    total_amount   DECIMAL(15,2),
    currency_id    INT REFERENCES currency(currency_id),
    incoterm       VARCHAR(10),
    status         VARCHAR(20) DEFAULT 'submitted'
);

CREATE TABLE purchase_order_line (
    po_line_id    INT PRIMARY KEY,
    po_id         INT NOT NULL REFERENCES purchase_order(po_id),
    ingredient_id INT NOT NULL REFERENCES ingredient(ingredient_id),
    quantity      DECIMAL(12,2) NOT NULL,
    uom_id        INT NOT NULL REFERENCES unit_of_measure(uom_id),
    unit_price    DECIMAL(12,4) NOT NULL,
    line_total    DECIMAL(15,2),
    line_number   INT NOT NULL
);

CREATE TABLE goods_receipt (
    receipt_id     INT PRIMARY KEY,
    receipt_number VARCHAR(20) NOT NULL,
    po_id          INT NOT NULL REFERENCES purchase_order(po_id),
    site_id        INT NOT NULL REFERENCES site(site_id),
    received_by    INT REFERENCES employee(employee_id),
    receipt_date   TIMESTAMP NOT NULL,
    status         VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE goods_receipt_line (
    receipt_line_id INT PRIMARY KEY,
    receipt_id      INT NOT NULL REFERENCES goods_receipt(receipt_id),
    po_line_id      INT NOT NULL REFERENCES purchase_order_line(po_line_id),
    received_qty    DECIMAL(12,2) NOT NULL,
    accepted_qty    DECIMAL(12,2),
    rejected_qty    DECIMAL(12,2) DEFAULT 0,
    lot_number      VARCHAR(50),
    expiry_date     DATE
);

CREATE TABLE invoice (
    invoice_id     INT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL,
    supplier_id    INT NOT NULL REFERENCES supplier(supplier_id),
    po_id          INT REFERENCES purchase_order(po_id),
    invoice_date   DATE NOT NULL,
    due_date       DATE NOT NULL,
    total_amount   DECIMAL(15,2) NOT NULL,
    currency_id    INT REFERENCES currency(currency_id),
    status         VARCHAR(20) DEFAULT 'received'
);

CREATE TABLE invoice_line (
    invoice_line_id INT PRIMARY KEY,
    invoice_id      INT NOT NULL REFERENCES invoice(invoice_id),
    po_line_id      INT REFERENCES purchase_order_line(po_line_id),
    description     VARCHAR(200),
    quantity        DECIMAL(12,2),
    unit_price      DECIMAL(12,4),
    line_total      DECIMAL(15,2)
);

CREATE TABLE payment (
    payment_id     INT PRIMARY KEY,
    invoice_id     INT NOT NULL REFERENCES invoice(invoice_id),
    payment_date   DATE NOT NULL,
    amount         DECIMAL(15,2) NOT NULL,
    currency_id    INT REFERENCES currency(currency_id),
    payment_method VARCHAR(30),
    reference      VARCHAR(50),
    status         VARCHAR(20) DEFAULT 'completed'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN 5: INVENTORY MANAGEMENT
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE warehouse (
    warehouse_id   INT PRIMARY KEY,
    warehouse_name VARCHAR(100) NOT NULL,
    warehouse_code VARCHAR(20) NOT NULL,
    site_id        INT NOT NULL REFERENCES site(site_id),
    warehouse_type VARCHAR(30), -- raw_material, finished_goods, cold_storage
    capacity       DECIMAL(12,2),
    capacity_uom   INT REFERENCES unit_of_measure(uom_id),
    is_cold_storage BOOLEAN DEFAULT FALSE,
    temp_min       DECIMAL(4,1),
    temp_max       DECIMAL(4,1)
);

CREATE TABLE warehouse_zone (
    zone_id       INT PRIMARY KEY,
    warehouse_id  INT NOT NULL REFERENCES warehouse(warehouse_id),
    zone_name     VARCHAR(50) NOT NULL,
    zone_type     VARCHAR(30), -- ambient, chilled, frozen, hazmat
    temp_min      DECIMAL(4,1),
    temp_max      DECIMAL(4,1)
);

CREATE TABLE storage_location (
    location_id   INT PRIMARY KEY,
    zone_id       INT NOT NULL REFERENCES warehouse_zone(zone_id),
    location_code VARCHAR(20) NOT NULL,
    aisle         VARCHAR(10),
    rack          VARCHAR(10),
    shelf         VARCHAR(10),
    bin           VARCHAR(10),
    max_weight_kg DECIMAL(10,2)
);

CREATE TABLE material_master (
    material_id    INT PRIMARY KEY,
    material_code  VARCHAR(20) NOT NULL,
    material_name  VARCHAR(200) NOT NULL,
    material_type  VARCHAR(30), -- raw, semi_finished, finished, packaging
    ingredient_id  INT REFERENCES ingredient(ingredient_id),
    product_id     INT REFERENCES product(product_id),
    base_uom_id    INT NOT NULL REFERENCES unit_of_measure(uom_id),
    standard_cost  DECIMAL(12,4),
    currency_id    INT REFERENCES currency(currency_id)
);

CREATE TABLE inventory_lot (
    lot_id           INT PRIMARY KEY,
    lot_number       VARCHAR(50) NOT NULL,
    material_id      INT NOT NULL REFERENCES material_master(material_id),
    location_id      INT NOT NULL REFERENCES storage_location(location_id),
    supplier_id      INT REFERENCES supplier(supplier_id),
    receipt_id       INT REFERENCES goods_receipt(receipt_id),
    quantity         DECIMAL(12,2) NOT NULL,
    uom_id           INT NOT NULL REFERENCES unit_of_measure(uom_id),
    production_date  DATE,
    expiry_date      DATE,
    status           VARCHAR(20) DEFAULT 'available' -- available, quarantine, reserved, expired
);

CREATE TABLE stock_level (
    stock_level_id INT PRIMARY KEY,
    material_id    INT NOT NULL REFERENCES material_master(material_id),
    site_id        INT NOT NULL REFERENCES site(site_id),
    quantity       DECIMAL(12,2) NOT NULL,
    uom_id         INT NOT NULL REFERENCES unit_of_measure(uom_id),
    days_of_cover  DECIMAL(5,1),
    last_updated   TIMESTAMP NOT NULL
);

CREATE TABLE safety_stock_config (
    config_id      INT PRIMARY KEY,
    material_id    INT NOT NULL REFERENCES material_master(material_id),
    site_id        INT NOT NULL REFERENCES site(site_id),
    safety_stock_qty DECIMAL(12,2) NOT NULL,
    safety_days    INT NOT NULL,
    uom_id         INT NOT NULL REFERENCES unit_of_measure(uom_id),
    review_date    DATE
);

CREATE TABLE reorder_point_config (
    config_id       INT PRIMARY KEY,
    material_id     INT NOT NULL REFERENCES material_master(material_id),
    site_id         INT NOT NULL REFERENCES site(site_id),
    reorder_point   DECIMAL(12,2) NOT NULL,
    reorder_qty     DECIMAL(12,2) NOT NULL,
    lead_time_days  INT NOT NULL,
    uom_id          INT NOT NULL REFERENCES unit_of_measure(uom_id)
);

CREATE TABLE inventory_transaction (
    transaction_id   INT PRIMARY KEY,
    material_id      INT NOT NULL REFERENCES material_master(material_id),
    lot_id           INT REFERENCES inventory_lot(lot_id),
    site_id          INT NOT NULL REFERENCES site(site_id),
    transaction_type VARCHAR(30) NOT NULL, -- receipt, issue, transfer, adjustment, scrap
    quantity         DECIMAL(12,2) NOT NULL,
    uom_id           INT NOT NULL REFERENCES unit_of_measure(uom_id),
    reference_type   VARCHAR(30),
    reference_id     INT,
    transaction_date TIMESTAMP NOT NULL,
    created_by       INT REFERENCES employee(employee_id)
);

CREATE TABLE cycle_count (
    count_id      INT PRIMARY KEY,
    warehouse_id  INT NOT NULL REFERENCES warehouse(warehouse_id),
    count_date    DATE NOT NULL,
    initiated_by  INT REFERENCES employee(employee_id),
    status        VARCHAR(20) DEFAULT 'planned',
    variance_value DECIMAL(15,2)
);

CREATE TABLE cycle_count_line (
    count_line_id  INT PRIMARY KEY,
    count_id       INT NOT NULL REFERENCES cycle_count(count_id),
    material_id    INT NOT NULL REFERENCES material_master(material_id),
    location_id    INT NOT NULL REFERENCES storage_location(location_id),
    system_qty     DECIMAL(12,2) NOT NULL,
    counted_qty    DECIMAL(12,2),
    variance_qty   DECIMAL(12,2),
    counted_by     INT REFERENCES employee(employee_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN 6: PRODUCTION & MANUFACTURING
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE factory (
    factory_id     INT PRIMARY KEY,
    site_id        INT NOT NULL REFERENCES site(site_id),
    factory_code   VARCHAR(20) NOT NULL,
    total_lines    INT NOT NULL,
    max_capacity   DECIMAL(12,2),
    capacity_uom_id INT REFERENCES unit_of_measure(uom_id),
    operating_hours DECIMAL(4,1) DEFAULT 24.0
);

CREATE TABLE production_line (
    line_id        INT PRIMARY KEY,
    factory_id     INT NOT NULL REFERENCES factory(factory_id),
    line_name      VARCHAR(50) NOT NULL,
    line_code      VARCHAR(20) NOT NULL,
    line_type      VARCHAR(30), -- molding, enrobing, packaging, mixing
    max_throughput DECIMAL(10,2),
    throughput_uom INT REFERENCES unit_of_measure(uom_id),
    status         VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE line_product_capability (
    capability_id INT PRIMARY KEY,
    line_id       INT NOT NULL REFERENCES production_line(line_id),
    product_id    INT NOT NULL REFERENCES product(product_id),
    changeover_minutes INT,
    std_throughput DECIMAL(10,2)
);

CREATE TABLE production_shift (
    shift_id    INT PRIMARY KEY,
    factory_id  INT NOT NULL REFERENCES factory(factory_id),
    shift_name  VARCHAR(30) NOT NULL,
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    shift_type  VARCHAR(20) -- day, evening, night
);

CREATE TABLE production_schedule (
    schedule_id    INT PRIMARY KEY,
    line_id        INT NOT NULL REFERENCES production_line(line_id),
    product_id     INT NOT NULL REFERENCES product(product_id),
    shift_id       INT NOT NULL REFERENCES production_shift(shift_id),
    scheduled_date DATE NOT NULL,
    planned_qty    DECIMAL(12,2) NOT NULL,
    uom_id         INT NOT NULL REFERENCES unit_of_measure(uom_id),
    status         VARCHAR(20) DEFAULT 'planned'
);

CREATE TABLE work_order (
    wo_id           INT PRIMARY KEY,
    wo_number       VARCHAR(20) NOT NULL,
    schedule_id     INT REFERENCES production_schedule(schedule_id),
    line_id         INT NOT NULL REFERENCES production_line(line_id),
    product_id      INT NOT NULL REFERENCES product(product_id),
    planned_qty     DECIMAL(12,2) NOT NULL,
    actual_qty      DECIMAL(12,2),
    uom_id          INT NOT NULL REFERENCES unit_of_measure(uom_id),
    start_time      TIMESTAMP,
    end_time        TIMESTAMP,
    status          VARCHAR(20) DEFAULT 'created',
    supervisor_id   INT REFERENCES employee(employee_id)
);

CREATE TABLE work_order_step (
    step_id       INT PRIMARY KEY,
    wo_id         INT NOT NULL REFERENCES work_order(wo_id),
    step_number   INT NOT NULL,
    step_name     VARCHAR(100) NOT NULL,
    planned_duration_min INT,
    actual_duration_min  INT,
    status        VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE production_batch (
    batch_id       INT PRIMARY KEY,
    batch_number   VARCHAR(50) NOT NULL,
    wo_id          INT NOT NULL REFERENCES work_order(wo_id),
    product_id     INT NOT NULL REFERENCES product(product_id),
    quantity       DECIMAL(12,2) NOT NULL,
    uom_id         INT NOT NULL REFERENCES unit_of_measure(uom_id),
    production_date TIMESTAMP NOT NULL,
    expiry_date    DATE,
    status         VARCHAR(20) DEFAULT 'produced'
);

CREATE TABLE batch_ingredient_usage (
    usage_id      INT PRIMARY KEY,
    batch_id      INT NOT NULL REFERENCES production_batch(batch_id),
    ingredient_id INT NOT NULL REFERENCES ingredient(ingredient_id),
    lot_id        INT REFERENCES inventory_lot(lot_id),
    quantity_used DECIMAL(12,2) NOT NULL,
    uom_id        INT NOT NULL REFERENCES unit_of_measure(uom_id)
);

CREATE TABLE equipment (
    equipment_id   INT PRIMARY KEY,
    equipment_name VARCHAR(100) NOT NULL,
    equipment_code VARCHAR(20) NOT NULL,
    equipment_type VARCHAR(50),
    line_id        INT REFERENCES production_line(line_id),
    factory_id     INT NOT NULL REFERENCES factory(factory_id),
    manufacturer   VARCHAR(100),
    install_date   DATE,
    status         VARCHAR(20) DEFAULT 'operational'
);

CREATE TABLE equipment_maintenance (
    maintenance_id   INT PRIMARY KEY,
    equipment_id     INT NOT NULL REFERENCES equipment(equipment_id),
    maintenance_type VARCHAR(30), -- preventive, corrective, predictive
    scheduled_date   DATE,
    completed_date   DATE,
    technician_id    INT REFERENCES employee(employee_id),
    duration_hours   DECIMAL(5,1),
    cost             DECIMAL(10,2),
    notes            TEXT,
    status           VARCHAR(20) DEFAULT 'scheduled'
);

CREATE TABLE oee_record (
    oee_id          INT PRIMARY KEY,
    line_id         INT NOT NULL REFERENCES production_line(line_id),
    record_date     DATE NOT NULL,
    shift_id        INT REFERENCES production_shift(shift_id),
    availability    DECIMAL(5,2) NOT NULL,
    performance     DECIMAL(5,2) NOT NULL,
    quality         DECIMAL(5,2) NOT NULL,
    oee_percentage  DECIMAL(5,2) NOT NULL,
    planned_time_min  INT,
    actual_run_time_min INT,
    ideal_cycle_time DECIMAL(8,4),
    total_count     INT,
    good_count      INT
);

CREATE TABLE downtime_event (
    downtime_id    INT PRIMARY KEY,
    line_id        INT NOT NULL REFERENCES production_line(line_id),
    equipment_id   INT REFERENCES equipment(equipment_id),
    reason_id      INT NOT NULL REFERENCES downtime_reason(downtime_reason_id),
    start_time     TIMESTAMP NOT NULL,
    end_time       TIMESTAMP,
    duration_min   INT,
    is_planned     BOOLEAN DEFAULT FALSE,
    reported_by    INT REFERENCES employee(employee_id)
);

CREATE TABLE downtime_reason (
    downtime_reason_id INT PRIMARY KEY,
    reason_code        VARCHAR(20) NOT NULL,
    reason_name        VARCHAR(100) NOT NULL,
    category           VARCHAR(50), -- mechanical, electrical, changeover, material, operator
    is_planned         BOOLEAN DEFAULT FALSE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN 7: QUALITY CONTROL
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE quality_parameter (
    parameter_id   INT PRIMARY KEY,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_code VARCHAR(20) NOT NULL,
    parameter_type VARCHAR(30), -- chemical, physical, microbiological, sensory
    uom_id         INT REFERENCES unit_of_measure(uom_id),
    min_value      DECIMAL(10,4),
    max_value      DECIMAL(10,4)
);

CREATE TABLE product_specification (
    spec_id        INT PRIMARY KEY,
    product_id     INT NOT NULL REFERENCES product(product_id),
    parameter_id   INT NOT NULL REFERENCES quality_parameter(parameter_id),
    target_value   DECIMAL(10,4),
    lower_limit    DECIMAL(10,4),
    upper_limit    DECIMAL(10,4),
    is_critical    BOOLEAN DEFAULT FALSE
);

CREATE TABLE quality_inspection (
    inspection_id   INT PRIMARY KEY,
    inspection_type VARCHAR(30) NOT NULL, -- incoming, in_process, final, storage
    reference_type  VARCHAR(30), -- goods_receipt, batch, lot
    reference_id    INT,
    site_id         INT NOT NULL REFERENCES site(site_id),
    inspector_id    INT REFERENCES employee(employee_id),
    inspection_date TIMESTAMP NOT NULL,
    overall_result  VARCHAR(20), -- pass, fail, conditional
    status          VARCHAR(20) DEFAULT 'in_progress'
);

CREATE TABLE inspection_result (
    result_id      INT PRIMARY KEY,
    inspection_id  INT NOT NULL REFERENCES quality_inspection(inspection_id),
    parameter_id   INT NOT NULL REFERENCES quality_parameter(parameter_id),
    measured_value DECIMAL(10,4),
    result         VARCHAR(20), -- pass, fail, warning
    notes          TEXT
);

CREATE TABLE non_conformance (
    nc_id           INT PRIMARY KEY,
    nc_number       VARCHAR(20) NOT NULL,
    inspection_id   INT REFERENCES quality_inspection(inspection_id),
    batch_id        INT REFERENCES production_batch(batch_id),
    supplier_id     INT REFERENCES supplier(supplier_id),
    nc_type         VARCHAR(30), -- material, process, product, supplier
    severity        VARCHAR(20), -- minor, major, critical
    description     TEXT NOT NULL,
    reported_date   TIMESTAMP NOT NULL,
    reported_by     INT REFERENCES employee(employee_id),
    root_cause      TEXT,
    disposition     VARCHAR(30), -- rework, scrap, use_as_is, return
    status          VARCHAR(20) DEFAULT 'open'
);

CREATE TABLE corrective_action (
    action_id       INT PRIMARY KEY,
    nc_id           INT NOT NULL REFERENCES non_conformance(nc_id),
    action_type     VARCHAR(30), -- correction, corrective, preventive
    description     TEXT NOT NULL,
    assigned_to     INT REFERENCES employee(employee_id),
    due_date        DATE,
    completion_date DATE,
    verification_date DATE,
    verified_by     INT REFERENCES employee(employee_id),
    status          VARCHAR(20) DEFAULT 'open'
);

CREATE TABLE lab_test (
    test_id         INT PRIMARY KEY,
    test_number     VARCHAR(20) NOT NULL,
    inspection_id   INT REFERENCES quality_inspection(inspection_id),
    sample_id       VARCHAR(50),
    lab_name        VARCHAR(100),
    requested_date  TIMESTAMP NOT NULL,
    completed_date  TIMESTAMP,
    status          VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE lab_test_result (
    test_result_id INT PRIMARY KEY,
    test_id        INT NOT NULL REFERENCES lab_test(test_id),
    parameter_id   INT NOT NULL REFERENCES quality_parameter(parameter_id),
    result_value   DECIMAL(10,4),
    result_text    VARCHAR(100),
    pass_fail      VARCHAR(10)
);

CREATE TABLE recall_event (
    recall_id      INT PRIMARY KEY,
    recall_number  VARCHAR(20) NOT NULL,
    product_id     INT NOT NULL REFERENCES product(product_id),
    batch_id       INT REFERENCES production_batch(batch_id),
    recall_type    VARCHAR(20), -- voluntary, mandatory
    recall_class   VARCHAR(10), -- I, II, III
    reason         TEXT NOT NULL,
    initiated_date DATE NOT NULL,
    affected_qty   DECIMAL(12,2),
    regions_affected TEXT,
    status         VARCHAR(20) DEFAULT 'initiated',
    lead_id        INT REFERENCES employee(employee_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN 8: LOGISTICS & COLD CHAIN
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE carrier (
    carrier_id    INT PRIMARY KEY,
    carrier_name  VARCHAR(100) NOT NULL,
    carrier_code  VARCHAR(20) NOT NULL,
    carrier_type  VARCHAR(30), -- road, rail, sea, air
    country_id    INT REFERENCES country(country_id),
    is_cold_chain_certified BOOLEAN DEFAULT FALSE,
    status        VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE vehicle_type (
    vehicle_type_id INT PRIMARY KEY,
    type_name       VARCHAR(50) NOT NULL,
    is_refrigerated BOOLEAN DEFAULT FALSE,
    max_payload_kg  DECIMAL(10,2),
    temp_min        DECIMAL(4,1),
    temp_max        DECIMAL(4,1)
);

CREATE TABLE vehicle (
    vehicle_id      INT PRIMARY KEY,
    vehicle_code    VARCHAR(20) NOT NULL,
    carrier_id      INT NOT NULL REFERENCES carrier(carrier_id),
    vehicle_type_id INT NOT NULL REFERENCES vehicle_type(vehicle_type_id),
    license_plate   VARCHAR(20),
    gps_tracker_id  VARCHAR(50),
    last_maintenance DATE,
    status          VARCHAR(20) DEFAULT 'available'
);

CREATE TABLE route (
    route_id       INT PRIMARY KEY,
    route_name     VARCHAR(100) NOT NULL,
    route_code     VARCHAR(20) NOT NULL,
    origin_site_id INT NOT NULL REFERENCES site(site_id),
    dest_site_id   INT NOT NULL REFERENCES site(site_id),
    distance_km    DECIMAL(8,1),
    est_duration_hrs DECIMAL(5,1),
    is_cold_chain  BOOLEAN DEFAULT FALSE
);

CREATE TABLE route_waypoint (
    waypoint_id    INT PRIMARY KEY,
    route_id       INT NOT NULL REFERENCES route(route_id),
    sequence_order INT NOT NULL,
    site_id        INT REFERENCES site(site_id),
    waypoint_name  VARCHAR(100),
    latitude       DECIMAL(9,6),
    longitude      DECIMAL(9,6),
    est_arrival_offset_hrs DECIMAL(5,1)
);

CREATE TABLE shipment (
    shipment_id    INT PRIMARY KEY,
    shipment_number VARCHAR(20) NOT NULL,
    po_id          INT REFERENCES purchase_order(po_id),
    supplier_id    INT REFERENCES supplier(supplier_id),
    carrier_id     INT NOT NULL REFERENCES carrier(carrier_id),
    vehicle_id     INT REFERENCES vehicle(vehicle_id),
    route_id       INT REFERENCES route(route_id),
    origin_site_id INT NOT NULL REFERENCES site(site_id),
    dest_site_id   INT NOT NULL REFERENCES site(site_id),
    ship_date      TIMESTAMP,
    est_arrival    TIMESTAMP,
    actual_arrival TIMESTAMP,
    status         VARCHAR(20) DEFAULT 'planned',
    is_cold_chain  BOOLEAN DEFAULT FALSE
);

CREATE TABLE shipment_line (
    shipment_line_id INT PRIMARY KEY,
    shipment_id      INT NOT NULL REFERENCES shipment(shipment_id),
    material_id      INT NOT NULL REFERENCES material_master(material_id),
    quantity         DECIMAL(12,2) NOT NULL,
    uom_id           INT NOT NULL REFERENCES unit_of_measure(uom_id),
    po_line_id       INT REFERENCES purchase_order_line(po_line_id),
    lot_number       VARCHAR(50)
);

CREATE TABLE delivery (
    delivery_id     INT PRIMARY KEY,
    delivery_number VARCHAR(20) NOT NULL,
    shipment_id     INT REFERENCES shipment(shipment_id),
    site_id         INT NOT NULL REFERENCES site(site_id),
    delivery_date   TIMESTAMP NOT NULL,
    received_by     INT REFERENCES employee(employee_id),
    dock_id         INT REFERENCES loading_dock(dock_id),
    status          VARCHAR(20) DEFAULT 'scheduled'
);

CREATE TABLE delivery_line (
    delivery_line_id INT PRIMARY KEY,
    delivery_id      INT NOT NULL REFERENCES delivery(delivery_id),
    material_id      INT NOT NULL REFERENCES material_master(material_id),
    expected_qty     DECIMAL(12,2),
    received_qty     DECIMAL(12,2),
    uom_id           INT NOT NULL REFERENCES unit_of_measure(uom_id),
    condition        VARCHAR(20) DEFAULT 'good'
);

CREATE TABLE loading_dock (
    dock_id     INT PRIMARY KEY,
    site_id     INT NOT NULL REFERENCES site(site_id),
    dock_code   VARCHAR(10) NOT NULL,
    dock_type   VARCHAR(20), -- inbound, outbound, both
    is_refrigerated BOOLEAN DEFAULT FALSE,
    status      VARCHAR(20) DEFAULT 'available'
);

CREATE TABLE temperature_reading (
    reading_id    INT PRIMARY KEY,
    vehicle_id    INT REFERENCES vehicle(vehicle_id),
    shipment_id   INT REFERENCES shipment(shipment_id),
    warehouse_id  INT REFERENCES warehouse(warehouse_id),
    sensor_id     VARCHAR(30) NOT NULL,
    temperature   DECIMAL(4,1) NOT NULL,
    humidity      DECIMAL(4,1),
    reading_time  TIMESTAMP NOT NULL,
    latitude      DECIMAL(9,6),
    longitude     DECIMAL(9,6),
    is_excursion  BOOLEAN DEFAULT FALSE
);

CREATE TABLE tracking_event (
    event_id      INT PRIMARY KEY,
    shipment_id   INT NOT NULL REFERENCES shipment(shipment_id),
    event_type    VARCHAR(30), -- departed, in_transit, arrived, customs, delayed
    event_time    TIMESTAMP NOT NULL,
    location_name VARCHAR(100),
    latitude      DECIMAL(9,6),
    longitude     DECIMAL(9,6),
    notes         VARCHAR(200)
);

CREATE TABLE freight_cost (
    cost_id      INT PRIMARY KEY,
    shipment_id  INT NOT NULL REFERENCES shipment(shipment_id),
    carrier_id   INT NOT NULL REFERENCES carrier(carrier_id),
    cost_type    VARCHAR(30), -- base, fuel_surcharge, customs, insurance, handling
    amount       DECIMAL(12,2) NOT NULL,
    currency_id  INT REFERENCES currency(currency_id),
    invoice_ref  VARCHAR(50)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN 9: ALERTS & MONITORING
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE alert_rule (
    rule_id        INT PRIMARY KEY,
    rule_name      VARCHAR(100) NOT NULL,
    rule_code      VARCHAR(20) NOT NULL,
    domain         VARCHAR(30) NOT NULL, -- inventory, supplier, cold_chain, production, quality
    condition_type VARCHAR(30), -- threshold, trend, anomaly, schedule
    metric         VARCHAR(50),
    operator       VARCHAR(10), -- gt, lt, eq, gte, lte
    threshold_value DECIMAL(12,4),
    severity       VARCHAR(20) NOT NULL, -- info, warning, critical
    is_active      BOOLEAN DEFAULT TRUE,
    created_by     INT REFERENCES employee(employee_id)
);

CREATE TABLE alert (
    alert_id       INT PRIMARY KEY,
    rule_id        INT NOT NULL REFERENCES alert_rule(rule_id),
    alert_time     TIMESTAMP NOT NULL,
    severity       VARCHAR(20) NOT NULL,
    title          VARCHAR(200) NOT NULL,
    message        TEXT NOT NULL,
    domain         VARCHAR(30) NOT NULL,
    reference_type VARCHAR(30),
    reference_id   INT,
    site_id        INT REFERENCES site(site_id),
    current_value  DECIMAL(12,4),
    threshold_value DECIMAL(12,4),
    status         VARCHAR(20) DEFAULT 'open'
);

CREATE TABLE alert_acknowledgment (
    ack_id         INT PRIMARY KEY,
    alert_id       INT NOT NULL REFERENCES alert(alert_id),
    acknowledged_by INT NOT NULL REFERENCES employee(employee_id),
    ack_time       TIMESTAMP NOT NULL,
    action_taken   TEXT,
    resolution     TEXT,
    resolved_time  TIMESTAMP
);

CREATE TABLE alert_escalation (
    escalation_id  INT PRIMARY KEY,
    alert_id       INT NOT NULL REFERENCES alert(alert_id),
    escalation_level INT NOT NULL,
    escalated_to   INT NOT NULL REFERENCES employee(employee_id),
    escalated_time TIMESTAMP NOT NULL,
    reason         VARCHAR(200)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- DOMAIN 10: KPIs, ANALYTICS & DEMAND
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE kpi_definition (
    kpi_id        INT PRIMARY KEY,
    kpi_name      VARCHAR(100) NOT NULL,
    kpi_code      VARCHAR(20) NOT NULL,
    domain        VARCHAR(30), -- supply_chain, production, quality, logistics
    description   TEXT,
    uom_id        INT REFERENCES unit_of_measure(uom_id),
    aggregation   VARCHAR(20), -- avg, sum, min, max, count
    direction     VARCHAR(10) -- higher_better, lower_better
);

CREATE TABLE kpi_target (
    target_id     INT PRIMARY KEY,
    kpi_id        INT NOT NULL REFERENCES kpi_definition(kpi_id),
    site_id       INT REFERENCES site(site_id),
    period_id     INT NOT NULL REFERENCES fiscal_period(period_id),
    target_value  DECIMAL(12,4) NOT NULL,
    stretch_value DECIMAL(12,4),
    floor_value   DECIMAL(12,4)
);

CREATE TABLE kpi_measurement (
    measurement_id INT PRIMARY KEY,
    kpi_id         INT NOT NULL REFERENCES kpi_definition(kpi_id),
    site_id        INT REFERENCES site(site_id),
    measured_date  DATE NOT NULL,
    measured_value DECIMAL(12,4) NOT NULL,
    period_id      INT REFERENCES fiscal_period(period_id)
);

CREATE TABLE dashboard_config (
    config_id     INT PRIMARY KEY,
    dashboard_name VARCHAR(100) NOT NULL,
    owner_id      INT NOT NULL REFERENCES employee(employee_id),
    layout_json   TEXT,
    is_default    BOOLEAN DEFAULT FALSE,
    created_date  TIMESTAMP NOT NULL,
    modified_date TIMESTAMP
);

CREATE TABLE customer (
    customer_id    INT PRIMARY KEY,
    customer_name  VARCHAR(200) NOT NULL,
    customer_code  VARCHAR(20) NOT NULL,
    customer_type  VARCHAR(30), -- retailer, distributor, wholesaler, direct
    country_id     INT NOT NULL REFERENCES country(country_id),
    region_id      INT REFERENCES region(region_id),
    credit_limit   DECIMAL(15,2),
    payment_terms  VARCHAR(30),
    status         VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE sales_order (
    order_id       INT PRIMARY KEY,
    order_number   VARCHAR(20) NOT NULL,
    customer_id    INT NOT NULL REFERENCES customer(customer_id),
    order_date     TIMESTAMP NOT NULL,
    requested_date DATE,
    ship_to_site   INT REFERENCES site(site_id),
    total_amount   DECIMAL(15,2),
    currency_id    INT REFERENCES currency(currency_id),
    priority       VARCHAR(10),
    status         VARCHAR(20) DEFAULT 'confirmed'
);

CREATE TABLE sales_order_line (
    order_line_id INT PRIMARY KEY,
    order_id      INT NOT NULL REFERENCES sales_order(order_id),
    product_id    INT NOT NULL REFERENCES product(product_id),
    variant_id    INT REFERENCES product_variant(variant_id),
    quantity      DECIMAL(12,2) NOT NULL,
    uom_id        INT NOT NULL REFERENCES unit_of_measure(uom_id),
    unit_price    DECIMAL(12,4),
    line_total    DECIMAL(15,2),
    line_number   INT NOT NULL
);

CREATE TABLE demand_forecast (
    forecast_id    INT PRIMARY KEY,
    forecast_name  VARCHAR(100) NOT NULL,
    period_id      INT NOT NULL REFERENCES fiscal_period(period_id),
    created_by     INT REFERENCES employee(employee_id),
    created_date   TIMESTAMP NOT NULL,
    forecast_type  VARCHAR(30), -- statistical, consensus, manual
    status         VARCHAR(20) DEFAULT 'draft'
);

CREATE TABLE forecast_line (
    forecast_line_id INT PRIMARY KEY,
    forecast_id      INT NOT NULL REFERENCES demand_forecast(forecast_id),
    product_id       INT NOT NULL REFERENCES product(product_id),
    site_id          INT REFERENCES site(site_id),
    region_id        INT REFERENCES region(region_id),
    forecast_qty     DECIMAL(12,2) NOT NULL,
    uom_id           INT NOT NULL REFERENCES unit_of_measure(uom_id),
    confidence       DECIMAL(5,2)
);
