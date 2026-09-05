import { Server as HttpServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import type { MATCH_TYPE } from "../@types/types";
import { wsArcjet } from "../arcjet";

interface ExtWebSocket extends WebSocket {
  isAlive?: boolean;
  subscriptions?: Set<number>;
}

interface IncomingMessage {
  type: "subscribe" | "unsubscribe" | string;
  matchId?: number;
}

interface OutgoingPayload {
  type: string;
  matchId?: number;
  message?: string;
}

const matchSubscribers = new Map<number, Set<ExtWebSocket>>();

function subscribe(matchId: number, socket: ExtWebSocket) {
  if (!matchSubscribers.has(matchId)) {
    matchSubscribers.set(matchId, new Set());
  }
  matchSubscribers.get(matchId)!.add(socket);
}

function unsubscribe(matchId: number, socket: ExtWebSocket) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers) return;
  subscribers.delete(socket);
  if (subscribers.size === 0) {
    matchSubscribers.delete(matchId);
  }
}

function cleanupSubscription(socket: ExtWebSocket) {
  if (!socket.subscriptions) return;
  for (const matchId of socket.subscriptions) {
    unsubscribe(matchId, socket);
  }
  socket.subscriptions.clear();
}

function sendJson(socket: WebSocket, payload: OutgoingPayload) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcastToAll(
  wss: WebSocketServer,
  payload: { type: string; data: MATCH_TYPE },
) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(message);
  }
}

function broadcastToMatch<T>(
  matchId: number,
  payload: { type: string; data: T },
) {
  const subscribers = matchSubscribers.get(matchId);
  if (!subscribers || subscribers.size === 0) return;
  const message = JSON.stringify(payload);
  for (const client of subscribers) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function handleMessage(socket: ExtWebSocket, data: WebSocket.RawData) {
  let message: IncomingMessage;
  try {
    message = JSON.parse(data.toString());
  } catch (error) {
    sendJson(socket, { type: "Error", message: "Invalid JSON" });
    return;
  }

  if (message.type === "subscribe" && Number.isInteger(message.matchId)) {
    const matchId = message.matchId as number;
    subscribe(matchId, socket);
    socket.subscriptions?.add(matchId);
    sendJson(socket, { type: "subscribe", matchId });
    return;
  }

  if (message.type === "unsubscribe" && Number.isInteger(message.matchId)) {
    const matchId = message.matchId as number;
    unsubscribe(matchId, socket);
    socket.subscriptions?.delete(matchId);
    sendJson(socket, { type: "unsubscribe", matchId });
  }
}

export function attachWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", async (socket: ExtWebSocket, req) => {
    if (wsArcjet) {
      try {
        const decision = await wsArcjet.protect(req);
        if (decision.isDenied()) {
          const code = decision.reason.isRateLimit() ? 1013 : 1008;
          const reason = decision.reason.isRateLimit()
            ? "Too many requests"
            : "Access denied";
          socket.close(code, reason);
          return;
        }
      } catch (error) {
        console.error("WS socket error", error);
        socket.close(1011, "Server security error");
        return;
      }
    }

    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.subscriptions = new Set();

    sendJson(socket, { type: "welcome" });

    socket.on("message", (data) => {
      handleMessage(socket, data);
    });

    socket.on("error", (err) => {
      console.error(err);
      socket.terminate();
    });

    socket.on("close", () => {
      cleanupSubscription(socket);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtWebSocket) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  const cleanup = () => clearInterval(interval);
  wss.on("close", cleanup);
  server.on("close", cleanup);

  function broadcastMatchCreated(match: MATCH_TYPE) {
    broadcastToAll(wss, { type: "match_created", data: match });
  }

  function broadcastCommentary<T>(matchId: number, comment: T) {
    broadcastToMatch(matchId, { type: "commentary", data: comment });
  }

  return { broadcastMatchCreated, broadcastCommentary };
}
