const pool = require('../config/db')

async function getParts(req, res) {
    try {
        const result = await pool.query(
            `SELECT
                name_parts,
                description_parts,
                stock,
                purchase_price,
                sale_price
            FROM parts
            WHERE is_active = TRUE`,
        )
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'No se encontraron registros' })
        }
        res.json(result.rows)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function getPartId(req, res) {
    const { id_parts } = req.params
    try {
        if (!id_parts) {
            res.status(400).json({ message: 'Parametro incorrecto' })
        }
        const result = await pool.query(
            `SELECT
                id_parts,
                name_parts,
                description_parts,
                stock,
                purchase_price,
                sale_price,
                is_active
            FROM parts
            WHERE is_active = TRUE`,
        )
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Parte no encontrada' })
        }
        res.status(200).json(result.rows[0])
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function createParts(req, res) {
    const { name_parts, description_parts, stock, purchase_price, sale_price } = req.body
    try {
        if (!name_parts || !description_parts || !stock || !purchase_price || !sale_price) {
            res.status(400).json({ message: 'Campos obligatorios' })
        }
        const existe = await pool.query(
            `SELECT id_parts
            FROM parts
            WHERE name_parts = $1 AND is_active = TRUE`,
        )
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function updatePart(req, res) {
    const { id_parts } = req.params
    const { name_parts, description_parts, stock, purchase_price, sale_price } = req.body
    if (!id_parts) {
        res.status(400).json({ message: 'Parametro incorrecto' })
    }
    if (!name_parts || description_parts || stock || purchase_price || sale_price) {
        res.status(400).json({ message: 'Campos obligatorios' })
    }
    try {
        const fields = {
            name_parts,
            description_parts,
            stock,
            purchase_price,
            sale_price
        }
        const update = Object.entries(fields).filter(([_, value]) => value !== undefined)
        if (update.length === 0) {
            res.status(400).json({ error: "Debe proporcionar al menos un campo para actualizar" })
        }
        const setClause = update.map(([key, _], index) => `${key} = $${index + 1}`).join(', ')
        const values = update.map(([_, value]) => value)
        values.push(id_parts)

        const query = `
            UPDATE parts
            SET ${setClause},
                updated_at = NOW()
            WHERE id_parts = $${values.length}`
        const result = await pool.query(query, values)
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Servicio no encontrado' })
        }
        res.json({
            message: 'Parte actualizada',
            part: result.rows[0]
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

module.exports = { getParts, getPartId, createParts, updatePart }