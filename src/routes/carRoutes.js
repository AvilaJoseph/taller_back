const express = require('express')
const router = express.Router()
const { getVehicles, getVehiclesId, createVechicle, updatedVehicle, deleteVehicle } = require('../controllers/carController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, getVehicles)
router.get('/:id_vehicles', authMiddleware, getVehiclesId)
router.post('/', authMiddleware, createVechicle)
router.put('/:id_vehicles', authMiddleware, updatedVehicle)
router.delete('/:id_vehicles', authMiddleware, deleteVehicle)

module.exports = router