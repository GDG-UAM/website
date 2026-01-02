import type { Server as IOServer, Socket } from "socket.io";

export interface SocketHandler {
  init: (io: IOServer, socket: Socket) => void;
}
