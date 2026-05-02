const express = require('express')
const router = express.Router()
const { 
    getWorksOrdersServices, 
    getWorksOrdersServicesId, 
    createWorkOrderServices, 
    updatedWorkOrderServices, 
    deleteWorkOrderServices 
} = require('../controllers/works_orders_servicesController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, getWorksOrdersServices)
router.get('/:id', authMiddleware, getWorksOrdersServicesId)
router.post('/', authMiddleware, createWorkOrderServices)
router.put('/:id', authMiddleware, updatedWorkOrderServices)
router.delete('/:id', authMiddleware, deleteWorkOrderServices)

module.exports = router