const pool = require('../config/db')

async function getClients(req, res) {
    try {
        const result = await pool.query(
            `SELECT 
            id_clients, 
            first_name,
            last_name,
            document,
            email
        FROM clients`
        )
        res.json(result.rows)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

async function getClientId(req, res) {
    const { id_clients } = req.params
    try {
        const result = await pool.query(
            `SELECT
                id_clients, 
                first_name,
                last_name,
                type_document,
                document,
                email
            FROM clients
            WHERE id_clients = $1
            `, [id_clients]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' })
        }
        res.json(result.rows[0])
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

async function createClient(req, res) {
    const { first_name, last_name, type_document, document, email, phone, address } = req.body
    try {
        const existe = await pool.query(
            `SELECT 
                id_clients
            FROM clients
            WHERE document = $1`,
            [document]
        )
        if (existe.rows.length > 0) {
            return res.status(409).json({ error: 'Cliente ya registrado' })
        }

        const result = await pool.query(
            `INSERT INTO clients
            (first_name, last_name, type_document, document, email, phone, address)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
            [first_name, last_name, type_document, document, email, phone, address]
        )

        res.status(201).json({
            message: 'Cliente creado',
            client: result.rows[0]  
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

async function updateClient(req, res) {
    const { id_clients } = req.params
    const { first_name, last_name, type_document, document, email, phone, address } = req.body
    try {
        const fields = { first_name, last_name, type_document, document, email, phone, address }

        const update = Object.entries(fields).filter(([_, value]) => value !== undefined)
        if (update.length === 0) {
            return res.status(400).json({ error: "Debe proporcionar al menos un campo para actualizar" });
        }

        const setClause = update.map(([key, _], index) => `${key} = $${index + 1}`).join(', ')
        const values = update.map(([_, value]) => value)
        values.push(id_clients)

        const query = `
            UPDATE clients
            SET ${setClause},
                updated_at = NOW()
            WHERE id_clients = $${values.length}
            RETURNING *`

        const result = await pool.query(query, values)

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' })
        }

        res.json({
            message: 'Cliente actualizado',
            client: result.rows[0]
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

async function deleteClient(req, res) {
    const { id_clients } = req.params
    try {
        const result = await pool.query(
            `DELETE FROM clients WHERE id_clients = $1 RETURNING *`,
            [id_clients]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' })
        }
        res.json({
            message: 'Cliente eliminado'
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ error: 'Error en el servidor' })
    }
}

module.exports = { getClients, getClientId, createClient, updateClient, deleteClient }