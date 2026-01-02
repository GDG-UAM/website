import type { Server as IOServer, Socket } from "socket.io";
import { SocketHandler } from "../types";

export const hackathonHandler: SocketHandler = {
  init: (io: IOServer, socket: Socket) => {
    socket.on("join", (data: { room?: string }) => {
      const room = data?.room;
      if (room && room.startsWith("hackathon:")) {
        const id = room.split(":")[1];
        if (id) {
          // console.log(`[socket] Client ${socket.id} subscribed to hackathon updates for ${id}`);
        }
      }
    });
  }
};
