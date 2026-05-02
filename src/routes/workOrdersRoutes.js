const express = require('express')
const router = express.Router()
const { 
    getWorkOrders, 
    getWorkOrderById, 
    createWorkOrder, 
    updateWorkOrder, 
    deleteWorkOrder 
} = require('../controllers/works_ordersController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, getWorkOrders)
router.get('/:id', authMiddleware, getWorkOrderById)
router.post('/', authMiddleware, createWorkOrder)
router.put('/:id', authMiddleware, updateWorkOrder)
router.delete('/:id', authMiddleware, deleteWorkOrder)

module.exports = router