import z from "zod";

export const matchValidator = z
  .object({
    sports: z.string(),
    homeTeam: z.string(),
    awayTeam: z.string(),
    startAt: z.coerce.date(),
    status: z
      .enum(["scheduled", "live", "finished"])
      .default("scheduled")
      .optional(),
    homeScore: z.coerce.number().default(0).optional(),
    awayScore: z.coerce.number().default(0).optional(),
  })
  .superRefine((data, ctx) => {
    const startDate = new Date(data.startAt);
    if (startDate < new Date()) {
      ctx.addIssue({
        code: "custom",
        message: "startAt cannot be in the past",
        path: ["startAt"],
      });
    }
  });

export const commentaryValidator = z.object({
  matchId: z.coerce.number(),
  minutes: z.coerce.number().int().positive().optional(),
  sequence: z.coerce.number().int().positive().optional(),
  period: z.string().optional(),
  eventType: z.string().optional(),
  actor: z.string().optional(),
  team: z.string().optional(),
  message: z.string(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const commentariesParams = z.object({
  id: z.string(),
});
