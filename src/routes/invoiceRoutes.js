const express = require('express')
const router = express.Router()
const { createInvoice, getFullInvoice } = require('../controllers/invoiceController') 
const authMiddleware = require('../middleware/authMiddleware')

router.post('/', authMiddleware, createInvoice)

router.get('/:id', authMiddleware, getFullInvoice)

module.exports = router