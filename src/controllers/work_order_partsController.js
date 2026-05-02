const pool = require('../config/db')

async function getWorkOrderParts(req, res) {
    try {
        const result = await pool.query('SELECT * FROM work_order_parts');
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No hay repuestos registrados en órdenes' });
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
}

async function createWorkOrderParts(req, res) {
    const client = await pool.connect();
    try {
        const { work_orders_id, parts_id, quantity } = req.body;
        await client.query('BEGIN');

        const partData = await client.query('SELECT price FROM parts WHERE id_parts = $1', [parts_id]);
        if (partData.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'El repuesto no existe' });
        }

        const unitPrice = parseFloat(partData.rows[0].price);
        const subtotal = unitPrice * quantity;

        const insertResult = await client.query(
            `INSERT INTO work_order_parts (work_orders_id, parts_id, quantity, unit_price, subtotal)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [work_orders_id, parts_id, quantity, unitPrice, subtotal]
        );

        await client.query(
            'UPDATE work_orders SET total_cost = total_cost + $1 WHERE id_work_orders = $2',
            [subtotal, work_orders_id]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Repuesto agregado correctamente', data: insertResult.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: 'Error al procesar la solicitud' });
    } finally {
        client.release();
    }
}

async function updatedWorkOrderParts(req, res) {
    const { id } = req.params;
    const { quantity } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const current = await client.query(
            'SELECT work_orders_id, unit_price, subtotal FROM work_order_parts WHERE id_work_order_parts = $1',
            [id]
        );

        if (current.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        const { work_orders_id, unit_price, subtotal: oldSubtotal } = current.rows[0];
        const newSubtotal = unit_price * quantity;
        const difference = newSubtotal - oldSubtotal;

        const result = await client.query(
            `UPDATE work_order_parts SET quantity = $1, subtotal = $2 WHERE id_work_order_parts = $3 RETURNING *`,
            [quantity, newSubtotal, id]
        );

        await client.query(
            'UPDATE work_orders SET total_cost = total_cost + $1 WHERE id_work_orders = $2',
            [difference, work_orders_id]
        );

        await client.query('COMMIT');
        res.status(200).json({ message: 'Cantidad actualizada', data: result.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Error interno' });
    } finally {
        client.release();
    }
}

async function deleteWorkOrderParts(req, res) {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const data = await client.query(
            'SELECT work_orders_id, subtotal FROM work_order_parts WHERE id_work_order_parts = $1',
            [id]
        );

        if (data.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        await client.query(
            'UPDATE work_orders SET total_cost = total_cost - $1 WHERE id_work_orders = $2',
            [data.rows[0].subtotal, data.rows[0].work_orders_id]
        );

        await client.query('DELETE FROM work_order_parts WHERE id_work_order_parts = $1', [id]);
        await client.query('COMMIT');
        res.status(200).json({ message: 'Repuesto eliminado de la orden' });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Error al eliminar' });
    } finally {
        client.release();
    }
}

module.exports = { getWorkOrderParts, createWorkOrderParts, updatedWorkOrderParts, deleteWorkOrderParts };