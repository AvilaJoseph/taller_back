require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser  = require('cookie-parser')
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");


const authRoutes = require('./routes/authRoutes')
const employeesRoutes = require('./routes/employeesRoutes')
const vehicleRoutes = require('./routes/carRoutes')

const app = express()

app.use(cors({
    origin: '*',
    credentials: false
}))

app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/vehicle', vehicleRoutes)
app.use('/api/employees', employeesRoutes)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app