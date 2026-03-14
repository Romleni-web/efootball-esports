const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/efootball',
  {
    logging: msg => logger.debug(msg),
    dialect: 'postgres',
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {}
  }
);

// User Model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: false,
    validate: {
      len: [3, 30],
      isAlphanumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  efId: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  mpesaNumber: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      is: /^254[0-9]{9}$/
    }
  },
  rank: {
    type: DataTypes.STRING(20),
    defaultValue: 'Bronze'
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  earningsTotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Tournament Model
const Tournament = sequelize.define('Tournament', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  format: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['single_elim', 'double_elim', 'round_robin']]
    }
  },
  maxPlayers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[4, 8, 16, 32, 64]]
    }
  },
  entryFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  prizePool: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  prizeSplit: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: { "1": 0.6, "2": 0.3, "3": 0.1 }
  },
  platform: {
    type: DataTypes.STRING(20),
    defaultValue: 'PS5'
  },
  crossplay: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'open',
    validate: {
      isIn: [['open', 'full', 'live', 'completed', 'cancelled']]
    }
  },
  startsAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  registrationDeadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  startedAt: {
    type: DataTypes.DATE
  },
  completedAt: {
    type: DataTypes.DATE
  },
  createdBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'tournaments',
  timestamps: true
});

// TournamentParticipant Model
const TournamentParticipant = sequelize.define('TournamentParticipant', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tournamentId: {
    type: DataTypes.UUID,
    references: {
      model: Tournament,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  seed: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'verified', 'active', 'eliminated', 'winner']]
    }
  },
  registeredAt: {
    type: DataTypes.DATE,
    defaultValue: Sequelize.NOW
  },
  verifiedAt: {
    type: DataTypes.DATE
  },
  verifiedBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  tableName: 'tournament_participants',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['tournamentId', 'userId']
    }
  ]
});

// Payment Model
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  participantId: {
    type: DataTypes.UUID,
    references: {
      model: TournamentParticipant,
      key: 'id'
    }
  },
  transactionId: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  senderNumber: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'verified', 'rejected']]
    }
  },
  screenshotUrl: {
    type: DataTypes.STRING(500)
  },
  verifiedBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  verifiedAt: {
    type: DataTypes.DATE
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'payments',
  timestamps: true
});

// Match Model
const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tournamentId: {
    type: DataTypes.UUID,
    references: {
      model: Tournament,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  round: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  matchNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  player1Id: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  player2Id: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  roomId: {
    type: DataTypes.STRING(20)
  },
  roomPassword: {
    type: DataTypes.STRING(10)
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'ready', 'live', 'completed', 'disputed', 'cancelled']]
    }
  },
  player1Score: {
    type: DataTypes.INTEGER
  },
  player2Score: {
    type: DataTypes.INTEGER
  },
  winnerId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  player1Reported: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  player2Reported: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  player1SubmittedAt: {
    type: DataTypes.DATE
  },
  player2SubmittedAt: {
    type: DataTypes.DATE
  },
  evidencePlayer1: {
    type: DataTypes.STRING(500)
  },
  evidencePlayer2: {
    type: DataTypes.STRING(500)
  },
  disputeReason: {
    type: DataTypes.TEXT
  },
  resolvedBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  resolutionNote: {
    type: DataTypes.TEXT
  },
  scheduledAt: {
    type: DataTypes.DATE
  },
  startedAt: {
    type: DataTypes.DATE
  },
  completedAt: {
    type: DataTypes.DATE
  },
  nextMatchId: {
    type: DataTypes.UUID,
    references: {
      model: 'matches',
      key: 'id'
    }
  }
}, {
  tableName: 'matches',
  timestamps: true
});

// Payout Model
const Payout = sequelize.define('Payout', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tournamentId: {
    type: DataTypes.UUID,
    references: {
      model: Tournament,
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'sent', 'failed']]
    }
  },
  mpesaNumber: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  transactionRef: {
    type: DataTypes.STRING(50)
  },
  screenshotUrl: {
    type: DataTypes.STRING(500)
  },
  sentBy: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  sentAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'payouts',
  timestamps: true
});

// Notification Model
const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id'
    }
  },
  type: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  data: {
    type: DataTypes.JSONB
  }
}, {
  tableName: 'notifications',
  timestamps: true
});

// Relationships
User.hasMany(Tournament, { foreignKey: 'createdBy' });
Tournament.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

Tournament.belongsToMany(User, { 
  through: TournamentParticipant, 
  foreignKey: 'tournamentId',
  otherKey: 'userId'
});
User.belongsToMany(Tournament, { 
  through: TournamentParticipant, 
  foreignKey: 'userId',
  otherKey: 'tournamentId'
});

TournamentParticipant.belongsTo(Tournament, { foreignKey: 'tournamentId' });
TournamentParticipant.belongsTo(User, { foreignKey: 'userId' });
TournamentParticipant.hasOne(Payment, { foreignKey: 'participantId' });

Tournament.hasMany(Match, { foreignKey: 'tournamentId' });
Match.belongsTo(Tournament, { foreignKey: 'tournamentId' });

Match.belongsTo(User, { foreignKey: 'player1Id', as: 'player1' });
Match.belongsTo(User, { foreignKey: 'player2Id', as: 'player2' });
Match.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });

Tournament.hasMany(Payout, { foreignKey: 'tournamentId' });
Payout.belongsTo(Tournament, { foreignKey: 'tournamentId' });
Payout.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Tournament,
  TournamentParticipant,
  Payment,
  Match,
  Payout,
  Notification
};