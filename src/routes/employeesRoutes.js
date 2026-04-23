const express = require('express')
const router = express.Router()
const { getEmployees, getEmployeesId, updateEmployees, reactivateEmployee, deleteEmployees } = require('../controllers/employeesController')
const authMiddleware = require('../middleware/authMiddleware')

router.get('/', authMiddleware, getEmployees)
router.get('/:id_employees', authMiddleware, getEmployeesId)
router.put('/:id_employees', authMiddleware, updateEmployees)
router.put('/:id_employees/reactivate', authMiddleware, reactivateEmployee)
router.delete('/:id_employees', authMiddleware, deleteEmployees)

module.exports = router