require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

const authRoutes = require('./routes/authRoutes')
const employeesRoutes = require('./routes/employeesRoutes')
const vehicleRoutes = require('./routes/carRoutes')
const clientRoutes = require('./routes/clientRoutes')
const servicesRoutes = require('./routes/servicesRoutes')
const partsRoutes = require('./routes/partsRoutes')
const workOrdersRoutes = require('./routes/workOrdersRoutes')
const workOrderServicesRoutes = require('./routes/workOrderServicesRoutes')
const workOrderPartsRoutes = require('./routes/workOrderPartsRoutes')
const invoiceRoutes = require('./routes/invoiceRoutes')

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
app.use('/api/clients', clientRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/parts', partsRoutes)

app.use('/api/work-orders', workOrdersRoutes)
app.use('/api/work-order-services', workOrderServicesRoutes)
app.use('/api/work-order-parts', workOrderPartsRoutes)
app.use('/api/invoices', invoiceRoutes)

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

module.exports = app