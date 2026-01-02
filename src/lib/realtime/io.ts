import type { Server as IOServer } from "socket.io";

declare global {
  var __gdg_io__: IOServer | undefined;
}

let localIO: IOServer | null = null;

export function setIO(instance: IOServer) {
  localIO = instance;
  try {
    globalThis.__gdg_io__ = instance;
  } catch {}
}

export function getIO(): IOServer | null {
  try {
    return globalThis.__gdg_io__ || localIO;
  } catch {
    return localIO;
  }
}

export function emitToRoom<T = unknown>(room: string, event: string, payload: T) {
  const io = getIO();
  if (!io) return;
  // console.log(`[socket] Emitting ${event} to room ${room} =>`, payload);
  io.to(room).emit(event, payload);
}
