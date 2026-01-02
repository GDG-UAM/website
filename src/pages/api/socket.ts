import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";
import { setIO } from "@/lib/realtime/io";
import { baseHandler } from "@/lib/realtime/handlers/baseHandler";
import { giveawayHandler } from "@/lib/realtime/handlers/giveawayHandler";
import { hackathonHandler } from "@/lib/realtime/handlers/hackathonHandler";

// Augment res.socket.server with io instance
type WithIO = NextApiResponse & {
  socket: NextApiResponse["socket"] & { server: HTTPServer & { io?: IOServer } };
};

export default function handler(_req: NextApiRequest, res: WithIO) {
  console.log("[socket] API handler called");
  if (!res.socket.server.io) {
    console.log("[socket] initializing new IOServer...");
    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" },
      pingInterval: 20000,
      pingTimeout: 30000,
      connectionStateRecovery: { maxDisconnectionDuration: 120000 }
    });
    res.socket.server.io = io;
    setIO(io);

    // Dynamic handler registration
    const handlers = [
      baseHandler,
      giveawayHandler,
      hackathonHandler
      // Add more handlers here as needed
    ];

    io.on("connection", (socket) => {
      // console.log("[socket] client connected:", socket.id);

      // Initialize all handlers for each new socket
      for (const handler of handlers) {
        handler.init(io, socket);
      }
    });
  }
  res.end();
}
