const { Payment, TournamentParticipant, Tournament, User, Notification } = require('../models');
const logger = require('../utils/logger');

exports.submitPayment = async (req, res) => {
  try {
    const { tournamentId, transactionId, senderNumber, screenshot } = req.body;
    const userId = req.user.userId;

    // Find participant record
    const participant = await TournamentParticipant.findOne({
      where: { tournamentId, userId },
      include: [{ model: Tournament }]
    });

    if (!participant) {
      return res.status(404).json({ error: 'Not registered for this tournament' });
    }

    if (participant.status === 'verified') {
      return res.status(400).json({ error: 'Payment already verified' });
    }

    // Check for duplicate transaction ID
    const existing = await Payment.findOne({ where: { transactionId } });
    if (existing) {
      return res.status(400).json({ error: 'Transaction ID already used' });
    }

    // Format sender number
    let formattedNumber = senderNumber;
    if (senderNumber.startsWith('0')) {
      formattedNumber = '254' + senderNumber.substring(1);
    } else if (senderNumber.startsWith('+')) {
      formattedNumber = senderNumber.substring(1);
    }

    const payment = await Payment.create({
      participantId: participant.id,
      transactionId: transactionId.toUpperCase(),
      senderNumber: formattedNumber,
      amount: participant.Tournament.entryFee,
      screenshotUrl: screenshot || null,
      status: 'pending'
    });

    // Notify admin (simplified)
    logger.info(`New payment pending: ${transactionId} for tournament ${tournamentId}`);

    res.status(201).json({
      message: 'Payment submitted successfully. Awaiting verification.',
      payment
    });
  } catch (error) {
    logger.error('Submit payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getPendingPayments = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const payments = await Payment.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: TournamentParticipant,
          include: [
            { model: User, attributes: ['username', 'mpesaNumber'] },
            { model: Tournament, attributes: ['name', 'entryFee'] }
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(payments);
  } catch (error) {
    logger.error('Get pending payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const payment = await Payment.findByPk(id, {
      include: [
        {
          model: TournamentParticipant,
          include: [{ model: Tournament }]
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    // Update payment
    payment.status = 'verified';
    payment.verifiedBy = req.user.userId;
    payment.verifiedAt = new Date();
    await payment.save();

    // Update participant
    const participant = await TournamentParticipant.findByPk(payment.participantId);
    participant.status = 'verified';
    participant.verifiedAt = new Date();
    participant.verifiedBy = req.user.userId;
    await participant.save();

    // Check if tournament full
    const count = await TournamentParticipant.count({
      where: { 
        tournamentId: participant.tournamentId, 
        status: 'verified' 
      }
    });

    const tournament = await Tournament.findByPk(participant.tournamentId);
    if (count >= tournament.maxPlayers) {
      tournament.status = 'full';
      await tournament.save();
    }

    // Notify user
    await Notification.create({
      userId: participant.userId,
      type: 'payment_verified',
      title: 'Payment Confirmed',
      message: `Your entry for ${tournament.name} is confirmed!`,
      data: { tournamentId: tournament.id }
    });

    logger.info(`Payment ${id} verified by admin ${req.user.userId}`);

    res.json({ message: 'Payment verified successfully' });
  } catch (error) {
    logger.error('Verify payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findByPk(id, {
      include: [{ model: TournamentParticipant }]
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = 'rejected';
    payment.verifiedBy = req.user.userId;
    payment.verifiedAt = new Date();
    payment.notes = reason;
    await payment.save();

    // Notify user
    await Notification.create({
      userId: payment.TournamentParticipant.userId,
      type: 'payment_rejected',
      title: 'Payment Issue',
      message: `Your payment was rejected: ${reason}`,
      data: { paymentId: id }
    });

    res.json({ message: 'Payment rejected' });
  } catch (error) {
    logger.error('Reject payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};