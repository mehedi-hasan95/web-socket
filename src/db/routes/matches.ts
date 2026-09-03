import { Router } from "express";
import { matches } from "../schema";
import { db } from "../db";
import { matchValidator } from "../validator/match-validator";
import { desc } from "drizzle-orm";

export const matchRouter = Router();

matchRouter.get("/", async (req, res) => {
  try {
    const data = await db
      .select()
      .from(matches)
      .orderBy(desc(matches.createdAt));
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

matchRouter.post("/", async (req, res) => {
  const parsed = matchValidator.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid payload",
      details: JSON.stringify(parsed.error),
    });
  }

  try {
    const [data] = await db.insert(matches).values(parsed.data).returning();
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
});
