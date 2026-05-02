const express = require('express')
const router = express.Router()
const { getParts, getPartsId, createParts, updatedParts, deleteParts } = require('../controllers/partsController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, getParts)
router.get('/:id', authMiddleware, getPartsId)
router.post('/', authMiddleware, createParts)
router.put('/:id', authMiddleware, updatedParts)
router.delete('/:id', authMiddleware, deleteParts)

module.exports = router