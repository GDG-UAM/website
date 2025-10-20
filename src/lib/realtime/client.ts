import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    socket = io(base, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      timeout: 20000
    });
  }
  return socket;
}

export function subscribeToGiveaway(giveawayId: string, onCount: (count: number) => void) {
  const s = getSocket();
  const room = `giveaway:${giveawayId}`;
  const join = () => {
    try {
      console.log("[socket] joining room", room);
    } catch {}
    s.emit("join", { room });
  };

  // Join now if connected, otherwise join on connect; also re-join after reconnects
  if (s.connected) join();
  const onConnect = () => join();
  const onConnectError = (err: unknown) => {
    try {
      console.warn("[socket] connect error", err);
    } catch {}
  };
  const onDisconnect = (reason: string) => {
    try {
      console.log("[socket] disconnected:", reason);
    } catch {}
  };
  s.on("connect", onConnect);
  s.on("connect_error", onConnectError);
  s.on("disconnect", onDisconnect);
  // optional heartbeat to keep some proxies from idling the connection
  let hb: ReturnType<typeof setInterval> | undefined;
  try {
    hb = setInterval(() => {
      if (s.connected) s.emit("ping", { t: Date.now() });
    }, 25000);
  } catch {}
  const handler = (payload: { count: number }) => {
    if (typeof payload?.count === "number") {
      try {
        console.log("[socket] Received giveaway:count =>", payload.count);
      } catch {}
      onCount(payload.count);
    }
  };
  s.on("giveaway:count", handler);
  return () => {
    s.off("giveaway:count", handler);
    s.off("connect", onConnect);
    s.off("connect_error", onConnectError);
    s.off("disconnect", onDisconnect);
    if (hb) clearInterval(hb);
  };
}
