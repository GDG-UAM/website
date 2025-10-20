import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";
import { setIO } from "@/lib/realtime/io";
import { countEntries } from "@/lib/controllers/giveawayController";

// Augment res.socket.server with io instance
type WithIO = NextApiResponse & {
  socket: NextApiResponse["socket"] & { server: HTTPServer & { io?: IOServer } };
};

export default function handler(_req: NextApiRequest, res: WithIO) {
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" },
      pingInterval: 20000,
      pingTimeout: 30000,
      connectionStateRecovery: { maxDisconnectionDuration: 120000 }
    });
    res.socket.server.io = io;
    setIO(io);

    io.on("connection", (socket) => {
      try {
        console.log("[socket] client connected:", socket.id);
      } catch {}
      socket.on("join", async (data: { room?: string }) => {
        const room = data?.room;
        if (room) {
          socket.join(room);
          try {
            console.log("[socket]", socket.id, "joined", room);
          } catch {}
          // If this is a giveaway room, emit the latest count immediately to the joining client
          if (room.startsWith("giveaway:")) {
            const id = room.split(":")[1];
            if (id) {
              try {
                const total = await countEntries(id);
                try {
                  console.log(`[socket] Emitting giveaway:count on join for ${id} =>`, total);
                } catch {}
                socket.emit("giveaway:count", { count: total });
              } catch {}
            }
          }
        }
      });
      socket.on("ping", () => {
        // no-op heartbeat to keep some proxies from idling the connection
      });
    });
  }
  res.end();
}
