import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL);
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinTournament = (tournamentId) => {
  if (socket) {
    socket.emit('join-tournament', tournamentId);
  }
};

export const onTournamentUpdate = (callback) => {
  if (socket) {
    socket.on('tournament-started', callback);
    socket.on('tournament-completed', callback);
  }
};

export const onMatchUpdate = (callback) => {
  if (socket) {
    socket.on('match-started', callback);
    socket.on('match-completed', callback);
  }
};