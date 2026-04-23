const express = require('express')
const router = express.Router()
const { register, login, logout } = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', authMiddleware, (req, res) => {
    res.json({ user: req.user })
})

module.exports = router