-- =============================================================
--  TALLER MECÁNICO — Esquema PostgreSQL
--  Mejoras aplicadas:
--    · Tipos nativos de PG (SERIAL, NUMERIC, TEXT, TIMESTAMPTZ)
--    · Corrección de typos (first_name, description_parts, etc.)
--    · Claves primarias, foráneas y restricciones CHECK
--    · Columna employee_id en users para enlazar con empleados
--    · Timestamps en todas las tablas
--    · Índices en FK, búsquedas frecuentes y columnas de filtrado
--    · Valores por defecto sensatos (created_at, updated_at, status)
-- =============================================================


-- -------------------------------------------------------------
-- EXTENSIÓN útil para UUIDs si en el futuro migras a UUID PKs
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- -------------------------------------------------------------


-- =============================================================
--  1. EMPLOYEES  (primero porque users la referencia)
-- =============================================================
CREATE TABLE employees (
    id_employees    SERIAL          PRIMARY KEY,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    type_document   SMALLINT        NOT NULL
                        CHECK (type_document IN (1, 2, 3)),
                        -- 1=CC, 2=CE, 3=Pasaporte
    document        VARCHAR(20)     NOT NULL UNIQUE,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    phone           VARCHAR(20),
    address         TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
--  2. USERS
-- =============================================================
CREATE TABLE users (
    id_users        SERIAL          PRIMARY KEY,
    employee_id     INT             REFERENCES employees (id_employees)
                                        ON DELETE SET NULL,
                        -- NULL = usuario admin sin empleado asociado
    email           VARCHAR(150)    NOT NULL UNIQUE,
    password        VARCHAR(100)    NOT NULL,  -- almacena el hash (bcrypt, argon2)
    role            SMALLINT        NOT NULL DEFAULT 2
                        CHECK (role IN (1, 2, 3)),
                        -- 1=admin, 2=mecánico, 3=recepcionista
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
--  3. CLIENTS
-- =============================================================
CREATE TABLE clients (
    id_clients      SERIAL          PRIMARY KEY,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    type_document   SMALLINT        NOT NULL
                        CHECK (type_document IN (1, 2, 3)),
    document        VARCHAR(20)     NOT NULL UNIQUE,
    email           VARCHAR(150)    UNIQUE,
    phone           VARCHAR(20),
    address         TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
--  4. VEHICLES
-- =============================================================
CREATE TABLE vehicles (
    id_vehicles     SERIAL          PRIMARY KEY,
    client_id       INT             NOT NULL
                        REFERENCES clients (id_clients)
                        ON DELETE RESTRICT,
    mark            VARCHAR(100)    NOT NULL,
    model           VARCHAR(100)    NOT NULL,
    year            SMALLINT        NOT NULL
                        CHECK (year BETWEEN 1900 AND 2100),
    license_plate   VARCHAR(20)     NOT NULL UNIQUE,
    color           VARCHAR(50),
    mileage         INT             NOT NULL DEFAULT 0
                        CHECK (mileage >= 0),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
--  5. SERVICES  (catálogo)
-- =============================================================
CREATE TABLE services (
    id_services         SERIAL          PRIMARY KEY,
    name_services       VARCHAR(150)    NOT NULL UNIQUE,
    description_services TEXT,
    price               NUMERIC(10, 2)  NOT NULL
                            CHECK (price >= 0),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
--  6. PARTS  (catálogo de repuestos)
-- =============================================================
CREATE TABLE parts (
    id_parts            SERIAL          PRIMARY KEY,
    name_parts          VARCHAR(150)    NOT NULL UNIQUE,
    description_parts   TEXT,
    stock               INT             NOT NULL DEFAULT 0
                            CHECK (stock >= 0),
    purchase_price      NUMERIC(10, 2)  NOT NULL
                            CHECK (purchase_price >= 0),
    sale_price          NUMERIC(10, 2)  NOT NULL
                            CHECK (sale_price >= 0),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
--  7. WORK_ORDERS
-- =============================================================
CREATE TABLE work_orders (
    id_work_orders  SERIAL          PRIMARY KEY,
    vehicle_id      INT             NOT NULL
                        REFERENCES vehicles (id_vehicles)
                        ON DELETE RESTRICT,
    employee_id     INT             NOT NULL
                        REFERENCES employees (id_employees)
                        ON DELETE RESTRICT,
    status          VARCHAR(30)     NOT NULL DEFAULT 'pending'
                        CHECK (status IN (
                            'pending',      -- recibido, sin comenzar
                            'in_progress',  -- en taller
                            'waiting_parts',-- esperando repuestos
                            'completed',    -- trabajo terminado
                            'delivered',    -- entregado al cliente
                            'cancelled'
                        )),
    description     TEXT,           -- descripción del problema reportado
    diagnosis       TEXT,           -- diagnóstico técnico
    start_date      TIMESTAMPTZ,
    end_date        TIMESTAMPTZ,
    total_cost      NUMERIC(10, 2)  DEFAULT 0
                        CHECK (total_cost >= 0),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_dates CHECK (
        end_date IS NULL OR end_date >= start_date
    )
);


-- =============================================================
--  8. WORK_ORDER_SERVICES  (tabla pivote)
-- =============================================================
CREATE TABLE work_order_services (
    id_work_order_services  SERIAL          PRIMARY KEY,
    work_orders_id          INT             NOT NULL
                                REFERENCES work_orders (id_work_orders)
                                ON DELETE CASCADE,
    services_id             INT             NOT NULL
                                REFERENCES services (id_services)
                                ON DELETE RESTRICT,
    quantity                INT             NOT NULL DEFAULT 1
                                CHECK (quantity > 0),
    unit_price              NUMERIC(10, 2)  NOT NULL
                                CHECK (unit_price >= 0),
    subtotal                NUMERIC(10, 2)  NOT NULL
                                CHECK (subtotal >= 0),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    UNIQUE (work_orders_id, services_id)   -- evita duplicar el mismo servicio en una orden
);


-- =============================================================
--  9. WORK_ORDER_PARTS  (tabla pivote)
-- =============================================================
CREATE TABLE work_order_parts (
    id_work_order_parts SERIAL          PRIMARY KEY,
    work_orders_id      INT             NOT NULL
                            REFERENCES work_orders (id_work_orders)
                            ON DELETE CASCADE,
    parts_id            INT             NOT NULL
                            REFERENCES parts (id_parts)
                            ON DELETE RESTRICT,
    quantity            INT             NOT NULL DEFAULT 1
                            CHECK (quantity > 0),
    unit_price          NUMERIC(10, 2)  NOT NULL
                            CHECK (unit_price >= 0),
    subtotal            NUMERIC(10, 2)  NOT NULL
                            CHECK (subtotal >= 0),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
--  10. INVOICES
-- =============================================================
CREATE TABLE invoices (
    id_invoices     SERIAL          PRIMARY KEY,
    work_order_id   INT             NOT NULL UNIQUE
                        REFERENCES work_orders (id_work_orders)
                        ON DELETE RESTRICT,
    invoice_number  VARCHAR(50)     NOT NULL UNIQUE,
    subtotal        NUMERIC(10, 2)  NOT NULL
                        CHECK (subtotal >= 0),
    tax             NUMERIC(10, 2)  NOT NULL DEFAULT 0
                        CHECK (tax >= 0),
    total           NUMERIC(10, 2)  NOT NULL
                        CHECK (total >= 0),
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'paid', 'cancelled', 'void')),
    issued_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);


-- =============================================================
--  ÍNDICES
--  Regla: índice en toda FK + columnas de filtrado frecuente
-- =============================================================

-- users
CREATE INDEX idx_users_employee_id     ON users (employee_id);

-- vehicles
CREATE INDEX idx_vehicles_client_id    ON vehicles (client_id);
CREATE INDEX idx_vehicles_plate        ON vehicles (license_plate);

-- work_orders  (tabla más consultada del sistema)
CREATE INDEX idx_wo_vehicle_id         ON work_orders (vehicle_id);
CREATE INDEX idx_wo_employee_id        ON work_orders (employee_id);
CREATE INDEX idx_wo_status             ON work_orders (status);
CREATE INDEX idx_wo_created_at         ON work_orders (created_at DESC);

-- work_order_services
CREATE INDEX idx_wos_work_order        ON work_order_services (work_orders_id);
CREATE INDEX idx_wos_service           ON work_order_services (services_id);

-- work_order_parts
CREATE INDEX idx_wop_work_order        ON work_order_parts (work_orders_id);
CREATE INDEX idx_wop_part              ON work_order_parts (parts_id);

-- invoices
CREATE INDEX idx_invoices_work_order   ON invoices (work_order_id);
CREATE INDEX idx_invoices_status       ON invoices (status);
CREATE INDEX idx_invoices_number       ON invoices (invoice_number);

-- búsquedas por nombre de cliente/empleado (trigram si activas pg_trgm)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX idx_clients_name  ON clients  USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
-- CREATE INDEX idx_employees_name ON employees USING gin ((first_name || ' ' || last_name) gin_trgm_ops);


-- =============================================================
--  FUNCIÓN + TRIGGER para auto-actualizar updated_at
-- =============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_parts_updated_at
    BEFORE UPDATE ON parts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================
--  VISTA útil: órdenes activas con cliente y vehículo
-- =============================================================
CREATE VIEW v_active_work_orders AS
SELECT
    wo.id_work_orders,
    wo.status,
    wo.created_at,
    c.first_name || ' ' || c.last_name  AS client_name,
    c.phone                              AS client_phone,
    v.mark || ' ' || v.model            AS vehicle,
    v.license_plate,
    e.first_name || ' ' || e.last_name  AS mechanic_name,
    wo.total_cost
FROM work_orders wo
JOIN vehicles  v ON v.id_vehicles  = wo.vehicle_id
JOIN clients   c ON c.id_clients   = v.client_id
JOIN employees e ON e.id_employees = wo.employee_id
WHERE wo.status NOT IN ('delivered', 'cancelled');
