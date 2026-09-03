import express, { type Express, type Request, type Response } from "express";
import { matchRouter } from "./db/routes/matches";
import { createServer } from "http";
import { attachWebSocketServer } from "./ws/server";

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST;

const app: Express = express();
const server = createServer(app);

app.use(express.json());
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/matches", matchRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
  const baseUrl =
    HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `wss://${HOST}:${PORT}`;
  console.log(`Example app listening on ${baseUrl}`);
  console.log(
    `Websocket server running on ${baseUrl.replace("http", "ws")}/ws`,
  );
});
