import { Server } from 'socket.io';
import { isAllowedOrigin } from '../middlewares/cors.js';

let connectedPassengersCount = 0;

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    },
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['polling', 'websocket']
  });

  io.on('connection', (socket) => {
    connectedPassengersCount++;
    console.log(`Passenger onboarded! Active live count: ${connectedPassengersCount}`);
    io.emit('live-passengers-count', connectedPassengersCount);

    socket.on('disconnect', () => {
      connectedPassengersCount = Math.max(0, connectedPassengersCount - 1);
      console.log(`Passenger departed. Active live count: ${connectedPassengersCount}`);
      io.emit('live-passengers-count', connectedPassengersCount);
    });
  });

  return io;
};

export const getLivePassengersCount = () => Math.max(1, connectedPassengersCount);
