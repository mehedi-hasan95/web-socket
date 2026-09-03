import { Server as HttpServer } from "http";
import WebSocket, { WebSocketServer } from "ws";
import type { MATCH_TYPE } from "../@types/types";
function sendJson(socket: WebSocket, payload: { type: string }) {
  if (socket.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify(payload));
}

function broadcast(
  wss: WebSocketServer,
  payload: { type: string; data: MATCH_TYPE },
) {
  for (const client of wss.clients) {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(JSON.stringify(payload));
  }
}

export function attachWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    maxPayload: 1024 * 1024,
  });

  wss.on("connection", (socket) => {
    sendJson(socket, { type: "welcome" });
    socket.on("error", console.error);
  });

  function broadcastMatchCreated(match: MATCH_TYPE) {
    broadcast(wss, { type: "match_created", data: match });
  }
  return { broadcastMatchCreated };
}
