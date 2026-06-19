import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

let socketInstance = null;

export function useSocket() {
  const { token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    if (!socketInstance) {
      socketInstance = io(API_BASE_URL, { auth: { token }, transports: ['websocket'] });
    }
    socketRef.current = socketInstance;
    return () => {};
  }, [token]);

  const on = useCallback((event, cb) => {
    socketRef.current?.on(event, cb);
    return () => socketRef.current?.off(event, cb);
  }, []);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const joinDoctors = useCallback(() => {
    socketRef.current?.emit('join:doctors');
  }, []);

  return { on, emit, joinDoctors, socket: socketRef.current };
}
