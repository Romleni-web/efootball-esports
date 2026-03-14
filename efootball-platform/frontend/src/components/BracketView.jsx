import React from 'react';

export default function BracketView({ bracket }) {
  // Group matches by round
  const rounds = bracket?.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = [];
    acc[match.round].push(match);
    return acc;
  }, {});

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-8 min-w-max">
        {Object.entries(rounds || {}).map(([roundNum, matches]) => (
          <div key={roundNum} className="flex flex-col gap-4">
            <h3 className="text-gray-400 font-bold text-center">Round {roundNum}</h3>
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match }) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';

  return (
    <div className={`w-64 p-4 rounded-lg border ${
      isLive ? 'bg-blue-500/20 border-blue-500' :
      isCompleted ? 'bg-gray-700 border-gray-600' :
      'bg-gray-800 border-gray-700'
    }`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`text-xs uppercase ${
          isLive ? 'text-blue-400 animate-pulse' :
          isCompleted ? 'text-green-400' :
          'text-gray-500'
        }`}>
          {match.status}
        </span>
        {match.roomId && (
          <span className="text-xs text-gray-400">Room: {match.roomId}</span>
        )}
      </div>

      <div className="space-y-2">
        <PlayerRow 
          name={match.player1?.username || 'TBD'} 
          score={match.player1Score}
          isWinner={match.winnerId === match.player1Id}
        />
        <div className="text-center text-gray-500 text-xs">VS</div>
        <PlayerRow 
          name={match.player2?.username || 'TBD'} 
          score={match.player2Score}
          isWinner={match.winnerId === match.player2Id}
        />
      </div>
    </div>
  );
}

function PlayerRow({ name, score, isWinner }) {
  return (
    <div className={`flex justify-between items-center p-2 rounded ${
      isWinner ? 'bg-green-500/20' : 'bg-gray-900'
    }`}>
      <span className={`text-sm ${isWinner ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
        {name}
      </span>
      {score !== null && (
        <span className="text-white font-bold">{score}</span>
      )}
    </div>
  );
}