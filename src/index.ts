import express, { type Express, type Request, type Response } from "express";

const app: Express = express();
const port = 8000;

app.use(express.json());
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
