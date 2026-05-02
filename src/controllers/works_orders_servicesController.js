const pool = require('../config/db')

async function getWorksOrdersServices(req, res) {
    try {
        const result = await pool.query(
            `SELECT
                id_work_order_services,
                work_orders_id,
                services_id,
                quantity,
                unit_price,
                subtotal
            FROM work_order_services`,
        )
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Ordenes de Servicio no encontradas' })
        }
        res.status(201).json({
            message: 'Ordenes de Servicio encontradas',
            WorkOrdersServices: result.rows
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error en el servidor', error })
    }
}

async function getWorksOrdersServicesId(req, res) {
    try {
        const { id_work_order_services } = req.params
        if (!id_work_order_services) {
            res.status(400).json({ message: 'No se encontro ID' })
        }

        const result = await pool.query(
            `SELECT
                id_work_order_services,
                work_orders_id,
                services_id,
                quantity,
                unit_price,
                subtotal
            WHERE work_order_services
            WHERE id_work_order_services = $1`,
            [id_work_order_services]
        )
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'No se encontro Orden de Servicio' })
        }
        res.status(201).json({
            message: 'Orden de Servicio encontrada',
            WorkOrderServices: result.rows[0]
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error en el servidor', error })
    }
}

async function createWorkOrderServices(req, res) {
    const client = await pool.connect();
    try {
        const { work_orders_id, services_id, quantity } = req.body;

        if (!work_orders_id || !services_id || !quantity) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        await client.query('BEGIN');

        const serviceResult = await client.query(
            'SELECT price FROM services WHERE id_services = $1',
            [services_id]
        );

        if (serviceResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'El servicio no existe' });
        }

        const unitPrice = parseFloat(serviceResult.rows[0].price);
        const subtotal = unitPrice * quantity;

        const insertResult = await client.query(
            `INSERT INTO work_order_services 
                (work_orders_id, services_id, quantity, unit_price, subtotal)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
            [work_orders_id, services_id, quantity, unitPrice, subtotal]
        );

        await client.query(
            `UPDATE work_orders 
             SET total_cost = total_cost + $1 
             WHERE id_work_orders = $2`,
            [subtotal, work_orders_id]
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Servicio agregado a la orden correctamente',
            data: insertResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en createWorkOrderServices:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    } finally {
        client.release();
    }
}

async function updatedWorkOrderServices(req, res) {
    const { id } = req.params;
    const { quantity } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const currentData = await client.query(
            'SELECT work_orders_id, unit_price, subtotal FROM work_order_services WHERE id_work_order_services = $1',
            [id]
        );

        if (currentData.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Servicio en la orden no encontrado' });
        }

        const { work_orders_id, unit_price, subtotal: oldSubtotal } = currentData.rows[0];
        const newSubtotal = unit_price * quantity;
        const difference = newSubtotal - oldSubtotal;

        const result = await client.query(
            `UPDATE work_order_services 
             SET quantity = $1, subtotal = $2 
             WHERE id_work_order_services = $3 
             RETURNING *`,
            [quantity, newSubtotal, id]
        );

        await client.query(
            'UPDATE work_orders SET total_cost = total_cost + $1 WHERE id_work_orders = $2',
            [difference, work_orders_id]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Servicio actualizado', data: result.rows[0] });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error interno' });
    } finally {
        client.release();
    }
}

async function deleteWorkOrderServices(req, res) {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const serviceInfo = await client.query(
            'SELECT work_orders_id, subtotal FROM work_order_services WHERE id_work_order_services = $1',
            [id]
        );

        if (serviceInfo.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        const { work_orders_id, subtotal } = serviceInfo.rows[0];

        await client.query(
            'UPDATE work_orders SET total_cost = total_cost - $1 WHERE id_work_orders = $2',
            [subtotal, work_orders_id]
        );

        await client.query('DELETE FROM work_order_services WHERE id_work_order_services = $1', [id]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Servicio eliminado y costo actualizado' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el servicio' });
    } finally {
        client.release();
    }
}

module.exports = { getWorksOrdersServices, getWorksOrdersServicesId, createWorkOrderServices, updatedWorkOrderServices}