const { Op } = require('sequelize');
const { 
  Tournament, 
  User, 
  TournamentParticipant, 
  Payment, 
  Match,
  Notification 
} = require('../models');
const logger = require('../utils/logger');
const { generateBracket } = require('../services/bracketService');

exports.createTournament = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      name,
      description,
      format,
      maxPlayers,
      entryFee,
      prizeSplit,
      platform,
      crossplay,
      startsAt,
      registrationDeadline
    } = req.body;

    // Calculate prize pool
    const prizePool = entryFee * maxPlayers;

    const tournament = await Tournament.create({
      name,
      description,
      format,
      maxPlayers,
      entryFee,
      prizePool,
      prizeSplit: prizeSplit || { "1": 0.6, "2": 0.3, "3": 0.1 },
      platform,
      crossplay,
      startsAt: new Date(startsAt),
      registrationDeadline: new Date(registrationDeadline),
      createdBy: req.user.userId
    });

    logger.info(`Tournament created: ${name}`);

    res.status(201).json({
      message: 'Tournament created successfully',
      tournament
    });
  } catch (error) {
    logger.error('Create tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTournaments = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const where = {};

    if (status) where.status = status;

    const tournaments = await Tournament.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['username']
      }],
      order: [['startsAt', 'ASC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      tournaments: tournaments.rows,
      total: tournaments.count,
      pages: Math.ceil(tournaments.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    logger.error('Get tournaments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTournament = async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['username']
        },
        {
          model: User,
          through: {
            attributes: ['status', 'seed', 'registeredAt']
          },
          attributes: ['id', 'username', 'rank', 'wins', 'losses']
        }
      ]
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get bracket if tournament is live or completed
    let bracket = null;
    if (['live', 'completed'].includes(tournament.status)) {
      bracket = await Match.findAll({
        where: { tournamentId: id },
        include: [
          { model: User, as: 'player1', attributes: ['username'] },
          { model: User, as: 'player2', attributes: ['username'] },
          { model: User, as: 'winner', attributes: ['username'] }
        ],
        order: [['round', 'ASC'], ['matchNumber', 'ASC']]
      });
    }

    res.json({
      tournament,
      bracket,
      participantCount: tournament.Users.length,
      isFull: tournament.Users.length >= tournament.maxPlayers
    });
  } catch (error) {
    logger.error('Get tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.joinTournament = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const tournament = await Tournament.findByPk(id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    if (tournament.status !== 'open') {
      return res.status(400).json({ error: 'Tournament is not open for registration' });
    }

    if (new Date() > new Date(tournament.registrationDeadline)) {
      return res.status(400).json({ error: 'Registration deadline has passed' });
    }

    // Check if already registered
    const existing = await TournamentParticipant.findOne({
      where: { tournamentId: id, userId }
    });
    if (existing) {
      return res.status(400).json({ error: 'Already registered for this tournament' });
    }

    // Check if full
    const count = await TournamentParticipant.count({
      where: { tournamentId: id }
    });
    if (count >= tournament.maxPlayers) {
      return res.status(400).json({ error: 'Tournament is full' });
    }

    // Create participant entry
    const participant = await TournamentParticipant.create({
      tournamentId: id,
      userId,
      status: tournament.entryFee > 0 ? 'pending' : 'verified'
    });

    // If free tournament, mark as verified immediately
    if (tournament.entryFee === 0) {
      participant.status = 'verified';
      participant.verifiedAt = new Date();
      await participant.save();

      // Check if tournament is now full
      const newCount = await TournamentParticipant.count({
        where: { tournamentId: id, status: 'verified' }
      });
      if (newCount >= tournament.maxPlayers) {
        tournament.status = 'full';
        await tournament.save();
      }
    }

    logger.info(`User ${userId} joined tournament ${id}`);

    res.status(201).json({
      message: 'Successfully registered for tournament',
      participant,
      requiresPayment: tournament.entryFee > 0
    });
  } catch (error) {
    logger.error('Join tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.startTournament = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const tournament = await Tournament.findByPk(id, {
      include: [{
        model: User,
        through: {
          where: { status: 'verified' }
        }
      }]
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    if (tournament.status !== 'full' && tournament.status !== 'open') {
      return res.status(400).json({ error: 'Tournament cannot be started' });
    }

    const participants = tournament.Users.map(u => u.id);
    
    if (participants.length < 2) {
      return res.status(400).json({ error: 'Not enough participants' });
    }

    // Generate bracket
    const matches = await generateBracket(id, participants, tournament.format);

    tournament.status = 'live';
    tournament.startedAt = new Date();
    await tournament.save();

    // Notify participants
    for (const user of tournament.Users) {
      await Notification.create({
        userId: user.id,
        type: 'tournament_started',
        title: 'Tournament Started!',
        message: `${tournament.name} has begun. Check your matches!`,
        data: { tournamentId: id }
      });
    }

    // Emit socket event
    req.io.to(`tournament-${id}`).emit('tournament-started', { tournamentId: id });

    logger.info(`Tournament ${id} started`);

    res.json({
      message: 'Tournament started successfully',
      matches: matches.length
    });
  } catch (error) {
    logger.error('Start tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};