const { Pool } = require('pg')

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
})

const connectDB = async () => {
    try{
        const client = await pool.connect()
        console.log('Conectando a PostgreSQL')
        client.release()
    } catch (error){
        console.log('Error al conectar:', error.message)
        process.exit(1)
    }
}

connectDB()
module.exports = pool