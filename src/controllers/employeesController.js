const pool = require('../config/db')

async function getEmployees(req, res) {
    try {
        const result = await pool.query(
            `SELECT
                id_employees,
                first_name,
                last_name,
                type_document,
                document,
                email,
                phone
            FROM employees
            WHERE is_active = TRUE
            `)
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No se encontraron empleados' })
        }
        res.json(result.rows)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function getEmployeesId(req, res) {
    const { id_employees } = req.params
    try {
        const result = await pool.query(
            `SELECT *
            FROM employees
            WHERE id_employees = $1`,
            [id_employees]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Empleado no encontrado' })
        }
        res.json(result.rows[0])
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function updateEmployees(req, res) {
    const { first_name, last_name, type_document, document, email, phone, address, is_active } = req.body
    const { id_employees } = req.params
    try {
        const fields = {
            first_name,
            last_name,
            type_document,
            document,
            email,
            phone,
            address,
            is_active
        }
        const update = Object.entries(fields).filter(([_, value]) => value !== undefined)
        if (update.rows.length === 0) {
            return res.status(404).json({ error: "Debe proporcionar al menos un campo para actualizar" });
        }

        const setClause = update.map(([key, _], index) => `${key} = $${index + 1}`).join(', ')
        const values = update.map(([_, value]) => value)
        values.push(id_employees)

        const query = `
            UPDATE employees
            SET ${setClause},
                updated_at = NOW()
            WHERE id_employees = $${values.length}
        `
        const result = await pool.query(query, values)
        if (result.length === 0) {
            return res.status(404).json({ error: 'Empleado no encontrado' })
        }
        res.json({ message: 'Empleado actualizado', employee: result.rows[0] })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function reactivateEmployee(req, res) {
    const { id_employees } = req.params
    try {
        const result = await pool.query(
            `UPDATE employees
            SET is_active = TRUE,
                updated_at = NOW()
            WHERE id_employees = $1
            RETURNING *`,
            [id_employees]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró empleado' })
        }
        res.json({ message: 'Empleado reactivado' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error en el servidor' })
    }
}

async function deleteEmployees(req, res) {
    const { id_employees } = req.params
    try {
        const result = await pool.query(
            `UPDATE employees
            SET is_active = FALSE,
                updated_at = NOW()
            WHERE id_employees = $1
            RETURNING *`,
            [id_employees]
        )
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No se encontró empleado' })
        }
        res.json({ message: 'Empleado desactivado' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error en el servidor' })
    }
}

module.exports = { getEmployees, getEmployeesId, updateEmployees, reactivateEmployee, deleteEmployees }