const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/admin');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/dashboard', authenticate, requireAdmin, adminController.getDashboard);
router.get('/disputes', authenticate, requireAdmin, adminController.getDisputes);

router.post('/disputes/:matchId/resolve', 
  authenticate, 
  requireAdmin,
  [
    body('winnerId').isUUID().withMessage('Valid winner ID required'),
    body('note').trim().isLength({ min: 5 }).withMessage('Resolution note required')
  ],
  adminController.resolveDispute
);

router.get('/payouts', authenticate, requireAdmin, adminController.getPayouts);

router.post('/payouts/:payoutId/send', 
  authenticate, 
  requireAdmin,
  upload.single('screenshot'),
  [
    body('transactionRef')
      .trim()
      .isLength({ min: 5 })
      .withMessage('Transaction reference required')
  ],
  adminController.sendPayout
);

module.exports = router;