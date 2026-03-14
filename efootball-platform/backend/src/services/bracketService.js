const { Match } = require('../models');
const crypto = require('crypto');

function generateRoomCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function generatePassword() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function generateBracket(tournamentId, participants, format) {
  if (format !== 'single_elim') {
    throw new Error('Only single elimination supported currently');
  }

  const n = participants.length;
  // Pad to nearest power of 2
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(n)));
  const paddedParticipants = [...participants];
  
  // Add byes if needed
  while (paddedParticipants.length < nextPowerOf2) {
    paddedParticipants.push(null); // bye
  }

  // Shuffle for random seeding
  for (let i = paddedParticipants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [paddedParticipants[i], paddedParticipants[j]] = 
    [paddedParticipants[j], paddedParticipants[i]];
  }

  const rounds = Math.log2(nextPowerOf2);
  const matches = [];
  let matchCounter = 1;

  // Round 1
  const round1Matches = [];
  for (let i = 0; i < paddedParticipants.length; i += 2) {
    const p1 = paddedParticipants[i];
    const p2 = paddedParticipants[i + 1];

    const match = await Match.create({
      tournamentId,
      round: 1,
      matchNumber: matchCounter,
      player1Id: p1,
      player2Id: p2,
      roomId: generateRoomCode(),
      roomPassword: generatePassword(),
      status: p1 && p2 ? 'pending' : 'completed', // Auto-win if bye
      winnerId: p1 && !p2 ? p1 : !p1 && p2 ? p2 : null
    });

    round1Matches.push(match);
    matchCounter++;
  }

  matches.push(...round1Matches);

  // Subsequent rounds (empty)
  for (let round = 2; round <= rounds; round++) {
    const numMatches = nextPowerOf2 / Math.pow(2, round);
    const roundMatches = [];

    for (let i = 0; i < numMatches; i++) {
      const match = await Match.create({
        tournamentId,
        round,
        matchNumber: matchCounter,
        player1Id: null,
        player2Id: null,
        roomId: generateRoomCode(),
        roomPassword: generatePassword(),
        status: 'pending'
      });

      roundMatches.push(match);
      matchCounter++;
    }

    // Link previous round winners
    const prevRoundMatches = matches.filter(m => m.round === round - 1);
    for (let i = 0; i < prevRoundMatches.length; i++) {
      const prevMatch = prevRoundMatches[i];
      const nextMatchIndex = Math.floor(i / 2);
      prevMatch.nextMatchId = roundMatches[nextMatchIndex].id;
      await prevMatch.save();
    }

    matches.push(...roundMatches);
  }

  return matches;
}

async function advanceWinner(matchId, winnerId) {
  const match = await Match.findByPk(matchId);
  if (!match || !match.nextMatchId) return;

  const nextMatch = await Match.findByPk(match.nextMatchId);
  
  // Determine slot (odd match numbers go to player1)
  const isPlayer1Slot = match.matchNumber % 2 === 1;
  
  if (isPlayer1Slot) {
    nextMatch.player1Id = winnerId;
  } else {
    nextMatch.player2Id = winnerId;
  }

  // If both slots filled, mark as ready
  if (nextMatch.player1Id && nextMatch.player2Id) {
    nextMatch.status = 'ready';
    nextMatch.scheduledAt = new Date(Date.now() + 5 * 60000); // 5 min buffer
  }

  await nextMatch.save();

  // Notify players
  const { Notification } = require('../models');
  await Notification.create({
    userId: winnerId,
    type: 'match_ready',
    title: 'Next Match Ready',
    message: `You've advanced to Round ${nextMatch.round}!`,
    data: { matchId: nextMatch.id }
  });

  return nextMatch;
}

module.exports = {
  generateBracket,
  advanceWinner
};