const express = require('express')
const router = express.Router()
const { 
    getWorkOrderParts, 
    createWorkOrderParts, 
    updatedWorkOrderParts, 
    deleteWorkOrderParts 
} = require('../controllers/work_order_partsController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, getWorkOrderParts)
router.post('/', authMiddleware, createWorkOrderParts)
router.put('/:id', authMiddleware, updatedWorkOrderParts)
router.delete('/:id', authMiddleware, deleteWorkOrderParts)

module.exports = router