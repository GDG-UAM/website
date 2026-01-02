import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";

    // Initialize server-side socket if not already running
    // We don't await this here to keep getSocket synchronous,
    // but the first connection attempt will happen while/after this fetch starts.
    fetch(`${base}/api/socket`).catch(() => {});

    socket = io(base, {
      path: "/api/socket/",
      transports: ["polling", "websocket"],
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
    // console.log("[socket] joining room", room);
    s.emit("join", { room });
  };

  // Join now if connected, otherwise join on connect; also re-join after reconnects
  if (s.connected) join();
  const onConnect = () => join();
  const onConnectError = (err: unknown) => {
    console.warn("[socket] connect error", err);
  };
  const onDisconnect = () => {
    // console.log("[socket] disconnected:", reason);
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
      // console.log("[socket] Received giveaway:count =>", payload.count);
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

export function subscribeToHackathon(hackathonId: string, onUpdate: (data: unknown) => void) {
  const s = getSocket();
  const room = `hackathon:${hackathonId}`;

  const join = () => {
    // console.log("[socket] joining room", room);
    s.emit("join", { room });
  };

  if (s.connected) join();
  const onConnect = () => join();

  s.on("connect", onConnect);

  const handler = (data: unknown) => {
    // console.log("[socket] Received intermission_update =>", data);
    onUpdate(data);
  };

  s.on("intermission_update", handler);

  return () => {
    s.off("intermission_update", handler);
    s.off("connect", onConnect);
  };
}
