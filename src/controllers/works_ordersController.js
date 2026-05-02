const pool = require('../config/db')

async function getWorkOrders(req, res) {
    try {
        const result = await pool.query(
            `SELECT
                id_work_orders,
                vehicle_id,
                status,
                description,
                diagnosis,
                total_cost
            FROM work_orders`
        )
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'No se encontraron ordenes' })
        }
        res.status(200).json({
            message: 'Ordenes encontradas',
            WorkOrders: result.rows
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function getWorkOrderId(req, res) {
    const { id_work_orders } = req.params;

    try {
        const query = `
            SELECT 
                wo.*,
                (SELECT json_agg(s) FROM (
                    SELECT wos.*, ser.name as service_name 
                    FROM work_order_services wos
                    JOIN services ser ON wos.services_id = ser.id_services
                    WHERE wos.work_orders_id = wo.id_work_orders
                ) s) as services,
                (SELECT json_agg(p) FROM (
                    SELECT wop.*, par.name as part_name 
                    FROM work_order_parts wop
                    JOIN parts par ON wop.parts_id = par.id_parts
                    WHERE wop.work_orders_id = wo.id_work_orders
                ) p) as parts
            FROM work_orders wo
            WHERE wo.id_work_orders = $1;
        `;

        const result = await pool.query(query, [id_work_orders]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
}

async function createWorkOrder(req, res) {
    const client = await pool.connect();
    try {
        const { vehicle_id, employee_id, status, description, diagnosis, services } = req.body;

        if (!vehicle_id || !employee_id) {
            return res.status(400).json({ error: "Vehículo y empleado son obligatorios" });
        }

        await client.query('BEGIN');

        const queryResult = await client.query(
            `INSERT INTO work_orders 
                (vehicle_id, employee_id, status, description, diagnosis)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_work_orders`,
            [vehicle_id, employee_id, status || 'pending', description, diagnosis]
        );

        const OrderWorkId = queryResult.rows[0].id_work_orders;
        let totalCost = 0;

        if (services && Array.isArray(services) && services.length > 0) {
            
            const serviceIds = services.map(s => s.services_id);

            const serviceData = await client.query(
                `SELECT id_services, price FROM services WHERE id_services = ANY($1)`,
                [serviceIds]
            );

            const pricesMap = {};
            serviceData.rows.forEach(row => {
                pricesMap[row.id_services] = parseFloat(row.price);
            });

            for (const s of services) {
                const realPrice = pricesMap[s.services_id];
                
                if (realPrice !== undefined) {
                    const subtotal = s.quantity * realPrice;
                    totalCost += subtotal;

                    await client.query(
                        `INSERT INTO work_order_services (work_orders_id, services_id, quantity, unit_price, subtotal)
                        VALUES ($1, $2, $3, $4, $5)`,
                        [OrderWorkId, s.services_id, s.quantity, realPrice, subtotal]
                    );
                }
            }
        }

        await client.query(
            'UPDATE work_orders SET total_cost = $1 WHERE id_work_orders = $2', 
            [totalCost, OrderWorkId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Orden creada exitosamente',
            id: OrderWorkId,
            total: totalCost
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error detallado:", error);
        res.status(500).json({ error: "Error interno al crear la orden" });
    } finally {
        client.release();
    }
}

async function updatedWorkOrder(req, res) {
    const { id_work_orders } = req.params
    const { status, description, diagnosis } = req.body
    try {
        const existe = await pool.query(
            `SELECT id_work_orders 
            FROM work_orders
            WHERE id_work_orders = $1`,
            [id_work_orders]
        )
        if (existe.rows.length === 0) {
            res.status(404).json({ message: 'Orden no encontrada' })
        }
        const result = await pool.query(
            `UPDATE work_orders
            SET
                status = COALESCE($1, status),
                description = COALESCE($2, description),
                diagnosis = COALESCE($3, diagnosis)
            WHERE id_work_orders = $4
            RETURNING *`,
            [status, description, diagnosis, id_work_orders]
        )
        res.status(200).json({
            message: 'Orden actualizada',
            workOrder: result.rows[0]
        })
    } catch (error) {
        console.error("Error en updatedWorkOrder:", error)
        res.status(500).json({ message: 'Error interno del servidor' })
    }
}

module.exports = { getWorkOrders, getWorkOrderId, createWorkOrder, updatedWorkOrder}