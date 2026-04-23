const pool = require('../config/db')

async function getServices(req, res) {
    try {
        const result = await pool.query(
            `SELECT
                id_services,
                name_services,
                description_services,
                price,
                is_active
            FROM services
            WHERE is_active = TRUE`,
        )
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'No se encontraron servicios' })
        }
        res.json(result.rows)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function getServicesId(req, res) {
    const { id_services } = req.params
    try {
        const result = await pool.query(
            `SELECT *
            FROM services
            WHERE is_active = TRUE`,
        )
        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Servicio no encontrado' })
        }
        res.json(result.rows[0])
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function createServices(req, res) {
    const { id_services, name_services, description_services, price } = req.body
    if (!id_services || !name_services || !description_services || !price) {
        return res.status(400).json({ error: '' })
    }
    try {
        const existe = await pool.query(
            `SELECT id_services FROM services WHERE is_active = TRUE AND id_services = $1`,
            [id_services]
        )
        if (existe.rows.length > 0) {
            return res.status(404).json({ message: 'Servicio ya creado' })
        }
        const result = await pool.query(
            `INSERT INTO services
                (name_services, description_services, price, is_active, created_at)
            VALUES ($1, $2, $3, $4, NOW())
            RETURNING *`,
            [name_services, description_services, price, true]
        )
        res.status(201).json({
            message: 'Servicio creado',
            servicio: result.rows[0]
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function updateServices(req, res) {
    const { id_services } = req.params
    const { name_services, description_services, price } = req.body
    if (!id_services) {
        return res.status(400).json({ message: 'Es necesario el identificador' });
    }

    if (!name_services || !description_services || !price) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }
    try {

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}