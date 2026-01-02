import type { Server as IOServer, Socket } from "socket.io";
import { SocketHandler } from "../types";
import { countEntries } from "@/lib/controllers/giveawayController";

export const giveawayHandler: SocketHandler = {
  init: (io: IOServer, socket: Socket) => {
    socket.on("join", async (data: { room?: string }) => {
      const room = data?.room;
      if (room && room.startsWith("giveaway:")) {
        const id = room.split(":")[1];
        if (id) {
          try {
            const total = await countEntries(id);
            socket.emit("giveaway:count", { count: total });
          } catch (e) {
            console.error(`[socket] Failed to emit initial giveaway count for ${id}:`, e);
          }
        }
      }
    });
  }
};
