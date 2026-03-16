import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  // Disconnect old socket if exists
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}
