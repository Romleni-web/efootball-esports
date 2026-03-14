const { Match, User, Notification, Tournament } = require('../models');
const { advanceWinner } = require('../services/bracketService');
const logger = require('../utils/logger');

exports.getMyMatches = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const matches = await Match.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { player1Id: userId },
          { player2Id: userId }
        ],
        status: ['pending', 'ready', 'live', 'disputed']
      },
      include: [
        { model: User, as: 'player1', attributes: ['username', 'efId'] },
        { model: User, as: 'player2', attributes: ['username', 'efId'] },
        { model: Tournament, attributes: ['name', 'platform', 'crossplay'] }
      ],
      order: [['scheduledAt', 'ASC']]
    });

    res.json(matches);
  } catch (error) {
    logger.error('Get my matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const match = await Match.findByPk(id, {
      include: [
        { model: User, as: 'player1', attributes: ['id', 'username', 'efId'] },
        { model: User, as: 'player2', attributes: ['id', 'username', 'efId'] },
        { model: User, as: 'winner', attributes: ['username'] },
        { model: Tournament, attributes: ['name', 'platform', 'crossplay'] }
      ]
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.player1Id !== userId && match.player2Id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(match);
  } catch (error) {
    logger.error('Get match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.confirmReady = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (!['pending', 'ready'].includes(match.status)) {
      return res.status(400).json({ error: 'Match already started or completed' });
    }

    const isPlayer1 = match.player1Id === userId;
    const isPlayer2 = match.player2Id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    // Mark player as ready
    if (isPlayer1) {
      match.player1Ready = true;
    } else {
      match.player2Ready = true;
    }

    await match.save();

    // Check if both ready
    const updated = await Match.findByPk(id);
    if (updated.player1Ready && updated.player2Ready) {
      updated.status = 'live';
      updated.startedAt = new Date();
      await updated.save();

      // Notify both players
      global.io.to(`match-${id}`).emit('match-started', { matchId: id });
    }

    res.json({
      message: 'Ready status confirmed',
      match: updated
    });
  } catch (error) {
    logger.error('Confirm ready error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.reportScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { myScore, opponentScore } = req.body;
    const userId = req.user.userId;
    const screenshot = req.file ? req.file.path || req.file.secure_url : null;

    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (!['live', 'ready'].includes(match.status)) {
      return res.status(400).json({ error: 'Match is not active' });
    }

    const isPlayer1 = match.player1Id === userId;
    const isPlayer2 = match.player2Id === userId;

    if (!isPlayer1 && !isPlayer2) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    // Store scores based on reporter
    if (isPlayer1) {
      match.p1ReportedScore = parseInt(myScore);
      match.p1ReportedOpponent = parseInt(opponentScore);
      match.player1Reported = true;
      match.player1SubmittedAt = new Date();
      match.evidencePlayer1 = screenshot;
    } else {
      match.p2ReportedScore = parseInt(myScore);
      match.p2ReportedOpponent = parseInt(opponentScore);
      match.player2Reported = true;
      match.player2SubmittedAt = new Date();
      match.evidencePlayer2 = screenshot;
    }

    await match.save();

    // Check if both reported
    if (match.player1Reported && match.player2Reported) {
      // Verify scores match
      const p1ClaimsP1Scored = match.p1ReportedScore;
      const p1ClaimsP2Scored = match.p1ReportedOpponent;
      const p2ClaimsP1Scored = match.p2ReportedOpponent; // What P2 says P1 scored
      const p2ClaimsP2Scored = match.p2ReportedScore;    // What P2 says P2 scored

      // Check if reports agree
      const scoresAgree = (p1ClaimsP1Scored === p2ClaimsP1Scored) && 
                          (p1ClaimsP2Scored === p2ClaimsP2Scored);

      if (scoresAgree) {
        // Set final scores
        match.player1Score = p1ClaimsP1Scored;
        match.player2Score = p1ClaimsP2Scored;

        // Determine winner
        if (match.player1Score > match.player2Score) {
          match.winnerId = match.player1Id;
        } else if (match.player2Score > match.player1Score) {
          match.winnerId = match.player2Id;
        } else {
          // Draw - need replay or admin decision
          match.status = 'disputed';
          match.disputeReason = 'Match ended in a draw';
          await match.save();
          
          return res.json({
            message: 'Scores submitted but match is a draw. Admin review required.',
            match
          });
        }

        match.status = 'completed';
        match.completedAt = new Date();
        await match.save();

        // Advance winner
        if (match.nextMatchId) {
          await advanceWinner(match.id, match.winnerId);
        } else {
          // Final match - tournament complete
          await handleTournamentWin(match.tournamentId, match.winnerId);
        }

        // Notify loser
        const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
        await Notification.create({
          userId: loserId,
          type: 'match_lost',
          title: 'Match Result',
          message: `You lost ${match.player1Score}-${match.player2Score}. Better luck next time!`,
          data: { matchId: id }
        });

        global.io.to(`match-${id}`).emit('match-completed', { 
          matchId: id, 
          winner: match.winnerId 
        });

        return res.json({
          message: 'Match completed successfully',
          match
        });
      } else {
        // Scores don't match - dispute
        match.status = 'disputed';
        match.disputeReason = 'Players reported different scores';
        await match.save();

        // Notify admin (simplified)
        logger.warn(`Score dispute in match ${id}: P1 claims ${p1ClaimsP1Scored}-${p1ClaimsP2Scored}, P2 claims ${p2ClaimsP1Scored}-${p2ClaimsP2Scored}`);

        return res.json({
          message: 'Scores submitted but there is a discrepancy. Admin will review.',
          match
        });
      }
    }

    res.json({
      message: 'Score reported. Waiting for opponent.',
      match
    });
  } catch (error) {
    logger.error('Report score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.disputeMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.userId;

    const match = await Match.findByPk(id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.player1Id !== userId && match.player2Id !== userId) {
      return res.status(403).json({ error: 'Not a participant' });
    }

    match.status = 'disputed';
    match.disputeReason = reason;
    match.disputedBy = userId;
    await match.save();

    logger.warn(`Match ${id} disputed by user ${userId}: ${reason}`);

    res.json({ message: 'Dispute submitted successfully' });
  } catch (error) {
    logger.error('Dispute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

async function handleTournamentWin(tournamentId, winnerId) {
  const tournament = await Tournament.findByPk(tournamentId);
  tournament.status = 'completed';
  tournament.completedAt = new Date();
  await tournament.save();

  // Update winner stats
  const winner = await User.findByPk(winnerId);
  winner.wins += 1;
  await winner.save();

  // Create payouts for top 3
  const { Payout, TournamentParticipant } = require('../models');
  const participants = await TournamentParticipant.findAll({
    where: { tournamentId },
    include: [{ model: User }],
    order: [['position', 'ASC']]
  });

  // Determine positions from bracket (simplified - top 3)
  const positions = [
    { pos: 1, split: tournament.prizeSplit["1"] || 0.6 },
    { pos: 2, split: tournament.prizeSplit["2"] || 0.3 },
    { pos: 3, split: tournament.prizeSplit["3"] || 0.1 }
  ];

  for (const { pos, split } of positions) {
    const userId = pos === 1 ? winnerId : null; // Simplified - need bracket traversal for 2nd/3rd
    
    if (userId) {
      await Payout.create({
        tournamentId,
        userId,
        position: pos,
        amount: tournament.prizePool * split,
        mpesaNumber: winner.mpesaNumber
      });
    }
  }

  // Notify winner
  await Notification.create({
    userId: winnerId,
    type: 'tournament_won',
    title: '🏆 Tournament Champion!',
    message: `You won ${tournament.name}!`,
    data: { tournamentId, prize: tournament.prizePool * (tournament.prizeSplit["1"] || 0.6) }
  });

  global.io.to(`tournament-${tournamentId}`).emit('tournament-completed', {
    tournamentId,
    winner: winnerId
  });
}