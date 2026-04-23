const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

async function register(req, res) {
    const { email, password, role, first_name, last_name, type_document, document, phone, address } = req.body

    if (!email || !password || !role || !first_name || !last_name || !type_document || !document) {
        return res.status(400).json({ error: 'Todos los campos son necesarios' })
    }

    if (![1, 2, 3].includes(Number(role))) {
        return res.status(400).json({ error: 'Rol inválido' })
    }

    if (![1, 2, 3].includes(Number(type_document))) {
        return res.status(400).json({ error: 'Tipo de documento inválido' })
    }

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        // 1. Verificar si el email ya existe
        const existe = await client.query(
            'SELECT id_users FROM users WHERE email = $1',
            [email]
        )
        if (existe.rows.length > 0) {
            await client.query('ROLLBACK')
            return res.status(409).json({ error: 'Email ya registrado' })
        }

        // 2. Insertar en employees primero
        const empleado = await client.query(
            `INSERT INTO employees (first_name, last_name, type_document, document, email, phone, address)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id_employees`,
            [first_name, last_name, Number(type_document), document, email, phone || null, address || null]
        )

        const employee_id = empleado.rows[0].id_employees
        const hash = await bcrypt.hash(password, 10)

        const result = await client.query(
            `INSERT INTO users (email, password, role, employee_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id_users, email, role, employee_id`,
            [email, hash, Number(role), employee_id]
        )

        await client.query('COMMIT')

        res.status(201).json({
            message: 'Usuario y empleado creados',
            user: result.rows[0]
        })

    } catch (error) {
        await client.query('ROLLBACK')
        console.log(error)
        res.status(500).json({ error: 'Error en el servidor' })
    } finally {
        client.release()
    }
}

async function login(req, res) {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ error: 'Todos los campos requeridos' })
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        const user = result.rows[0]

        const match = await bcrypt.compare(password, user.password)
        if (!match) {
            return res.status(401).json({ error: 'Credenciales inválidas' })
        }

        const token = jwt.sign(
            { id: user.id_users, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 2 * 60 * 60 * 1000
        })

        res.json({
            message: 'Login exitoso',
            user: {
                id: user.id_users,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {
        console.log('[login]', error)
        res.status(500).json({ error: 'Error en el servidor' })
    }
}

async function logout(req, res) {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    })
    res.json({ message: 'Sesión cerrada' })
}

module.exports = { register, login, logout }