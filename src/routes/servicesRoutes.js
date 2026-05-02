const express = require('express')
const router = express.Router()
const { getServices, getServicesId, createServices, updatedServices, deleteServices } = require('../controllers/servicesController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, getServices)
router.get('/:id', authMiddleware, getServicesId)
router.post('/', authMiddleware, createServices)
router.put('/:id', authMiddleware, updatedServices)
router.delete('/:id', authMiddleware, deleteServices)

module.exports = router