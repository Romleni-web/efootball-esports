const { 
  Tournament, 
  Match, 
  User, 
  Payout, 
  TournamentParticipant,
  Notification 
} = require('../models');
const logger = require('../utils/logger');

exports.getDashboard = async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.count(),
      totalTournaments: await Tournament.count(),
      activeTournaments: await Tournament.count({ where: { status: 'live' } }),
      pendingPayments: await require('../models').Payment.count({ 
        where: { status: 'pending' } 
      }),
      pendingPayouts: await Payout.count({ where: { status: 'pending' } }),
      totalRevenue: await require('../models').Payment.sum('amount', {
        where: { status: 'verified' }
      }) || 0
    };

    res.json(stats);
  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getDisputes = async (req, res) => {
  try {
    const disputes = await Match.findAll({
      where: { status: 'disputed' },
      include: [
        { model: User, as: 'player1', attributes: ['username'] },
        { model: User, as: 'player2', attributes: ['username'] },
        { model: Tournament, attributes: ['name'] }
      ]
    });

    res.json(disputes);
  } catch (error) {
    logger.error('Get disputes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.resolveDispute = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, note } = req.body;

    const match = await Match.findByPk(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    match.winnerId = winnerId;
    match.status = 'completed';
    match.resolvedBy = req.user.userId;
    match.resolutionNote = note;
    match.completedAt = new Date();
    await match.save();

    // Advance winner
    if (match.nextMatchId) {
      const { advanceWinner } = require('../services/bracketService');
      await advanceWinner(match.id, winnerId);
    }

    // Notify both players
    await Notification.create({
      userId: match.player1Id,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `Admin has ruled on your match. ${note}`,
      data: { matchId }
    });

    await Notification.create({
      userId: match.player2Id,
      type: 'dispute_resolved',
      title: 'Dispute Resolved',
      message: `Admin has ruled on your match. ${note}`,
      data: { matchId }
    });

    res.json({ message: 'Dispute resolved' });
  } catch (error) {
    logger.error('Resolve dispute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getPayouts = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    const payouts = await Payout.findAll({
      where: { status },
      include: [
        { model: User, attributes: ['username', 'mpesaNumber'] },
        { model: Tournament, attributes: ['name'] }
      ]
    });

    res.json(payouts);
  } catch (error) {
    logger.error('Get payouts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.sendPayout = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { transactionRef, screenshot } = req.body;

    const payout = await Payout.findByPk(payoutId, {
      include: [{ model: User }]
    });

    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    payout.status = 'sent';
    payout.transactionRef = transactionRef;
    payout.screenshotUrl = screenshot;
    payout.sentBy = req.user.userId;
    payout.sentAt = new Date();
    await payout.save();

    // Update user earnings
    const user = await User.findByPk(payout.userId);
    user.earningsTotal = parseFloat(user.earningsTotal) + parseFloat(payout.amount);
    await user.save();

    // Notify user
    await Notification.create({
      userId: payout.userId,
      type: 'prize_sent',
      title: 'Prize Money Sent!',
      message: `KES ${payout.amount} sent to your M-Pesa`,
      data: { payoutId, transactionRef }
    });

    res.json({ message: 'Payout marked as sent' });
  } catch (error) {
    logger.error('Send payout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};