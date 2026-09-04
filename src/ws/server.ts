import { Server as HttpServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import type { MATCH_TYPE } from "../@types/types";
import { wsArcjet } from "../arcjet";

interface ExtWebSocket extends WebSocket {
  isAlive?: boolean;
}

function sendJson(socket: WebSocket, payload: { type: string }) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcast(
  wss: WebSocketServer,
  payload: { type: string; data: MATCH_TYPE },
) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) continue;
    client.send(JSON.stringify(payload));
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
            ? "Too many request"
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
    sendJson(socket, { type: "welcome" });
    socket.on("error", console.error);
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
    broadcast(wss, { type: "match_created", data: match });
  }
  return { broadcastMatchCreated };
}
