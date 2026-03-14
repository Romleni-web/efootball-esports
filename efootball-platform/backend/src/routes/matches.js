const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const matchController = require('../controllers/matches');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/my-matches', authenticate, matchController.getMyMatches);
router.get('/:id', authenticate, matchController.getMatch);

router.post('/:id/ready', authenticate, matchController.confirmReady);

router.post('/:id/report', 
  authenticate,
  upload.single('screenshot'),
  [
    body('myScore').isInt({ min: 0, max: 20 }).withMessage('Score must be 0-20'),
    body('opponentScore').isInt({ min: 0, max: 20 }).withMessage('Score must be 0-20')
  ],
  matchController.reportScore
);

router.post('/:id/dispute', 
  authenticate,
  [
    body('reason').trim().isLength({ min: 10 }).withMessage('Reason must be at least 10 characters')
  ],
  matchController.disputeMatch
);

module.exports = router;