import type { Server as IOServer, Socket } from "socket.io";
import { SocketHandler } from "../types";

export const baseHandler: SocketHandler = {
  init: (io: IOServer, socket: Socket) => {
    socket.on("join", (data: { room?: string }) => {
      const room = data?.room;
      if (room) {
        socket.join(room);
        // console.log("[socket]", socket.id, "joined", room);
      }
    });

    socket.on("ping", () => {
      // no-op heartbeat
    });
  }
};
