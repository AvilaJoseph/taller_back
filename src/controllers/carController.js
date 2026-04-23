const pool = require('../config/db')

async function getVehicles(req, res) {
    try {
        const result = await pool.query(
            `SELECT 
                id_vehicles, 
                client_id, 
                mark, 
                model, 
                year, 
                license_plate, 
                color 
            FROM vehicles 
            ORDER BY created_at DESC`)
        res.json(result.rows)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

async function getVehiclesId(req, res) {
    const { id_vehicles } = req.params
    try {
        const result = await pool.query(
            `SELECT 
                v.id_vehicles, 
                v.client_id, 
                v.mark, 
                v.model, 
                v.license_plate, 
                v.color, 
                v.mileage 
            FROM vehicles v 
            INNER JOIN clients c 
                ON v.client_id = c.id_clients 
            WHERE v.id_vehicles = $1`,
            [id_vehicles]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: ' Vehículo no encontrado' })
        }
        res.json(result.rows[0])
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

async function createVechicle(req, res) {
    const { client_id, mark, model, year, license_plate, color, mileage } = req.body
    if (!client_id || !mark || !model || !year || !license_plate || !color || !mileage) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }

    try {
        const existe = await pool.query(
            `SELECT id_vehicles FROM vehicles WHERE license_plate = $1
            `, [license_plate]
        )
        if (existe.rows.length > 0) {
            return res.status(409).json({ error: 'Vehiculo ya registrado' })
        }
        const result = await pool.query(
            `INSERT INTO vehicles 
            (client_id, mark, model, year, license_plate, color, mileage)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [client_id, mark, model, year, license_plate, color, mileage]
        )
        res.status(201).json({
            message: 'Vehiculo creado',
            vehicle: result.rows[0]
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

async function updatedVehicle(req, res) {
    const { id_vehicles } = req.params;
    const { client_id, mark, model, year, license_plate, color, mileage } = req.body;

    try {
        const fields = {
            client_id,
            mark,
            model,
            year,
            license_plate,
            color,
            mileage
        };

        const updates = Object.entries(fields).filter(([_, value]) => value !== undefined);

        if (updates.length === 0) {
            return res.status(400).json({ error: "Debe proporcionar al menos un campo para actualizar" });
        }

        const setClause = updates
            .map(([key, _], index) => `${key} = $${index + 1}`)
            .join(", ");

        const values = updates.map(([_, value]) => value);

        values.push(id_vehicles);

        const query = `
            UPDATE vehicles
            SET ${setClause},
                updated_at = NOW()
            WHERE id_vehicles = $${values.length}
            RETURNING *;
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Vehículo no encontrado"
            });
        }

        res.json({
            message: "Vehículo actualizado correctamente",
            vehicle: result.rows[0]
        });

    } catch (error) {
        console.error("Error al actualizar el vehículo:", error);
        res.status(500).json({
            error: "Error interno del servidor"
        });
    }
}

async function deleteVehicle(req, res) {
    const { id_vehicles } = req.params

    try {
        const result = await pool.query(
            `DELETE FROM vehicles WHERE id_vehicles = $1 RETURNING *`,
            [id_vehicles]
        )

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' })
        }

        res.json({ message: 'Vehículo eliminado' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Error del servidor' })
    }
}

module.exports = { getVehicles, getVehiclesId, createVechicle, updatedVehicle, deleteVehicle }