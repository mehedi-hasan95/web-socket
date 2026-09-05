import { Router } from "express";
import {
  commentariesParams,
  commentaryValidator,
} from "../validator/match-validator";
import { db } from "../db";
import { commentaries } from "../schema";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", async (req, res) => {
  try {
    const payload = commentariesParams.safeParse(req.params);
    if (!payload.success) {
      return res.status(400).json({ message: "Invalid commentary payload" });
    }
    const id = Number(payload.data.id);
    const data = await db
      .select()
      .from(commentaries)
      .where(eq(commentaries.matchId, id))
      .orderBy(desc(commentaries.createdAt));
    return res.status(200).json({ data });
  } catch (error) {
    console.error("Failed to fetch commentary", error);
    return res.status(500).json({ message: "Failed to fetch commentary" });
  }
});

commentaryRouter.post("/", async (req, res) => {
  try {
    const bodyData = commentaryValidator.safeDecode(req.body);

    if (!bodyData.success) {
      return res.status(400).json({ message: "Invalid commentary payload" });
    }
    const [data] = await db
      .insert(commentaries)
      .values(bodyData.data)
      .returning();

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(data?.matchId, data);
    }

    return res.status(201).json({ data });
  } catch (error) {
    console.error("Failed to create commentary", error);
    return res.status(500).json({ message: "Failed to create commentary" });
  }
});
