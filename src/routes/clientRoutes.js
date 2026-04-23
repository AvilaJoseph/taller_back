const express = require('express')
const router = express.Router()
const { getClients, getClientId, createClient, updateClient, deleteClient } = require('../controllers/clientController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, getClients)
router.get('/:id_clients', authMiddleware, getClientId)
router.post('/', authMiddleware, createClient)
router.put('/:id_clients', authMiddleware, updateClient)
router.delete('/:id_clients', authMiddleware, deleteClient)

module.exports = router