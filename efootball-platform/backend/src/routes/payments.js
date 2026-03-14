const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const paymentController = require('../controllers/payments');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/submit', 
  authenticate,
  upload.single('screenshot'),
  [
    body('tournamentId').isUUID().withMessage('Valid tournament ID required'),
    body('transactionId')
      .trim()
      .isLength({ min: 10, max: 20 })
      .withMessage('Valid transaction ID required'),
    body('senderNumber')
      .matches(/^(254|0|\+254)[0-9]{9}$/)
      .withMessage('Valid M-Pesa number required')
  ],
  paymentController.submitPayment
);

router.get('/pending', authenticate, requireAdmin, paymentController.getPendingPayments);
router.post('/:id/verify', authenticate, requireAdmin, paymentController.verifyPayment);

router.post('/:id/reject', 
  authenticate, 
  requireAdmin,
  [body('reason').trim().notEmpty().withMessage('Rejection reason required')],
  paymentController.rejectPayment
);

module.exports = router;