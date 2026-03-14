const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const { authenticate } = require('../middleware/auth');

router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters')
    .isAlphanumeric()
    .withMessage('Username must be alphanumeric'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('mpesaNumber')
    .matches(/^(254|0|\+254)[0-9]{9}$/)
    .withMessage('Valid M-Pesa number required (254XXXXXXXXX)')
], authController.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').exists().withMessage('Password required')
], authController.login);

router.get('/me', authenticate, authController.getMe);

module.exports = router;