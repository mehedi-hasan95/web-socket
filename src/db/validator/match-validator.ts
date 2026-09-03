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
